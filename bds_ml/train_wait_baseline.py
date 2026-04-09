#!/usr/bin/env python3
"""
Train a simple wait-time model on synthetic_footfall.csv (or PBB export with same columns).

Usage:
  python simulate_footfall.py --rows 8000 --out data/synthetic_footfall.csv
  python train_wait_baseline.py --data data/synthetic_footfall.csv --out models/wait_model.joblib
"""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="data/synthetic_footfall.csv")
    ap.add_argument("--out", default="models/wait_model.joblib")
    args = ap.parse_args()

    path = Path(args.data)
    if not path.exists():
        raise SystemExit(f"Missing {path}. Run: python simulate_footfall.py")

    df = pd.read_csv(path)
    target = "wait_minutes"
    X = df.drop(columns=[target])
    y = df[target]

    cat = ["service_type"]
    num = [c for c in X.columns if c not in cat]

    pre = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), cat),
            ("num", "passthrough", num),
        ]
    )
    model = Pipeline(
        steps=[
            ("prep", pre),
            ("rf", RandomForestRegressor(n_estimators=120, random_state=42, max_depth=12)),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    print(f"Test MAE (minutes): {mae:.2f}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out)
    print(f"Saved {out.resolve()}")


if __name__ == "__main__":
    main()
