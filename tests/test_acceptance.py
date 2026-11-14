"""Acceptance tests covering Section 12 of COP31_Proje_Plani_ve_Prompt.md."""

from __future__ import annotations

import math
from uuid import uuid4

from fastapi.testclient import TestClient
import pytest

from backend.decision_model import distance_factor
from backend.geo import haversine_meters
from tests.conftest import Clock

BASE_LAT = 36.8969
BASE_LNG = 30.7133


def _offset_lat(lat: float, meters_north: float) -> float:
    return lat + (meters_north / 111_320.0)


def _submit(
    client: TestClient,
    *,
    browser_id: str | None = None,
    lat: float = BASE_LAT,
    lng: float = BASE_LNG,
    disaster_type: str = "flood",
    report_mode: str = "normal",
    location_source: str = "gps",
    client_request_id: str | None = None,
    headers: dict[str, str] | None = None,
):
    req_headers = dict(headers or {})
    if browser_id is not None:
        req_headers["X-Browser-Id"] = browser_id
    payload = {
        "latitude": lat,
        "longitude": lng,
        "disaster_type": disaster_type,
        "report_mode": report_mode,
        "location_source": location_source,
        "client_request_id": client_request_id or str(uuid4()),
    }
    return client.post("/api/reports", json=payload, headers=req_headers)


def test_scenario_01_and_02_coordinates_required_and_manual_allowed(client: TestClient) -> None:
    """Scenario 1 & 2: Invalid/missing coordinates are rejected; manual location source works."""
    missing_coords = client.post(
        "/api/reports",
        json={
            "disaster_type": "flood",
            "report_mode": "normal",
            "location_source": "gps",
            "client_request_id": str(uuid4()),
        },
    )
    assert missing_coords.status_code == 422

    bad_lat = client.post(
        "/api/reports",
        json={
            "latitude": 95.0,
            "longitude": BASE_LNG,
            "disaster_type": "flood",
            "report_mode": "normal",
            "location_source": "gps",
            "client_request_id": str(uuid4()),
        },
    )
    assert bad_lat.status_code == 422

    manual_ok = _submit(client, browser_id=str(uuid4()), location_source="manual")
    assert manual_ok.status_code == 200
    assert manual_ok.json()["status"] == "accepted"


def test_scenario_03_gps_weight_2_manual_weight_0_5(client: TestClient) -> None:
    """Scenario 3: First GPS report has base_weight 2.0; first manual report has base_weight 0.5."""
    gps_resp = _submit(client, browser_id=str(uuid4()), location_source="gps")
    assert gps_resp.status_code == 200
    gps_data = gps_resp.json()
    assert gps_data["status"] == "accepted"
    assert gps_data["report"]["base_weight"] == pytest.approx(2.0)
    assert gps_data["report"]["repeat_factor"] == pytest.approx(1.0)

    manual_resp = _submit(client, browser_id=str(uuid4()), location_source="manual")
    assert manual_resp.status_code == 200
    manual_data = manual_resp.json()
    assert manual_data["status"] == "accepted"
    assert manual_data["report"]["base_weight"] == pytest.approx(0.5)
    assert manual_data["report"]["repeat_factor"] == pytest.approx(1.0)


def test_scenario_04_duplicate_within_30m_and_1km_no_score_or_timer_reset(
    client: TestClient, clock: Clock
) -> None:
    """Scenario 4: Duplicate by same browser within 30m & 500m radius does not change score or reset 30m timer."""
    b1 = str(uuid4())
    r1 = _submit(client, browser_id=b1, disaster_type="flood", location_source="gps")
    assert r1.status_code == 200
    assert r1.json()["status"] == "accepted"

    score_before = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score_before["total_weight"] == pytest.approx(2.0)

    # Advance 20 minutes and send duplicate within 500m radius (200m north)
    clock.advance(20 * 60)
    dup = _submit(
        client,
        browser_id=b1,
        lat=_offset_lat(BASE_LAT, 200.0),
        lng=BASE_LNG,
        disaster_type="flood",
        location_source="gps",
    )
    assert dup.status_code == 200
    assert dup.json()["status"] == "duplicate"
    assert dup.json()["demo_record_created"] is False

    score_after = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score_after["total_weight"] == pytest.approx(2.0)
    assert score_after["active_report_count"] == 1

    # Advance 11 more minutes (31m since r1, only 11m since dup).
    # Because duplicate did NOT reset the 30m timer, repeat counter must now be reset to 0 -> weight 2.0.
    clock.advance(11 * 60)
    r2 = _submit(client, browser_id=b1, disaster_type="hail", location_source="gps")
    assert r2.status_code == 200
    assert r2.json()["status"] == "accepted"
    assert r2.json()["report"]["repeat_factor"] == pytest.approx(1.0)
    assert r2.json()["report"]["base_weight"] == pytest.approx(2.0)


