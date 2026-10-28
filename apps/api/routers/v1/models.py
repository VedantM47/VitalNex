"""
Model registry (from ml/artifacts/<disease>/model_meta.json) and governance endpoints.
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from apps.api.core.auth import CurrentUser, require_role
from apps.api.schemas import GovernanceSummaryResponse
from apps.api.services import governance_service
from apps.api.services.screening import models as loaded_models

router = APIRouter(tags=["Model Registry & Governance"])


def _summary(meta: Dict[str, Any]) -> Dict[str, Any]:
    t = meta["test_metrics"]
    return {
        "id": meta["disease"],
        "version": meta["version"],
        "model": meta["chosen_model"],
        "created_at": meta["created_at"],
        "data_hash": meta["data_hash"],
        "test_auroc": t["auroc"],
        "test_auroc_ci95": t["ci95"]["auroc"],
        "test_recall_at_t_mod": t["recall_at_t_mod"],
        "test_brier": t["brier"],
        "thresholds": {"t_mod": meta["thresholds"]["t_mod"], "t_high": meta["thresholds"]["t_high"]},
        "abstention_rate_test": meta["conformal_test"]["abstention_rate_total"],
        "flags": meta["flags"],
    }


@router.get("/models")
async def list_models() -> List[Dict[str, Any]]:
    """Versions and headline test metrics of the three loaded models."""
    return [_summary(m.meta) for m in loaded_models().values()]


@router.get("/models/{model_id}")
async def get_model(model_id: str) -> Dict[str, Any]:
    """Full model_meta.json for one disease (aggregate model facts only, no patient data)."""
    m = loaded_models().get(model_id)
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return m.meta


@router.get("/governance/summary", response_model=GovernanceSummaryResponse)
async def get_governance_summary(user: CurrentUser = Depends(require_role("admin"))):
    """Aggregates only, no patient identities."""
    return await governance_service.get_summary()
