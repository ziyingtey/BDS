#!/usr/bin/env python3
"""
Load a trained pipeline and predict wait_minutes for sample rows.

Usage:
  python train_wait_baseline.py --data data/synthetic_footfall.csv --out models/wait_model.joblib
  python predict_example.py --model models/wait_model.joblib
"""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="models/wait_model.joblib")
    args = ap.parse_args()
    path = Path(args.model)
    if not path.exists():
        raise SystemExit(f"Missing {path}. Train first: python train_wait_baseline.py")

    pipe = joblib.load(path)
    sample = pd.DataFrame(
        [
            {
                "branch_id": 1,
                "day_of_week": 1,
                "hour_of_day": 12,
                "month": 6,
                "service_type": "GeneralBanking",
                "queue_length": 10,
                "counters_open": 4,
            },
            {
                "branch_id": 2,
                "day_of_week": 3,
                "hour_of_day": 15,
                "month": 6,
                "service_type": "WealthManagement",
                "queue_length": 5,
                "counters_open": 3,
            },
        ]
    )
    pred = pipe.predict(sample)
    for i, minutes in enumerate(pred):
        print(f"Sample {i + 1}: predicted wait ≈ {minutes:.2f} minutes")


if __name__ == "__main__":
    main()
