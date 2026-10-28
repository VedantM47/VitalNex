"""
Public Trust Passport and principle traceability map (docs/SPEC.md §7.1, PROMPTS P7 steps 1-2).
No sign-in needed; no patient-level data. Live numbers are aggregates, or "not available".
"""

from typing import Any, Dict, Literal

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from apps.api.services import trust_service

router = APIRouter(prefix="/trust-passport", tags=["Trust Passport"])


@router.get("")
async def get_trust_passport() -> Dict[str, Any]:
    return await trust_service.passport()


@router.get("/principles")
async def get_principle_map() -> Dict[str, Any]:
    """apps/api/content/principle_map.json with every evidence item resolved live."""
    return await trust_service.principle_map()


@router.get("/images/{disease}/{image}")
async def get_image(
    disease: Literal["diabetes", "heart", "stroke"],
    image: Literal["reliability.png", "shap_global.png"],
):
    """Only the reliability and global SHAP plots under ml/artifacts/<disease>/ are served."""
    path = trust_service.image_path(disease, image)
    if path is None:
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(path, media_type="image/png", headers={"Cache-Control": "public, max-age=3600"})
