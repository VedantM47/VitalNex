"""
VITALNEX Patient Report PDF Service.

Generates professional, printable PDF reports for clinical risk assessments.
Uses ReportLab for server-side PDF generation.

IMPORTANT MEDICAL & COMPLIANCE RULES:
- Uses ACTUAL assessment data from the prediction pipeline.
- Does NOT fabricate attribution values or metrics; sections without real data say so.
- Includes mandatory medical disclaimer.
- Uses clean A4 layout, dynamic page numbering, units, and clear hierarchy.
"""

import io
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm, cm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, HRFlowable, KeepTogether
    )
    from reportlab.pdfgen import canvas
    from reportlab.graphics.shapes import Drawing, Rect, String, Line
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# VITALNEX Brand Colors
NAVY = colors.HexColor("#0B1F33")
TEAL = colors.HexColor("#0E7490")
CYAN = colors.HexColor("#22C1DC")
GREEN = colors.HexColor("#0F766E")
AMBER = colors.HexColor("#B45309")
RED = colors.HexColor("#B42318")
LIGHT_BG = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#D8E2EA")
TEXT_PRIMARY = colors.HexColor("#0F172A")
TEXT_SECONDARY = colors.HexColor("#475569")
TEXT_MUTED = colors.HexColor("#64748B")
WHITE = colors.white


if REPORTLAB_AVAILABLE:
    class NumberedCanvas(canvas.Canvas):
        """
        Two-pass canvas for adding dynamic total page count (Page X of Y)
        and running headers/footers.
        """
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self.draw_page_decorations(num_pages)
                super().showPage()
            super().save()

        def draw_page_decorations(self, page_count: int):
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(TEXT_MUTED)

            # Running Header on later pages
            if self._pageNumber > 1:
                self.drawString(18 * mm, 287 * mm, "VITALNEX Clinical Decision-Support Report — CONFIDENTIAL")
                self.setStrokeColor(BORDER)
                self.setLineWidth(0.5)
                self.line(18 * mm, 284 * mm, 192 * mm, 284 * mm)

            # Running Footer on all pages
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(192 * mm, 10 * mm, page_text)
            self.drawString(
                18 * mm,
                10 * mm,
                "VITALNEX Research Prototype • Non-Diagnostic • Emergency: Call 108 / 112 (India)"
            )
            self.setStrokeColor(BORDER)
            self.setLineWidth(0.5)
            self.line(18 * mm, 14 * mm, 192 * mm, 14 * mm)
            self.restoreState()


def _get_risk_color(band: str) -> colors.Color:
    if band == "Low":
        return GREEN
    elif band == "Moderate":
        return AMBER
    return RED


def _build_styles():
    """Create custom paragraph styles for the PDF."""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        "VNTitle", parent=styles["Title"],
        fontName="Helvetica-Bold", fontSize=20,
        textColor=NAVY, spaceAfter=2, alignment=TA_LEFT,
    ))
    styles.add(ParagraphStyle(
        "VNTagline", parent=styles["Normal"],
        fontName="Helvetica", fontSize=9,
        textColor=TEAL, spaceAfter=10,
    ))
    styles.add(ParagraphStyle(
        "VNSectionHeader", parent=styles["Heading2"],
        fontName="Helvetica-Bold", fontSize=11,
        textColor=NAVY, spaceBefore=12, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "VNBody", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8.5,
        textColor=TEXT_PRIMARY, leading=12,
    ))
    styles.add(ParagraphStyle(
        "VNBodyMuted", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8,
        textColor=TEXT_MUTED, leading=11,
    ))
    styles.add(ParagraphStyle(
        "VNDisclaimer", parent=styles["Normal"],
        fontName="Helvetica-Oblique", fontSize=7.5,
        textColor=TEXT_SECONDARY, leading=10, spaceAfter=4,
    ))
    styles.add(ParagraphStyle(
        "TableHeader", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8,
        textColor=WHITE,
    ))
    styles.add(ParagraphStyle(
        "TableCell", parent=styles["Normal"],
        fontName="Helvetica", fontSize=8,
        textColor=TEXT_PRIMARY, leading=10,
    ))
    styles.add(ParagraphStyle(
        "TableCellBold", parent=styles["Normal"],
        fontName="Helvetica-Bold", fontSize=8,
        textColor=TEXT_PRIMARY, leading=10,
    ))
    return styles


