"""Zero-PII SQLite Persistence Layer for HEATNODE AI."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path
import sqlite3
from typing import Any, Dict, Iterable, List, Optional, Tuple, Union


def _utc_now_iso() -> str:
    """Return current UTC timestamp in ISO-8601 format."""
    return datetime.now(timezone.utc).isoformat()


class Database:
    """SQLite database manager with strict zero-PII schema for reports and alert state."""

    def __init__(self, db_path: str | Path = "heatnode.db") -> None:
        self.db_path = str(db_path)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self) -> None:
        """Create tables if missing and seed default MONITORING alert state."""
        now_iso = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS reports (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    node_id TEXT NOT NULL,
                    category TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS alert_state (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    status TEXT NOT NULL,
                    hub_count INTEGER NOT NULL,
                    approved_by TEXT,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                INSERT OR IGNORE INTO alert_state (id, status, hub_count, approved_by, updated_at)
                VALUES (1, 'MONITORING', 3, NULL, ?)
                """,
                (now_iso,),
            )
            conn.commit()

    def insert_report(self, node_id: str, category: str) -> int:
        """Insert a single zero-PII crowd report and return its row ID."""
        now_iso = _utc_now_iso()
        with self._connect() as conn:
            cursor = conn.execute(
                "INSERT INTO reports (node_id, category, created_at) VALUES (?, ?, ?)",
                (node_id, category, now_iso),
            )
            conn.commit()
            return int(cursor.lastrowid)

    def insert_bulk_reports(
        self,
        reports: Iterable[Union[Tuple[str, str], Dict[str, str]]],
    ) -> int:
        """Insert multiple zero-PII crowd reports in a single transaction."""
        now_iso = _utc_now_iso()
        rows: List[Tuple[str, str, str]] = []
        for item in reports:
            if isinstance(item, dict):
                rows.append((item["node_id"], item["category"], now_iso))
            else:
                rows.append((item[0], item[1], now_iso))

        if not rows:
            return 0

        with self._connect() as conn:
            conn.executemany(
                "INSERT INTO reports (node_id, category, created_at) VALUES (?, ?, ?)",
                rows,
            )
            conn.commit()
        return len(rows)

    def get_recent_reports(self, minutes: int = 20) -> List[Dict[str, Any]]:
        """Fetch reports created within the last `minutes` minutes."""
        cutoff = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT id, node_id, category, created_at
                FROM reports
                WHERE created_at >= ?
                ORDER BY id ASC
                """,
                (cutoff,),
            ).fetchall()
        return [dict(row) for row in rows]

    def clear_reports(self) -> None:
        """Delete all crowd reports (used for demo reset)."""
        with self._connect() as conn:
            conn.execute("DELETE FROM reports")
            conn.commit()

    def get_alert_state(self) -> Dict[str, Any]:
        """Return the singleton alert lifecycle state."""
        with self._connect() as conn:
            row = conn.execute(
                "SELECT status, hub_count, approved_by, updated_at FROM alert_state WHERE id = 1"
            ).fetchone()
        if row is None:
            self.init_db()
            return self.get_alert_state()
        return dict(row)

    def set_alert_state(
        self,
        status: str,
        hub_count: int,
        approved_by: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Update the singleton alert lifecycle state and return the updated record."""
        now_iso = _utc_now_iso()
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO alert_state (id, status, hub_count, approved_by, updated_at)
                VALUES (1, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    status = excluded.status,
                    hub_count = excluded.hub_count,
                    approved_by = excluded.approved_by,
                    updated_at = excluded.updated_at
                """,
                (status, int(hub_count), approved_by, now_iso),
            )
            conn.commit()
        return self.get_alert_state()
