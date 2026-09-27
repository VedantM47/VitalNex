"""
AI Assistant and Voice Service Implementations.
Features healthcare guardrails, localized Hindi/Marathi/English responses,
emergency escalation, and STT/TTS abstractions.
"""

import uuid
from datetime import datetime, timezone
from apps.api.schemas import (
    AssistantMessageRequest,
    AssistantMessageResponse,
    ActionSuggestion,
    VoiceTranscribeRequest,
    VoiceTranscribeResponse,
    VoiceSynthesizeRequest,
    VoiceSynthesizeResponse,
)
from .base import IAgentService, IVoiceService


class AgentService(IAgentService):
    async def handle_message(self, request: AssistantMessageRequest) -> AssistantMessageResponse:
        msg = request.message.lower()
        lang = request.language

        # Emergency symptom detection guardrail
        emergency_keywords = ["chest pain", "pressure in chest", "shortness of breath", "छातीत दुखणे", "सीने में दर्द"]
        is_emergency = any(kw in msg for kw in emergency_keywords)

        if is_emergency:
            if lang == "mr":
                text = "सावधगिरी: छातीत दुखणे किंवा तीव्र अस्वस्थता ही तातडीची वैद्यकीय आणीबाणी असू शकते. कृपया त्वरित जवळच्या आपत्कालीन कक्षाशी संपर्क साधा किंवा 108/112 वर कॉल करा."
            elif lang == "hi":
                text = "चेतावनी: सीने में तेज दर्द या सांस लेने में तकलीफ एक आपातकालीन स्थिति हो सकती है। कृपया तुरंत नजदीकी अस्पताल के आपातकालीन विभाग में जाएं या 108/112 पर संपर्क करें।"
            else:
                text = "URGENT SAFETY NOTICE: Severe chest pressure or acute shortness of breath warrants immediate emergency medical evaluation. Please contact local emergency services (108 / 112) or proceed to the nearest emergency room immediately."

            return AssistantMessageResponse(
                id=f"ast-{uuid.uuid4().hex[:8]}",
                response=text,
                language=lang,
                escalation_recommended=True,
                suggestions=[
                    ActionSuggestion(id="act-emerg-1", label="Call Emergency (108)", action_type="emergency_call"),
                    ActionSuggestion(id="act-doc-urgent", label="Locate Nearest Emergency Care", action_type="navigate", payload={"path": "/care-connect"}),
                ],
                citations=[{"source": "ICMR Guidelines for Emergency Cardiac Care"}],
                timestamp=datetime.now(timezone.utc),
            )

        # Topic responses
        if "risk" in msg or "assessment" in msg or "जोखीम" in msg:
            if lang == "mr":
                text = "तुमचे VITALNEX जोखीम मूल्यांकन तुमचे वय, रक्तदाब, कोलेस्टेरॉल आणि जीवनशैली घटकांवर आधारित स्क्रीनिंग प्रदान करते. हा अंतिम वैद्यकीय निदान नसून केवळ प्रतिबंधात्मक मार्गदर्शन आहे."
            elif lang == "hi":
                text = "आपका VITALNEX जोखिम मूल्यांकन आपकी आयु, रक्तचाप, कोलेस्ट्रॉल और जीवनशैली के आधार पर एक प्रारंभिक स्क्रीनिंग देता है। यह कोई अंतिम निदान नहीं है।"
            else:
                text = "Your VITALNEX assessment evaluates your cardiometabolic screening indicators combining physiological vitals with lifestyle habits. It serves as preventive decision support, not an EMR diagnostic replacement."
            suggestions = [
                ActionSuggestion(id="sug-1", label="View Trust Passport", action_type="navigate", payload={"path": "/ai-trust"}),
                ActionSuggestion(id="sug-2", label="Consult Preventive Specialist", action_type="navigate", payload={"path": "/care-connect"}),
            ]
        elif "doctor" in msg or "specialist" in msg or "डॉक्टर" in msg:
            if lang == "mr":
                text = "मी तुम्हाला पुणे परिसरातील योग्य तज्ज्ञ शोधण्यात मदत करू शकतो. तुम्ही कार्डिओलॉजी, एंडोक्राइनॉलॉजी किंवा प्रतिबंधक औषधोपचार तज्ज्ञांशी संपर्क साधू शकता."
            elif lang == "hi":
                text = "मैं आपको पुणे क्षेत्र के विशेषज्ञ डॉक्टरों से जुड़ने में सहायता कर सकता हूं। आप हृदय रोग या प्रिवेंटिव मेडिसिन विशेषज्ञों की उपलब्धता देख सकते हैं।"
            else:
                text = "You can discover verified clinical specialists across Pune, PCMC, and peri-urban centers tailored to your screening profile."
            suggestions = [
                ActionSuggestion(id="sug-care", label="Open Care Connect", action_type="navigate", payload={"path": "/care-connect"}),
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
            citations=[{"source": "VITALNEX Clinical Reference Protocol v1.0"}],
            escalation_recommended=False,
            timestamp=datetime.now(timezone.utc),
        )


class VoiceService(IVoiceService):
    async def transcribe_audio(self, request: VoiceTranscribeRequest) -> VoiceTranscribeResponse:
        # Prompt 1 demo transcription adapter
        return VoiceTranscribeResponse(
            transcript="I would like to understand my latest clinical risk assessment and lifestyle recommendations.",
            detected_language=request.language,
            confidence=0.96,
            duration_seconds=3.2,
        )

    async def synthesize_speech(self, request: VoiceSynthesizeRequest) -> VoiceSynthesizeResponse:
        # Prompt 1 demo speech synthesis placeholder
        return VoiceSynthesizeResponse(
            audio_base64=None,
            audio_url="/audio/sample-feedback.mp3",
            duration_seconds=2.8,
            format="mp3",
        )
