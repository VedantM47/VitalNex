"""
Trust Passport and NITI Aayog principle traceability map (docs/SPEC.md §7.1, PROMPTS P7 steps 1-2).

Nothing here is hardcoded: model facts come from ml/artifacts/<disease>/model_meta.json,
data facts from ml/data/stats.json and docs/data_card.md, accepted trade-offs from
docs/DECISIONS.md (D-22, D-23, D-24), and live counts from the database. Any value that
cannot be read or computed is returned as "not available" (hard rule 4).
"""

import json
import re
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from apps.api.core.config import settings
from apps.api.services import aggregates, screening
from apps.api.services.governance_service import fairness_tables
from apps.api.services.aggregates import NOT_AVAILABLE

ROOT = Path(__file__).resolve().parents[3]
CONTENT = Path(__file__).resolve().parents[1] / "content"
DATA_CARD = ROOT / "docs" / "data_card.md"
DECISIONS = ROOT / "docs" / "DECISIONS.md"
DATA_STATS = ROOT / "ml" / "data" / "stats.json"
# Written by the assistant NLP phase (P8); absent until then.
NLP_META_CANDIDATES = (ROOT / "ml" / "artifacts" / "assistant" / "nlp_meta.json", ROOT / "ml" / "nlp" / "nlp_meta.json")
PASSPORT_DECISIONS = ("D-22", "D-23", "D-24")
IMAGES = ("reliability.png", "shap_global.png")


# ── file-backed facts ──

def _read_text(path: Path) -> Optional[str]:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return None


def _section(md: str, heading: str) -> Optional[str]:
    m = re.search(rf"^## {re.escape(heading)}\s*$(.*?)(?=^## |\Z)", md, flags=re.M | re.S)
    return m.group(1) if m else None


def _table_rows(block: str) -> Dict[str, str]:
    rows = {}
    for line in block.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) == 2 and cells[0] and not set(cells[0]) <= {"-", " "}:
            rows[cells[0]] = cells[1]
    return rows


def data_facts() -> Dict[str, Any]:
    """Facts from the generated data card and ml/data/stats.json."""
    md = _read_text(DATA_CARD)
    out: Dict[str, Any] = {"data_card_path": "docs/data_card.md"}
    if md is None:
        return {**out, "available": False}
    source = _table_rows(_section(md, "Source") or "")
    licence = re.search(r"Finding: licence is \*\*(.+?)\*\*", md)
    limits_block = _section(md, "Limitations") or ""
    out.update({
        "available": True,
        "name": source.get("Name", NOT_AVAILABLE),
        "doi": source.get("DOI", NOT_AVAILABLE),
        "underlying_survey": source.get("Underlying survey", NOT_AVAILABLE),
        "licence": licence.group(1) if licence else NOT_AVAILABLE,
        "limitations": [re.sub(r"^\d+\.\s*", "", l.strip()) for l in limits_block.splitlines() if re.match(r"^\d+\.", l.strip())],
        "synthetic_data_note": (_section(md, "Other data") or "").strip() or NOT_AVAILABLE,
    })
    try:
        stats = json.loads(DATA_STATS.read_text(encoding="utf-8"))
        out.update({
            "rows": stats["rows"],
            "exact_duplicate_rows": stats["exact_duplicate_rows"],
            "prevalence": stats["prevalence"],
            "positives": stats["positives"],
            "data_hash": stats["data_hash"],
            "splits": stats["splits"],
        })
    except (OSError, KeyError, ValueError):
        out["rows"] = NOT_AVAILABLE
    return out


def decisions(ids=PASSPORT_DECISIONS) -> List[Dict[str, str]]:
    md = _read_text(DECISIONS) or ""
    out = []
    for did in ids:
        m = re.search(rf"^\| {re.escape(did)} \|(.*)$", md, flags=re.M)
        if not m:
            out.append({"id": did, "decision": NOT_AVAILABLE})
            continue
        cells = [c.strip() for c in m.group(1).strip().rstrip("|").split("|")]
        out.append({"id": did, "decision": cells[0], "status": cells[1] if len(cells) > 1 else "",
                    "reasoning": cells[2] if len(cells) > 2 else ""})
    return out


