"""
AI Assistant and (frozen) Voice Endpoints.
"""

from fastapi import APIRouter, Depends
from apps.api.core.auth import CurrentUser, require_role
from apps.api.core.frozen import not_in_mvp
from apps.api.schemas import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    VoiceTranscribeRequest,
    VoiceSynthesizeRequest,
)
from apps.api.services import agent_service

router = APIRouter(tags=["AI Assistant & Voice"])


@router.post("/assistant/message", response_model=AssistantMessageResponse)
async def chat_message(
    request: AssistantMessageRequest, user: CurrentUser = Depends(require_role("patient", "doctor", "admin"))
):
    """SPEC §5 pipeline. The message text is never stored; only intent / confidence / emergency flag."""
    return await agent_service.handle_message(request, user)


# Voice is frozen for the MVP (docs/SPEC.md §1.2).
@router.post("/voice/transcribe")
async def transcribe_voice(request: VoiceTranscribeRequest):
    raise not_in_mvp()


@router.post("/voice/synthesize")
async def synthesize_voice(request: VoiceSynthesizeRequest):
    raise not_in_mvp()
