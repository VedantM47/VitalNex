"""Intent classifier heads (SPEC §5 step 4) and loading of the trained artifact.

Three approaches are compared in ml/nlp/train_intents.py:
  tfidf_lr  - character n-gram TF-IDF + logistic regression (no pretrained model; baseline)
  enc_lr    - frozen IndicSBERT embeddings + logistic regression
  enc_mlp   - frozen IndicSBERT embeddings + small PyTorch MLP head
The chosen one is saved in ml/nlp/artifacts/ and described by nlp_meta.json.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import joblib
import numpy as np

from ml.nlp import encoder

ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
META_PATH = ARTIFACTS / "nlp_meta.json"

INTENTS = [
    "EXPLAIN_RESULT", "WHAT_CAN_I_CHANGE", "DISEASE_INFO", "HOW_AI_WORKS", "BOOK_APPOINTMENT",
    "FIND_DOCTOR", "MY_DATA", "EMERGENCY", "MEDICATION_REQUEST", "GREETING", "OUT_OF_SCOPE",
]
APPROACHES = ("tfidf_lr", "enc_lr", "enc_mlp")
USES_ENCODER = {"tfidf_lr": False, "enc_lr": True, "enc_mlp": True}


# ---------------------------------------------------------------- MLP head

def build_mlp(dim: int, n_classes: int, hidden: int = 256, dropout: float = 0.2):
    import torch.nn as nn

    return nn.Sequential(nn.Linear(dim, hidden), nn.ReLU(), nn.Dropout(dropout), nn.Linear(hidden, n_classes))


def train_mlp(X: np.ndarray, y: np.ndarray, n_classes: int, epochs: int, seed: int = 42,
              lr: float = 1e-3, weight_decay: float = 1e-4, batch_size: int = 64,
              eval_fn=None, eval_every: int = 0):
    """Full-precision CPU training. If eval_fn is given, it is called every `eval_every` epochs
    with the model and the epoch number (used to pick the epoch count on validation)."""
    import torch

    torch.manual_seed(seed)
    g = torch.Generator().manual_seed(seed)
    model = build_mlp(X.shape[1], n_classes)
    opt = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
    loss_fn = torch.nn.CrossEntropyLoss()
    Xt, yt = torch.from_numpy(X.astype(np.float32)), torch.from_numpy(y.astype(np.int64))
    for ep in range(1, epochs + 1):
        model.train()
        perm = torch.randperm(len(Xt), generator=g)
        for i in range(0, len(Xt), batch_size):
            idx = perm[i:i + batch_size]
            opt.zero_grad()
            loss_fn(model(Xt[idx]), yt[idx]).backward()
            opt.step()
        if eval_fn and eval_every and ep % eval_every == 0:
            eval_fn(model, ep)
    model.eval()
    return model


def mlp_proba(model, X: np.ndarray) -> np.ndarray:
    import torch

    with torch.no_grad():
        return torch.softmax(model(torch.from_numpy(X.astype(np.float32))), dim=1).numpy()


# ---------------------------------------------------------------- loaded classifier

class IntentClassifier:
    """The chosen, trained classifier plus its thresholds (from nlp_meta.json)."""

    def __init__(self, meta: dict):
        self.meta = meta
        self.approach = meta["chosen_approach"]
        self.labels: List[str] = meta["labels"]
        self.thresholds: Dict[str, float] = meta["thresholds"]
        files = meta["artifact_files"]
        if self.approach == "enc_mlp":
            import torch

            state = torch.load(ARTIFACTS / files["model"], map_location="cpu", weights_only=True)
            self.model = build_mlp(meta["encoder"]["dimension"], len(self.labels))
            self.model.load_state_dict(state)
            self.model.eval()
        else:
            self.model = joblib.load(ARTIFACTS / files["model"])

    @property
    def uses_encoder(self) -> bool:
        return USES_ENCODER[self.approach]

    def predict_proba(self, texts: Sequence[str], embeddings: Optional[np.ndarray] = None) -> np.ndarray:
        if self.approach == "tfidf_lr":
            return self.model.predict_proba(list(texts))
        X = embeddings if embeddings is not None else encoder.encode(texts)
        if self.approach == "enc_lr":
            return self.model.predict_proba(X)
        return mlp_proba(self.model, X)


def load_meta() -> dict:
    return json.loads(META_PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def load_classifier() -> IntentClassifier:
    return IntentClassifier(load_meta())
