"""Deterministic phrase rules shared by the assessment and the assistant (SPEC §5 steps 1-2).

No model is involved: the lists in ml/nlp/data/{emergency,medication}_phrases.json are matched
after a fixed normalisation, so the behaviour is predictable and testable.
"""

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

DATA = Path(__file__).resolve().parent / "data"

# A word character for boundary purposes: ASCII letters/digits or any Devanagari code point.
_WORD = r"a-z0-9ऀ-ॿ"
_LEFT = rf"(?<![{_WORD}])"
_RIGHT = rf"(?![{_WORD}])"
_NUKTA = "़"
_PUNCT = re.compile(rf"[^{_WORD}\s]")


def normalise(text: Optional[str]) -> str:
    """NFC, lower-case, drop nukta and apostrophes, chandrabindu -> anusvara, punctuation -> space."""
    if not text:
        return ""
    t = unicodedata.normalize("NFC", text)
    t = unicodedata.normalize("NFD", t).replace(_NUKTA, "")  # precomposed nukta letters decompose
    t = unicodedata.normalize("NFC", t).lower()
    t = t.replace("ँ", "ं")  # ँ -> ं
    t = t.replace("'", "").replace("’", "")
    t = _PUNCT.sub(" ", t)
    return " ".join(t.split())


def _compile(entries: Iterable[str], prefix_all: bool) -> List[re.Pattern]:
    out = []
    for e in entries:
        prefix = prefix_all or e.endswith("*")
        body = re.escape(normalise(e.rstrip("*")))
        if not body:
            continue
        tail = "" if prefix else rf"(?:s|es)?{_RIGHT}"
        out.append(re.compile(_LEFT + body + tail))
    return out


def _term(term: str) -> Tuple[Tuple[str, ...], bool]:
    """A pair term: words to match in sequence; whole-word if it ends in '='."""
    exact = term.endswith("=")
    return tuple(normalise(term.rstrip("=")).split()), exact


def _positions(tokens: List[str], term: Tuple[Tuple[str, ...], bool]) -> List[int]:
    words, exact = term
    n = len(words)
    out = []
    for i in range(len(tokens) - n + 1):
        ok = all(tokens[i + j] == w for j, w in enumerate(words[:-1]))
        last = tokens[i + n - 1]
        if ok and (last == words[-1] if exact else last.startswith(words[-1])):
            out.append(i)
    return out


class PairRule:
    """Two concepts (e.g. a chest word and a pain word) within `window` words of each other."""

    def __init__(self, spec: dict):
        self.name = spec["name"]
        self.window = int(spec["window"])
        self.a = [_term(t) for t in spec["a"]]
        self.b = [_term(t) for t in spec["b"]]

    def matches(self, tokens: List[str]) -> bool:
        pa = [i for t in self.a for i in _positions(tokens, t)]
        if not pa:
            return False
        pb = [i for t in self.b for i in _positions(tokens, t)]
        return any(abs(i - j) <= self.window for i in pa for j in pb)


class PhraseRule:
    def __init__(self, spec: dict, prefix_all: bool):
        entries = [p for lang in spec["phrases"].values() for p in lang]
        self.phrases = _compile(entries, prefix_all)
        self.patterns = [re.compile(_LEFT + normalise_pattern(p)) for p in spec.get("patterns", [])]
        self.pairs = [PairRule(p) for p in spec.get("pairs", [])]
        self.exclude = sorted((normalise(x) for x in spec.get("exclude", [])), key=len, reverse=True)

    def which(self, text: Optional[str]) -> Optional[str]:
        """Name of the first rule that fires (for tests / debugging), else None."""
        t = normalise(text)
        if not t:
            return None
        for x in self.exclude:
            t = re.sub(_LEFT + re.escape(x), " ", t)
        for p in self.phrases:
            if p.search(t):
                return "phrase"
        for p in self.patterns:
            if p.search(t):
                return "pattern"
        tokens = t.split()
        for p in self.pairs:
            if p.matches(tokens):
                return f"pair:{p.name}"
        return None

    def matches(self, text: Optional[str]) -> bool:
        return self.which(text) is not None


def normalise_pattern(p: str) -> str:
    """Same character normalisation as text, without touching regex syntax."""
    p = unicodedata.normalize("NFD", unicodedata.normalize("NFC", p)).replace(_NUKTA, "")
    return unicodedata.normalize("NFC", p).lower().replace("ँ", "ं")


def _spec(name: str) -> dict:
    return json.loads((DATA / name).read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def emergency_rule() -> PhraseRule:
    return PhraseRule(_spec("emergency_phrases.json"), prefix_all=True)


@lru_cache(maxsize=1)
def bare_red_flag_rule() -> PhraseRule:
    """D-26: bare red-flag words ("stroke", "लकवा", ...) from the `bare_red_flags` section of the SAME
    emergency file. They always show the 108 / 112 card; see has_bare_red_flag."""
    return PhraseRule(_spec("emergency_phrases.json")["bare_red_flags"], prefix_all=True)


@lru_cache(maxsize=1)
def medication_rule() -> PhraseRule:
    return PhraseRule(_spec("medication_phrases.json"), prefix_all=False)


def is_emergency(text: Optional[str]) -> bool:
    """A full emergency message (symptom happening now): the assistant replies with 108 / 112 only."""
    return emergency_rule().matches(text)


def has_bare_red_flag(text: Optional[str]) -> bool:
    """A bare red-flag word (D-26), e.g. "what is a stroke?". The assistant shows the 108 / 112 card
    AND its normal answer; the assessment free-text check treats it as a full emergency."""
    return bare_red_flag_rule().matches(text)


def shows_emergency_card(text: Optional[str]) -> bool:
    """True when the 108 / 112 card must be shown: a full emergency or a bare red-flag word."""
    return is_emergency(text) or has_bare_red_flag(text)


def is_medication_request(text: Optional[str]) -> bool:
    return medication_rule().matches(text)
