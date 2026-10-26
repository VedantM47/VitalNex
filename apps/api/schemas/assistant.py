"""
AI Health Assistant Schemas.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant|system|tool)$")
    content: str
    timestamp: Optional[datetime] = None
    citations: Optional[List[Dict[str, str]]] = None


class AssistantMessageRequest(BaseModel):
    """The user is the signed-in user. The message text is never stored (SPEC §5)."""
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field("en", pattern="^(en|hi|mr)$")
    context: Optional[Dict[str, Any]] = None


class ActionSuggestion(BaseModel):
    id: str
    label: str
    action_type: str  # e.g. "navigate", "schedule", "explain_feature"
    payload: Dict[str, Any] = {}


class AssistantMessageResponse(BaseModel):
    id: str
    response: str
    language: str
    suggestions: List[ActionSuggestion] = []
    citations: List[Dict[str, str]] = []
    escalation_recommended: bool = False
    disclaimer: str = (
        "VITALNEX AI Health Assistant is for educational health guidance. "
        "For acute or emergency symptoms, seek immediate professional emergency medical care."
    )
    timestamp: datetime
