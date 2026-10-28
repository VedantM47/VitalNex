"""Train and evaluate the assistant intent classifier (SPEC §5, PROMPTS P8 step 4).

    python -m ml.nlp.train_intents

1. Split intents_train.jsonl into train / validation (20%, stratified by intent x language, seed 42).
2. Compare (a) TF-IDF + LR, (b) frozen IndicSBERT + LR, (c) frozen IndicSBERT + PyTorch MLP head.
   Small hyper-parameter grids are tuned on validation only.
3. Choose the approach with the best validation macro-F1 (within 0.005 -> the simpler one).
4. On validation (chosen approach): pick the OUT_OF_SCOPE abstention threshold, and the lower
   safety thresholds at which the classifier alone flags EMERGENCY / MEDICATION_REQUEST.
5. Refit every approach on the full training file; evaluate ONCE on intents_test.jsonl.
   The choice in step 3 is fixed before any test number is computed.
6. FAQ similarity threshold: 95th percentile of the best FAQ similarity of OUT_OF_SCOPE training
   utterances (so ~5% of off-topic questions would get an FAQ answer).
7. Save the chosen model, nlp_meta.json and docs/model_cards/assistant.md.

Downloads the encoder weights once from Hugging Face if they are not cached; nothing else leaves
the machine.
"""

import hashlib
import json
import platform
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline

from ml.nlp import encoder, faq, rules
from ml.nlp.intent_model import APPROACHES, ARTIFACTS, INTENTS, META_PATH, mlp_proba, train_mlp

ROOT = Path(__file__).resolve().parents[2]
DATA = Path(__file__).resolve().parent / "data"
CARD = ROOT / "docs" / "model_cards" / "assistant.md"
SEED = 42
VAL_SIZE = 0.2
LANGS = ("en", "hi", "mr")
OOS = INTENTS.index("OUT_OF_SCOPE")
EMERG = INTENTS.index("EMERGENCY")
MED = INTENTS.index("MEDICATION_REQUEST")
C_GRID = (1.0, 10.0, 100.0)
MLP_MAX_EPOCHS, MLP_EVAL_EVERY = 150, 10
OOS_GRID = [round(x, 2) for x in np.arange(0.20, 0.91, 0.05)]
SAFETY_GRID = [round(x, 2) for x in np.arange(0.05, 0.51, 0.05)]
FAQ_OOS_PERCENTILE = 95
TIE = 0.005
VERSION = "assistant-v1.0.0"


def load(name):
    return [json.loads(line) for line in (DATA / name).read_text(encoding="utf-8").splitlines() if line.strip()]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def y_of(rows):
    return np.array([INTENTS.index(r["intent"]) for r in rows])


def scores(y, pred, idx=None):
    if idx is not None:
        y, pred = y[idx], pred[idx]
    return {"accuracy": round(float(accuracy_score(y, pred)), 4),
            "macro_f1": round(float(f1_score(y, pred, average="macro", labels=sorted(set(y)), zero_division=0)), 4),
            "n": int(len(y))}


def per_language(rows, y, pred):
    out = {"all": scores(y, pred)}
    for lang in LANGS:
        out[lang] = scores(y, pred, np.array([r["lang"] == lang for r in rows]))
    return out


def abstain(proba, t):
    pred = proba.argmax(1)
    return np.where(proba.max(1) < t, OOS, pred)


# ------------------------------------------------------------------ approaches

def fit_tfidf(texts, y, C):
    m = make_pipeline(TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, min_df=1),
                      LogisticRegression(C=C, max_iter=5000))
    return m.fit(texts, y)


def fit_lr(X, y, C):
    return LogisticRegression(C=C, max_iter=5000).fit(X, y)


