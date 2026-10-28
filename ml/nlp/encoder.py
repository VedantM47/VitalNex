"""Local multilingual sentence encoder (SPEC §5 step 3, D-13).

Wraps `l3cube-pune/indic-sentence-bert-nli` (MuRIL-based SBERT, CC-BY-4.0) via
sentence-transformers. Runs on CPU, loaded once per process. Nothing is sent to any API:
the weights are downloaded once from Hugging Face into the local cache by
`python -m ml.nlp.train_intents`; the API afterwards loads them with local_files_only=True.
"""

import os
import threading
from typing import List, Optional, Sequence

import numpy as np

MODEL_ID = "l3cube-pune/indic-sentence-bert-nli"
LICENCE = "CC-BY-4.0"
ATTRIBUTION = (
    "L3Cube-IndicSBERT (l3cube-pune/indic-sentence-bert-nli), L3Cube Pune, licensed CC-BY-4.0. "
    "Paper: Deode et al., 'L3Cube-IndicSBERT: A simple approach for learning cross-lingual sentence "
    "representations using multilingual BERT', 2023. https://huggingface.co/l3cube-pune/indic-sentence-bert-nli"
)
MODEL_URL = "https://huggingface.co/l3cube-pune/indic-sentence-bert-nli"


class EncoderUnavailable(RuntimeError):
    """The model weights are not in the local cache (run `python -m ml.nlp.train_intents`)."""


_lock = threading.Lock()
_model = None


def _set_offline(offline: bool) -> None:
    """Without this, transformers starts a background 'safetensors auto-conversion' thread that
    calls the Hugging Face API (repo metadata only) when it loads .bin weights, even with
    local_files_only. The API must make no outbound calls, so local loads run fully offline."""
    for var in ("HF_HUB_OFFLINE", "TRANSFORMERS_OFFLINE"):
        os.environ[var] = "1" if offline else "0"
    try:
        import huggingface_hub.constants as hc

        hc.HF_HUB_OFFLINE = offline
    except ImportError:
        pass


def _load(local_only: bool):
    _set_offline(local_only)
    import torch
    from sentence_transformers import SentenceTransformer

    torch.set_num_threads(max(1, min(4, os.cpu_count() or 1)))
    try:
        return SentenceTransformer(MODEL_ID, device="cpu", local_files_only=local_only)
    except Exception as e:  # missing cache, corrupt download, offline
        raise EncoderUnavailable(f"Cannot load {MODEL_ID} (local_only={local_only}): {e}") from e


def get_model(allow_download: bool = False):
    """The SentenceTransformer, loaded once per process. The API never downloads (allow_download=False)."""
    global _model
    with _lock:
        if _model is None:
            try:
                _model = _load(local_only=True)
            except EncoderUnavailable:
                if not allow_download:
                    raise
                _model = _load(local_only=False)
        return _model


def is_available() -> bool:
    try:
        get_model()
        return True
    except EncoderUnavailable:
        return False


def model_revision() -> Optional[str]:
    """Commit hash of the cached snapshot, recorded in nlp_meta.json."""
    try:
        from huggingface_hub import scan_cache_dir

        for repo in scan_cache_dir().repos:
            if repo.repo_id == MODEL_ID:
                return sorted(r.commit_hash for r in repo.revisions)[-1]
    except Exception:
        return None
    return None


def encode(texts: Sequence[str], allow_download: bool = False, batch_size: int = 32) -> np.ndarray:
    """L2-normalised float32 embeddings, shape (n, 768). Dot product = cosine similarity."""
    model = get_model(allow_download)
    emb = model.encode(list(texts), batch_size=batch_size, normalize_embeddings=True,
                       convert_to_numpy=True, show_progress_bar=False)
    return emb.astype(np.float32)


def dimension() -> int:
    return int(get_model().get_sentence_embedding_dimension())


__all__: List[str] = ["MODEL_ID", "LICENCE", "ATTRIBUTION", "MODEL_URL", "EncoderUnavailable",
                      "get_model", "is_available", "encode", "model_revision", "dimension"]
