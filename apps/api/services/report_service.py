"""
Patient PDF report (docs/SPEC.md §1.2 F17, PROMPTS P9 step 1).

Built only from the stored assessment row, the clinician review row and model_meta.json:
- bands only — no probabilities or conformal sets (D-10);
- an abstained disease shows "not confident — see a doctor" and no band or factors;
- emergency / correct-inputs records show no levels;
- the clinician's note and level, only once a clinician has reviewed it;
- limitations (incl. the Low-band miss rate from model_meta.json, D-23), the non-diagnostic notice
  and the Trust Passport URL.

Fonts: Noto Sans Devanagari (SIL OFL 1.1, apps/api/assets/fonts/OFL.txt) is embedded for every
language; it also covers Latin. Devanagari conjuncts and vowel signs need OpenType shaping, which
reportlab (>= 4.3) does through uharfbuzz when a paragraph style has `shaping=1`. Without uharfbuzz
the text would come out with broken conjuncts, so the service refuses to build a HI/MR PDF instead
of producing one that reads wrongly.
"""

import io
import json
from datetime import datetime, timedelta, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from apps.api.core.config import settings
from apps.api.schemas.assessment import AssessmentRecord
from apps.api.services import screening
from ml.training.features import DISEASES

CONTENT = Path(__file__).resolve().parents[1] / "content"
FONT_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"
FONT, FONT_BOLD = "NotoSansDevanagari", "NotoSansDevanagari-Bold"
LANGS = ("en", "hi", "mr")

INK, MUTED, LINE = colors.HexColor("#0B1F33"), colors.HexColor("#475569"), colors.HexColor("#D8E2EA")
BAND_COLOUR = {"low": colors.HexColor("#065F46"), "moderate": colors.HexColor("#92400E"),
               "high": colors.HexColor("#991B1B")}


class ShapingUnavailableError(RuntimeError):
    pass


def shaping_available() -> bool:
    try:
        import uharfbuzz  # noqa: F401
    except ImportError:
        return False
    return True


@lru_cache(maxsize=1)
def _register_fonts() -> None:
    pdfmetrics.registerFont(TTFont(FONT, str(FONT_DIR / "NotoSansDevanagari-Regular.ttf")))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(FONT_DIR / "NotoSansDevanagari-Bold.ttf")))
    pdfmetrics.registerFontFamily(FONT, normal=FONT, bold=FONT_BOLD, italic=FONT, boldItalic=FONT_BOLD)


@lru_cache(maxsize=3)
def content(lang: str) -> Dict[str, Any]:
    return json.loads((CONTENT / f"report.{lang}.json").read_text(encoding="utf-8"))


def _styles() -> Dict[str, ParagraphStyle]:
    base = ParagraphStyle("base", fontName=FONT, fontSize=10, leading=15, textColor=INK, alignment=TA_LEFT,
                          shaping=1)
    return {
        "body": base,
        "small": ParagraphStyle("small", parent=base, fontSize=8.5, leading=12.5, textColor=MUTED),
        "title": ParagraphStyle("title", parent=base, fontName=FONT_BOLD, fontSize=17, leading=24),
        "h2": ParagraphStyle("h2", parent=base, fontName=FONT_BOLD, fontSize=12.5, leading=18, spaceBefore=8,
                             spaceAfter=3),
        "h3": ParagraphStyle("h3", parent=base, fontName=FONT_BOLD, fontSize=10.5, leading=15, spaceBefore=4),
        "bullet": ParagraphStyle("bullet", parent=base, leftIndent=10, bulletIndent=0),
    }


def _p(text: str, style: ParagraphStyle, bullet: bool = False) -> Paragraph:
    return Paragraph(escape(text), style, bulletText="•" if bullet else None)


IST = timezone(timedelta(hours=5, minutes=30), "IST")