def tune(tr_rows, va_rows, Etr, Eva):
    """Per approach: best hyper-parameter and validation probabilities."""
    ytr, yva = y_of(tr_rows), y_of(va_rows)
    ttr, tva = [r["text"] for r in tr_rows], [r["text"] for r in va_rows]
    res = {}

    best = None
    for C in C_GRID:
        p = fit_tfidf(ttr, ytr, C).predict_proba(tva)
        f = scores(yva, p.argmax(1))["macro_f1"]
        if best is None or f > best[0]:
            best = (f, {"C": C}, p)
    res["tfidf_lr"] = best

    best = None
    for C in C_GRID:
        p = fit_lr(Etr, ytr, C).predict_proba(Eva)
        f = scores(yva, p.argmax(1))["macro_f1"]
        if best is None or f > best[0]:
            best = (f, {"C": C}, p)
    res["enc_lr"] = best

    trace = []

    def ev(model, ep):
        p = mlp_proba(model, Eva)
        trace.append((scores(yva, p.argmax(1))["macro_f1"], ep, p))

    train_mlp(Etr, ytr, len(INTENTS), MLP_MAX_EPOCHS, SEED, eval_fn=ev, eval_every=MLP_EVAL_EVERY)
    f, ep, p = max(trace, key=lambda t: (t[0], -t[1]))  # best F1, then fewer epochs
    res["enc_mlp"] = (f, {"epochs": ep, "hidden": 256, "dropout": 0.2, "lr": 1e-3, "weight_decay": 1e-4,
                          "batch_size": 64}, p)
    return res


def choose(res):
    best_f = max(v[0] for v in res.values())
    for a in APPROACHES:  # ordered simplest first
        if res[a][0] >= best_f - TIE:
            return a


def pick_oos_threshold(yva, proba):
    rows = [(scores(yva, abstain(proba, t))["macro_f1"], t) for t in OOS_GRID]
    best = max(f for f, _ in rows)
    t = max(t for f, t in rows if f == best)  # tie -> abstain more (safer)
    return t, [{"t": t_, "val_macro_f1": f} for f, t_ in rows]


def pick_safety_threshold(yva, proba, cls):
    """Largest t in the grid at which P(cls) >= t still flags every validation example of cls."""
    pos = yva == cls
    ok = [t for t in SAFETY_GRID if (proba[pos, cls] >= t).all()]
    t = max(ok) if ok else min(SAFETY_GRID)
    fp = float((proba[~pos, cls] >= t).mean())
    return t, round(fp, 4)


def refit(approach, hp, rows, E):
    y = y_of(rows)
    if approach == "tfidf_lr":
        return fit_tfidf([r["text"] for r in rows], y, hp["C"])
    if approach == "enc_lr":
        return fit_lr(E, y, hp["C"])
    return train_mlp(E, y, len(INTENTS), hp["epochs"], SEED)


def proba_of(approach, model, rows, E):
    if approach == "tfidf_lr":
        return model.predict_proba([r["text"] for r in rows])
    if approach == "enc_lr":
        return model.predict_proba(E)
    return mlp_proba(model, E)


# ------------------------------------------------------------------ FAQ threshold

def faq_threshold(train, Etrain):
    sims = []
    for i, r in enumerate(train):
        if r["intent"] == "OUT_OF_SCOPE":
            sims.append(faq.best_match(Etrain[i], r["lang"])[1])
    return round(float(np.percentile(sims, FAQ_OOS_PERCENTILE)), 3), sims


def faq_coverage(rows, E, t):
    out = {}
    for lang in LANGS + ("all",):
        idx = [i for i, r in enumerate(rows) if r["intent"] in ("DISEASE_INFO", "HOW_AI_WORKS")
               and (lang == "all" or r["lang"] == lang)]
        hits, examples = 0, []
        for i in idx:
            topics = faq.DISEASE_TOPICS if rows[i]["intent"] == "DISEASE_INFO" else faq.VITALNEX_TOPICS
            e, s = faq.best_match(E[i], rows[i]["lang"], topics)
            hits += s >= t
            examples.append({"query": rows[i]["text"], "lang": rows[i]["lang"], "faq_id": e["id"],
                             "similarity": round(s, 3), "answered": bool(s >= t)})
        out[lang] = {"answered": int(hits), "n": len(idx), "rate": round(hits / max(1, len(idx)), 4)}
        if lang == "all":
            out["examples"] = examples
    return out


