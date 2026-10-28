"""
P9 tests: patient PDF report (bands only, D-10), language versions (EN / HI / MR) with an embedded
Noto Sans Devanagari font and HarfBuzz shaping, ownership, consent, and the clinician note.
Database = in-memory fake (tests/fakedb.py); models = real ml/artifacts.

Note on text extraction: shaped Devanagari conjuncts and pre-base vowel signs are drawn as single
glyphs that have no one-to-one Unicode mapping, so PDF text extraction (copy / search) loses some
Devanagari characters even though the page renders correctly. Assertions on Devanagari text below
therefore use words whose glyphs map one-to-one (checked against the rendered page).
"""

import io
import re

import pytest
from fastapi.testclient import TestClient
from pypdf import PdfReader

from apps.api.core.config import settings
from apps.api.main import app
from apps.api.services import report_service, screening
from fakedb import FakeStore, bearer, install
from test_clinician_review import ABSTAIN, DOC, HIGH, LOW, PAT_A, PAT_B, assess, seed_people

client = TestClient(app)


@pytest.fixture
def store(monkeypatch):
    s = FakeStore()
    cleanup = install(monkeypatch, s)
    seed_people(s)
    yield s
    cleanup()


def pdf(asm_id, uid=PAT_A, lang=None):
    url = f"/api/v1/reports/{asm_id}/pdf" + (f"?lang={lang}" if lang else "")
    return client.get(url, headers=bearer(uid))


def text_of(content: bytes) -> str:
    reader = PdfReader(io.BytesIO(content))
    return "\n".join(p.extract_text() for p in reader.pages)


def fonts_of(content: bytes) -> set:
    reader = PdfReader(io.BytesIO(content))
    names = set()
    for page in reader.pages:
        for f in (page["/Resources"].get("/Font") or {}).values():
            names.add(str(f.get_object()["/BaseFont"]))
    return names


def test_english_report_has_every_section_and_no_probabilities(store):
    asm = assess(PAT_A, HIGH)
    res = pdf(asm["id"], lang="en")
    assert res.status_code == 200 and res.headers["content-type"] == "application/pdf"
    assert res.content.startswith(b"%PDF")
    assert "attachment" in res.headers["content-disposition"]
    text = text_of(res.content)
    flat = " ".join(text.split())
    for needle in ("VITALNEX screening report", "Asha Patil", "Date of screening", asm["id"], "Next step",
                   "See a doctor soon", "Results by condition", "Main factors", "Clinician review",
                   "Limitations", "Model versions", "This is not a diagnosis", "does not diagnose disease",
                   settings.PUBLIC_WEB_URL.rstrip("/") + "/ai-trust"):
        assert needle in flat, needle
    for d, m in screening.models().items():
        assert m.meta["version"] in flat
        # Low-band miss rate comes from model_meta.json (D-23), same rounding as the results page.
        n = round((1 - m.meta["test_metrics"]["recall_at_t_mod"]) * 100)
        assert f"about {n} were shown as Low" in flat
    # Bands only (D-10): no probability, percentage or conformal set anywhere.
    assert "%" not in text and "probab" not in flat.lower() and "conformal" not in flat.lower()
    stored = next(a for a in store.rows("risk_assessments") if a["id"] == asm["id"])
    for r in stored["results"].values():
        assert f"{r['probability']:.4f}"[1:] not in flat  # e.g. ".4213"
    assert any(a["action"] == "REPORT_DOWNLOADED" for a in store.rows("audit_logs"))


def test_abstained_disease_says_not_confident_without_band_or_factors(store):
    asm = assess(PAT_A, ABSTAIN)
    abstained = [d for d, r in asm["results"].items() if r["abstained"]]
    assert abstained
    flat = " ".join(text_of(pdf(asm["id"], lang="en").content).split())
    assert flat.count("Not confident — see a doctor") == len(abstained)
    assert flat.count("Level:") == 3 - len(abstained)


def test_emergency_record_shows_no_levels(store):
    asm = assess(PAT_A, {**LOW, "symptoms": {"chest_pain": True}})
    assert asm["next_step"] == "emergency"
    flat = " ".join(text_of(pdf(asm["id"], lang="en").content).split())
    assert "Emergency: call 108 / 112 now" in flat
    assert "No screening levels are shown" in flat and "Level:" not in flat