def test_scenario_05_different_browser_same_ip_is_separate(client: TestClient) -> None:
    """Scenario 5: Different browser on same IP is accepted separately with GPS weight 2.0."""
    shared_ip_headers = {"X-Forwarded-For": "203.0.113.42"}
    b1 = str(uuid4())
    b2 = str(uuid4())

    r1 = _submit(client, browser_id=b1, headers=shared_ip_headers)
    r2 = _submit(client, browser_id=b2, headers=shared_ip_headers)

    assert r1.json()["status"] == "accepted"
    assert r2.json()["status"] == "accepted"
    assert r1.json()["report"]["base_weight"] == pytest.approx(2.0)
    assert r2.json()["report"]["base_weight"] == pytest.approx(2.0)
    assert r1.json()["event_id"] == r2.json()["event_id"]

    score = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score["total_weight"] == pytest.approx(4.0)
    assert score["active_report_count"] == 2


def test_scenario_06_three_valid_gps_reports_decay(client: TestClient) -> None:
    """Scenario 6: 3 valid GPS reports from same browser get weights 2.0, 1.8, 1.62."""
    b1 = str(uuid4())
    r1 = _submit(client, browser_id=b1, disaster_type="flood", location_source="gps")
    r2 = _submit(client, browser_id=b1, disaster_type="hail", location_source="gps")
    r3 = _submit(client, browser_id=b1, disaster_type="wildfire", location_source="gps")

    assert r1.json()["report"]["base_weight"] == pytest.approx(2.0)
    assert r2.json()["report"]["base_weight"] == pytest.approx(1.8)
    assert r3.json()["report"]["base_weight"] == pytest.approx(1.62)


def test_scenario_07_30m_silence_resets_counter_to_2(
    client: TestClient, clock: Clock
) -> None:
    """Scenario 7: At least 30 minutes of silence after last valid report resets GPS weight to 2.0."""
    b1 = str(uuid4())
    r1 = _submit(client, browser_id=b1, disaster_type="flood", location_source="gps")
    assert r1.json()["report"]["base_weight"] == pytest.approx(2.0)

    clock.advance(10 * 60)
    r2 = _submit(client, browser_id=b1, disaster_type="hail", location_source="gps")
    assert r2.json()["report"]["base_weight"] == pytest.approx(1.8)

    clock.advance(30 * 60)
    r3 = _submit(client, browser_id=b1, disaster_type="tornado", location_source="gps")
    assert r3.json()["report"]["repeat_factor"] == pytest.approx(1.0)
    assert r3.json()["report"]["base_weight"] == pytest.approx(2.0)


def test_scenario_08_different_disasters_same_location_separate(client: TestClient) -> None:
    """Scenario 8: Flood and hail at same location are separate events and separate scores."""
    r_flood = _submit(client, browser_id=str(uuid4()), disaster_type="flood")
    r_hail = _submit(client, browser_id=str(uuid4()), disaster_type="hail")

    assert r_flood.json()["event_id"] != r_hail.json()["event_id"]

    map_all = client.get("/api/map", params={"lat": BASE_LAT, "lng": BASE_LNG}).json()
    assert len(map_all["events"]) == 2
    assert map_all["scores_by_disaster"]["flood"]["total_weight"] == pytest.approx(2.0)
    assert map_all["scores_by_disaster"]["hail"]["total_weight"] == pytest.approx(2.0)
    assert map_all["scores_by_disaster"]["tornado"]["uncertain"] is True


