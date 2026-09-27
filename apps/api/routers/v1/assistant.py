"""
AI Assistant and Voice Endpoints.
"""

from fastapi import APIRouter
from apps.api.schemas import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
)
from apps.api.services import agent_service, voice_service

router = APIRouter(tags=["AI Assistant & Voice"])


@router.post("/assistant/message", response_model=AssistantMessageResponse)
async def chat_message(request: AssistantMessageRequest):
    return await agent_service.handle_message(request)


@router.post("/voice/transcribe", response_model=VoiceTranscribeResponse)
async def transcribe_voice(request: VoiceTranscribeRequest):
    return await voice_service.transcribe_audio(request)


@router.post("/voice/synthesize", response_model=VoiceSynthesizeResponse)
async def synthesize_voice(request: VoiceSynthesizeRequest):
    return await voice_service.synthesize_speech(request)
