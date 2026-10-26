"""
AI Assistant Service.

Phase P0 state: deterministic emergency gate + fixed, pre-written replies only.
No external API is called and no text is generated (CLAUDE.md hard rule 6).
TODO(P8): replace keyword routing with the local multilingual intent classifier
and curated FAQ retrieval described in docs/SPEC.md §5.
"""

import uuid
from datetime import datetime, timezone
from typing import List

from apps.api.schemas import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    ActionSuggestion,
)
from .base import IAgentService


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
                citations=[],
                timestamp=datetime.now(timezone.utc),
            )

        # TODO(P8): intent classification (SPEC §5). Until then, keyword routing only.
        return self._deterministic_fallback_response(msg_lower, lang)

    def _deterministic_fallback_response(self, msg: str, lang: str) -> AssistantMessageResponse:
        """Fixed, pre-written replies chosen by simple keyword matching."""
        if "risk" in msg or "assessment" in msg or "जोखीम" in msg:
            if lang == "mr":
                text = "VITALNEX स्क्रीनिंग सध्या पुन्हा तयार केली जात आहे आणि अजून उपलब्ध नाही. उपलब्ध झाल्यावर ती तुमच्या उत्तरांची तुलना सर्वेक्षण डेटाशी करेल. हे निदान नाही."
            elif lang == "hi":
                text = "VITALNEX स्क्रीनिंग अभी दोबारा बनाई जा रही है और उपलब्ध नहीं है। उपलब्ध होने पर यह आपके उत्तरों की तुलना सर्वे डेटा से करेगी। यह निदान नहीं है।"
            else:
                text = "The VITALNEX screening is being rebuilt and is not available yet. When it is, it will compare your answers with survey data. It is not a diagnosis."
            suggestions = [
                ActionSuggestion(id="sug-1", label="View AI Trust Passport", action_type="navigate", payload={"path": "/ai-trust"}),
                ActionSuggestion(id="sug-2", label="Find a demo clinician", action_type="navigate", payload={"path": "/care-connect"}),
            ]
        elif "doctor" in msg or "specialist" in msg or "डॉक्टर" in msg:
            if lang == "mr":
                text = "तुम्ही डेमो डॉक्टरांची यादी पाहू शकता आणि डेमो अपॉइंटमेंट बुक करू शकता."
            elif lang == "hi":
                text = "आप डेमो डॉक्टर सूची देख सकते हैं और डेमो अपॉइंटमेंट बुक कर सकते हैं।"
            else:
                text = "You can browse the demo clinician directory and book a demo appointment."
            suggestions = [
                ActionSuggestion(id="sug-care", label="Open Care Connect", action_type="navigate", payload={"path": "/care-connect"}),
                ActionSuggestion(id="sug-apt", label="Book Consultation", action_type="navigate", payload={"path": "/appointments"}),
            ]
        else:
            if lang == "mr":
                text = "नमस्कार! मी VITALNEX सहाय्यक आहे. मी तुम्हाला ॲपमध्ये मार्ग शोधण्यात किंवा डेमो डॉक्टर शोधण्यात मदत करू शकतो."
            elif lang == "hi":
                text = "नमस्ते! मैं VITALNEX सहायक हूं। मैं ऐप में रास्ता ढूंढने या डेमो डॉक्टर खोजने में आपकी मदद कर सकता हूं।"
            else:
                text = "Hello! I am the VITALNEX assistant. I can help you find your way around the app or find a demo clinician."
            suggestions = [
                ActionSuggestion(id="sug-prof", label="Review Health Profile", action_type="navigate", payload={"path": "/health-profile"}),
                ActionSuggestion(id="sug-risk", label="Understand Risk Assessment", action_type="navigate", payload={"path": "/risk-assessment"}),
            ]

        return AssistantMessageResponse(
            id=f"ast-{uuid.uuid4().hex[:8]}",
            response=text,
            language=lang,
            suggestions=suggestions,
            citations=[],
            escalation_recommended=False,
            timestamp=datetime.now(timezone.utc),
        )
