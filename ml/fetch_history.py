"""5-Year Historical Weather Fetcher for Antalya (Open-Meteo Archive + Synthetic Fallback)."""

from __future__ import annotations

from datetime import date, timedelta
import math
from pathlib import Path
from typing import Optional

import httpx
import numpy as np
import pandas as pd

ANTALYA_LAT: float = 36.8969
ANTALYA_LON: float = 30.7133
OPEN_METEO_ARCHIVE_URL: str = "https://archive-api.open-meteo.com/v1/archive"
DEFAULT_WEATHER_CSV: str = "data/antalya_weather_5y.csv"

HOURLY_VARIABLES = [
    "temperature_2m",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_direction_10m",
    "shortwave_radiation",
]


def generate_synthetic_antalya_weather(
    start_date: str = "2021-11-01",
    end_date: str = "2026-11-01",
    seed: int = 42,
) -> pd.DataFrame:
    """Generate physics-consistent 5-year hourly Antalya weather data as fallback.

    Models Mediterranean seasonal cycles, diurnal temperature/humidity/solar curves,
    summer heatwave episodes, and coastal sea-breeze / nocturnal land-breeze winds.
    """
    rng = np.random.default_rng(seed)
    timestamps = pd.date_range(
        start=f"{start_date} 00:00:00",
        end=f"{end_date} 23:00:00",
        freq="1h",
    )
    n = len(timestamps)
    day_of_year = timestamps.day_of_year.to_numpy(dtype=float)
    hour = timestamps.hour.to_numpy(dtype=float)

    # Seasonal baseline: Antalya mean ~10C in Jan (doy~15), ~30C in late Jul (doy~205)
    seasonal_phase = 2.0 * math.pi * (day_of_year - 205.0) / 365.25
    seasonal_mean_temp = 20.0 + 10.0 * np.cos(seasonal_phase)

    # Diurnal temperature swing: larger in summer (~7C amplitude), smaller in winter (~4C)
    diurnal_amp = 5.5 + 1.5 * np.cos(seasonal_phase)
    diurnal_temp = diurnal_amp * np.sin(2.0 * math.pi * (hour - 9.0) / 24.0)

    # Multi-day synoptic weather waves + occasional summer heatwaves
    synoptic = 2.2 * np.sin(2.0 * math.pi * np.arange(n) / (24.0 * 7.5))
    heatwave = np.where(
        (seasonal_mean_temp > 26.0) & (rng.random(n) < 0.03),
        rng.uniform(3.0, 6.5, size=n),
        0.0,
    )
    # Smooth heatwave impulses over 24h window
    heatwave = pd.Series(heatwave).rolling(24, min_periods=1, center=True).max().to_numpy()

    temp_c = seasonal_mean_temp + diurnal_temp + synoptic + heatwave + rng.normal(0.0, 0.8, size=n)
    temp_c = np.round(np.clip(temp_c, 1.0, 45.5), 2)

    # Relative humidity: higher in winter/night, lower in hot afternoons
    base_rh = 62.0 - 12.0 * np.cos(seasonal_phase)
    diurnal_rh = -16.0 * np.sin(2.0 * math.pi * (hour - 9.0) / 24.0)
    rel_humidity = base_rh + diurnal_rh + rng.normal(0.0, 5.0, size=n)
    rel_humidity = np.round(np.clip(rel_humidity, 15.0, 98.0), 1)

    # Solar radiation (W/m^2): zero at night, seasonal peak at solar noon (12:30)
    max_solar = 650.0 + 300.0 * np.cos(seasonal_phase)
    solar_angle = np.sin(math.pi * (hour - 6.0) / 13.0)
    is_daylight = (hour >= 6.0) & (hour <= 19.0) & (solar_angle > 0.0)
    cloud_factor = np.clip(1.0 - np.abs(rng.normal(0.0, 0.12, size=n)), 0.25, 1.0)
    solar_wm2 = np.where(is_daylight, max_solar * solar_angle * cloud_factor, 0.0)
    solar_wm2 = np.round(np.clip(solar_wm2, 0.0, 1050.0), 1)

    # Wind speed (km/h): coastal sea breeze peaks in afternoon
    sea_breeze = 6.0 * np.maximum(0.0, np.sin(math.pi * (hour - 9.0) / 11.0))
    wind_speed_kmh = 7.5 + sea_breeze + rng.gamma(shape=2.0, scale=2.0, size=n)
    wind_speed_kmh = np.round(np.clip(wind_speed_kmh, 0.5, 55.0), 2)

    # Wind direction (deg): S/SW sea breeze (180-225 deg) by day, N/NW land breeze by night
    day_weight = np.clip(np.sin(math.pi * (hour - 8.0) / 12.0), 0.0, 1.0)
    wind_dir = (15.0 + 185.0 * day_weight + rng.normal(0.0, 22.0, size=n)) % 360.0
    wind_dir = np.round(wind_dir, 1)

    return pd.DataFrame(
        {
            "time": timestamps.strftime("%Y-%m-%dT%H:%M"),
            "temperature_2m": temp_c,
            "relative_humidity_2m": rel_humidity,
            "wind_speed_10m": wind_speed_kmh,
            "wind_direction_10m": wind_dir,
            "shortwave_radiation": solar_wm2,
        }
    )