def _date(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(IST).strftime("%Y-%m-%d %H:%M IST")


def _factor_text(feature: str, direction: str, lang: str) -> Optional[str]:
    """Factor sentence in the report language, from the same templates the results page uses."""
    expl = screening._content("explanations", lang)
    if feature not in expl["features"] or direction not in expl["templates"]:
        return None
    text = expl["templates"][direction].format(feature=expl["features"][feature])
    return text[:1].upper() + text[1:]


def _miss_per_100(disease: str, version: Optional[str]) -> Optional[int]:
    """Low-band miss rate (D-23), only if the stored result came from the model loaded now."""
    m = screening.models().get(disease)
    if not m or not version or m.meta["version"] != version:
        return None
    recall = m.meta.get("test_metrics", {}).get("recall_at_t_mod")
    return None if recall is None else round((1 - recall) * 100)


def report_notes(inputs: Dict[str, Any], results: Dict[str, Any]) -> List[str]:
    """The result notes, recomputed from the stored answers (same rules as screening.assess)."""
    if not results:
        return []
    notes = []
    if inputs.get("sex") == "prefer_not_to_say":
        notes.append("sex_not_stated_higher_band_used")
    if isinstance(inputs.get("age"), (int, float)) and inputs["age"] < screening.YOUNG_AGE:
        notes.append("age_under_40_less_reliable")
    return notes


def build_pdf(record: AssessmentRecord, full_name: Optional[str], review: Optional[Dict[str, Any]],
              lang: str, generated_at: Optional[datetime] = None) -> bytes:
    if lang not in LANGS:
        raise ValueError(f"Unsupported language: {lang}")
    if lang != "en" and not shaping_available():
        raise ShapingUnavailableError("Devanagari text needs uharfbuzz for correct shaping.")
    _register_fonts()
    c, s = content(lang), _styles()
    generated_at = generated_at or datetime.now(timezone.utc)
    results = screening.shape_results(record.results or {}, "patient")  # D-10: bands and text only
    versions = record.model_versions or {}
    review = review or {}
    reviewed = bool(review.get("reviewed_by_clinician"))
    clinician_bands = review.get("clinician_bands") or {} if reviewed else {}

    story: List[Any] = [
        _p(c["title"], s["title"]),
        _p(c["subtitle"], s["small"]),
        Spacer(1, 4 * mm),
    ]
    meta_rows = [
        [c["name"], full_name or c["name_missing"]],
        [c["date"], _date(record.created_at)],
        [c["generated"], _date(generated_at)],
        [c["reference"], record.id],
    ]
    if record.assessment_mode == "demo":
        meta_rows.append(["", c["demo_record"]])
    table = Table([[_p(k, s["small"]), _p(v, s["body"])] for k, v in meta_rows], colWidths=[42 * mm, None])
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP"), ("LINEBELOW", (0, -1), (-1, -1), 0.5, LINE),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 1)]))
    story += [table, Spacer(1, 3 * mm)]

    # Next step first: it is what the person should do.
    step = c["next_steps"].get(record.next_step)
    story.append(_p(c["next_step"], s["h2"]))
    if step:
        story += [_p(step["title"], s["h3"]), _p(step["body"], s["body"])]
    if record.next_step == screening.EMERGENCY:
        story.append(_p(c["emergency_no_scores"], s["body"]))

    # Per-disease results.
    story.append(_p(c["results_title"], s["h2"]))
    if not results:
        story.append(_p(c["no_results"], s["body"]))
    for d in DISEASES:
        r = results.get(d)
        if not r:
            continue
        story.append(_p(c["condition"][d], s["h3"]))
        if r.get("abstained") or not r.get("band"):
            story += [_p(c["not_confident"], s["body"]), _p(c["not_confident_body"], s["small"])]
        else:
            band = r["band"]
            colour = BAND_COLOUR[band].hexval()[2:]
            story.append(Paragraph(f'{escape(c["level"])}: <font color="#{colour}"><b>{escape(c["band"][band])}</b></font>',
                                   s["body"]))
            story.append(_p(c["similar"][band].replace("{condition}", c["condition_short"][d]), s["body"]))
            factors = [t for t in (_factor_text(f["feature"], f["direction"], lang) for f in r.get("top_factors", []))
                       if t]
            story.append(_p(c["factors"], s["small"]))
            if factors:
                story += [_p(t, s["bullet"], bullet=True) for t in factors]
            else:
                story.append(_p(c["no_factors"], s["small"]))
        cb = clinician_bands.get(d)
        if cb:
            story.append(_p(f'{c["clinician_level"]}: {c["band"].get(cb.lower(), cb)}', s["body"]))

    notes = report_notes(record.inputs or {}, results)
    for n in notes:
        story.append(_p(c["notes"][n], s["small"], bullet=True))

    # Clinician review.
    story.append(_p(c["clinician"], s["h2"]))
    if reviewed:
        story.append(_p(c["reviewed"], s["body"]))
        if review.get("clinician_note"):
            story += [_p(c["clinician_note"], s["h3"]), _p(review["clinician_note"], s["body"])]
    elif review.get("status") == "pending":
        story.append(_p(c["review_pending"], s["body"]))
    else:
        story.append(_p(c["not_reviewed"], s["body"]))

    # Limitations.
    story.append(_p(c["limitations"], s["h2"]))
    story += [_p(c["limit_inputs"], s["body"], bullet=True), _p(c["limit_data"], s["body"], bullet=True)]
    for d in DISEASES:
        n = _miss_per_100(d, (versions.get(d) or {}).get("version")) if d in results else None
        if n is not None:
            text = c["limit_low"].replace("{condition}", c["condition_short"][d]).replace("{n}", str(n))
            story.append(_p(text, s["body"], bullet=True))

    # Model versions.
    if versions:
        story.append(_p(c["model_versions"], s["h2"]))
        for d in DISEASES:
            v = versions.get(d)
            if v:
                story.append(_p(f'{c["condition"][d]}: {v.get("version")} ({v.get("model")}, data {str(v.get("data_hash"))[:12]})',
                                s["small"]))

    # Notice + Trust Passport.
    story += [_p(c["notice_title"], s["h2"]), _p(c["disclaimer"], s["body"]), Spacer(1, 2 * mm),
              _p(c["trust"], s["small"]), _p(trust_passport_url(), s["small"])]

    buf = io.BytesIO()
    page_label = c["page"]

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont(FONT, 8)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(A4[0] - 18 * mm, 10 * mm, page_label.replace("{n}", str(doc.page)), shaping=True)
        canvas.drawString(18 * mm, 10 * mm, "VITALNEX", shaping=True)
        canvas.restoreState()

    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=16 * mm,
                            bottomMargin=18 * mm, title=c["title"], author="VITALNEX", lang=lang)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    return buf.getvalue()


def trust_passport_url() -> str:
    return settings.PUBLIC_WEB_URL.rstrip("/") + "/ai-trust"
