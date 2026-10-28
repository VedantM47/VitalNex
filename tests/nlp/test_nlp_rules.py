"""P8: deterministic assistant rules and content checks (no network, no encoder needed)."""

import json
import re
from collections import Counter
from pathlib import Path

import pytest

from apps.api.core.emergency import text_has_red_flag
from ml.nlp import rules

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "ml" / "nlp" / "data"
LANGS = ("en", "hi", "mr")


def rows(name):
    return [json.loads(l) for l in (DATA / name).read_text(encoding="utf-8").splitlines() if l.strip()]


TEST = rows("intents_test.jsonl")
TRAIN = rows("intents_train.jsonl")
INTENTS = ["EXPLAIN_RESULT", "WHAT_CAN_I_CHANGE", "DISEASE_INFO", "HOW_AI_WORKS", "BOOK_APPOINTMENT",
           "FIND_DOCTOR", "MY_DATA", "EMERGENCY", "MEDICATION_REQUEST", "GREETING", "OUT_OF_SCOPE"]


def test_dataset_shape():
    tr = Counter((r["lang"], r["intent"]) for r in TRAIN)
    te = Counter((r["lang"], r["intent"]) for r in TEST)
    for lang in LANGS:
        for i in INTENTS:
            assert tr[(lang, i)] == 40, (lang, i)
            assert te[(lang, i)] == 10, (lang, i)
    for lang in ("hi", "mr"):
        for i in INTENTS:
            assert sum(r["script"] == "latin" for r in TRAIN if r["lang"] == lang and r["intent"] == i) == 10
            assert sum(r["script"] == "latin" for r in TEST if r["lang"] == lang and r["intent"] == i) >= 3


def test_test_set_does_not_copy_train():
    train_texts = {r["text"].lower() for r in TRAIN}
    assert not [r["text"] for r in TEST if r["text"].lower() in train_texts]


@pytest.mark.parametrize("lang", LANGS)
def test_emergency_rules_full_recall_on_test_phrases(lang):
    """Rules alone catch every emergency test phrase (see the model card for how the lists were built)."""
    missed = [r["text"] for r in TEST if r["intent"] == "EMERGENCY" and r["lang"] == lang and not rules.is_emergency(r["text"])]
    assert missed == []


@pytest.mark.parametrize("lang", LANGS)
def test_medication_rule_catches_every_medication_test_phrase(lang):
    missed = [r["text"] for r in TEST if r["intent"] == "MEDICATION_REQUEST" and r["lang"] == lang
              and not rules.is_medication_request(r["text"])]
    assert missed == []


def test_rules_do_not_fire_on_other_test_intents():
    fp_e = [r["text"] for r in TEST if r["intent"] != "EMERGENCY" and rules.is_emergency(r["text"])]
    fp_m = [r["text"] for r in TEST if r["intent"] not in ("EMERGENCY", "MEDICATION_REQUEST")
            and rules.is_medication_request(r["text"])]
    assert fp_e == [] and fp_m == []


def test_assessment_and_assistant_share_one_emergency_list():
    for t in ("seene mein bahut tez dard", "छातीत खूप दुखत आहे", "my face is drooping on one side"):
        assert text_has_red_flag(t) and rules.is_emergency(t)


@pytest.mark.parametrize("text", [
    "what is a stroke?", "what are the warning signs of a heart attack", "स्ट्रोक क्या होता है",
    "हृदयविकाराचा झटका म्हणजे काय", "I go to the gym for fitness", "जवळचा दवाखाना कुठे आहे",
])
def test_questions_about_diseases_are_not_emergencies(text):
    assert not rules.is_emergency(text)


@pytest.mark.parametrize("text", [
    "I think he is having a stroke", "दिल का दौरा पड़ा है", "papa ko lakwa mar gaya",
    "हृदयविकाराचा झटका आला आहे", "सीने में बहुत तेज़ दर्द है", "saans lene me bahut takleef",
])
def test_present_tense_emergencies_fire(text):
    assert rules.is_emergency(text)


def test_normalisation_handles_nukta_and_chandrabindu():
    assert rules.normalise("ज़बान लड़खड़ा") == rules.normalise("जबान लडखडा")
    assert rules.normalise("साँस") == rules.normalise("सांस")
    assert rules.normalise("Can't  BREATHE!") == "cant breathe"


@pytest.mark.parametrize("text,expected", [
    ("kitni goli lu", True), ("what is 140 mg/dl sugar", False), ("jab doctor milega", False),
    ("जवळचा दवाखाना कुठे आहे", False), ("मला कोणते औषध घ्यावे", True), ("dose of aspirin", True),
])
def test_medication_rule_word_boundaries(text, expected):
    assert rules.is_medication_request(text) is expected


# ---------------------------------------------------------------- FAQ content

def faq(lang):
    return json.loads((ROOT / "ml" / "nlp" / f"faq.{lang}.json").read_text(encoding="utf-8"))["entries"]


def test_faq_same_ids_in_all_languages_and_counts():
    ids = [e["id"] for e in faq("en")]
    assert len(ids) == len(set(ids))
    for lang in ("hi", "mr"):
        assert [e["id"] for e in faq(lang)] == ids
    topics = Counter(e["topic"] for e in faq("en"))
    assert all(topics[t] >= 15 for t in ("diabetes", "heart", "stroke")) and topics["vitalnex"] >= 10


@pytest.mark.parametrize("lang", LANGS)
def test_faq_entries_are_sourced_short_and_never_about_medicines(lang):
    allowed = ("https://www.who.int/", "https://www.nhs.uk/", "https://www.icmr.gov.in/", "https://www.niti.gov.in/",
               "https://archive.ics.uci.edu/", "https://huggingface.co/")
    for e in faq(lang):
        assert e["source_url"].startswith(allowed) and e["source_title"]
        assert len(e["answer"]) < 400
        assert not rules.is_medication_request(e["answer"]), e["id"]
        assert not rules.is_emergency(e["question"]), e["id"]


@pytest.mark.parametrize("lang", LANGS)
def test_faq_never_states_a_diagnosis(lang):
    bad = re.compile(r"(?<!if )\byou have (diabetes|heart disease|a stroke)\b", re.I)  # conditionals are fine
    assert not [e["id"] for e in faq(lang) if bad.search(e["answer"])]
