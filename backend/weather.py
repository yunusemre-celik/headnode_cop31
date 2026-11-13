"""Open-Meteo Weather Ingestion, Offline Fallback & UTCI Thermal Stress.

Provides live weather fetching for Antalya, an offline fallback mechanism
for zero-infrastructure COP31 demonstrations, and biometeorological
UTCI (Universal Thermal Climate Index) proxy estimation.
"""

from datetime import datetime, timezone
import json
import math
from pathlib import Path
import time
from typing import Literal, Optional, TypedDict

import httpx

# Default Antalya coordinates (Muratpasa / City Center)
ANTALYA_LAT: float = 36.8969
ANTALYA_LON: float = 30.7133
OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
DEFAULT_FALLBACK_PATH: str = "data/fallback_weather.json"
DEFAULT_CACHE_TTL_SECONDS: float = 900.0  # 15 minutes


class WeatherSnapshot(TypedDict):
    """Snapshot of current or simulated micro-meteorological conditions."""

    temperature_c: float
    relative_humidity: float
    wind_speed_kmh: float
    wind_direction_deg: float
    solar_radiation_wm2: float
    utci_c: float
    stress_category: str
    source: Literal["open-meteo", "fallback", "simulation"]
    timestamp: str


def compute_utci(
    temp_c: float,
    rel_humidity: float,
    wind_speed_ms: float,
    solar_radiation_wm2: float,
) -> float:
    """Compute Effective Thermal Stress Index (UTCI proxy).

    Combines dry-bulb temperature, vapor pressure derived from relative humidity,
    wind convective cooling, and solar radiation mean radiant temperature offset
    based on Steadman's human heat-budget formulation.

    Args:
        temp_c: Ambient dry-bulb temperature in degrees Celsius.
        rel_humidity: Relative humidity percentage (0.0 to 100.0).
        wind_speed_ms: Wind speed at 10m / 2m in meters per second.
        solar_radiation_wm2: Shortwave global solar radiation in W/m^2.

    Returns:
        Estimated UTCI equivalent temperature in degrees Celsius.
    """
    # Clamp inputs to physically plausible boundaries
    t = float(temp_c)
    rh = max(0.0, min(100.0, float(rel_humidity)))
    v = max(0.1, float(wind_speed_ms))
    sol = max(0.0, float(solar_radiation_wm2))

    # Water vapor pressure e (hPa) via Magnus-Tetens approximation
    e = (rh / 100.0) * 6.105 * math.exp((17.27 * t) / (237.7 + t))

    # Net solar radiation absorption proxy (W/m^2)
    # Human clothing-skin net absorptivity on projected surface (~10% of global irradiance)
    q_net = sol * 0.10

    # Solar mean radiant load moderated by convective wind dissipation
    solar_adj = (0.70 * q_net) / (v + 10.0)

    # Steadman apparent temperature / UTCI proxy
    utci = t + 0.33 * e - 0.70 * v - 4.00 + solar_adj
    return round(float(utci), 2)


def utci_category(utci_c: float) -> str:
    """Map UTCI temperature to standardized thermal stress category.

    Standard UTCI operational thresholds:
    - < 26.0 °C: No Thermal Stress
    - 26.0 - 32.0 °C: Moderate Heat Stress
    - 32.0 - 38.0 °C: Strong Heat Stress
    - 38.0 - 46.0 °C: Very Strong Heat Stress
    - >= 46.0 °C: Extreme Heat Stress

    Args:
        utci_c: UTCI temperature in degrees Celsius.

    Returns:
        One of the 5 standardized thermal stress category labels.
    """
    if utci_c < 26.0:
        return "No Thermal Stress"
    if utci_c < 32.0:
        return "Moderate Heat Stress"
    if utci_c < 38.0:
        return "Strong Heat Stress"
    if utci_c < 46.0:
        return "Very Strong Heat Stress"
    return "Extreme Heat Stress"


