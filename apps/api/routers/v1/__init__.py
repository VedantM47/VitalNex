"""
FastAPI v1 API Router aggregator.
"""

from fastapi import APIRouter
from .health import router as health_router
from .profile import router as profile_router
from .assessment import router as assessment_router
from .doctors import router as doctors_router
from .assistant import router as assistant_router
from .models import router as models_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(profile_router)
api_v1_router.include_router(assessment_router)
api_v1_router.include_router(doctors_router)
api_v1_router.include_router(assistant_router)
api_v1_router.include_router(models_router)

__all__ = ["api_v1_router"]
