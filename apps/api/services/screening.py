"""
Screening engine (no database): the order of operations in docs/SPEC.md §1.4.

emergency red flags -> data-quality gate -> per-disease predict -> calibrate -> OOD + conformal
-> band -> next-step rules -> explanations / guidance.

Models are loaded once from ml/artifacts (ml.predictor.DiseaseModel). Every number returned traces
to those artifacts. Medicines are never named; diagnoses are never stated.
"""

import itertools
import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from apps.api.core.emergency import text_has_red_flag
from apps.api.schemas.assessment import AssessmentInputs, AssessmentRequest, CHANGEABLE_FIELDS
from ml.predictor import DiseaseModel
from ml.training.features import DISEASES, FEATURES, age_to_band

CONTENT = Path(__file__).resolve().parents[1] / "content"
BANDS = ("low", "moderate", "high")
BMI_RANGE = (12.0, 70.0)
BMI_OVERWEIGHT_ASIAN, BMI_OBESE_ASIAN = 23.0, 27.5
YOUNG_AGE = 40  # D-24: results are less reliable under 40
TOP_K = 3

DISCLAIMER = (
    "VITALNEX is a screening and care-navigation prototype. It does not diagnose disease, does not "
    "recommend medicines, and does not replace a qualified healthcare professional. If you have "
    "chest pain, signs of stroke or severe breathlessness, call 108 / 112 now."
)

# Next-step codes (SPEC §1.4), first match wins.
EMERGENCY, CORRECT_INPUTS, NOT_CONFIDENT = "emergency", "correct_inputs", "not_confident"
SEE_DOCTOR_SOON, DISCUSS_NEXT_CHECKUP, ROUTINE_CHECKUP = "see_doctor_soon", "discuss_next_checkup", "routine_checkup"
QUEUE_STEPS = {EMERGENCY, NOT_CONFIDENT, SEE_DOCTOR_SOON}


@lru_cache(maxsize=1)
def models() -> Dict[str, DiseaseModel]:
    return {d: DiseaseModel(d) for d in DISEASES}


@lru_cache(maxsize=6)
def _content(kind: str, lang: str) -> dict:
    return json.loads((CONTENT / f"{kind}.{lang}.json").read_text(encoding="utf-8"))


def model_versions() -> Dict[str, Any]:
    return {d: {"version": m.meta["version"], "data_hash": m.meta["data_hash"], "model": m.meta["chosen_model"]}
            for d, m in models().items()}


def bmi_of(inputs: AssessmentInputs) -> float:
    return round(inputs.weight_kg / (inputs.height_cm / 100) ** 2, 1)


def feature_row(inputs: AssessmentInputs, sex: int) -> Dict[str, int]:
    """Map form answers to the 14 BRFSS features. Nothing is filled in: every value comes from the form."""
    return {
        "Age": age_to_band(inputs.age),
        "Sex": sex,
        "BMI": int(round(bmi_of(inputs))),
        "HighBP": int(inputs.high_bp),
        "HighChol": int(inputs.high_chol),
        "Smoker": int(inputs.smoker),
        "PhysActivity": int(inputs.phys_activity),
        "Fruits": int(inputs.fruits),
        "Veggies": int(inputs.veggies),
        "HvyAlcoholConsump": int(inputs.heavy_alcohol),
        "GenHlth": inputs.gen_health,
        "MentHlth": inputs.ment_health_days,
        "PhysHlth": inputs.phys_health_days,
        "DiffWalk": int(inputs.diff_walk),
    }


def sex_variants(inputs: AssessmentInputs) -> List[int]:
    return {"female": [0], "male": [1], "prefer_not_to_say": [0, 1]}[inputs.sex]


