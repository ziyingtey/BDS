#!/usr/bin/env python3
"""
Train a wait-time regression model (minutes) from CSV features.

References (scikit-learn user guide):
  - User guide: https://scikit-learn.org/stable/user_guide.html
  - Train/test split: https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-evaluating-estimator-performance
  - ColumnTransformer + mixed types: https://scikit-learn.org/stable/modules/compose.html#column-transformer-for-heterogeneous-data
  - RandomForestRegressor: https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html
  - Regression metrics: https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics

Expected CSV columns (from simulate_footfall.py or PBB export mapped to same names):
  branch_id, day_of_week, hour_of_day, month, service_type,
  queue_length, counters_open, wait_minutes (target)

Usage:
  pip install -r requirements.txt
  python simulate_footfall.py --rows 8000 --out data/synthetic_footfall.csv
  python train_wait_baseline.py --data data/synthetic_footfall.csv --out models/wait_model.joblib
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

def _one_hot_encoder() -> OneHotEncoder:
    """Dense output for RandomForest; compatible with sklearn 1.2+ and older."""
    try:
        return OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    except TypeError:
        return OneHotEncoder(handle_unknown="ignore", sparse=False)


REQUIRED_COLUMNS = [
    "branch_id",
    "day_of_week",
    "hour_of_day",
    "month",
    "service_type",
    "queue_length",
    "counters_open",
    "wait_minutes",
]


def build_pipeline(random_state: int = 42) -> Pipeline:
    """Preprocessing + regressor. Categoricals one-hot; numerics passed through."""
    cat = ["service_type"]
    num = [
        "branch_id",
        "day_of_week",
        "hour_of_day",
        "month",
        "queue_length",
        "counters_open",
    ]
    pre = ColumnTransformer(
        transformers=[
            ("cat", _one_hot_encoder(), cat),
            ("num", "passthrough", num),
        ]
    )
    rf = RandomForestRegressor(
        n_estimators=200,
        max_depth=16,
        min_samples_leaf=2,
        random_state=random_state,
        n_jobs=-1,
    )
    return Pipeline([("prep", pre), ("model", rf)])


def main() -> None:
    ap = argparse.ArgumentParser(description="Train wait-time model for BDS FYP.")
    ap.add_argument("--data", default="data/synthetic_footfall.csv", help="Training CSV path")
    ap.add_argument("--out", default="models/wait_model.joblib", help="Output joblib path")
    ap.add_argument("--test-size", type=float, default=0.2, help="Hold-out test fraction")
    ap.add_argument("--cv", type=int, default=5, help="Cross-validation folds (0 to skip)")
    ap.add_argument("--seed", type=int, default=42, help="Random seed")
    args = ap.parse_args()

    path = Path(args.data)
    if not path.exists():
        raise SystemExit(f"Missing {path}. Run: python simulate_footfall.py --rows 8000")

    df = pd.read_csv(path)
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise SystemExit(f"CSV missing columns: {missing}. Found: {list(df.columns)}")

    target = "wait_minutes"
    X = df.drop(columns=[target])
    y = df[target].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=args.test_size,
        random_state=args.seed,
        shuffle=True,
    )

    pipe = build_pipeline(random_state=args.seed)

    # Cross-validation on training portion only (avoids leakage from test set)
    cv_note = "skipped"
    if args.cv and args.cv >= 2:
        n_train = len(X_train)
        n_splits = min(args.cv, max(2, n_train // 5))
        if n_splits >= 2:
            cv = KFold(n_splits=n_splits, shuffle=True, random_state=args.seed)
            neg_mae = cross_val_score(
                pipe,
                X_train,
                y_train,
                cv=cv,
                scoring="neg_mean_absolute_error",
                n_jobs=-1,
            )
            cv_mae = float(-neg_mae.mean())
            cv_std = float(neg_mae.std())
            print(f"CV MAE (train folds, {n_splits}-fold): {cv_mae:.3f} (+/- {cv_std:.3f}) minutes")
            cv_note = f"{n_splits}-fold MAE mean={cv_mae:.4f}, std={cv_std:.4f}"

    pipe.fit(X_train, y_train)
    pred_test = pipe.predict(X_test)

    mae = mean_absolute_error(y_test, pred_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, pred_test)))
    r2 = r2_score(y_test, pred_test)

    print(f"\nHold-out test set (n={len(y_test)}):")
    print(f"  MAE  (mean abs error): {mae:.3f} minutes")
    print(f"  RMSE (root mean sq):   {rmse:.3f} minutes")
    print(f"  R²   (coeff. of det.): {r2:.4f}")

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipe, out)
    print(f"\nSaved pipeline → {out.resolve()}")

    report = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "data_path": str(path.resolve()),
        "n_rows": int(len(df)),
        "test_size": args.test_size,
        "cv_summary": cv_note,
        "metrics_holdout": {
            "mae_minutes": round(mae, 6),
            "rmse_minutes": round(rmse, 6),
            "r2": round(r2, 6),
            "n_test": int(len(y_test)),
        },
        "sklearn_pipeline": "ColumnTransformer(OneHotEncoder + numerics) -> RandomForestRegressor",
        "references": [
            "https://scikit-learn.org/stable/modules/cross_validation.html",
            "https://scikit-learn.org/stable/modules/model_evaluation.html#regression-metrics",
        ],
    }
    report_path = out.parent / "training_metrics.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Saved metrics  → {report_path.resolve()}")


if __name__ == "__main__":
    main()
