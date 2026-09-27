# VITALNEX Data Directory Architecture

This directory houses raw research datasets, processed artifacts, and deterministic demo samples for VITALNEX.

## Directory Structure

```text
/data
  /raw/                  # Raw input datasets (e.g., Pune_Clinical_Risk_Synthetic_Dataset_20000.csv)
  /processed/            # Cleaned, standardized, or engineered features (used in training/validation)
  /demo/                 # Deterministic, non-PHI sample records for offline UI and rapid demo mode
```

## Dataset Specifications

- **Current Reference**: `Pune_Clinical_Risk_Synthetic_Dataset_20000.csv`
- **Rows**: 20,000 synthetic patient records
- **Columns**: 26 features (demographic, lifestyle, clinical, UCI-aligned cardiac metrics, and target labels)
- **Provenance**: Synthetic academic research dataset for AI fairness, safety, and clinical decision support evaluation. Contains **NO real patient data**.
- **Data Dictionary**: See `data/raw/Pune_Clinical_Risk_Data_Dictionary.csv` and `data/raw/Pune_Clinical_Risk_Dataset_Provenance.txt`.

## Data Governance & Safety Rule

1. Never place unanonymized or real protected health information (PHI) in this directory.
2. In production, datasets are registered via the `DatasetService` and `DatasetVersion` schemas.
3. Frontends must **never** load raw CSV files directly from the browser; all data access goes through the authenticated FastAPI / Supabase data interfaces.