def _fetch_open_meteo_archive(
    start_date: str,
    end_date: str,
    lat: float = ANTALYA_LAT,
    lon: float = ANTALYA_LON,
    timeout_s: float = 25.0,
) -> pd.DataFrame:
    """Fetch hourly historical weather from Open-Meteo Archive API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": ",".join(HOURLY_VARIABLES),
        "timezone": "Europe/Istanbul",
    }
    with httpx.Client(timeout=timeout_s) as client:
        resp = client.get(OPEN_METEO_ARCHIVE_URL, params=params)
        resp.raise_for_status()
        payload = resp.json()

    hourly = payload.get("hourly")
    if not hourly or "time" not in hourly:
        raise ValueError("Open-Meteo Archive response missing 'hourly' data")

    df = pd.DataFrame(
        {
            "time": hourly["time"],
            "temperature_2m": hourly["temperature_2m"],
            "relative_humidity_2m": hourly["relative_humidity_2m"],
            "wind_speed_10m": hourly["wind_speed_10m"],
            "wind_direction_10m": hourly["wind_direction_10m"],
            "shortwave_radiation": hourly["shortwave_radiation"],
        }
    )
    if df.empty:
        raise ValueError("Open-Meteo Archive returned 0 rows")

    # Fill any occasional missing archive readings cleanly
    numeric_cols = HOURLY_VARIABLES
    df[numeric_cols] = df[numeric_cols].ffill().bfill()
    return df


def fetch_historical_weather(
    output_path: str | Path = DEFAULT_WEATHER_CSV,
    start_date: str = "2021-11-01",
    end_date: Optional[str] = None,
    force_synthetic: bool = False,
) -> tuple[Path, str, int]:
    """Fetch 5-year Antalya hourly weather CSV, falling back to synthetic data if offline.

    Returns:
        Tuple of (written_path, source_label, row_count).
    """
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    if end_date is None:
        # Cap at 2026-11-01 or 2 days ago (Open-Meteo archive lag)
        cap_date = min(date(2026, 11, 1), date.today() - timedelta(days=2))
        end_date = cap_date.isoformat()

    source = "open-meteo-archive"
    if force_synthetic:
        df = generate_synthetic_antalya_weather(start_date=start_date, end_date=end_date)
        source = "synthetic-fallback"
    else:
        try:
            df = _fetch_open_meteo_archive(start_date=start_date, end_date=end_date)
        except Exception:
            df = generate_synthetic_antalya_weather(start_date=start_date, end_date=end_date)
            source = "synthetic-fallback"

    df.to_csv(out, index=False)
    return out, source, len(df)


if __name__ == "__main__":
    path, src, count = fetch_historical_weather()
    print(f"Saved {count} hourly rows from {src} to {path}")
