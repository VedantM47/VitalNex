"""Fetch the CDC BRFSS 2015 Diabetes Health Indicators dataset (UCI id 891) into data/raw/.

Run: python -m ml.data.download
Raw data is git-ignored and never committed.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "data" / "raw"
RAW_CSV = RAW_DIR / "diabetes_binary_health_indicators_BRFSS2015.csv"
META_JSON = RAW_DIR / "uci_891_metadata.json"

MANUAL = f"""
Automatic download failed. Download manually:
  1. Open https://www.kaggle.com/datasets/alexteboul/diabetes-health-indicators-dataset
  2. Download diabetes_binary_health_indicators_BRFSS2015.csv
  3. Save it as {RAW_CSV}
Then run: python -m ml.data.prepare
"""


def main() -> int:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    if RAW_CSV.exists():
        print(f"Already present: {RAW_CSV}")
        return 0
    try:
        from ucimlrepo import fetch_ucirepo

        ds = fetch_ucirepo(id=891)
        df = ds.data.features.join(ds.data.targets)
    except Exception as exc:  # network / API failure
        print(f"ucimlrepo fetch failed: {exc!r}")
        print(MANUAL)
        return 1
    df.to_csv(RAW_CSV, index=False)
    META_JSON.write_text(json.dumps(ds.metadata, indent=2, default=str), encoding="utf-8")
    print(f"Saved {len(df):,} rows to {RAW_CSV}")
    print(f"Saved source metadata to {META_JSON}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