def nlp_meta() -> Optional[Dict[str, Any]]:
    for p in NLP_META_CANDIDATES:
        try:
            return json.loads(p.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
    return None


def image_path(disease: str, name: str) -> Optional[Path]:
    """Only the two Trust Passport plots of a known disease; nothing else is served."""
    if disease not in screening.models() or name not in IMAGES:
        return None
    p = ROOT / "ml" / "artifacts" / disease / name
    return p if p.is_file() else None


def model_summary(d: str, meta: Dict[str, Any]) -> Dict[str, Any]:
    t, ci = meta["test_metrics"], meta["test_metrics"]["ci95"]
    bands = meta["bands_test"]
    conf = meta["conformal_test"]
    shap_top = sorted(meta["shap"]["global_mean_abs"].items(), key=lambda kv: -kv[1])
    return {
        "disease": d,
        "version": meta["version"],
        "trained_at": meta["created_at"],
        "data_hash": meta["data_hash"],
        "chosen_model": meta["chosen_model"],
        "chosen_reason": meta["chosen_reason"],
        "test_n": t["n"],
        "test_prevalence": t["prevalence"],
        "auroc": t["auroc"], "auroc_ci95": ci["auroc"],
        "brier": t["brier"], "brier_ci95": ci["brier"],
        "recall_at_moderate_threshold": t["recall_at_t_mod"], "recall_at_moderate_threshold_ci95": ci["recall_at_t_mod"],
        # Share of people with the condition who land in the Low band (D-23: stated openly).
        "miss_rate_in_low_band": bands["low"]["share_of_true_cases"],
        "bands_test": {b: {"share_of_people": v["share"], "observed_rate": v["observed_rate"]} for b, v in bands.items()},
        "deduplicated_test_auroc": meta["test_metrics_deduplicated"]["auroc"],
        "calibration": {"method_fitted_on": meta["calibration"]["fitted_on"],
                        "ece_before": meta["calibration"]["before"]["ece_10"],
                        "ece_after": meta["calibration"]["after"]["ece_10"]},
        "abstention": {
            "alpha": meta["conformal"]["alpha"],
            "coverage": conf["coverage"],
            "abstention_rate_total": conf["abstention_rate_total"],
            "ood_rate": conf["ood_rate"],
        },
        "global_shap_top": [{"feature": f, "mean_abs_shap": v} for f, v in shap_top[:5]],
        "images": {
            "reliability": f"/api/v1/trust-passport/images/{d}/reliability.png",
            "shap_global": f"/api/v1/trust-passport/images/{d}/shap_global.png",
        },
        "model_card_url": f"/api/v1/models/{d}/card",
        "flags": meta["flags"],
    }


async def live_aggregates() -> Dict[str, Any]:
    return {
        "assessments": await aggregates.safe(aggregates.assessment_stats()),
        "emergency_triggers": await aggregates.safe(aggregates.emergency_triggers()),
        "clinician_review": await aggregates.safe(aggregates.override_analytics()),
        "note": "Counts only include people who agreed to anonymous safety statistics (aggregate_audit).",
    }


async def passport() -> Dict[str, Any]:
    models = screening.models()
    fairness = fairness_tables()
    ages = {d: f["age_gap"] for d, f in fairness.items()}
    contact = settings.PROBLEM_REPORT_CONTACT.strip()
    return {
        "what_it_is": ["screening", "care_navigation"],
        "what_it_is_not": ["diagnosis", "prescription", "replacement_for_doctor", "validated_on_indian_patients"],
        "disclaimer": screening.DISCLAIMER,
        "data": data_facts(),
        "models": {d: model_summary(d, m.meta) for d, m in models.items()},
        "fairness": fairness,
        "age_gap": {
            "by_disease": ages,
            "under_40_note_shown": True,  # screening.YOUNG_AGE note "age_under_40_less_reliable"
            "young_age_threshold": screening.YOUNG_AGE,
        },
        "accepted_decisions": decisions(),
        "limitations": {
            "data": data_facts().get("limitations", NOT_AVAILABLE),
            "model_flags": {d: m.meta["flags"] for d, m in models.items()},
        },
        "versions": {
            "api": settings.VERSION,
            "models": {d: {"version": m.meta["version"], "trained_at": m.meta["created_at"]} for d, m in models.items()},
        },
        "live": await live_aggregates(),
        "report_a_problem": {
            "contact": contact or NOT_AVAILABLE,
            "emergency": "108 / 112",
        },
    }


# ── principle map ──

def _per_disease(fn: Callable[[Dict[str, Any]], Any]) -> Dict[str, Any]:
    out = {}
    for d, m in screening.models().items():
        try:
            out[d] = fn(m.meta)
        except (KeyError, TypeError):
            out[d] = NOT_AVAILABLE
    return out


async def _abstention_rate() -> Dict[str, Any]:
    live = await aggregates.safe(aggregates.assessment_stats())
    return {
        "test_set": _per_disease(lambda m: m["conformal_test"]["abstention_rate_total"]),
        "live": live if live == NOT_AVAILABLE else {d: v["abstention_rate"] for d, v in live["per_disease"].items()},
    }


async def _override_rate_by_disease() -> Any:
    o = await aggregates.safe(aggregates.override_analytics())
    return o if o == NOT_AVAILABLE else {d: v["override_rate"] for d, v in o["per_disease"].items()}


async def _medication_refusals() -> Any:
    s = await aggregates.safe(aggregates.assistant_stats())
    return s if s == NOT_AVAILABLE else s["medication_refusals"]


async def _language_parity() -> Any:
    meta = nlp_meta()
    if not meta:
        return NOT_AVAILABLE
    return meta.get("per_language", NOT_AVAILABLE)


async def _static(value: Any) -> Any:
    return value


def _resolvers() -> Dict[str, Callable[[], Any]]:
    return {
        "coverage_per_class": lambda: _static(_per_disease(lambda m: m["conformal_test"]["coverage"])),
        "abstention_rate": _abstention_rate,
        "emergency_triggers_count": lambda: aggregates.safe(aggregates.emergency_triggers()),
        "recall_fpr_gap_tables": lambda: _static(_per_disease(lambda m: {
            g: {"recall": v["gaps"]["recall"], "false_positive_rate": v["gaps"]["false_positive_rate"]}
            for g, v in m["fairness"]["groups"].items()})),
        "language_parity_table": _language_parity,
        "excluded_features_list": lambda: _static(_per_disease(lambda m: m["fairness_only_columns"])),
        "consent_rates": lambda: aggregates.safe(aggregates.consent_rates()),
        "share_revocations": lambda: aggregates.safe(aggregates.share_stats()),
        "data_request_log": lambda: aggregates.safe(aggregates.data_request_stats()),
        "model_card_version": lambda: _static(_per_disease(lambda m: m["version"])),
        "data_hash": lambda: _static(_per_disease(lambda m: m["data_hash"])),
        "override_rate_by_disease": _override_rate_by_disease,
        "audit_entries": lambda: aggregates.safe(aggregates.audit_entries()),
        "medication_refusal_count": _medication_refusals,
        # What-if / recourse requests store nothing, so usage is not recorded anywhere.
        "recourse_usage": lambda: _static(NOT_AVAILABLE),
    }


def load_principle_map() -> Dict[str, Any]:
    return json.loads((CONTENT / "principle_map.json").read_text(encoding="utf-8"))


async def principle_map() -> Dict[str, Any]:
    pm = load_principle_map()
    resolvers = _resolvers()
    for p in pm["principles"]:
        for e in p["evidence"]:
            fn = resolvers.get(e["resolver"])
            try:
                e["value"] = await fn() if fn else NOT_AVAILABLE
            except Exception:  # noqa: BLE001
                e["value"] = NOT_AVAILABLE
            e["available"] = e["value"] != NOT_AVAILABLE
    return pm
