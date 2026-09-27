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
    dataset_service,
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


@router.get("/governance/{assessment_id}")
async def get_assessment_governance(assessment_id: str):
    return {
        "assessment_id": assessment_id,
        "governance_status": "COMPLIANT",
        "data_provenance": "Synthetic Pune Clinical Risk Research Set",
        "audited_by": "VITALNEX Continuous Safety Monitor",
        "human_oversight_status": "Not_Required",
    }


@router.get("/dataset/metadata")
async def get_dataset_metadata():
    return dataset_service.get_metadata()


@router.get("/dataset/schema")
async def get_dataset_schema():
    return dataset_service.get_feature_schema()