# ------------------------------------------------------------------ pipeline safety on test

def pipeline_safety(rows, proba, t_emerg, t_med, t_oos):
    emerg = np.array([rules.is_emergency(r["text"]) for r in rows])
    med = np.array([rules.is_medication_request(r["text"]) for r in rows])
    y = y_of(rows)
    clf_emerg = proba[:, EMERG] >= t_emerg
    clf_med = proba[:, MED] >= t_med
    pe, pm = y == EMERG, y == MED
    final = abstain(proba, t_oos)
    final = np.where(emerg | clf_emerg, EMERG, np.where(med | clf_med, MED, final))
    out = {
        "emergency_recall_rules_only": round(float(emerg[pe].mean()), 4),
        "emergency_recall_classifier_only": round(float(clf_emerg[pe].mean()), 4),
        "emergency_recall_pipeline": round(float((emerg | clf_emerg)[pe].mean()), 4),
        "emergency_false_alarm_rate_non_emergency": round(float((emerg | clf_emerg)[~pe].mean()), 4),
        "medication_refused_or_escalated": round(float(((emerg | clf_emerg) | med | clf_med)[pm].mean()), 4),
        "medication_false_refusal_rate_other": round(float((~(emerg | clf_emerg) & (med | clf_med))[~pm & ~pe].mean()), 4),
        "oos_abstain_rate_on_oos": round(float((final == OOS)[y == OOS].mean()), 4),
        "in_scope_abstain_rate": round(float((final == OOS)[y != OOS].mean()), 4),
        "pipeline_intent_metrics": per_language(rows, y, final),
    }
    return out


# ------------------------------------------------------------------ main

