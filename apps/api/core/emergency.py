"""Deterministic emergency red-flag check (SPEC §1.4 rule 1, CLAUDE.md hard rule 8).

Runs before any model. Shared by the assessment flow and the assistant: both use the single
phrase list in ml/nlp/data/emergency_phrases.json (EN / HI / MR + romanised), matched by
ml.nlp.rules after a fixed normalisation.

D-26: in the assessment free-text box a bare red-flag word ("stroke", "लकवा", "heart attack", ...)
counts as a full emergency, so this check uses the full list AND the bare-word list.
"""

from typing import Optional

from ml.nlp.rules import shows_emergency_card

EMERGENCY_NUMBERS = ("108", "112")


def text_has_red_flag(text: Optional[str]) -> bool:
    return shows_emergency_card(text)
