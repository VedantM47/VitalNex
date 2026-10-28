"""Deterministic emergency red-flag check (SPEC §1.4 rule 1, CLAUDE.md hard rule 8).

Runs before any model. Shared by the assessment flow and the assistant: both use the single
phrase list in ml/nlp/data/emergency_phrases.json (EN / HI / MR + romanised), matched by
ml.nlp.rules after a fixed normalisation.
"""

from typing import Optional

from ml.nlp.rules import is_emergency

EMERGENCY_NUMBERS = ("108", "112")


def text_has_red_flag(text: Optional[str]) -> bool:
    return is_emergency(text)
