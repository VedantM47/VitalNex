"""
Voice & Accessibility Pydantic Schemas.
"""

from typing import Optional
from pydantic import BaseModel, Field


class VoiceTranscribeRequest(BaseModel):
    audio_base64: str
    language: str = Field("en", pattern="^(en|hi|mr)$")
    sample_rate_hz: int = 16000


class VoiceTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    duration_seconds: float


class VoiceSynthesizeRequest(BaseModel):
    text: str
    language: str = Field("en", pattern="^(en|hi|mr)$")
    voice_gender: str = Field("neutral", pattern="^(female|male|neutral)$")
    speed: float = Field(1.0, ge=0.5, le=2.0)


class VoiceSynthesizeResponse(BaseModel):
    audio_base64: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: float
    format: str = "mp3"