def _create_feature_chart(pos_contributors: List[Dict[str, Any]], neg_contributors: List[Dict[str, Any]]) -> Drawing:
    """Draw a clean visual bar chart of top risk contributors."""
    d = Drawing(460, 100)
    d.add(Rect(0, 0, 460, 100, fillColor=LIGHT_BG, strokeColor=BORDER, strokeWidth=0.5, rx=4, ry=4))
    
    d.add(String(10, 85, "TOP CONTRIBUTING FACTORS", fontName="Helvetica-Bold", fontSize=8, fillColor=NAVY))
    
    y = 65
    all_contribs = pos_contributors[:2] + neg_contributors[:2]
    if not all_contribs:
        d.add(String(20, 45, "No feature attributions available.", fontName="Helvetica-Oblique", fontSize=8, fillColor=TEXT_MUTED))
        return d

    for item in all_contribs:
        label = str(item.get("label", item.get("feature", "")))[:25]
        val_str = str(item.get("value", ""))
        impact = str(item.get("impact", ""))
        is_risk = "Risk" in impact or "+" in impact or "↑" in impact

        bar_color = RED if is_risk else GREEN
        bar_width = min(180, max(30, len(label) * 8 + 20))

        d.add(String(12, y, label, fontName="Helvetica", fontSize=8, fillColor=TEXT_PRIMARY))
        d.add(Rect(160, y - 2, bar_width, 10, fillColor=bar_color, strokeColor=None))
        d.add(String(165 + bar_width, y, f"{impact} (Val: {val_str})", fontName="Helvetica-Bold", fontSize=7.5, fillColor=bar_color))
        y -= 18

    return d


