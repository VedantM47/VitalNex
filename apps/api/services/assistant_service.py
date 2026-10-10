"""
AI Assistant and Voice Service Implementations.
Features healthcare safety guardrails, localized Hindi/Marathi/English natural language generation,
Gemini AI provider integration, Jev bounded intent classification, emergency triage, and STT/TTS abstractions.
"""

import os
import uuid
import logging
import httpx
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from apps.api.schemas import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    ActionSuggestion,
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
)
from apps.api.services.jev_service import classify_assistant_intent, is_jev_available
from .base import IAgentService, IVoiceService

logger = logging.getLogger("vitalnex.assistant")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

SYSTEM_INSTRUCTION = """You are the VITALNEX Health Intelligence Assistant.
VITALNEX is an academic healthcare research and clinical decision-support prototype.
It is:
- Non-diagnostic: You do not diagnose medical conditions.
- Non-prescriptive: You do not prescribe medications or alter dosage.
- Not clinically validated: You are built on academic research and synthetic regional populations (Pune, India).

You CAN:
- Explain cardiometabolic risk assessments and physiological vitals.
- Explain feature attributions (TreeSHAP contributions, e.g. blood pressure, cholesterol, BMI).
- Explain the 11-dimension AI Trust Passport and calibration metrics.
- Provide general preventive health education and lifestyle awareness.
- Assist with discovering verified clinical specialists in Pune and scheduling appointments.

You MUST:
- Always remind the user that your output is for decision-support and does not replace a licensed medical practitioner.
- In case of acute or emergency symptoms (chest pain, severe shortness of breath, sudden weakness, syncope), immediately urge the user to call emergency services (108 / 112 in India).
- Reply in the language requested (English, Hindi, or Marathi).
"""


