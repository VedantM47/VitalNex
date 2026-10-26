# VITALNEX data directory

```text
data/
  raw/         Real training data downloaded in Phase P2 (CDC BRFSS, UCI id 891). Git-ignored.
  processed/   Prepared data written by ml/data/prepare.py (Phase P2). Git-ignored.
  synthetic/   Pune Clinical Risk Synthetic Dataset (team-made). Committed.
```

## `synthetic/` — demo and stress-test use only

`synthetic/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv` (20,000 rows), its data dictionary and
provenance note are **synthetic**. They contain no real patient data.

Per decision D-4 (`docs/DECISIONS.md`) this dataset is used **only** for:

- demo patient profiles (age, sex, locality), clearly labelled "synthetic demo patient";
- stress tests (missing, out-of-range and contradictory inputs).

It is **never** used to train or evaluate the production models, and no metric computed on it is
reported anywhere. Its labels come from a formula, so metrics on it describe that formula, not people.

## Rules

1. Never place real or identifiable health data in this directory.
2. Never commit `raw/` or `processed/`.
3. Browsers never load these files directly; all access goes through the API.