def main():
    t0 = time.time()
    train, test = load("intents_train.jsonl"), load("intents_test.jsonl")
    holdout = load("emergency_holdout.jsonl")
    strat = [f"{r['intent']}|{r['lang']}" for r in train]
    idx_tr, idx_va = train_test_split(np.arange(len(train)), test_size=VAL_SIZE, random_state=SEED, stratify=strat)
    tr_rows, va_rows = [train[i] for i in idx_tr], [train[i] for i in idx_va]
    print(f"train {len(train)} (fit {len(tr_rows)} / val {len(va_rows)}), test {len(test)}, holdout {len(holdout)}")

    print("encoding (downloads the encoder once if not cached) ...")
    encoder.get_model(allow_download=True)
    te = time.time()
    Etrain = encoder.encode([r["text"] for r in train], allow_download=True)
    enc_s = time.time() - te
    Etest = encoder.encode([r["text"] for r in test])
    Ehold = encoder.encode([r["text"] for r in holdout])
    Etr, Eva = Etrain[idx_tr], Etrain[idx_va]
    single = []
    for r in test[:30]:
        s = time.perf_counter()
        encoder.encode([r["text"]])
        single.append((time.perf_counter() - s) * 1000)

    # 2-3. compare on validation, choose
    yva = y_of(va_rows)
    res = tune(tr_rows, va_rows, Etr, Eva)
    val_cmp = {a: {"hyperparameters": res[a][1], **{"val": per_language(va_rows, yva, res[a][2].argmax(1))}}
               for a in APPROACHES}
    chosen = choose(res)
    print("validation macro-F1:", {a: res[a][0] for a in APPROACHES}, "-> chosen:", chosen)

    # 4. thresholds on validation (chosen approach)
    pva = res[chosen][2]
    t_oos, oos_curve = pick_oos_threshold(yva, pva)
    t_emerg, emerg_fp_val = pick_safety_threshold(yva, pva, EMERG)
    t_med, med_fp_val = pick_safety_threshold(yva, pva, MED)
    print(f"thresholds: oos={t_oos} emergency={t_emerg} (val FP {emerg_fp_val}) medication={t_med} (val FP {med_fp_val})")

    # 5. refit on full train, evaluate once on test
    ytest = y_of(test)
    test_cmp, models, ptests = {}, {}, {}
    for a in APPROACHES:
        models[a] = refit(a, res[a][1], train, Etrain)
        ptests[a] = proba_of(a, models[a], test, Etest)
        test_cmp[a] = per_language(test, ytest, ptests[a].argmax(1))
    p = ptests[chosen]
    pred_t = abstain(p, t_oos)
    chosen_test = per_language(test, ytest, pred_t)
    cm = confusion_matrix(ytest, pred_t, labels=list(range(len(INTENTS)))).tolist()
    per_intent = {}
    weakest = {}
    for lang in LANGS:
        m = np.array([r["lang"] == lang for r in test])
        f1s = f1_score(ytest[m], pred_t[m], average=None, labels=list(range(len(INTENTS))), zero_division=0)
        per_intent[lang] = {INTENTS[i]: round(float(f), 4) for i, f in enumerate(f1s)}
        wi = int(np.argmin(f1s))
        weakest[lang] = {"intent": INTENTS[wi], "f1": round(float(f1s[wi]), 4)}
    errors = [{"text": r["text"], "lang": r["lang"], "true": r["intent"], "pred": INTENTS[pred_t[i]],
               "confidence": round(float(p[i].max()), 3)} for i, r in enumerate(test) if pred_t[i] != ytest[i]]

    safety = pipeline_safety(test, p, t_emerg, t_med, t_oos)
    ph = proba_of(chosen, models[chosen], holdout, Ehold)
    h_rule = np.array([rules.is_emergency(r["text"]) for r in holdout])
    h_clf = ph[:, EMERG] >= t_emerg
    holdout_res = {"n": len(holdout), "rules_only": round(float(h_rule.mean()), 4),
                   "classifier_only": round(float(h_clf.mean()), 4),
                   "pipeline": round(float((h_rule | h_clf).mean()), 4),
                   "missed": [r["text"] for i, r in enumerate(holdout) if not (h_rule[i] or h_clf[i])]}
    print("test (chosen, with abstention):", chosen_test)
    print("pipeline safety:", {k: v for k, v in safety.items() if k != "pipeline_intent_metrics"})
    print("emergency hold-out:", holdout_res)

    # 6. FAQ threshold
    t_faq, oos_sims = faq_threshold(train, Etrain)
    coverage = faq_coverage(test, Etest, t_faq)
    print("faq threshold", t_faq, "coverage", {k: v for k, v in coverage.items() if k != "examples"})

    # 7. save
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    for old in ARTIFACTS.glob("intent_model.*"):
        old.unlink()
    if chosen == "enc_mlp":
        import torch
        fname = "intent_model.pt"
        torch.save(models[chosen].state_dict(), ARTIFACTS / fname)
    else:
        fname = "intent_model.joblib"
        joblib.dump(models[chosen], ARTIFACTS / fname)

    import sentence_transformers
    import torch
    import transformers

    meta = {
        "version": VERSION,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "labels": INTENTS,
        "chosen_approach": chosen,
        "chosen_hyperparameters": res[chosen][1],
        "selection_rule": f"best validation macro-F1; within {TIE} prefer the simpler approach "
                          f"(order {list(APPROACHES)}). Fixed before test evaluation.",
        "artifact_files": {"model": fname},
        "encoder": {"model_id": encoder.MODEL_ID, "revision": encoder.model_revision(), "licence": encoder.LICENCE,
                    "attribution": encoder.ATTRIBUTION, "url": encoder.MODEL_URL, "dimension": int(Etrain.shape[1]),
                    "frozen": True, "device": "cpu",
                    "encode_ms_per_message_cpu_median": round(float(np.median(single)), 1),
                    "encode_seconds_train_set": round(enc_s, 1)},
        "data": {
            "train_file": "ml/nlp/data/intents_train.jsonl", "train_sha256": sha256(DATA / "intents_train.jsonl"),
            "test_file": "ml/nlp/data/intents_test.jsonl", "test_sha256": sha256(DATA / "intents_test.jsonl"),
            "emergency_holdout_file": "ml/nlp/data/emergency_holdout.jsonl",
            "n_train": len(train), "n_fit": len(tr_rows), "n_val": len(va_rows), "n_test": len(test),
            "per_language_train": dict(Counter(r["lang"] for r in train)),
            "per_language_test": dict(Counter(r["lang"] for r in test)),
            "romanised_train": sum(r["lang"] != "en" and r["script"] == "latin" for r in train),
            "romanised_test": sum(r["lang"] != "en" and r["script"] == "latin" for r in test),
            "origin": "All utterances written by Claude Code (synthetic, not from users). Test lines were written "
                      "separately with different phrasing. HI/MR not yet reviewed by native speakers.",
            "split": {"val_size": VAL_SIZE, "seed": SEED, "stratify": "intent x language"},
        },
        "comparison": {"validation": val_cmp, "test_argmax_no_abstention": test_cmp},
        "thresholds": {"oos": t_oos, "emergency": t_emerg, "medication": t_med, "faq_similarity": t_faq},
        "threshold_selection": {
            "oos": "max validation macro-F1 when max-probability < t is mapped to OUT_OF_SCOPE (ties -> larger t)",
            "oos_curve_validation": oos_curve,
            "emergency": "largest t (grid 0.05-0.50) keeping 100% validation recall for EMERGENCY via P(EMERGENCY) >= t",
            "emergency_val_false_alarm_rate": emerg_fp_val,
            "medication": "same rule for MEDICATION_REQUEST",
            "medication_val_false_refusal_rate": med_fp_val,
            "faq_similarity": f"{FAQ_OOS_PERCENTILE}th percentile of best FAQ similarity of OUT_OF_SCOPE training utterances",
            "faq_oos_similarity_summary": {"min": round(float(min(oos_sims)), 3), "median": round(float(np.median(oos_sims)), 3),
                                           "max": round(float(max(oos_sims)), 3)},
        },
        "per_language": {l: chosen_test[l] for l in LANGS},  # language-parity metric (Trust Passport)
        "test_metrics": {"chosen_with_abstention": chosen_test, "per_intent_f1": per_intent,
                         "weakest_intent": weakest,
                         "confusion_matrix": {"labels": INTENTS, "rows_true_cols_pred": cm},
                         "errors": errors},
        "pipeline_safety_test": safety,
        "emergency_holdout": holdout_res,
        "faq": {"entries_per_language": len(faq.entries("en")),
                "per_topic": dict(Counter(e["topic"] for e in faq.entries("en"))),
                "test_coverage": coverage},
        "rules": {"emergency_file": "ml/nlp/data/emergency_phrases.json",
                  "medication_file": "ml/nlp/data/medication_phrases.json",
                  "note": "Rule lists were extended once after the first look at test-set misses (see model card); "
                          "emergency_holdout.jsonl was written afterwards and was NOT used to tune anything."},
        "libraries": {"python": platform.python_version(), "scikit-learn": sklearn.__version__,
                      "torch": torch.__version__, "sentence-transformers": sentence_transformers.__version__,
                      "transformers": transformers.__version__, "numpy": np.__version__},
        "train_seconds_total": round(time.time() - t0, 1),
    }
    META_PATH.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_card(meta)
    print(f"saved {ARTIFACTS / fname}, {META_PATH}, {CARD} in {meta['train_seconds_total']} s")