def data_quality(inputs: AssessmentInputs) -> Dict[str, Any]:
    """Hard errors stop the assessment (rule 2). Warnings are kept and shown to the clinician."""
    errors, warnings = [], []
    bmi = bmi_of(inputs)
    if not BMI_RANGE[0] <= bmi <= BMI_RANGE[1]:
        errors.append({"field": "weight_kg", "code": "bmi_out_of_range", "bmi": bmi})
    if inputs.gen_health == 1 and inputs.phys_health_days >= 20:
        warnings.append({"code": "excellent_health_but_many_unwell_days"})
    if inputs.gen_health == 1 and inputs.diff_walk:
        warnings.append({"code": "excellent_health_but_difficulty_walking"})
    return {"passed": not errors, "errors": errors, "warnings": warnings}


def _explain(values, lang: str) -> List[Dict[str, Any]]:
    content = _content("explanations", lang)
    order = sorted(range(len(FEATURES)), key=lambda i: -abs(values[i]))[:TOP_K]
    out = []
    for i in order:
        if values[i] == 0:
            continue
        f, direction = FEATURES[i], "raises" if values[i] > 0 else "lowers"
        text = content["templates"][direction].format(feature=content["features"][f])
        out.append({
            "feature": f,
            "direction": direction,
            "shap": float(values[i]),
            "text_key": f"factor.{f}.{direction}",
            "text": text[:1].upper() + text[1:],
        })
    return out


def score(inputs: AssessmentInputs, lang: str = "en", explain: bool = True) -> Dict[str, Dict[str, Any]]:
    """Per disease result for valid inputs. For 'prefer not to say', both sexes are scored (D-9):
    the higher band is kept, and if either run abstains the disease abstains."""
    out = {}
    variants = sex_variants(inputs)
    rows = pd.DataFrame([feature_row(inputs, s) for s in variants])
    for d, m in models().items():
        pred = m.predict(rows)
        pick = max(range(len(variants)), key=lambda i: (pred["band"][i], pred["p"][i]))
        abstained = bool(pred["abstain"].any())
        reason = None
        if abstained:
            reason = "out_of_distribution" if pred["ood"].any() else "conformal_uncertain"
        p = float(pred["p"][pick])
        has0, has1 = p <= m.conformal["q0"], 1 - p <= m.conformal["q1"]
        res = {
            "band": BANDS[int(pred["band"][pick])],
            "probability": round(p, 4),
            "abstained": abstained,
            "abstain_reason": reason,
            "conformal_set": [c for c, inc in ((0, has0), (1, has1)) if inc],
            "sex_used": variants[pick] if len(variants) > 1 else None,
            "top_factors": _explain(m.shap(rows.iloc[[pick]])[0], lang) if explain else [],
        }
        out[d] = res
    return out