class WeatherService:
    """Service for fetching live weather data with in-memory caching and offline fallback."""

    def __init__(
        self,
        fallback_path: str = DEFAULT_FALLBACK_PATH,
        lat: float = ANTALYA_LAT,
        lon: float = ANTALYA_LON,
        ttl_seconds: float = DEFAULT_CACHE_TTL_SECONDS,
    ) -> None:
        self.fallback_path = Path(fallback_path)
        self.lat = lat
        self.lon = lon
        self.ttl_seconds = ttl_seconds
        self._cache: Optional[WeatherSnapshot] = None
        self._cache_time: float = 0.0

    def get_current_weather(self, force_fallback: bool = False) -> WeatherSnapshot:
        """Get current weather snapshot.

        Attempts Open-Meteo live API call unless force_fallback is True.
        Caches successful live responses for ttl_seconds.
        Falls back to fallback_path if network fails.
        """
        if force_fallback:
            return self._load_fallback()

        now_mono = time.monotonic()
        if self._cache is not None and (now_mono - self._cache_time) < self.ttl_seconds:
            return self._cache

        try:
            snapshot = self._fetch_open_meteo()
            self._cache = snapshot
            self._cache_time = now_mono
            return snapshot
        except Exception:
            return self._load_fallback()

    def _fetch_open_meteo(self) -> WeatherSnapshot:
        """Fetch current weather from Open-Meteo API."""
        params = {
            "latitude": self.lat,
            "longitude": self.lon,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",
                "wind_direction_10m",
                "shortwave_radiation",
            ],
        }

        response = httpx.get(OPEN_METEO_FORECAST_URL, params=params, timeout=5.0)
        response.raise_for_status()
        data = response.json()
        cur = data.get("current", {})

        temp_c = float(cur["temperature_2m"])
        rel_humidity = float(cur["relative_humidity_2m"])
        wind_speed_kmh = float(cur["wind_speed_10m"])
        wind_direction_deg = float(cur["wind_direction_10m"])
        solar_radiation_wm2 = float(cur.get("shortwave_radiation", 0.0))

        # Open-Meteo provides wind speed in km/h; compute_utci expects m/s
        wind_speed_ms = wind_speed_kmh / 3.6
        utci_c = compute_utci(temp_c, rel_humidity, wind_speed_ms, solar_radiation_wm2)
        category = utci_category(utci_c)

        timestamp = cur.get("time") or datetime.now(timezone.utc).isoformat()

        snapshot: WeatherSnapshot = {
            "temperature_c": temp_c,
            "relative_humidity": rel_humidity,
            "wind_speed_kmh": wind_speed_kmh,
            "wind_direction_deg": wind_direction_deg,
            "solar_radiation_wm2": solar_radiation_wm2,
            "utci_c": utci_c,
            "stress_category": category,
            "source": "open-meteo",
            "timestamp": timestamp,
        }
        return snapshot

    def _load_fallback(self) -> WeatherSnapshot:
        """Load baseline weather from JSON fallback file."""
        defaults = {
            "temperature_c": 36.4,
            "relative_humidity": 48.0,
            "wind_speed_kmh": 12.5,
            "wind_direction_deg": 215.0,
            "solar_radiation_wm2": 780.0,
        }

        if self.fallback_path.exists():
            try:
                data = json.loads(self.fallback_path.read_text(encoding="utf-8"))
            except Exception:
                data = defaults
        else:
            data = defaults

        temp_c = float(data.get("temperature_c", defaults["temperature_c"]))
        rel_humidity = float(data.get("relative_humidity", defaults["relative_humidity"]))
        wind_speed_kmh = float(data.get("wind_speed_kmh", defaults["wind_speed_kmh"]))
        wind_direction_deg = float(data.get("wind_direction_deg", defaults["wind_direction_deg"]))
        solar_radiation_wm2 = float(data.get("solar_radiation_wm2", defaults["solar_radiation_wm2"]))

        wind_speed_ms = wind_speed_kmh / 3.6
        utci_c = compute_utci(temp_c, rel_humidity, wind_speed_ms, solar_radiation_wm2)
        category = utci_category(utci_c)
        timestamp = datetime.now(timezone.utc).isoformat()

        snapshot: WeatherSnapshot = {
            "temperature_c": temp_c,
            "relative_humidity": rel_humidity,
            "wind_speed_kmh": wind_speed_kmh,
            "wind_direction_deg": wind_direction_deg,
            "solar_radiation_wm2": solar_radiation_wm2,
            "utci_c": utci_c,
            "stress_category": category,
            "source": "fallback",
            "timestamp": timestamp,
        }
        return snapshot
