#!/usr/bin/env python3
"""
Rule-based synthetic footfall / queue snapshots for BDS wait-time modelling.

Generates CSV rows: branch, time features, service type, queue state, counters → wait_minutes.
When PBB provides real data, keep the same *idea* of features and swap the CSV path in train.py.

Usage:
  cd bds_ml
  python -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
  pip install -r requirements.txt
  python simulate_footfall.py --rows 5000 --out data/synthetic_footfall.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

# Match FYP business units (strings stable for one-hot encoding later)
SERVICE_TYPES = ("GeneralBanking", "CardServices", "WealthManagement")
# Mean active service duration (minutes) — longer service ⇒ longer waits behind same queue
SERVICE_MEAN_MINUTES = {
    "GeneralBanking": 11.0,
    "CardServices": 17.0,
    "WealthManagement": 32.0,
}
# Branch “busyness” multiplier (urban vs suburban style)
BRANCH_LOAD = {1: 1.35, 2: 1.15, 3: 1.0, 4: 0.9, 5: 0.75}


def hourly_arrival_intensity(hour: int) -> float:
    """Typical banking-style curve: quiet open, lunch peak, afternoon, taper."""
    if hour < 9 or hour > 17:
        return 0.15
    if 11 <= hour <= 13:
        return 1.45
    if 14 <= hour <= 16:
        return 1.2
    if 9 <= hour <= 10:
        return 0.85
    return 1.0


def simulate_rows(n: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    branch_id = rng.integers(1, 6, size=n)
    # Weekday-heavy (Mon–Fri); occasional Saturday (6)
    dow = rng.choice([0, 1, 2, 3, 4, 5, 6], size=n, p=[0.18, 0.18, 0.18, 0.18, 0.18, 0.05, 0.05])
    hour = rng.integers(9, 18, size=n)  # 09:00–17:59 simplified
    month = rng.integers(1, 13, size=n)

    service = rng.choice(np.array(SERVICE_TYPES), size=n)

    counters_open = rng.integers(2, 7, size=n)  # staffed counters for that BU/branch snapshot

    rows = []
    for i in range(n):
        b = int(branch_id[i])
        h = int(hour[i])
        svc = str(service[i])
        lam_base = 4.0 * BRANCH_LOAD[b] * hourly_arrival_intensity(h)
        # Queue length ~ Poisson (arrivals minus service is simplified to one snapshot)
        queue_len = int(rng.poisson(lam_base))
        queue_len = min(queue_len, 80)  # cap extreme tails for realism

        mean_svc = SERVICE_MEAN_MINUTES[svc]
        # Wait ≈ work backlog / parallel servers, with lognormal noise (real life jitter)
        load = (queue_len + 0.5 * mean_svc / 10.0) / max(counters_open[i], 1)
        base_wait = load * mean_svc * (0.55 + 0.08 * BRANCH_LOAD[b])
        noise = rng.lognormal(mean=0.0, sigma=0.22)
        wait = float(base_wait * noise)
        # Saturday / lunch slightly worse on average
        if dow[i] == 5:
            wait *= 1.08
        if 11 <= h <= 13:
            wait *= 1.12
        wait = float(np.clip(wait, 1.0, 240.0))

        rows.append(
            {
                "branch_id": b,
                "day_of_week": int(dow[i]),
                "hour_of_day": h,
                "month": int(month[i]),
                "service_type": svc,
                "queue_length": queue_len,
                "counters_open": int(counters_open[i]),
                "wait_minutes": round(wait, 2),
            }
        )

    return pd.DataFrame(rows)


def main() -> None:
    p = argparse.ArgumentParser(description="Generate synthetic footfall / queue CSV for BDS FYP.")
    p.add_argument("--rows", type=int, default=3000, help="Number of synthetic observations")
    p.add_argument("--out", type=str, default="data/synthetic_footfall.csv", help="Output CSV path")
    p.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility")
    args = p.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    df = simulate_rows(args.rows, args.seed)
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} rows to {out_path.resolve()}")
    print(df.head(3).to_string(index=False))


if __name__ == "__main__":
    main()
