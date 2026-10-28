"""Curated FAQ retrieval (SPEC §5 step 5): cosine similarity between the user's message and the
FAQ questions in the same language (ml/nlp/faq.{en,hi,mr}.json). Below the similarity threshold
chosen in train_intents.py the assistant says it has no reliable answer. Text is never generated:
the answer returned is the stored, sourced answer.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import numpy as np

from ml.nlp import encoder

FAQ_DIR = Path(__file__).resolve().parent
LANGS = ("en", "hi", "mr")
DISEASE_TOPICS = ("diabetes", "heart", "stroke")
VITALNEX_TOPICS = ("vitalnex",)


@lru_cache(maxsize=3)
def entries(lang: str) -> List[Dict[str, str]]:
    return json.loads((FAQ_DIR / f"faq.{lang}.json").read_text(encoding="utf-8"))["entries"]


@lru_cache(maxsize=3)
def question_embeddings(lang: str) -> np.ndarray:
    return encoder.encode([e["question"] for e in entries(lang)])


def best_match(query_emb: np.ndarray, lang: str, topics: Optional[Iterable[str]] = None
               ) -> Tuple[Optional[Dict[str, str]], float]:
    """Top FAQ entry (restricted to `topics`) and its cosine similarity."""
    es = entries(lang)
    sims = question_embeddings(lang) @ query_emb.reshape(-1)
    allowed = set(topics) if topics else None
    best, best_s = None, -1.0
    for e, s in zip(es, sims):
        if allowed and e["topic"] not in allowed:
            continue
        if s > best_s:
            best, best_s = e, float(s)
    return best, best_s