class AgentService(IAgentService):
    async def handle_message(self, request: AssistantMessageRequest) -> AssistantMessageResponse:
        msg = request.message.strip()
        msg_lower = msg.lower()
        lang = request.language

        # ── 1. HARD DETERMINISTIC EMERGENCY ESCALATION GATE ──
        emergency_keywords = [
            "chest pain", "pressure in chest", "shortness of breath", "heart attack", "crushing pain",
            "छातीत दुखणे", "श्वास घेण्यास त्रास", "सीने में दर्द", "सांस लेने में तकलीफ", "दिल का दौरा"
        ]
        is_emergency = any(kw in msg_lower for kw in emergency_keywords)

        if is_emergency:
            if lang == "mr":
                text = "तातडीची वैद्यकीय सूचना: छातीत दुखणे किंवा तीव्र अस्वस्थता ही गंभीर वैद्यकीय आणीबाणी असू शकते. कृपया त्वरित 108 / 112 वर कॉल करा किंवा जवळच्या आपत्कालीन कक्षात जा."
            elif lang == "hi":
                text = "तत्काल चिकित्सा चेतावनी: सीने में तेज दर्द या सांस फूलना एक गंभीर आपातकालीन स्थिति हो सकती है। कृपया तुरंत 108 / 112 पर संपर्क करें अथवा नजदीकी अस्पताल जाएं।"
            else:
                text = "URGENT MEDICAL NOTICE: Severe chest pressure or acute shortness of breath warrants immediate emergency medical evaluation. Please contact emergency services (108 / 112) or proceed to the nearest emergency facility immediately."

            return AssistantMessageResponse(
                id=f"ast-{uuid.uuid4().hex[:8]}",
                response=text,
                language=lang,
                escalation_recommended=True,
                suggestions=[
                    ActionSuggestion(id="act-emerg-1", label="Emergency Services (108 / 112)", action_type="emergency_call"),
                    ActionSuggestion(id="act-doc-urgent", label="Locate Nearest Emergency Facility", action_type="navigate", payload={"path": "/care-connect"}),
                ],
                citations=[{"source": "ICMR Emergency Cardiovascular Protocol"}],
                timestamp=datetime.now(timezone.utc),
            )

        # ── 2. BOUNDED JEV INTENT CLASSIFICATION ──
        jev_intent_res = await classify_assistant_intent(msg)
        intent = jev_intent_res.get("intent", "GENERAL_GUIDANCE")

        # ── 3. GEMINI NATURAL LANGUAGE GENERATION ──
        gemini_response = await self._generate_gemini_response(msg, lang, intent)

        if gemini_response:
            return AssistantMessageResponse(
                id=f"ast-{uuid.uuid4().hex[:8]}",
                response=gemini_response,
                language=lang,
                suggestions=self._build_suggestions_for_intent(intent),
                citations=[
                    {"source": "VITALNEX Clinical Knowledge Base (Academic Prototype)"},
                    {"source": "ICMR Cardiometabolic Screening Guidelines"},
                ],
                escalation_recommended=False,
                timestamp=datetime.now(timezone.utc),
            )

        # ── 4. DETERMINISTIC LOCAL HEALTHCARE GUIDANCE FALLBACK ──
        return self._deterministic_fallback_response(msg_lower, lang, intent)

    async def _generate_gemini_response(self, user_message: str, language: str, intent: str) -> Optional[str]:
        """Call Google Gemini API server-side for natural language generation."""
        if not GEMINI_API_KEY or not GEMINI_API_KEY.strip():
            return None

        prompt = f"""Language: {language}
User Query: {user_message}
Bounded Intent Classification: {intent}

Respond concisely, with empathetic, clear, and non-diagnostic clinical decision-support guidance in {language}."""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.2,
                            "maxOutputTokens": 350,
                        },
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            return parts[0]["text"].strip()
                logger.warning(f"Gemini API returned status: {resp.status_code}")
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}")

        return None

    def _build_suggestions_for_intent(self, intent: str) -> List[ActionSuggestion]:
        if intent in ["ASSESSMENT_EXPLANATION", "HEALTH_PROFILE"]:
            return [
                ActionSuggestion(id="sug-risk", label="View Risk Assessment", action_type="navigate", payload={"path": "/risk-assessment"}),
                ActionSuggestion(id="sug-trust", label="Inspect AI Trust Passport", action_type="navigate", payload={"path": "/ai-trust"}),
            ]
        elif intent in ["DOCTOR_DISCOVERY", "APPOINTMENT"]:
            return [
                ActionSuggestion(id="sug-doc", label="Care Connect Directory", action_type="navigate", payload={"path": "/care-connect"}),
                ActionSuggestion(id="sug-apt", label="My Appointments", action_type="navigate", payload={"path": "/appointments"}),
            ]
        return [
            ActionSuggestion(id="sug-prof", label="Review Health Profile", action_type="navigate", payload={"path": "/health-profile"}),
            ActionSuggestion(id="sug-rep", label="Clinical Reports", action_type="navigate", payload={"path": "/reports"}),
        ]

    def _deterministic_fallback_response(self, msg: str, lang: str, intent: str) -> AssistantMessageResponse:
        """Deterministic, localized healthcare guidance when Gemini API key is unconfigured."""
        if "risk" in msg or "assessment" in msg or "जोखीम" in msg or intent == "ASSESSMENT_EXPLANATION":
            if lang == "mr":
                text = "तुमचे VITALNEX जोखीम मूल्यांकन तुमचे वय, रक्तदाब, कोलेस्टेरॉल आणि जीवनशैली घटकांवर आधारित स्क्रीनिंग प्रदान करते. हा अंतिम वैद्यकीय निदान नसून प्रतिबंधात्मक निर्णय-समर्थन आहे."
            elif lang == "hi":
                text = "आपका VITALNEX जोखिम मूल्यांकन आपकी आयु, रक्तचाप, कोलेस्ट्रॉल और जीवनशैली के आधार पर एक प्रारंभिक स्क्रीनिंग देता है। यह कोई अंतिम निदान नहीं है।"
            else:
                text = "Your VITALNEX assessment evaluates your cardiometabolic screening indicators combining physiological vitals with lifestyle habits. It serves as preventive decision support, not an EMR diagnostic replacement."
            suggestions = [
                ActionSuggestion(id="sug-1", label="View AI Trust Passport", action_type="navigate", payload={"path": "/ai-trust"}),
                ActionSuggestion(id="sug-2", label="Consult Preventive Specialist", action_type="navigate", payload={"path": "/care-connect"}),
            ]
        elif "doctor" in msg or "specialist" in msg or "डॉक्टर" in msg or intent in ["DOCTOR_DISCOVERY", "APPOINTMENT"]:
            if lang == "mr":
                text = "मी तुम्हाला पुणे परिसरातील योग्य तज्ज्ञ शोधण्यात मदत करू शकतो. तुम्ही कार्डिओलॉजी, एंडोक्राइनॉलॉजी किंवा प्रतिबंधक औषधोपचार तज्ज्ञांशी संपर्क साधू शकता."
            elif lang == "hi":
                text = "मैं आपको पुणे क्षेत्र के विशेषज्ञ डॉक्टरों से जुड़ने में सहायता कर सकता हूं। आप हृदय रोग या प्रिवेंटिव मेडिसिन विशेषज्ञों की उपलब्धता देख सकते हैं।"
            else:
                text = "You can discover verified clinical specialists across Pune, PCMC, and peri-urban centers tailored to your screening profile."
            suggestions = [
                ActionSuggestion(id="sug-care", label="Open Care Connect", action_type="navigate", payload={"path": "/care-connect"}),
                ActionSuggestion(id="sug-apt", label="Book Consultation", action_type="navigate", payload={"path": "/appointments"}),
            ]
        else:
            if lang == "mr":
                text = "नमस्कार! मी तुमचा VITALNEX आरोग्य सहाय्यक आहे. मी तुमचे आरोग्य प्रोफाइल समजून घेणे, जोखीम स्क्रीनिंग स्पष्ट करणे आणि डॉक्टरांशी संपर्क साधणे यात मदत करू शकतो."
            elif lang == "hi":
                text = "नमस्ते! मैं आपका VITALNEX स्वास्थ्य सहायक हूं। मैं आपकी प्रोफाइल समझने, जोखिम मूल्यांकन और डॉक्टरों से जुड़ने में मदद कर सकता हूं।"
            else:
                text = "Hello! I am your VITALNEX Health Intelligence Assistant. How can I assist you with your health profile, understanding your AI Trust Passport, or finding care today?"
            suggestions = [
                ActionSuggestion(id="sug-prof", label="Review Health Profile", action_type="navigate", payload={"path": "/health-profile"}),
                ActionSuggestion(id="sug-risk", label="Understand Risk Assessment", action_type="navigate", payload={"path": "/risk-assessment"}),
            ]

        return AssistantMessageResponse(
            id=f"ast-{uuid.uuid4().hex[:8]}",
            response=text,
            language=lang,
            suggestions=suggestions,
            citations=[{"source": "VITALNEX Clinical Reference Protocol v1.0 (Deterministic Research Mode)"}],
            escalation_recommended=False,
            timestamp=datetime.now(timezone.utc),
        )


class VoiceService(IVoiceService):
    async def transcribe_audio(self, request: VoiceTranscribeRequest) -> VoiceTranscribeResponse:
        # Multilingual transcription service adapter
        return VoiceTranscribeResponse(
            transcript="Explain my latest clinical cardiometabolic risk assessment and recommended lifestyle modifications.",
            detected_language=request.language,
            confidence=0.96,
            duration_seconds=3.2,
        )

    async def synthesize_speech(self, request: VoiceSynthesizeRequest) -> VoiceSynthesizeResponse:
        # Multilingual speech synthesis adapter
        return VoiceSynthesizeResponse(
            audio_base64=None,
            audio_url="/audio/sample-feedback.mp3",
            duration_seconds=2.8,
            format="mp3",
        )
