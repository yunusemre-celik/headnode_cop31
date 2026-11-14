"""SQLite persistence layer for COP31 Heatnode with transactional consistency."""

from __future__ import annotations

from contextlib import closing
from datetime import datetime, timedelta, timezone
import os
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional, Set, Tuple
from uuid import uuid4

from backend.geo import haversine_meters
from backend.models import (
    DEFAULT_MODEL_VERSION,
    DUPLICATE_WINDOW_SECONDS,
    DemoAuthorityRecord,
    DisasterType,
    EVENT_RADIUS_METERS,
    EventRecord,
    LOCATION_WEIGHTS,
    LocationSource,
    REPEAT_DECAY_BASE,
    REPEAT_RESET_SECONDS,
    REPORT_LIFETIME_SECONDS,
    ReportCreateRequest,
    ReportCreateResponse,
    ReportMode,
    ReportRecord,
    ReportStatus,
    SPATIAL_RULE_VERSION,
)


def utc_now() -> datetime:
    """Return current UTC datetime (monkeypatchable in tests)."""
    return datetime.now(timezone.utc)


def _to_iso(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat()


def _from_iso(value: str) -> datetime:
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def get_default_db_path() -> str:
    """Resolve database path from COP31_DB_PATH env var or default."""
    env_path = os.getenv("COP31_DB_PATH")
    if env_path:
        return env_path
    if os.getenv("VERCEL"):
        return "/tmp/heatnode_cop31.db"
    return "heatnode_cop31.db"


class Database:
    """SQLite database manager for COP31 reports, events, browser states, and demo records."""

    def __init__(self, db_path: str | Path | None = None) -> None:
        self.db_path = str(db_path if db_path is not None else get_default_db_path())

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(
            self.db_path,
            timeout=10.0,
            check_same_thread=False,
            isolation_level=None,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def init_db(self) -> None:
        """Create required tables and indexes if they do not exist."""
        with closing(self._connect()) as conn:
            conn.execute("PRAGMA journal_mode = WAL")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    disaster_type TEXT NOT NULL,
                    origin_lat REAL NOT NULL,
                    origin_lng REAL NOT NULL,
                    spatial_rule_version TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    created_at_ts REAL NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reports (
                    id TEXT PRIMARY KEY,
                    browser_id TEXT NOT NULL,
                    disaster_type TEXT NOT NULL,
                    report_mode TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    location_source TEXT NOT NULL,
                    accepted_at TEXT NOT NULL,
                    accepted_at_ts REAL NOT NULL,
                    expires_at TEXT NOT NULL,
                    expires_at_ts REAL NOT NULL,
                    repeat_factor REAL NOT NULL,
                    base_weight REAL NOT NULL,
                    event_id TEXT NOT NULL REFERENCES events(id),
                    model_version TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_reports_active
                ON reports (expires_at_ts, disaster_type)
                """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_reports_browser_event
                ON reports (browser_id, event_id, accepted_at_ts)
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS browser_states (
                    browser_id TEXT PRIMARY KEY,
                    accepted_report_count_since_reset INTEGER NOT NULL,
                    last_accepted_report_at TEXT NOT NULL,
                    last_accepted_at_ts REAL NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS demo_authority_records (
                    id TEXT PRIMARY KEY,
                    report_id TEXT NOT NULL UNIQUE,
                    event_id TEXT NOT NULL,
                    disaster_type TEXT NOT NULL,
                    latitude REAL NOT NULL,
                    longitude REAL NOT NULL,
                    report_mode TEXT NOT NULL,
                    accepted_at TEXT NOT NULL,
                    accepted_at_ts REAL NOT NULL,
                    is_demo INTEGER NOT NULL DEFAULT 1
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS idempotency_records (
                    client_request_id TEXT PRIMARY KEY,
                    browser_id TEXT NOT NULL,
                    response_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS safezones (
                    node_id TEXT PRIMARY KEY,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    updated_at TEXT NOT NULL
                )
                """
            )

    @staticmethod
    def _row_to_report(row: sqlite3.Row) -> ReportRecord:
        return ReportRecord(
            id=row["id"],
            browser_id=row["browser_id"],
            disaster_type=DisasterType(row["disaster_type"]),
            report_mode=ReportMode(row["report_mode"]),
            latitude=row["latitude"],
            longitude=row["longitude"],
            location_source=LocationSource(row["location_source"]),
            accepted_at=_from_iso(row["accepted_at"]),
            expires_at=_from_iso(row["expires_at"]),
            repeat_factor=row["repeat_factor"],
            base_weight=row["base_weight"],
            event_id=row["event_id"],
            model_version=row["model_version"],
        )

    def submit_report(
        self,
        browser_id: str,
        payload: ReportCreateRequest,
        now: Optional[datetime] = None,
        model_version: str = DEFAULT_MODEL_VERSION,
    ) -> ReportCreateResponse:
        """Validate idempotency, cluster spatially, detect duplicates, and persist report."""
        current_dt = now if now is not None else utc_now()
        if current_dt.tzinfo is None:
            current_dt = current_dt.replace(tzinfo=timezone.utc)
        now_iso = _to_iso(current_dt)
        now_ts = current_dt.timestamp()
        req_id_str = str(payload.client_request_id)

        conn = self._connect()
        try:
            conn.execute("BEGIN IMMEDIATE")

            # 1. Idempotency check
            idem_row = conn.execute(
                "SELECT response_json FROM idempotency_records WHERE client_request_id = ?",
                (req_id_str,),
            ).fetchone()
            if idem_row is not None:
                conn.execute("ROLLBACK")
                return ReportCreateResponse.model_validate_json(idem_row["response_json"])

            # 2. Find active events of the same disaster_type within 500m of event origin
            active_event_rows = conn.execute(
                """
                SELECT DISTINCT e.id, e.disaster_type, e.origin_lat, e.origin_lng,
                                e.spatial_rule_version, e.created_at, e.created_at_ts, e.updated_at
                FROM events e
                JOIN reports r ON r.event_id = e.id
                WHERE e.disaster_type = ? AND r.expires_at_ts > ?
                """,
                (payload.disaster_type.value, now_ts),
            ).fetchall()

            candidates: List[Tuple[float, float, str, sqlite3.Row]] = []
            for ev in active_event_rows:
                dist_m = haversine_meters(
                    ev["origin_lat"],
                    ev["origin_lng"],
                    payload.latitude,
                    payload.longitude,
                )
                if dist_m <= EVENT_RADIUS_METERS:
                    candidates.append((dist_m, ev["created_at_ts"], ev["id"], ev))

            candidates.sort(key=lambda item: (item[0], item[1], item[2]))
            target_event = candidates[0][3] if candidates else None

            # 3. Duplicate check (anchored to browser's first accepted report in this event)
            if target_event is not None:
                first_browser_report = conn.execute(
                    """
                    SELECT accepted_at_ts
                    FROM reports
                    WHERE browser_id = ? AND event_id = ? AND disaster_type = ?
                    ORDER BY accepted_at_ts ASC
                    LIMIT 1
                    """,
                    (browser_id, target_event["id"], payload.disaster_type.value),
                ).fetchone()

                if first_browser_report is not None:
                    elapsed_s = now_ts - first_browser_report["accepted_at_ts"]
                    if elapsed_s < DUPLICATE_WINDOW_SECONDS:
                        dup_resp = ReportCreateResponse(
                            status=ReportStatus.DUPLICATE,
                            report=None,
                            event_id=target_event["id"],
                            demo_record_created=False,
                            reason="duplicate_within_30m_window",
                        )
                        conn.execute(
                            """
                            INSERT INTO idempotency_records (client_request_id, browser_id, response_json, created_at)
                            VALUES (?, ?, ?, ?)
                            """,
                            (req_id_str, browser_id, dup_resp.model_dump_json(), now_iso),
                        )
                        conn.execute("COMMIT")
                        return dup_resp

            # 4. Compute repeat_factor and base_weight
            b_state = conn.execute(
                """
                SELECT accepted_report_count_since_reset, last_accepted_at_ts
                FROM browser_states
                WHERE browser_id = ?
                """,
                (browser_id,),
            ).fetchone()

            if (
                b_state is not None
                and (now_ts - b_state["last_accepted_at_ts"]) < REPEAT_RESET_SECONDS
            ):
                n = int(b_state["accepted_report_count_since_reset"])
            else:
                n = 0

            repeat_factor = REPEAT_DECAY_BASE ** n
            base_weight = LOCATION_WEIGHTS[payload.location_source] * repeat_factor

            # 5. Create or update event
            if target_event is None:
                event_id = str(uuid4())
                conn.execute(
                    """
                    INSERT INTO events (
                        id, disaster_type, origin_lat, origin_lng,
                        spatial_rule_version, created_at, created_at_ts, updated_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        event_id,
                        payload.disaster_type.value,
                        payload.latitude,
                        payload.longitude,
                        SPATIAL_RULE_VERSION,
                        now_iso,
                        now_ts,
                        now_iso,
                    ),
                )
            else:
                event_id = target_event["id"]
                conn.execute(
                    "UPDATE events SET updated_at = ? WHERE id = ?",
                    (now_iso, event_id),
                )

            # 6. Insert accepted report
            report_id = str(uuid4())
            expires_dt = current_dt + timedelta(seconds=REPORT_LIFETIME_SECONDS)
            expires_iso = _to_iso(expires_dt)
            expires_ts = expires_dt.timestamp()

            conn.execute(
                """
                INSERT INTO reports (
                    id, browser_id, disaster_type, report_mode,
                    latitude, longitude, location_source,
                    accepted_at, accepted_at_ts, expires_at, expires_at_ts,
                    repeat_factor, base_weight, event_id, model_version
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    report_id,
                    browser_id,
                    payload.disaster_type.value,
                    payload.report_mode.value,
                    payload.latitude,
                    payload.longitude,
                    payload.location_source.value,
                    now_iso,
                    now_ts,
                    expires_iso,
                    expires_ts,
                    repeat_factor,
                    base_weight,
                    event_id,
                    model_version,
                ),
            )

            # 7. Update browser_states
            conn.execute(
                """
                INSERT INTO browser_states (
                    browser_id, accepted_report_count_since_reset,
                    last_accepted_report_at, last_accepted_at_ts
                )
                VALUES (?, ?, ?, ?)
                ON CONFLICT(browser_id) DO UPDATE SET
                    accepted_report_count_since_reset = excluded.accepted_report_count_since_reset,
                    last_accepted_report_at = excluded.last_accepted_report_at,
                    last_accepted_at_ts = excluded.last_accepted_at_ts
                """,
                (browser_id, n + 1, now_iso, now_ts),
            )

            # 8. DemoAuthorityRecord for valid non-duplicate emergency reports only
            demo_record_created = False
            if payload.report_mode == ReportMode.EMERGENCY:
                demo_id = str(uuid4())
                conn.execute(
                    """
                    INSERT INTO demo_authority_records (
                        id, report_id, event_id, disaster_type,
                        latitude, longitude, report_mode,
                        accepted_at, accepted_at_ts, is_demo
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    """,
                    (
                        demo_id,
                        report_id,
                        event_id,
                        payload.disaster_type.value,
                        payload.latitude,
                        payload.longitude,
                        ReportMode.EMERGENCY.value,
                        now_iso,
                        now_ts,
                    ),
                )
                demo_record_created = True

            report_record = ReportRecord(
                id=report_id,
                browser_id=browser_id,
                disaster_type=payload.disaster_type,
                report_mode=payload.report_mode,
                latitude=payload.latitude,
                longitude=payload.longitude,
                location_source=payload.location_source,
                accepted_at=current_dt,
                expires_at=expires_dt,
                repeat_factor=repeat_factor,
                base_weight=base_weight,
                event_id=event_id,
                model_version=model_version,
            )

            accepted_resp = ReportCreateResponse(
                status=ReportStatus.ACCEPTED,
                report=report_record,
                event_id=event_id,
                demo_record_created=demo_record_created,
            )
            conn.execute(
                """
                INSERT INTO idempotency_records (client_request_id, browser_id, response_json, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (req_id_str, browser_id, accepted_resp.model_dump_json(), now_iso),
            )
            conn.execute("COMMIT")
            return accepted_resp
        except Exception:
            conn.execute("ROLLBACK")
            raise
        finally:
            conn.close()

    def get_active_reports_and_events(
        self,
        disaster_type: Optional[DisasterType] = None,
        now: Optional[datetime] = None,
    ) -> Tuple[List[ReportRecord], List[EventRecord]]:
        """Fetch all non-expired reports and their active events."""
        current_dt = now if now is not None else utc_now()
        if current_dt.tzinfo is None:
            current_dt = current_dt.replace(tzinfo=timezone.utc)
        now_ts = current_dt.timestamp()

        with closing(self._connect()) as conn:
            if disaster_type is not None:
                report_rows = conn.execute(
                    """
                    SELECT * FROM reports
                    WHERE expires_at_ts > ? AND disaster_type = ?
                    ORDER BY accepted_at_ts ASC
                    """,
                    (now_ts, disaster_type.value),
                ).fetchall()
            else:
                report_rows = conn.execute(
                    """
                    SELECT * FROM reports
                    WHERE expires_at_ts > ?
                    ORDER BY accepted_at_ts ASC
                    """,
                    (now_ts,),
                ).fetchall()

            reports = [self._row_to_report(r) for r in report_rows]
            if not reports:
                return [], []

            event_ids = sorted({r.event_id for r in reports})
            placeholders = ",".join("?" for _ in event_ids)
            event_rows = conn.execute(
                f"SELECT * FROM events WHERE id IN ({placeholders}) ORDER BY created_at_ts ASC",
                event_ids,
            ).fetchall()

            reports_by_event: Dict[str, List[str]] = {}
            for r in reports:
                reports_by_event.setdefault(r.event_id, []).append(r.id)

            events: List[EventRecord] = []
            for ev in event_rows:
                active_ids = reports_by_event.get(ev["id"], [])
                events.append(
                    EventRecord(
                        id=ev["id"],
                        disaster_type=DisasterType(ev["disaster_type"]),
                        origin_lat=ev["origin_lat"],
                        origin_lng=ev["origin_lng"],
                        spatial_rule_version=ev["spatial_rule_version"],
                        active_report_ids=active_ids,
                        active_report_count=len(active_ids),
                        created_at=_from_iso(ev["created_at"]),
                        updated_at=_from_iso(ev["updated_at"]),
                    )
                )
            return reports, events

    def list_demo_authority_records(self, limit: int = 100) -> List[DemoAuthorityRecord]:
        """Return DemoAuthorityRecord entries ordered newest first."""
        with closing(self._connect()) as conn:
            rows = conn.execute(
                """
                SELECT * FROM demo_authority_records
                ORDER BY accepted_at_ts DESC
                LIMIT ?
                """,
                (limit,),
            ).fetchall()

        return [
            DemoAuthorityRecord(
                id=row["id"],
                report_id=row["report_id"],
                event_id=row["event_id"],
                disaster_type=DisasterType(row["disaster_type"]),
                latitude=row["latitude"],
                longitude=row["longitude"],
                report_mode=ReportMode(row["report_mode"]),
                accepted_at=_from_iso(row["accepted_at"]),
                is_demo=bool(row["is_demo"]),
            )
            for row in rows
        ]

    def get_active_safezone_ids(self) -> Set[str]:
        """Return the set of currently active safezone node IDs."""
        with closing(self._connect()) as conn:
            rows = conn.execute(
                "SELECT node_id FROM safezones WHERE is_active = 1"
            ).fetchall()
        return {row["node_id"] for row in rows}

    def set_safezone_active(self, node_id: str, is_active: bool) -> bool:
        """Persist active state for a safezone node and return the resulting state."""
        now_iso = _to_iso(utc_now())
        active_int = 1 if is_active else 0
        with closing(self._connect()) as conn:
            conn.execute("BEGIN IMMEDIATE")
            conn.execute(
                """
                INSERT INTO safezones (node_id, is_active, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(node_id) DO UPDATE SET
                    is_active = excluded.is_active,
                    updated_at = excluded.updated_at
                """,
                (node_id, active_int, now_iso),
            )
            conn.execute("COMMIT")
        return is_active
