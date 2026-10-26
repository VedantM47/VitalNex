# VITALNEX — Hindi / Marathi wording review list

Per CLAUDE.md and decision D-15, every Hindi (HI) and Marathi (MR) string with medical or safety
meaning is listed here as **pending** until a human reviewer confirms it. Human review is
deferred (accepted risk, D-15). The strings were written by Claude Code; they have **not** been checked
by a native-speaker clinician.

When a reviewer confirms a row, change its status to `confirmed (<name>, <date>)`. If the wording
changes, update the source file and this list together.

Status key: `pending` = not reviewed · `confirmed` = reviewed and accepted.

---

## Added or changed in Phase P0

### Web UI — `apps/web/src/messages/{en,hi,mr}.json`

| Key | EN | HI | MR | _review |
|---|---|---|---|---|
| `risk.subtitle` | Screening for diabetes, heart disease and stroke. This is not a diagnosis. | मधुमेह, हृदय रोग और स्ट्रोक के लिए स्क्रीनिंग। यह निदान नहीं है। | मधुमेह, हृदयरोग आणि स्ट्रोकसाठी स्क्रीनिंग. हे निदान नाही. | pending |
| `status.assessmentUnavailableBody` | VITALNEX is being rebuilt on real survey data. … If you have symptoms such as chest pain, call 108 / 112. | VITALNEX को वास्तविक सर्वे डेटा पर दोबारा बनाया जा रहा है। … अगर आपको सीने में दर्द जैसे लक्षण हैं, तो 108 / 112 पर कॉल करें। | VITALNEX खऱ्या सर्वेक्षण डेटावर पुन्हा तयार केले जात आहे. … छातीत दुखणे यासारखी लक्षणे असल्यास 108 / 112 वर कॉल करा. | pending |
| `status.profileRebuildBody` | The old profile asked for lab and test values … | पुरानी प्रोफाइल में ऐसे लैब और टेस्ट मान पूछे जाते थे … | जुन्या प्रोफाइलमध्ये बहुतेक लोकांना माहीत नसलेली लॅब आणि चाचणी मूल्ये … | pending |
| `status.noAssessmentBody` | Your screening results will appear here … | स्क्रीनिंग उपलब्ध होने और आपके पूरा करने के बाद … | स्क्रीनिंग उपलब्ध झाल्यावर आणि तुम्ही ती पूर्ण केल्यावर … | pending |
| `status.trustUnavailableBody` | The Trust Passport will be generated from the real model cards … | नए मॉडल प्रशिक्षित होने के बाद ट्रस्ट पासपोर्ट … | नवीन मॉडेल प्रशिक्षित झाल्यानंतर ट्रस्ट पासपोर्ट … | pending |
| `care.verifiedNotice` | Demo clinician profile (not a real doctor) | डेमो डॉक्टर प्रोफाइल (वास्तविक डॉक्टर नहीं) | डेमो डॉक्टर प्रोफाइल (खरे डॉक्टर नाहीत) | pending |

Non-medical status strings added in P0 (`status.notInMvp*`, `status.noData*`,
`status.*Title`) are UI text only and are not listed.

### Assistant fixed replies — `apps/api/services/assistant_service.py`

| Reply | EN | HI | MR | _review |
|---|---|---|---|---|
| Screening question | The VITALNEX screening is being rebuilt and is not available yet. When it is, it will compare your answers with survey data. It is not a diagnosis. | VITALNEX स्क्रीनिंग अभी दोबारा बनाई जा रही है और उपलब्ध नहीं है। उपलब्ध होने पर यह आपके उत्तरों की तुलना सर्वे डेटा से करेगी। यह निदान नहीं है। | VITALNEX स्क्रीनिंग सध्या पुन्हा तयार केली जात आहे आणि अजून उपलब्ध नाही. उपलब्ध झाल्यावर ती तुमच्या उत्तरांची तुलना सर्वेक्षण डेटाशी करेल. हे निदान नाही. | pending |
| Doctor question | You can browse the demo clinician directory and book a demo appointment. | आप डेमो डॉक्टर सूची देख सकते हैं और डेमो अपॉइंटमेंट बुक कर सकते हैं। | तुम्ही डेमो डॉक्टरांची यादी पाहू शकता आणि डेमो अपॉइंटमेंट बुक करू शकता. | pending |
| Greeting | Hello! I am the VITALNEX assistant. … | नमस्ते! मैं VITALNEX सहायक हूं। … | नमस्कार! मी VITALNEX सहाय्यक आहे. … | pending |

---

## Already in the repo before P0 (not written in P0, still unreviewed)

| Location | What | _review |
|---|---|---|
| `apps/api/services/assistant_service.py` — emergency reply (HI, MR) | Safety-critical emergency text (108 / 112). **Highest priority for review.** | pending |
| `apps/web/src/app/ai-assistant/page.tsx` — offline fallback (HI, MR) | Tells the user to call 108 when the assistant is unreachable. | pending |
| `apps/web/src/messages/hi.json`, `mr.json` — all other keys | Existing UI translations. Full inventory of medical strings happens in P9. | pending |
