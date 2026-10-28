"""Feature contract — single source of truth (SPEC §3.3). Imported by ml/ and apps/api."""

DISEASES = ("diabetes", "heart", "stroke")

TARGETS = {
    "diabetes": "Diabetes_binary",
    "heart": "HeartDiseaseorAttack",
    "stroke": "Stroke",
}

# The 14 model inputs, in model order. None of the TARGETS is ever an input (D-19).
FEATURES = (
    "Age", "Sex", "BMI", "HighBP", "HighChol", "Smoker", "PhysActivity", "Fruits",
    "Veggies", "HvyAlcoholConsump", "GenHlth", "MentHlth", "PhysHlth", "DiffWalk",
)

BINARY_FEATURES = (
    "Sex", "HighBP", "HighChol", "Smoker", "PhysActivity", "Fruits", "Veggies",
    "HvyAlcoholConsump", "DiffWalk",
)

# Allowed value ranges in the BRFSS file (inclusive).
RANGES = {
    **{f: (0, 1) for f in BINARY_FEATURES},
    "Age": (1, 13),
    "BMI": (12, 98),
    "GenHlth": (1, 5),
    "MentHlth": (0, 30),
    "PhysHlth": (0, 30),
}

# Fairness audit only — never model inputs, never asked in the app (D-6).
FAIRNESS_ONLY = ("Income", "Education", "AnyHealthcare", "NoDocbcCost", "CholCheck")

ALL_COLUMNS = (*FEATURES, *TARGETS.values(), *FAIRNESS_ONLY)

# Features the what-if panel may change (SPEC §4.6).
CHANGEABLE = (
    "BMI", "Smoker", "PhysActivity", "Fruits", "Veggies", "HvyAlcoholConsump",
    "GenHlth", "MentHlth", "PhysHlth",
)

AGE_BANDS = [(18, 24)] + [(25 + 5 * i, 29 + 5 * i) for i in range(11)] + [(80, 200)]


def age_to_band(age_years: int) -> int:
    """Map age in years to BRFSS _AGEG5YR band 1..13. Ages < 18 are rejected."""
    if age_years < 18:
        raise ValueError("age must be >= 18")
    for i, (lo, hi) in enumerate(AGE_BANDS, start=1):
        if lo <= age_years <= hi:
            return i
    return 13