def test_scenario_09_distance_factor_0_250_500(client: TestClient) -> None:
    """Scenario 9: Distance factor is 1 at 0m, 0.5 at 250m, 0 at 500m."""
    assert distance_factor(0.0) == pytest.approx(1.0)
    assert distance_factor(250.0) == pytest.approx(0.5)
    assert distance_factor(500.0) == pytest.approx(0.0)
    assert distance_factor(600.0) == pytest.approx(0.0)

    _submit(client, browser_id=str(uuid4()), disaster_type="flood", location_source="gps")

    at_0m = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert at_0m["total_weight"] == pytest.approx(2.0)

    lat_250m = _offset_lat(BASE_LAT, 250.0)
    actual_d_250 = haversine_meters(BASE_LAT, BASE_LNG, lat_250m, BASE_LNG)
    expected_w_250 = 2.0 * max(0.0, 1.0 - actual_d_250 / 500.0)
    at_250m = client.get(
        "/api/map",
        params={"lat": lat_250m, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert at_250m["total_weight"] == pytest.approx(expected_w_250, rel=1e-3)
    assert at_250m["total_weight"] == pytest.approx(1.0, abs=0.02)

    lat_500m = _offset_lat(BASE_LAT, 500.0)
    at_500m = client.get(
        "/api/map",
        params={"lat": lat_500m, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert at_500m["total_weight"] == pytest.approx(0.0, abs=0.01)


def test_scenario_10_and_11_1h_expiration_and_uncertain(
    client: TestClient, clock: Clock
) -> None:
    """Scenario 10 & 11: No data -> Belirsiz (uncertain); after 1h report expires -> uncertain again."""
    initial = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert initial["uncertain"] is True
    assert initial["confidence"] is None
    assert initial["criticality"] is None
    assert initial["total_weight"] == pytest.approx(0.0)

    _submit(client, browser_id=str(uuid4()), disaster_type="flood")

    active = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()
    assert active["query_score"]["uncertain"] is False
    assert len(active["active_reports"]) == 1

    # Advance 1 hour (3600s) -> expired
    clock.advance(3600)
    expired = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()
    assert expired["query_score"]["uncertain"] is True
    assert expired["query_score"]["confidence"] is None
    assert expired["query_score"]["criticality"] is None
    assert expired["query_score"]["total_weight"] == pytest.approx(0.0)
    assert len(expired["active_reports"]) == 0


def test_scenario_12_scores_for_s_eq_2_and_monotonic_increase(client: TestClient) -> None:
    """Scenario 12: S=2 -> confidence ~33.33, criticality ~16.67; both increase with more contributions."""
    _submit(client, browser_id=str(uuid4()), disaster_type="flood", location_source="gps")

    score1 = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score1["total_weight"] == pytest.approx(2.0)
    assert score1["confidence"] == pytest.approx(100.0 * 2.0 / 6.0, abs=0.01)
    assert score1["criticality"] == pytest.approx(100.0 * 2.0 / 12.0, abs=0.01)
    assert round(score1["confidence"], 2) == pytest.approx(33.33)
    assert round(score1["criticality"], 2) == pytest.approx(16.67)

    # Independent browser adds another GPS report -> S=4
    _submit(client, browser_id=str(uuid4()), disaster_type="flood", location_source="gps")
    score2 = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "flood"},
    ).json()["query_score"]
    assert score2["total_weight"] == pytest.approx(4.0)
    assert score2["confidence"] > score1["confidence"]
    assert score2["criticality"] > score1["criticality"]


def test_scenario_13_demo_authority_only_for_valid_emergency(client: TestClient) -> None:
    """Scenario 13: Normal report creates no DemoAuthorityRecord; valid emergency creates one; duplicate does not."""
    b1 = str(uuid4())
    normal_resp = _submit(client, browser_id=b1, report_mode="normal", disaster_type="flood")
    assert normal_resp.json()["demo_record_created"] is False
    assert client.get("/api/demo-authority").json()["records"] == []

    emerg_resp = _submit(client, browser_id=b1, report_mode="emergency", disaster_type="hail")
    assert emerg_resp.status_code == 200
    assert emerg_resp.json()["status"] == "accepted"
    assert emerg_resp.json()["demo_record_created"] is True

    # Duplicate emergency from same browser in same event must NOT create another demo record
    dup_emerg = _submit(client, browser_id=b1, report_mode="emergency", disaster_type="hail")
    assert dup_emerg.json()["status"] == "duplicate"
    assert dup_emerg.json()["demo_record_created"] is False

    demo_payload = client.get("/api/demo-authority").json()
    assert demo_payload["is_demo"] is True
    assert len(demo_payload["records"]) == 1
    rec = demo_payload["records"][0]
    assert rec["is_demo"] is True
    assert rec["disaster_type"] == "hail"
    assert rec["report_mode"] == "emergency"


def test_scenario_15_idempotency_client_request_id(client: TestClient) -> None:
    """Scenario 15: Repeating same client_request_id returns identical result and creates no duplicate."""
    b1 = str(uuid4())
    req_id = str(uuid4())

    first = _submit(
        client,
        browser_id=b1,
        disaster_type="wildfire",
        report_mode="emergency",
        client_request_id=req_id,
    )
    second = _submit(
        client,
        browser_id=b1,
        disaster_type="wildfire",
        report_mode="emergency",
        client_request_id=req_id,
    )

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["report"]["id"] == second.json()["report"]["id"]
    assert first.json()["event_id"] == second.json()["event_id"]

    # Score is still 2.0 (not 4.0) and only 1 demo record exists
    score = client.get(
        "/api/map",
        params={"lat": BASE_LAT, "lng": BASE_LNG, "disaster_type": "wildfire"},
    ).json()["query_score"]
    assert score["total_weight"] == pytest.approx(2.0)
    assert score["active_report_count"] == 1
    assert len(client.get("/api/demo-authority").json()["records"]) == 1
