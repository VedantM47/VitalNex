"""
Health Check and System Status Router.
"""

from fastapi import APIRouter
from apps.api.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "demo_mode": settings.DEMO_MODE,
        "disclaimer": "VITALNEX is an academic/decision-support research prototype.",
    }
