from datetime import datetime, timezone
import json
from pathlib import Path
import pytest

from backend.weather import compute_utci, utci_category, WeatherService, WeatherSnapshot


def test_utci_extreme_heat_and_category():
    utci = compute_utci(temp_c=45.0, rel_humidity=45.0, wind_speed_ms=2.0, solar_radiation_wm2=850.0)
    assert utci >= 46.0
    assert utci_category(utci) == "Extreme Heat Stress"


def test_weather_service_fallback_on_network_error(monkeypatch):
    def broken_get(*args, **kwargs):
        raise RuntimeError("network down")

    monkeypatch.setattr("httpx.get", broken_get)
    svc = WeatherService(fallback_path="data/fallback_weather.json")
    snap = svc.get_current_weather()
    assert snap["source"] == "fallback"
    assert "utci_c" in snap
    assert snap["stress_category"] in {
        "No Thermal Stress",
        "Moderate Heat Stress",
        "Strong Heat Stress",
        "Very Strong Heat Stress",
        "Extreme Heat Stress",
    }


def test_utci_category_thresholds():
    assert utci_category(20.0) == "No Thermal Stress"
    assert utci_category(25.9) == "No Thermal Stress"
    assert utci_category(26.0) == "Moderate Heat Stress"
    assert utci_category(31.9) == "Moderate Heat Stress"
    assert utci_category(32.0) == "Strong Heat Stress"
    assert utci_category(37.9) == "Strong Heat Stress"
    assert utci_category(38.0) == "Very Strong Heat Stress"
    assert utci_category(45.9) == "Very Strong Heat Stress"
    assert utci_category(46.0) == "Extreme Heat Stress"
    assert utci_category(52.0) == "Extreme Heat Stress"


def test_weather_service_live_success(monkeypatch):
    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "current": {
                    "time": "2026-11-13T14:00",
                    "temperature_2m": 29.5,
                    "relative_humidity_2m": 55.0,
                    "wind_speed_10m": 14.4,
                    "wind_direction_10m": 180.0,
                    "shortwave_radiation": 620.0,
                }
            }

        def raise_for_status(self):
            pass

    monkeypatch.setattr("httpx.get", lambda *args, **kwargs: FakeResponse())
    svc = WeatherService(fallback_path="data/fallback_weather.json")
    snap = svc.get_current_weather()

    assert snap["source"] == "open-meteo"
    assert snap["temperature_c"] == 29.5
    assert snap["relative_humidity"] == 55.0
    assert snap["wind_speed_kmh"] == 14.4
    assert snap["wind_direction_deg"] == 180.0
    assert snap["solar_radiation_wm2"] == 620.0
    assert isinstance(snap["utci_c"], float)
    assert snap["stress_category"] in {
        "No Thermal Stress",
        "Moderate Heat Stress",
        "Strong Heat Stress",
        "Very Strong Heat Stress",
        "Extreme Heat Stress",
    }
    assert isinstance(snap["timestamp"], str)


def test_weather_service_ttl_cache(monkeypatch):
    call_count = 0

    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "current": {
                    "temperature_2m": 30.0,
                    "relative_humidity_2m": 50.0,
                    "wind_speed_10m": 10.0,
                    "wind_direction_10m": 90.0,
                    "shortwave_radiation": 500.0,
                }
            }

        def raise_for_status(self):
            pass

    def counting_get(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        return FakeResponse()

    monkeypatch.setattr("httpx.get", counting_get)
    svc = WeatherService(fallback_path="data/fallback_weather.json", ttl_seconds=900.0)

    snap1 = svc.get_current_weather()
    assert call_count == 1
    assert snap1["source"] == "open-meteo"

    snap2 = svc.get_current_weather()
    assert call_count == 1  # Should use cache!
    assert snap2["temperature_c"] == snap1["temperature_c"]


def test_weather_service_force_fallback(monkeypatch):
    # Even if live api works, force_fallback=True uses fallback
    class FakeResponse:
        status_code = 200

        def json(self):
            return {
                "current": {
                    "temperature_2m": 18.0,
                    "relative_humidity_2m": 40.0,
                    "wind_speed_10m": 5.0,
                    "wind_direction_10m": 0.0,
                    "shortwave_radiation": 100.0,
                }
            }

        def raise_for_status(self):
            pass

    monkeypatch.setattr("httpx.get", lambda *args, **kwargs: FakeResponse())
    svc = WeatherService(fallback_path="data/fallback_weather.json")
    snap = svc.get_current_weather(force_fallback=True)

    assert snap["source"] == "fallback"
    assert snap["temperature_c"] == 36.4
    assert snap["relative_humidity"] == 48.0
    assert snap["wind_speed_kmh"] == 12.5
    assert snap["wind_direction_deg"] == 215.0
    assert snap["solar_radiation_wm2"] == 780.0


def test_fallback_weather_json_file_contents():
    path = Path("data/fallback_weather.json")
    assert path.exists()
    data = json.loads(path.read_text(encoding="utf-8"))
    assert data["temperature_c"] == 36.4
    assert data["relative_humidity"] == 48.0
    assert data["wind_speed_kmh"] == 12.5
    assert data["wind_direction_deg"] == 215.0
    assert data["solar_radiation_wm2"] == 780.0
