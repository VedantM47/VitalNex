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
    intent: Optional[str] = None  # one of the SPEC §5 intents, or UNAVAILABLE
    confidence: Optional[float] = None  # classifier probability; None when a deterministic rule decided
    decided_by: Optional[str] = None  # rule | classifier | abstain | unavailable
    suggestions: List[ActionSuggestion] = []
    citations: List[Dict[str, str]] = []  # {"title", "url"} for FAQ / guidance answers
    escalation_recommended: bool = False
    # D-26: show the 108 / 112 emergency card above the reply. True for a full emergency (then `response`
    # is the emergency text only) and for a bare red-flag word such as "stroke" (then `response` is the
    # normal answer, shown below the card).
    emergency_card: bool = False
    disclaimer: str = (
        "Answers come from a fixed, reviewed library — VITALNEX does not generate medical advice. "
        "In an emergency call 108 / 112."
    )
    details: Dict[str, Any] = {}  # e.g. faq_id, faq_similarity
    timestamp: datetime
