#!/usr/bin/env python3
"""
FastAPI service: loads wait_model.joblib and exposes POST /predict/wait.

Run (after pip install -r requirements.txt and training):
  cd bds_ml
  python api_server.py
  # or: uvicorn api_server:app --host 127.0.0.1 --port 5055

.NET backend proxies to http://127.0.0.1:5055 (see appsettings WaitPrediction:PythonServiceUrl).

Docs: https://fastapi.tiangolo.com/
"""

from __future__ import annotations

import os
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

MODEL_PATH = Path(os.environ.get("WAIT_MODEL_PATH", "models/wait_model.joblib"))

app = FastAPI(title="BDS Wait-Time Model", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_pipe = None


def get_pipe():
    global _pipe
    if _pipe is None:
        if not MODEL_PATH.exists():
            raise HTTPException(
                status_code=503,
                detail=f"Model not found at {MODEL_PATH}. Run: python train_wait_baseline.py",
            )
        _pipe = joblib.load(MODEL_PATH)
    return _pipe


class PredictIn(BaseModel):
    """JSON from .NET uses camelCase (System.Text.Json default)."""

    branchId: int = Field(ge=1, le=99)
    dayOfWeek: int = Field(ge=0, le=6)
    hourOfDay: int = Field(ge=0, le=23)
    month: int = Field(ge=1, le=12)
    serviceType: str = "GeneralBanking"
    queueLength: int = Field(ge=0, le=500)
    countersOpen: int = Field(ge=1, le=50)


class PredictOut(BaseModel):
    waitMinutes: float
    source: str = "sklearn"


@app.get("/health")
def health():
    return {"ok": True, "model_path": str(MODEL_PATH.resolve()), "model_exists": MODEL_PATH.exists()}


@app.post("/predict/wait", response_model=PredictOut)
def predict_wait(body: PredictIn):
    pipe = get_pipe()
    row = pd.DataFrame(
        [
            {
                "branch_id": body.branchId,
                "day_of_week": body.dayOfWeek,
                "hour_of_day": body.hourOfDay,
                "month": body.month,
                "service_type": body.serviceType,
                "queue_length": body.queueLength,
                "counters_open": body.countersOpen,
            }
        ]
    )
    pred = float(pipe.predict(row)[0])
    pred = max(1.0, min(240.0, pred))
    return PredictOut(waitMinutes=round(pred, 2), source="sklearn")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=5055)
