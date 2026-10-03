"""
Prediction Agent
Uses weekly time-series data, 4-week rolling average, NumPy linear regression.
Outputs: trend label, slope, R², growth rate, 4-week forecast with uncertainty range.
"""

import math
from datetime import datetime, timedelta, timezone

import numpy as np

from app.core.schemas import PredictionInput, PredictionResult, ForecastPoint, WeeklyTrendPoint


def _trend_label(slope: float, r_squared: float, counts: list[int]) -> str:
    mean = np.mean(counts) if counts else 0
    # Emerging: low total but rising fast
    if mean < 5 and slope > 0.5:
        return "emerging"
    if r_squared < 0.2:
        return "stable"
    if slope > 0.3:
        return "increasing"
    if slope < -0.3:
        return "decreasing"
    return "stable"


def _next_week_label(last_week: str, offset: int) -> str:
    try:
        year, week = map(int, last_week.split("-W"))
        base = datetime.strptime(f"{year}-W{week}-1", "%G-W%V-%u").replace(tzinfo=timezone.utc)
        next_dt = base + timedelta(weeks=offset)
        iso = next_dt.isocalendar()
        return f"{iso[0]}-W{iso[1]:02d}"
    except Exception:
        return f"W+{offset}"


def predict(data: PredictionInput) -> PredictionResult:
    trend_points: list[WeeklyTrendPoint] = data.weekly_trend or []

    # Need at least 2 data points for regression
    if len(trend_points) < 2:
        # Default: stable, no meaningful forecast
        empty_forecast = [
            ForecastPoint(week=f"W+{i}", predicted=0.0, lower=0.0, upper=0.0)
            for i in range(1, 5)
        ]
        return PredictionResult(
            pattern_id=data.pattern_id,
            trend="stable",
            slope=0.0,
            r_squared=0.0,
            growth_rate=0.0,
            forecast=empty_forecast,
        )

    # Sort by week
    sorted_points = sorted(trend_points, key=lambda p: p.week)
    counts = [p.count for p in sorted_points]
    n = len(counts)
    x = np.arange(n, dtype=float)
    y = np.array(counts, dtype=float)

    # Linear regression via numpy
    coeffs = np.polyfit(x, y, 1)
    slope = float(coeffs[0])
    intercept = float(coeffs[1])

    # R² calculation
    y_pred = slope * x + intercept
    ss_res = float(np.sum((y - y_pred) ** 2))
    ss_tot = float(np.sum((y - np.mean(y)) ** 2))
    r_squared = 1.0 - (ss_res / ss_tot) if ss_tot > 0 else 0.0

    # Growth rate (percentage change over available period)
    first_val = max(counts[0], 1)
    last_val = counts[-1]
    growth_rate = round(((last_val - first_val) / first_val) * 100, 2)

    # 4-week rolling average (last 4 weeks)
    window = counts[-4:] if n >= 4 else counts
    rolling_avg = float(np.mean(window))

    # 4-week forecast
    last_week_label = sorted_points[-1].week
    residuals = y - y_pred
    std_err = float(np.std(residuals)) if len(residuals) > 1 else 0.0
    margin = 1.96 * std_err  # 95 % confidence interval

    forecast: list[ForecastPoint] = []
    for i in range(1, 5):
        predicted_raw = slope * (n + i - 1) + intercept
        # Blend regression prediction with rolling average
        predicted = 0.6 * predicted_raw + 0.4 * rolling_avg
        predicted = max(0.0, round(predicted, 2))
        lower = max(0.0, round(predicted - margin, 2))
        upper = round(predicted + margin, 2)
        week_label = _next_week_label(last_week_label, i)
        forecast.append(ForecastPoint(week=week_label, predicted=predicted, lower=lower, upper=upper))

    trend = _trend_label(slope, max(0.0, r_squared), counts)

    return PredictionResult(
        pattern_id=data.pattern_id,
        trend=trend,
        slope=round(slope, 4),
        r_squared=round(max(0.0, r_squared), 4),
        growth_rate=growth_rate,
        forecast=forecast,
    )
