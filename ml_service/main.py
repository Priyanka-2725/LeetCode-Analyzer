"""
LeetCode Analytics — ML Prediction Microservice
FastAPI service that provides streak risk, growth prediction,
and performance decline detection.
"""

from __future__ import annotations

import logging
import os
import time
from typing import Literal

import numpy as np
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator

# ── Logging ───────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="LeetCode ML Prediction Service",
    description="Streak risk, growth prediction, and performance decline detection.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5000").split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── Root route ───────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "status": "ok",
        "message": "LeetCode ML Prediction Service is running",
        "endpoints": {
            "docs": "/docs",
            "predict": "/predict",
        },
    }

# ── Request / Response schemas ────────────────────────────────────────────────

class PredictRequest(BaseModel):
    avgProblemsPerDay: float = Field(..., ge=0, le=100, description="Average problems solved per day")
    consistencyScore: float  = Field(..., ge=0, le=100, description="Consistency score 0–100")
    growthRate: float        = Field(..., ge=-100, le=500, description="% growth vs previous period")
    weakTopicsCount: int     = Field(..., ge=0, le=50,  description="Number of identified weak topics")

    @field_validator("avgProblemsPerDay", "consistencyScore", mode="before")
    @classmethod
    def round_floats(cls, v: float) -> float:
        return round(float(v), 4)


RiskLevel = Literal["low", "medium", "high"]


class PredictResponse(BaseModel):
    streakRisk: RiskLevel
    riskScore: float                  = Field(..., description="Raw risk score 0.0–1.0")
    predictedSolvesNextWeek: float
    predictedSolvesNextMonth: float
    confidence: float                 = Field(..., description="Prediction confidence 0.0–1.0")
    performanceDecline: bool
    declineSeverity: Literal["none", "mild", "moderate", "severe"]
    message: str
    details: dict


# ── ML Models (pure-math, no external model files needed) ────────────────────

class StreakRiskModel:
    """
    Weighted scoring model for streak break risk.

    Weights (sum = 1.0):
      - Inconsistency component  : 0.40
      - Weak topics component    : 0.30
      - Negative growth component: 0.30
    """

    W_CONSISTENCY = 0.40
    W_WEAK_TOPICS = 0.30
    W_GROWTH      = 0.30

    # Thresholds
    HIGH_THRESHOLD   = 0.60
    MEDIUM_THRESHOLD = 0.35

    def predict(
        self,
        consistency_score: float,
        weak_topics_count: int,
        growth_rate: float,
    ) -> tuple[RiskLevel, float]:
        # Inconsistency: higher score → lower risk
        inconsistency = 1.0 - np.clip(consistency_score / 100.0, 0.0, 1.0)

        # Weak topics: normalised to [0, 1] over a max of 10 topics
        weak_component = np.clip(weak_topics_count / 10.0, 0.0, 1.0)

        # Growth: only negative growth contributes to risk
        # growth_rate is a %; map [-100, 0] → [1, 0]
        negative_growth = np.clip(-growth_rate / 100.0, 0.0, 1.0)

        risk_score = float(
            self.W_CONSISTENCY * inconsistency
            + self.W_WEAK_TOPICS * weak_component
            + self.W_GROWTH * negative_growth
        )
        risk_score = round(np.clip(risk_score, 0.0, 1.0), 4)

        if risk_score >= self.HIGH_THRESHOLD:
            level: RiskLevel = "high"
        elif risk_score >= self.MEDIUM_THRESHOLD:
            level = "medium"
        else:
            level = "low"

        return level, risk_score


class GrowthModel:
    """
    Linear regression–style growth predictor.

    Base formula:  future_solves = avg_per_day * horizon_days
    Growth adjustment: multiply by (1 + growth_rate/100) capped at ±50 %
    """

    def predict(self, avg_per_day: float, growth_rate: float, horizon_days: int) -> float:
        base = avg_per_day * horizon_days
        # Cap growth adjustment to ±50 % to avoid wild extrapolation
        adjustment = np.clip(1.0 + growth_rate / 100.0, 0.5, 1.5)
        return round(float(base * adjustment), 2)


class ConfidenceModel:
    """
    Confidence is driven primarily by consistency (how reliable the data is)
    and secondarily by growth stability.
    """

    def predict(self, consistency_score: float, growth_rate: float) -> float:
        base_confidence = consistency_score / 100.0
        # Penalise extreme growth values (very high or very negative = less reliable)
        stability_penalty = np.clip(abs(growth_rate) / 200.0, 0.0, 0.25)
        confidence = float(np.clip(base_confidence - stability_penalty, 0.05, 0.99))
        return round(confidence, 4)


class DeclineDetector:
    """
    Detects performance decline based on growth rate and consistency.

    Severity mapping:
      none     : growth >= -10 %
      mild     : -10 % > growth >= -25 %
      moderate : -25 % > growth >= -50 %
      severe   : growth < -50 %
    """

    def predict(
        self, growth_rate: float, consistency_score: float
    ) -> tuple[bool, Literal["none", "mild", "moderate", "severe"]]:
        # Decline only if growth is negative AND consistency is below 60
        declining = growth_rate < -10 and consistency_score < 60

        if not declining or growth_rate >= -10:
            return False, "none"
        if growth_rate >= -25:
            return True, "mild"
        if growth_rate >= -50:
            return True, "moderate"
        return True, "severe"


# Instantiate models once at startup
_streak_model   = StreakRiskModel()
_growth_model   = GrowthModel()
_confidence_model = ConfidenceModel()
_decline_detector = DeclineDetector()