def shared_factors(results: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Interaction view: factors in the top 3 of two or more (non-abstained) diseases."""
    seen: Dict[str, Dict[str, str]] = {}
    for d, r in results.items():
        if r["abstained"]:
            continue
        for f in r["top_factors"]:
            seen.setdefault(f["feature"], {})[d] = f["direction"]
    return [{"feature": f, "diseases": ds} for f, ds in seen.items() if len(ds) >= 2]


def next_step(emergency: bool, dq_passed: bool, results: Dict[str, Dict[str, Any]]) -> str:
    if emergency:
        return EMERGENCY
    if not dq_passed:
        return CORRECT_INPUTS
    if any(r["abstained"] for r in results.values()):
        return NOT_CONFIDENT
    bands = {r["band"] for r in results.values()}
    if "high" in bands:
        return SEE_DOCTOR_SOON
    if "moderate" in bands:
        return DISCUSS_NEXT_CHECKUP
    return ROUTINE_CHECKUP


def queue_reasons(step: str, results: Dict[str, Dict[str, Any]], dq: Dict[str, Any]) -> List[str]:
    if step not in QUEUE_STEPS:
        return []
    reasons = []
    if step == EMERGENCY:
        reasons.append("emergency")
    if any(r["abstained"] for r in results.values()):
        reasons.append("abstained")
    if any(r["band"] == "high" and not r["abstained"] for r in results.values()):
        reasons.append("high_band")
    if dq["warnings"]:
        reasons.append("data_quality")
    return reasons


def guidance(inputs: AssessmentInputs, lang: str) -> List[Dict[str, Any]]:
    items = _content("guidance", lang)["items"]
    bmi = bmi_of(inputs)
    keys = []
    if bmi >= BMI_OBESE_ASIAN:
        keys.append("bmi_obese")
    elif bmi >= BMI_OVERWEIGHT_ASIAN:
        keys.append("bmi_overweight")
    if not inputs.phys_activity:
        keys.append("physical_activity")
    if not (inputs.fruits and inputs.veggies):
        keys.append("diet")
    if inputs.smoker:
        keys.append("tobacco")
    if inputs.heavy_alcohol:
        keys.append("alcohol")
    if inputs.high_bp:
        keys.append("blood_pressure")
    if inputs.high_chol:
        keys.append("cholesterol")
    if inputs.ment_health_days >= 14:
        keys.append("mental_health")
    keys.append("regular_checkups")
    return [{"key": k, **items[k]} for k in keys]


def assess(req: AssessmentRequest) -> Dict[str, Any]:
    """Full (clinician-level) result. Use shape_for_role before returning it to a patient."""
    lang = req.language
    emergency = any(req.symptoms.model_dump().values()) or text_has_red_flag(req.free_text)
    dq = data_quality(req)
    base = {"emergency": emergency, "data_quality": dq, "bmi": bmi_of(req), "results": {},
            "shared_factors": [], "notes": [], "guidance": [], "model_versions": {},
            "disclaimer": DISCLAIMER}
    if emergency:  # rule 1: no models, no scores
        return {**base, "next_step": EMERGENCY, "queue_reasons": ["emergency"]}
    if not dq["passed"]:  # rule 2
        return {**base, "next_step": CORRECT_INPUTS, "queue_reasons": []}

    results = score(req, lang)
    step = next_step(False, True, results)
    notes = []
    if req.sex == "prefer_not_to_say":
        notes.append("sex_not_stated_higher_band_used")
    if req.age < YOUNG_AGE:
        notes.append("age_under_40_less_reliable")
    return {**base, "results": results, "next_step": step, "queue_reasons": queue_reasons(step, results, dq),
            "shared_factors": shared_factors(results), "notes": notes,
            "guidance": guidance(req, lang), "model_versions": model_versions()}


PATIENT_HIDDEN = ("probability", "conformal_set", "sex_used")


def shape_results(results: Dict[str, Dict[str, Any]], role: str) -> Dict[str, Dict[str, Any]]:
    """Patients get bands and text only; abstained diseases get no band (D-10). Clinicians get all."""
    if role == "doctor":
        return results
    shaped = {}
    for d, r in results.items():
        r = {k: v for k, v in r.items() if k not in PATIENT_HIDDEN}
        r["top_factors"] = [{k: v for k, v in f.items() if k != "shap"} for f in r["top_factors"]]
        if r["abstained"]:
            r["band"] = None
            r["top_factors"] = []
        shaped[d] = r
    return shaped


def shape_for_role(result: Dict[str, Any], role: str) -> Dict[str, Any]:
    if role == "doctor":
        return result
    shaped = {k: v for k, v in result.items() if k != "queue_reasons"}
    shaped["results"] = shape_results(result["results"], role)
    return shaped


# --- What-if and recourse (SPEC §4.6) -------------------------------------------------------------

class NotChangeableError(ValueError):
    pass


def _answers(inputs: AssessmentInputs) -> Dict[str, Any]:
    """Form answers only (drops symptoms / free text / language from a full request)."""
    return {k: getattr(inputs, k) for k in AssessmentInputs.model_fields}


def apply_changes(base: AssessmentInputs, changes: Dict[str, Any]) -> tuple[AssessmentInputs, List[str]]:
    bad = sorted(set(changes) - set(CHANGEABLE_FIELDS))
    if bad:
        raise NotChangeableError(f"These answers cannot be changed in what-if: {', '.join(bad)}")
    notes = []
    changes = dict(changes)
    if base.smoker and changes.get("smoker") is False:
        # BRFSS asks "ever smoked 100 cigarettes": quitting cannot turn it back to no.
        changes.pop("smoker")
        notes.append("smoker_ever_cannot_reset")
    new = AssessmentInputs.model_validate({**_answers(base), **changes})
    if not data_quality(new)["passed"]:
        raise ValueError("The changed answers give a BMI outside 12–70.")
    return new, notes


def what_if(base: AssessmentInputs, changes: Dict[str, Any], lang: str) -> Dict[str, Any]:
    new, notes = apply_changes(base, changes)
    before, after = score(base, lang, explain=False), score(new, lang, explain=True)
    return {"before": before, "after": after, "applied_changes": {k: v for k, v in _answers(new).items() if v != _answers(base)[k]},
            "notes": notes, "disclaimer": DISCLAIMER}


def _candidate_steps(base: AssessmentInputs) -> List[Dict[str, Any]]:
    """Single realistic changes. Weight at most -10%; health days halved; GenHlth one step better."""
    steps = [{"weight_kg": round(base.weight_kg * f, 1)} for f in (0.975, 0.95, 0.925, 0.90)
             if base.weight_kg * f >= 30]
    for field in ("phys_activity", "fruits", "veggies"):
        if not getattr(base, field):
            steps.append({field: True})
    if base.heavy_alcohol:
        steps.append({"heavy_alcohol": False})
    if base.gen_health > 1:
        steps.append({"gen_health": base.gen_health - 1})
    for field in ("ment_health_days", "phys_health_days"):
        v = getattr(base, field)
        if v >= 2:
            steps.append({field: v // 2})
    return steps


def _size(change: Dict[str, Any], base: AssessmentInputs) -> float:
    """Smaller is easier: number of answers changed, then how far weight moves."""
    w = abs(change.get("weight_kg", base.weight_kg) - base.weight_kg) / base.weight_kg
    return len(change) + w


def recourse(base: AssessmentInputs, lang: str) -> Dict[str, Any]:
    """For each disease in moderate/high (and not abstained), the smallest single or pair change
    that lowers its band."""
    current = score(base, lang, explain=False)
    singles = _candidate_steps(base)
    combos = singles + [{**a, **b} for a, b in itertools.combinations(singles, 2) if not set(a) & set(b)]
    combos.sort(key=lambda c: _size(c, base))
    variants = sex_variants(base)
    candidates = []
    for c in combos:
        inp = AssessmentInputs.model_validate({**_answers(base), **c})
        if data_quality(inp)["passed"]:
            candidates.append((c, inp))
    rows = pd.DataFrame([feature_row(inp, s) for _, inp in candidates for s in variants])
    out = {}
    for d, m in models().items():
        cur = current[d]
        if cur["abstained"] or cur["band"] == "low":
            out[d] = {"current_band": None if cur["abstained"] else cur["band"], "suggestion": None,
                      "reason": "abstained" if cur["abstained"] else "already_low"}
            continue
        pred = m.predict(rows) if len(rows) else None
        found = None
        n = len(variants)
        for i, (c, _) in enumerate(candidates):
            sl = slice(i * n, (i + 1) * n)
            if pred["abstain"][sl].any():
                continue
            band = int(pred["band"][sl].max())
            if band < BANDS.index(cur["band"]):
                found = {"changes": c, "new_band": BANDS[band]}
                break
        out[d] = {"current_band": cur["band"], "suggestion": found,
                  "reason": None if found else "no_small_change_found"}
    return {"recourse": out, "limits": "single or paired changes; weight at most -10%; health days at most halved; "
                                       "general health one step; never age, sex, blood pressure, cholesterol or "
                                       "walking difficulty", "disclaimer": DISCLAIMER}
