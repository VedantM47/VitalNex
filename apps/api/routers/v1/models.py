"""
Model Laboratory and Governance Endpoints.
"""

from typing import List
from fastapi import APIRouter, HTTPException
from apps.api.schemas import (
    ModelRegistryItem,
    GovernanceSummaryResponse,
)
from apps.api.services import (
    model_registry_service,
    governance_service,
)

router = APIRouter(tags=["Model Registry & Governance"])


@router.get("/models", response_model=List[ModelRegistryItem])
async def list_models():
    return await model_registry_service.list_models()


@router.get("/models/{model_id}", response_model=ModelRegistryItem)
async def get_model(model_id: str):
    model = await model_registry_service.get_model(model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.get("/governance/summary", response_model=GovernanceSummaryResponse)
async def get_governance_summary():
    return await governance_service.get_summary()