@pytest.mark.parametrize("lang, words", [
    ("hi", ["VITALNEX", "नाम", "मधुमेह", "अगला कदम"]),
    ("mr", ["VITALNEX", "नाव", "मधुमेह", "पुढील पाऊल"]),
])
def test_hindi_and_marathi_reports_embed_devanagari_font(store, lang, words):
    asm = assess(PAT_A, HIGH)
    res = pdf(asm["id"], lang=lang)
    assert res.status_code == 200 and res.content.startswith(b"%PDF")
    assert any(f.endswith("+NotoSansDevanagari-Regular") for f in fonts_of(res.content))
    assert any(f.endswith("+NotoSansDevanagari-Bold") for f in fonts_of(res.content))
    text = text_of(res.content)
    for w in words:
        assert w in text, w
    assert asm["id"] in text and "/ai-trust" in text
    assert "%" not in text
    # No English section headings leak into a translated report.
    for en in ("Next step", "Results by condition", "Limitations", "Clinician review"):
        assert en not in text


def test_report_language_defaults_to_profile_language(store):
    asm = assess(PAT_A, HIGH)  # Asha's profile language is Marathi
    res = pdf(asm["id"])
    assert res.headers["content-disposition"].endswith('-mr.pdf"')
    assert "पुढील पाऊल" in text_of(res.content)


def test_devanagari_is_shaped_by_harfbuzz():
    """Conjuncts need OpenType shaping. With uharfbuzz, reportlab turns क + ् + ष into one glyph."""
    from reportlab.pdfbase.pdfmetrics import getFont
    from reportlab.pdfbase.ttfonts import shapeStr

    assert report_service.shaping_available()
    report_service._register_fonts()
    assert getFont(report_service.FONT).shapable
    assert all(s.shaping for s in report_service._styles().values())
    shaped = shapeStr("क्ष", report_service.FONT, 10)
    assert len(shaped.__shapeData__) == 1  # one conjunct glyph for three code points
    word = shapeStr("स्क्रीनिंग", report_service.FONT, 10)
    assert len(word.__shapeData__) < len("स्क्रीनिंग")


def test_devanagari_report_refused_without_shaping(store, monkeypatch):
    asm = assess(PAT_A, HIGH)
    monkeypatch.setattr(report_service, "shaping_available", lambda: False)
    assert pdf(asm["id"], lang="hi").status_code == 503
    assert pdf(asm["id"], lang="en").status_code == 200


def test_clinician_note_and_level_appear_after_review(store):
    asm = assess(PAT_A, HIGH)
    flat = " ".join(text_of(pdf(asm["id"], lang="en").content).split())
    assert "Waiting for clinician review" in flat and "Clinician note" not in flat
    res = client.patch(f"/api/v1/doctor/reviews/{asm['id']}", headers=bearer(DOC), json={
        "decision": "override", "note": "Please book a lipid test with your GP.",
        "overrides": [{"disease": "heart", "clinician_band": "Moderate", "reason_code": "model_overestimates"}]})
    assert res.status_code == 200, res.text
    flat = " ".join(text_of(pdf(asm["id"], lang="en").content).split())
    assert "Reviewed by a clinician" in flat
    assert "Please book a lipid test with your GP." in flat
    assert "Clinician's level: Moderate" in flat
    assert "model_overestimates" not in flat  # reason codes are not shown to patients


def test_patient_cannot_download_someone_elses_report(store):
    asm = assess(PAT_A, HIGH)
    assert pdf(asm["id"], uid=PAT_B).status_code == 404
    assert pdf(asm["id"], uid=DOC).status_code == 403
    assert client.get(f"/api/v1/reports/{asm['id']}/pdf").status_code == 401
    assert pdf(asm["id"], lang="fr").status_code == 422


def test_withdrawn_history_hides_reports(store):
    asm = assess(PAT_A, HIGH)
    assert [r["assessment_id"] for r in client.get("/api/v1/reports", headers=bearer(PAT_A)).json()] == [asm["id"]]
    res = client.put("/api/v1/consents/store_history", headers=bearer(PAT_A), json={"granted": False})
    assert res.status_code == 200, res.text
    assert client.get("/api/v1/reports", headers=bearer(PAT_A)).json() == []
    assert pdf(asm["id"]).status_code == 404


def test_report_content_keys_match_across_languages():
    def keys(d, prefix=""):
        out = set()
        for k, v in d.items():
            if k.startswith("_"):
                continue
            out |= keys(v, f"{prefix}{k}.") if isinstance(v, dict) else {prefix + k}
        return out

    en = keys(report_service.content("en"))
    assert keys(report_service.content("hi")) == en == keys(report_service.content("mr"))
    # No medicine names or diagnosis wording in the English report text.
    blob = " ".join(str(v) for v in report_service.content("en").values())
    assert not re.search(r"\byou have (diabetes|heart disease|a stroke)\b", blob, re.I)