# ── Message generator ─────────────────────────────────────────────────────────

def build_message(
    risk: RiskLevel,
    decline: bool,
    decline_severity: str,
    predicted_week: float,
    confidence: float,
    consistency: float,
    growth_rate: float,
) -> str:
    parts: list[str] = []

    if risk == "high":
        parts.append("⚠️ High streak risk detected — solve at least 1 problem today.")
    elif risk == "medium":
        parts.append("🟡 Moderate streak risk — maintain your daily habit.")
    else:
        parts.append("✅ Streak is healthy — keep the momentum going.")

    if decline and decline_severity != "none":
        parts.append(f"📉 {decline_severity.capitalize()} performance decline detected.")

    parts.append(
        f"📈 Projected {predicted_week:.1f} solves next week "
        f"(confidence: {confidence * 100:.0f}%)."
    )

    if consistency < 30:
        parts.append("💡 Tip: Aim for at least 1 problem per day to boost consistency.")
    elif growth_rate > 20:
        parts.append("🚀 Great growth momentum — push into harder problems.")

    return "  ".join(parts)


# ── Middleware: request timing ────────────────────────────────────────────────

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = round((time.perf_counter() - start) * 1000, 2)
    response.headers["X-Process-Time-Ms"] = str(elapsed)
    return response


# ── Exception handler ─────────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    log.exception("Unhandled error on %s", request.url)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal prediction service error", "detail": str(exc)},
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["ops"])
def health():
    """Liveness probe."""
    return {"status": "ok", "service": "ml-prediction", "version": "1.0.0"}


@app.get("/ready", tags=["ops"])
def ready():
    """Readiness probe — confirms models are loaded."""
    return {
        "status": "ready",
        "models": ["StreakRiskModel", "GrowthModel", "ConfidenceModel", "DeclineDetector"],
    }


@app.post("/predict", response_model=PredictResponse, tags=["prediction"])
def predict(body: PredictRequest) -> PredictResponse:
    """
    Run all ML models against the provided analytics features and return
    a unified prediction payload.

    **Input**
    - `avgProblemsPerDay`  — rolling average solves per day
    - `consistencyScore`  — 0–100 active-day ratio
    - `growthRate`        — % change vs previous period (can be negative)
    - `weakTopicsCount`   — number of topics below mastery threshold

    **Output**
    - `streakRisk`               — low / medium / high
    - `riskScore`                — raw 0–1 score
    - `predictedSolvesNextWeek`  — 7-day projection
    - `predictedSolvesNextMonth` — 30-day projection
    - `confidence`               — 0–1 prediction reliability
    - `performanceDecline`       — boolean flag
    - `declineSeverity`          — none / mild / moderate / severe
    - `message`                  — human-readable summary
    - `details`                  — per-model breakdown
    """
    log.info(
        "predict  avg=%.2f  consistency=%.1f  growth=%.1f  weakTopics=%d",
        body.avgProblemsPerDay,
        body.consistencyScore,
        body.growthRate,
        body.weakTopicsCount,
    )

    # Run models
    risk_level, risk_score = _streak_model.predict(
        body.consistencyScore, body.weakTopicsCount, body.growthRate
    )
    predicted_week  = _growth_model.predict(body.avgProblemsPerDay, body.growthRate, 7)
    predicted_month = _growth_model.predict(body.avgProblemsPerDay, body.growthRate, 30)
    confidence      = _confidence_model.predict(body.consistencyScore, body.growthRate)
    decline, severity = _decline_detector.predict(body.growthRate, body.consistencyScore)

    message = build_message(
        risk_level, decline, severity,
        predicted_week, confidence,
        body.consistencyScore, body.growthRate,
    )

    details = {
        "streakRiskModel": {
            "inconsistencyComponent": round((1 - body.consistencyScore / 100) * StreakRiskModel.W_CONSISTENCY, 4),
            "weakTopicsComponent":    round((body.weakTopicsCount / 10) * StreakRiskModel.W_WEAK_TOPICS, 4),
            "negativeGrowthComponent": round(max(0, -body.growthRate / 100) * StreakRiskModel.W_GROWTH, 4),
        },
        "growthModel": {
            "baseSolves7d":  round(body.avgProblemsPerDay * 7, 2),
            "baseSolves30d": round(body.avgProblemsPerDay * 30, 2),
            "growthAdjustment": round(min(max(1 + body.growthRate / 100, 0.5), 1.5), 4),
        },
        "confidenceModel": {
            "baseConfidence":    round(body.consistencyScore / 100, 4),
            "stabilityPenalty":  round(min(abs(body.growthRate) / 200, 0.25), 4),
        },
        "declineDetector": {
            "declining":  decline,
            "severity":   severity,
            "growthRate": body.growthRate,
        },
    }

    return PredictResponse(
        streakRisk=risk_level,
        riskScore=risk_score,
        predictedSolvesNextWeek=predicted_week,
        predictedSolvesNextMonth=predicted_month,
        confidence=confidence,
        performanceDecline=decline,
        declineSeverity=severity,
        message=message,
        details=details,
    )


@app.post("/predict/batch", tags=["prediction"])
def predict_batch(bodies: list[PredictRequest]) -> list[PredictResponse]:
    """Run predictions for multiple users in one call (max 50)."""
    if len(bodies) > 50:
        raise HTTPException(status_code=400, detail="Batch size cannot exceed 50.")
    return [predict(b) for b in bodies]