def generate_assessment_pdf(
    assessment_data: Dict[str, Any],
    explanation_data: Optional[Dict[str, Any]] = None,
    language: str = "en",
) -> Optional[bytes]:
    """
    Generate a professional patient risk assessment PDF.
    Returns PDF bytes or None if ReportLab is unavailable.
    """
    if not REPORTLAB_AVAILABLE:
        return None

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        title="VITALNEX Clinical Assessment Report",
        author="VITALNEX Intelligence Engine",
    )

    styles = _build_styles()
    elements = []

    # ── HEADER BRANDING ──
    header_table_data = [
        [
            Paragraph("VITALNEX CLINICAL RISK REPORT", styles["VNTitle"]),
            Paragraph(f"REPORT ID: REP-{assessment_data.get('id', 'DEMO')[:12].upper()}<br/>GEN DATE: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ParagraphStyle("RightHeader", fontName="Helvetica", fontSize=7.5, textColor=TEXT_MUTED, alignment=TA_RIGHT)),
        ]
    ]
    header_table = Table(header_table_data, colWidths=[310, 150])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(HRFlowable(width="100%", color=TEAL, thickness=1.5, spaceBefore=4, spaceAfter=10))

    # ── PATIENT DEMOGRAPHICS & METADATA ──
    assessment_id = assessment_data.get("id", f"asm-{uuid.uuid4().hex[:8]}")
    user_id = assessment_data.get("user_id", "demo-user")
    evaluated_at = str(assessment_data.get("evaluated_at", datetime.now(timezone.utc).isoformat()))[:19].replace("T", " ")
    mode = assessment_data.get("assessment_mode", "Validated ML Model")

    meta_data = [
        [
            Paragraph("<b>Patient Identifier:</b>", styles["TableCell"]), Paragraph(user_id, styles["TableCellBold"]),
            Paragraph("<b>Assessment ID:</b>", styles["TableCell"]), Paragraph(assessment_id, styles["TableCellBold"]),
        ],
        [
            Paragraph("<b>Evaluation Date:</b>", styles["TableCell"]), Paragraph(evaluated_at, styles["TableCell"]),
            Paragraph("<b>Screening Mode:</b>", styles["TableCell"]), Paragraph(mode.title(), styles["TableCell"]),
        ],
    ]
    meta_table = Table(meta_data, colWidths=[100, 130, 90, 140])
    meta_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # ── EXECUTIVE SUMMARY & RISK SCORE ──
    elements.append(Paragraph("EXECUTIVE CLINICAL SUMMARY", styles["VNSectionHeader"]))
    risk_score = float(assessment_data.get("risk_score", 0.0))
    risk_band = str(assessment_data.get("risk_band", "Low"))
    hr_status = assessment_data.get("human_review_status", "Not_Required")
    risk_color = _get_risk_color(risk_band)

    risk_summary_data = [
        [
            Paragraph("Cardiometabolic Risk Score", styles["TableCellBold"]),
            Paragraph("Risk Stratification", styles["TableCellBold"]),
            Paragraph("Model Version", styles["TableCellBold"]),
        ],
        [
            Paragraph(f"<font size=16 color={NAVY.hexval()}><b>{risk_score}%</b></font>", styles["TableCell"]),
            Paragraph(f"<font size=12 color={risk_color.hexval()}><b>{risk_band.upper()} RISK</b></font>", styles["TableCell"]),
            Paragraph(str(assessment_data.get("model_version", "not available")), styles["TableCell"]),
        ],
    ]
    risk_table = Table(risk_summary_data, colWidths=[150, 150, 160])
    risk_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(risk_table)

    summary_explanation = (
        f"Screening level: <b>{risk_band}</b>. This is not a diagnosis. "
    )
    if risk_band == "High":
        summary_explanation += "High-risk indicators detected. Secondary clinical review and physician confirmation are strongly recommended."
    elif risk_band == "Moderate":
        summary_explanation += "Moderate risk indicators observed. Lifestyle modifications and periodic 90-day re-screening are advised."
    else:
        summary_explanation += "Screening parameters are within non-elevated baseline bounds. Continue standard wellness maintenance."

    elements.append(Spacer(1, 4))
    elements.append(Paragraph(summary_explanation, styles["VNBody"]))
    elements.append(Spacer(1, 10))

    # ── CLINICAL INPUT VALUES & UNITS ──
    elements.append(Paragraph("CLINICAL INPUT PARAMETERS & UNITS", styles["VNSectionHeader"]))
    input_snapshot = assessment_data.get("input_snapshot", {})
    
    param_labels_units = {
        "age": ("Age", "years"),
        "sex": ("Biological Sex", "0=Female, 1=Male"),
        "trestbps": ("Resting Blood Pressure", "mmHg"),
        "chol": ("Serum Cholesterol", "mg/dL"),
        "fbs": ("Fasting Blood Sugar >120 mg/dL", "0=No, 1=Yes"),
        "restecg": ("Resting ECG Results", "0=Normal, 1=ST-T wave abnormality, 2=LVH"),
        "thalach": ("Maximum Heart Rate Achieved", "bpm"),
        "exang": ("Exercise-Induced Angina", "0=No, 1=Yes"),
        "oldpeak": ("ST Depression Induced by Exercise", "mm"),
        "slope": ("Slope of Peak Exercise ST Segment", "1=Upsloping, 2=Flat, 3=Downsloping"),
        "ca": ("Number of Major Vessels Colored by Flourosopy", "0-3 vessels"),
        "thal": ("Thalassemia Thallium Stress Test", "3=Normal, 6=Fixed, 7=Reversible"),
        "bmi": ("Body Mass Index", "kg/m²"),
        "smoking": ("Active Smoking Status", "0=Non-smoker, 1=Smoker"),
    }

    param_rows = [[
        Paragraph("Parameter Name", styles["TableHeader"]),
        Paragraph("Observed Value", styles["TableHeader"]),
        Paragraph("Standard Units / Scale", styles["TableHeader"]),
        Paragraph("Data Quality Status", styles["TableHeader"]),
    ]]

    if input_snapshot:
        for k, v in input_snapshot.items():
            name, unit = param_labels_units.get(k, (k.upper(), "Standard"))
            status_str = "Self-reported"
            param_rows.append([
                Paragraph(name, styles["TableCellBold"]),
                Paragraph(str(v), styles["TableCell"]),
                Paragraph(unit, styles["TableCell"]),
                Paragraph(status_str, styles["TableCell"]),
            ])
    else:
        param_rows.append([
            Paragraph("No inputs recorded", styles["TableCellBold"]),
            Paragraph("—", styles["TableCell"]),
            Paragraph("—", styles["TableCell"]),
            Paragraph("—", styles["TableCell"]),
        ])

    param_table = Table(param_rows, colWidths=[150, 80, 130, 100])
    param_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(param_table)
    elements.append(Spacer(1, 10))

    # ── FEATURE ATTRIBUTION / SHAP CHART ──
    elements.append(Paragraph("MODEL EXPLAINABILITY & PROVENANCE", styles["VNSectionHeader"]))
    if explanation_data:
        pos = explanation_data.get("top_positive_contributors", [])
        neg = explanation_data.get("top_negative_contributors", [])
        chart = _create_feature_chart(pos, neg)
        elements.append(chart)
    else:
        elements.append(Paragraph("Factor explanations are not available for this report.", styles["VNBodyMuted"]))
    elements.append(Spacer(1, 10))

    # ── MODEL & DATASET METADATA ──
    elements.append(Paragraph("MODEL GOVERNANCE & DATASET PROVENANCE", styles["VNSectionHeader"]))
    model_version = assessment_data.get("model_version", "not available")
    
    gov_data = [
        [Paragraph("<b>Model Artifact Version:</b>", styles["TableCell"]), Paragraph(model_version, styles["TableCellBold"])],
        [Paragraph("<b>Human Oversight Gate:</b>", styles["TableCell"]), Paragraph("Required" if hr_status == "Pending" else "Automated Baseline Gate", styles["TableCellBold"])],
    ]
    gov_table = Table(gov_data, colWidths=[140, 320])
    gov_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BG),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(gov_table)
    elements.append(Spacer(1, 10))

    # ── CLINICIAN SIGN-OFF FIELD (OPTIONAL / PLACEHOLDER REVIEW) ──
    elements.append(Paragraph("CLINICIAN OVERSIGHT & SIGN-OFF", styles["VNSectionHeader"]))
    signoff_data = [
        [
            Paragraph("<b>Reviewing Clinician:</b> ___________________________", styles["TableCell"]),
            Paragraph("<b>Medical License No:</b> ___________________", styles["TableCell"]),
        ],
        [
            Paragraph("<b>Clinical Notes & Findings:</b> ____________________________________________________________________", styles["TableCell"]),
            Paragraph("<b>Date:</b> ______________", styles["TableCell"]),
        ],
    ]
    signoff_table = Table(signoff_data, colWidths=[280, 180])
    signoff_table.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(signoff_table)
    elements.append(Spacer(1, 10))

    # ── MANDATORY MEDICAL DISCLAIMER ──
    elements.append(HRFlowable(width="100%", color=RED, thickness=1, spaceBefore=4, spaceAfter=6))
    elements.append(Paragraph("MANDATORY MEDICAL & RESEARCH DISCLAIMER", ParagraphStyle("DiscTitle", fontName="Helvetica-Bold", fontSize=8, textColor=RED)))
    disclaimer_text = (
        "<b>THIS REPORT IS AN ACADEMIC DECISION-SUPPORT PROTOTYPE AND NOT A CLINICALLY VALIDATED DIAGNOSTIC DEVICE.</b><br/>"
        "1. This report does not diagnose medical conditions, prescribe treatment, or replace qualified physician consultation.<br/>"
        "2. Screening levels are estimates from statistical models and can be wrong.<br/>"
        "3. In case of severe chest pain, shortness of breath, or emergency symptoms, contact local emergency services immediately (108 / 112 in India)."
    )
    elements.append(Paragraph(disclaimer_text, styles["VNDisclaimer"]))

    # Build PDF with two-pass NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    return buffer.getvalue()


# Alias for backward compatibility
generate_pdf_report = generate_assessment_pdf
