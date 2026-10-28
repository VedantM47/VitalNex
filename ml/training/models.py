"""Candidate models (SPEC §4.1). Each is an sklearn Pipeline with predict_proba.

Every pipeline starts with FitRecorder so tests and train_all can assert that fitting only ever
saw training rows.
"""
import numpy as np
import torch
from lightgbm import LGBMClassifier, early_stopping
from sklearn.base import BaseEstimator, ClassifierMixin, TransformerMixin
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from torch import nn

SEED = 42
SIMPLICITY = ("logreg", "lightgbm", "mlp")  # tie-break order, simplest first


class FitRecorder(TransformerMixin, BaseEstimator):
    """Pass-through step that records the row labels it was fitted on."""

    def fit(self, X, y=None):
        self.fit_index_ = np.asarray(X.index) if hasattr(X, "index") else None
        self.n_features_in_ = X.shape[1]
        return self

    def transform(self, X):
        return np.asarray(X, dtype=np.float32)


class LGBMEarlyStop(ClassifierMixin, BaseEstimator):
    """LightGBM with early stopping on an inner stratified validation split of the fit data."""

    def __init__(self, num_leaves=31, min_child_samples=100, learning_rate=0.05,
                 n_estimators=2000, val_frac=0.1, random_state=SEED):
        self.num_leaves = num_leaves
        self.min_child_samples = min_child_samples
        self.learning_rate = learning_rate
        self.n_estimators = n_estimators
        self.val_frac = val_frac
        self.random_state = random_state

    def fit(self, X, y):
        Xtr, Xva, ytr, yva = train_test_split(
            X, y, test_size=self.val_frac, stratify=y, random_state=self.random_state)
        self.model_ = LGBMClassifier(
            num_leaves=self.num_leaves, min_child_samples=self.min_child_samples,
            learning_rate=self.learning_rate, n_estimators=self.n_estimators,
            random_state=self.random_state, verbose=-1)
        self.model_.fit(Xtr, ytr, eval_set=[(Xva, yva)], eval_metric="auc",
                        callbacks=[early_stopping(50, verbose=False)])
        self.classes_ = np.array([0, 1])
        self.best_iteration_ = int(self.model_.best_iteration_)
        return self

    def predict_proba(self, X):
        return self.model_.predict_proba(X)


def mlp_net(d_in: int) -> nn.Module:
    return nn.Sequential(
        nn.Linear(d_in, 64), nn.ReLU(), nn.Dropout(0.2),
        nn.Linear(64, 32), nn.ReLU(), nn.Dropout(0.2),
        nn.Linear(32, 1),
    )


class TorchMLP(ClassifierMixin, BaseEstimator):
    """14 -> 64 -> 32 -> 1 MLP, BCEWithLogits(pos_weight), Adam, early stopping on inner val AUROC."""

    def __init__(self, lr=1e-3, weight_decay=0.0, batch_size=1024, max_epochs=40, patience=4,
                 val_frac=0.1, random_state=SEED):
        self.lr = lr
        self.weight_decay = weight_decay
        self.batch_size = batch_size
        self.max_epochs = max_epochs
        self.patience = patience
        self.val_frac = val_frac
        self.random_state = random_state

    def fit(self, X, y):
        torch.manual_seed(self.random_state)
        rng = np.random.default_rng(self.random_state)
        X = np.asarray(X, dtype=np.float32)
        y = np.asarray(y, dtype=np.float32)
        Xtr, Xva, ytr, yva = train_test_split(
            X, y, test_size=self.val_frac, stratify=y, random_state=self.random_state)
        Xtr_t, ytr_t = torch.from_numpy(Xtr), torch.from_numpy(ytr)
        Xva_t, yva_t = torch.from_numpy(Xva), torch.from_numpy(yva)

        self.net_ = mlp_net(X.shape[1])
        pos_weight = torch.tensor([(1 - ytr.mean()) / ytr.mean()])
        loss_fn = nn.BCEWithLogitsLoss(pos_weight=pos_weight)
        opt = torch.optim.Adam(self.net_.parameters(), lr=self.lr, weight_decay=self.weight_decay)

        self.history_ = {"train_loss": [], "val_loss": [], "val_auroc": []}
        best_auc, best_state, bad = -1.0, None, 0
        for _ in range(self.max_epochs):
            self.net_.train()
            perm = torch.from_numpy(rng.permutation(len(Xtr)))
            total = 0.0
            for i in range(0, len(perm), self.batch_size):
                b = perm[i:i + self.batch_size]
                opt.zero_grad()
                loss = loss_fn(self.net_(Xtr_t[b]).squeeze(1), ytr_t[b])
                loss.backward()
                opt.step()
                total += loss.item() * len(b)
            self.net_.eval()
            with torch.no_grad():
                logits = self.net_(Xva_t).squeeze(1)
                val_loss = loss_fn(logits, yva_t).item()
            auc = roc_auc_score(yva, logits.numpy())
            self.history_["train_loss"].append(total / len(Xtr))
            self.history_["val_loss"].append(val_loss)
            self.history_["val_auroc"].append(float(auc))
            if auc > best_auc + 1e-4:
                best_auc, bad = auc, 0
                best_state = {k: v.clone() for k, v in self.net_.state_dict().items()}
            else:
                bad += 1
                if bad >= self.patience:
                    break
        self.net_.load_state_dict(best_state)
        self.net_.eval()
        self.best_epoch_ = int(np.argmax(self.history_["val_auroc"])) + 1
        self.classes_ = np.array([0, 1])
        return self

    def predict_proba(self, X):
        with torch.no_grad():
            p = torch.sigmoid(self.net_(torch.as_tensor(np.asarray(X, dtype=np.float32))).squeeze(1))
        p = p.numpy().astype(np.float64)
        return np.column_stack([1 - p, p])


def candidates() -> dict:
    """name -> (unfitted pipeline, small hyperparameter grid)."""
    return {
        "logreg": (
            Pipeline([("rec", FitRecorder()), ("scale", StandardScaler()),
                      ("clf", LogisticRegression(class_weight="balanced", max_iter=2000))]),
            {"clf__C": [0.01, 0.1, 1.0]},
        ),
        "lightgbm": (
            Pipeline([("rec", FitRecorder()), ("clf", LGBMEarlyStop())]),
            {"clf__num_leaves": [15, 63], "clf__min_child_samples": [50, 300]},
        ),
        "mlp": (
            Pipeline([("rec", FitRecorder()), ("scale", StandardScaler()), ("clf", TorchMLP())]),
            {"clf__lr": [1e-3, 3e-3]},
        ),
    }


def fit_index(pipeline: Pipeline) -> np.ndarray:
    return pipeline.named_steps["rec"].fit_index_


def strip_fit_index(pipeline: Pipeline) -> Pipeline:
    """Drop the recorded row labels before saving (only needed for the leakage check)."""
    pipeline.named_steps["rec"].fit_index_ = None
    return pipeline


def raw_proba(pipeline: Pipeline, X) -> np.ndarray:
    return pipeline.predict_proba(X)[:, 1]
