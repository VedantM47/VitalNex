"""Deterministic emergency red-flag check (SPEC §1.4 rule 1, CLAUDE.md hard rule 8).

Runs before any model. Shared by the assessment flow and the assistant.
"""

from typing import Optional

EMERGENCY_NUMBERS = ("108", "112")

EMERGENCY_KEYWORDS = (
    # English
    "chest pain", "pressure in chest", "chest pressure", "crushing pain", "heart attack",
    "shortness of breath", "can't breathe", "cannot breathe", "face drooping", "slurred speech",
    "arm weakness", "stroke", "fainted", "unconscious",
    # Hindi
    "सीने में दर्द", "सांस लेने में तकलीफ", "दिल का दौरा", "लकवा", "बेहोश",
    # Marathi
    "छातीत दुखणे", "श्वास घेण्यास त्रास", "हृदयविकाराचा झटका", "अर्धांगवायू", "बेशुद्ध",
)


def text_has_red_flag(text: Optional[str]) -> bool:
    if not text:
        return False
    t = text.lower()
    return any(k in t for k in EMERGENCY_KEYWORDS)