def _table(cmp):
    lines = ["| Approach | EN acc | EN macro-F1 | HI acc | HI macro-F1 | MR acc | MR macro-F1 | All macro-F1 |",
             "|---|---|---|---|---|---|---|---|"]
    for a, m in cmp.items():
        m = m.get("val", m)
        lines.append(f"| {a} | " + " | ".join(f"{m[l]['accuracy']:.3f} | {m[l]['macro_f1']:.3f}" for l in LANGS)
                     + f" | {m['all']['macro_f1']:.3f} |")
    return "\n".join(lines)


def write_card(meta):
    t = meta["thresholds"]
    s = meta["pipeline_safety_test"]
    h = meta["emergency_holdout"]
    c = meta["test_metrics"]["chosen_with_abstention"]
    cov = meta["faq"]["test_coverage"]
    weak = meta["test_metrics"]["weakest_intent"]
    cm = meta["test_metrics"]["confusion_matrix"]
    short = ["EXPL", "CHNG", "DIS", "AI", "BOOK", "DOC", "DATA", "EMRG", "MED", "GRT", "OOS"]
    cm_lines = ["| true \\ pred | " + " | ".join(short) + " |", "|---" * (len(short) + 1) + "|"]
    for i, row in enumerate(cm["rows_true_cols_pred"]):
        cm_lines.append(f"| {short[i]} | " + " | ".join(str(v) for v in row) + " |")
    card = f"""# Model card — VITALNEX assistant intent classifier

*Generated by `python -m ml.nlp.train_intents` from `ml/nlp/artifacts/nlp_meta.json`. Do not edit by hand.*

| | |
|---|---|
| Version | `{meta['version']}` (created {meta['created_at']}) |
| Task | Classify a chat message (EN / HI / MR, incl. romanised HI/MR) into 11 intents (SPEC §5) |
| Chosen approach | **{meta['chosen_approach']}** {json.dumps(meta['chosen_hyperparameters'])} |
| Encoder | `{meta['encoder']['model_id']}` revision `{meta['encoder']['revision']}` — frozen, CPU, {meta['encoder']['dimension']}-d |
| Encoder licence | **{meta['encoder']['licence']}**. {meta['encoder']['attribution']} |
| Generative model | **None.** Every reply is pre-written (templates, curated FAQ with sources). No external API. |
| CPU cost | ~{meta['encoder']['encode_ms_per_message_cpu_median']} ms to encode one message (median, this laptop) |

## Intended use and limits

- Routes a user's message to a fixed action: emergency card, medicine refusal, templated explanation of the
  user's latest assessment, sourced FAQ answer, or a navigation button. It never writes medical text.
- **Not** a symptom checker and **not** a diagnostic tool. Safety does not depend on the classifier alone:
  deterministic emergency and medicine rules run first (SPEC §5 steps 1–2).
- All training and test utterances were **written by Claude Code** (synthetic). They are not real user messages,
  so real-world accuracy will be lower than shown here. Hindi/Marathi lines have not yet been checked by native
  speakers (`docs/i18n_review_p8.md`).

## Data

- Train: {meta['data']['n_train']} utterances ({meta['data']['per_language_train']}), ~40 per intent per language,
  {meta['data']['romanised_train']} romanised HI/MR. Validation = 20% of train, stratified by intent × language (seed {meta['data']['split']['seed']}).
- Test: {meta['data']['n_test']} utterances, 10 per intent per language ({meta['data']['romanised_test']} romanised),
  written separately with different phrasing. Used once, after the approach was chosen.
- Emergency hold-out: {h['n']} extra emergency messages written after the rule lists were finalised; never used for tuning.

## Comparison (test set, argmax, no abstention)

{_table(meta['comparison']['test_argmax_no_abstention'])}

Validation (used for the choice):

{_table(meta['comparison']['validation'])}

Selection rule: {meta['selection_rule']}

## Chosen model on test (with OUT_OF_SCOPE abstention at {t['oos']})

| Language | Accuracy | Macro-F1 | Weakest intent (F1) |
|---|---|---|---|
""" + "\n".join(f"| {l} | {c[l]['accuracy']:.3f} | {c[l]['macro_f1']:.3f} | {weak[l]['intent']} ({weak[l]['f1']:.2f}) |" for l in LANGS) + f"""

Confusion matrix (all languages, test, with abstention):

""" + "\n".join(cm_lines) + f"""

## Thresholds (chosen on validation)

| Threshold | Value | Rule |
|---|---|---|
| OUT_OF_SCOPE abstention | {t['oos']} | {meta['threshold_selection']['oos']} |
| Classifier emergency backstop | {t['emergency']} | {meta['threshold_selection']['emergency']} |
| Classifier medicine backstop | {t['medication']} | {meta['threshold_selection']['medication']} |
| FAQ similarity | {t['faq_similarity']} | {meta['threshold_selection']['faq_similarity']} |

## Safety results (test set, full pipeline: rules first, classifier backstop)

| Check | Result |
|---|---|
| Emergency recall — rules only | {s['emergency_recall_rules_only']:.3f} |
| Emergency recall — classifier only | {s['emergency_recall_classifier_only']:.3f} |
| **Emergency recall — pipeline** | **{s['emergency_recall_pipeline']:.3f}** |
| Emergency false-alarm rate on non-emergency test messages | {s['emergency_false_alarm_rate_non_emergency']:.3f} |
| Medicine requests refused (or escalated as emergency) | {s['medication_refused_or_escalated']:.3f} |
| Non-medicine messages wrongly refused | {s['medication_false_refusal_rate_other']:.3f} |
| OUT_OF_SCOPE messages that abstain | {s['oos_abstain_rate_on_oos']:.3f} |
| In-scope messages that abstain | {s['in_scope_abstain_rate']:.3f} |
| Emergency hold-out (never tuned): rules only / classifier only / pipeline | {h['rules_only']:.3f} / {h['classifier_only']:.3f} / {h['pipeline']:.3f} |

Honest note on the rules: the first version of the phrase lists caught only part of the test emergency
messages (extra words such as "बहुत तेज़" broke exact phrases). The lists were then extended once with
proximity rules (a chest word near a pain word, etc.) after looking at those misses, so the test-set rule recall
above is **optimistic**. The separate hold-out was written afterwards to measure this honestly; hold-out misses
are listed in `nlp_meta.json` → `emergency_holdout.missed`.

## FAQ retrieval

{meta['faq']['entries_per_language']} entries per language ({meta['faq']['per_topic']}), same ids in EN/HI/MR, each with a WHO /
NHS / ICMR / NITI / UCI / Hugging Face source URL that returned HTTP 200 when written. CDC pages were not used
because they returned HTTP 403 to automated checks. Share of test DISEASE_INFO / HOW_AI_WORKS questions whose
best FAQ match passes the threshold: EN {cov['en']['rate']:.2f}, HI {cov['hi']['rate']:.2f}, MR {cov['mr']['rate']:.2f}.
Retrieval correctness (is the top entry the right one?) was **not** measured with labels; examples are in
`nlp_meta.json` → `faq.test_coverage.examples`.

## Fairness / inclusivity

Per-language accuracy and macro-F1 above are the language-parity metric (NITI Aayog "Inclusivity").
Romanised Hindi/Marathi is included in train and test.

## Privacy

Message text is never stored; `assistant_logs` keeps only intent, confidence and emergency flag.
The encoder runs locally; no message leaves the server.

## Libraries

{json.dumps(meta['libraries'])}
"""
    CARD.parent.mkdir(parents=True, exist_ok=True)
    CARD.write_text(card, encoding="utf-8")


if __name__ == "__main__":
    main()
