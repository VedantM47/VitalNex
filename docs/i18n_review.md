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

---

## Added or changed in Phase P1

### Web UI — `apps/web/src/messages/{en,hi,mr}.json`

| Key | EN | HI | MR | _review |
|---|---|---|---|---|
| `auth.demoNotice` | MVP with dummy accounts only. Do not enter real personal health information. | यह केवल डमी खातों वाला MVP है। अपनी असली स्वास्थ्य जानकारी न डालें। | हे फक्त डमी खात्यांसह MVP आहे. तुमची खरी आरोग्य माहिती टाकू नका. | pending |
| `auth.signupNoHealthData` | No health information is collected when you create an account. | खाता बनाते समय कोई स्वास्थ्य जानकारी नहीं ली जाती। | खाते तयार करताना कोणतीही आरोग्य माहिती घेतली जात नाही. | pending |
| `reviewQueue.emptyBody` | A result appears here when a consenting patient's screening is High, not confident, flagged for data quality, or an emergency. | परिणाम यहाँ तब आता है जब सहमति देने वाले मरीज़ की स्क्रीनिंग उच्च हो, VITALNEX निश्चित न हो, डेटा-गुणवत्ता की समस्या हो, या आपातकालीन लक्षण हों। | संमती दिलेल्या रुग्णाची स्क्रीनिंग उच्च असल्यास, VITALNEX खात्रीशीर नसल्यास, डेटा-गुणवत्तेची समस्या असल्यास किंवा आपत्कालीन लक्षणे असल्यास निकाल येथे दिसतो. | pending |
| `reviewQueue.reason.high_band` | High screening level | उच्च स्क्रीनिंग स्तर | उच्च स्क्रीनिंग स्तर | pending |
| `reviewQueue.reason.abstained` | VITALNEX not confident | VITALNEX निश्चित नहीं है | VITALNEX खात्रीशीर नाही | pending |
| `reviewQueue.reason.data_quality` | Data-quality flag | डेटा-गुणवत्ता चेतावनी | डेटा-गुणवत्ता इशारा | pending |
| `reviewQueue.reason.emergency` | Emergency symptoms reported | आपातकालीन लक्षण बताए गए | आपत्कालीन लक्षणे नोंदवली | pending |
| `reviewQueue.status.overridden` | Overridden | बदला गया | बदलले | pending |
| `care.noSlots` | This demo doctor has no free slots in the next 14 days. | इस डेमो डॉक्टर के पास अगले 14 दिनों में कोई खाली स्लॉट नहीं है। | या डेमो डॉक्टरकडे पुढील 14 दिवसांत रिकामा स्लॉट नाही. | pending |

### Database seed — `supabase/seed/seed_demo.py` (`doctor_specializations`)

| Code | EN | HI | MR | _review |
|---|---|---|---|---|
| `cardiology` | Cardiology | हृदय रोग (कार्डियोलॉजी) | हृदयरोग (कार्डिओलॉजी) | pending |
| `endocrinology` | Endocrinology (diabetes) | एंडोक्रिनोलॉजी (मधुमेह) | एंडोक्रिनोलॉजी (मधुमेह) | pending |
| `neurology` | Neurology (stroke) | न्यूरोलॉजी (स्ट्रोक) | न्यूरोलॉजी (स्ट्रोक) | pending |

Other P1 strings (`auth.*` sign-in / sign-up / password texts, `reviewQueue` titles and
buttons, `care.bookedWith`, `care.bookingFailed`) are UI text only and are not listed.

---

## Added in Phase P4 (API content, `apps/api/content/*.{hi,mr}.json`, file-level `_review: pending`)

### Explanation templates — `explanations.{en,hi,mr}.json`

| Key | EN | HI | MR | _review |
|---|---|---|---|---|
| `templates.raises` | {feature} made your answers more similar to people who have been told they have this condition. | {feature} के कारण आपके उत्तर उन लोगों से अधिक मिलते-जुलते हैं जिन्हें यह स्थिति होने के बारे में बताया गया है। | {feature} यामुळे तुमची उत्तरे, ज्यांना ही स्थिती असल्याचे सांगितले गेले आहे अशा लोकांशी अधिक जुळतात. | pending |
| `templates.lowers` | {feature} made your answers less similar to people who have been told they have this condition. | {feature} के कारण आपके उत्तर उन लोगों से कम मिलते-जुलते हैं जिन्हें यह स्थिति होने के बारे में बताया गया है। | {feature} यामुळे तुमची उत्तरे, ज्यांना ही स्थिती असल्याचे सांगितले गेले आहे अशा लोकांशी कमी जुळतात. | pending |
| `features.Age` | your age group | आपका आयु वर्ग | तुमचा वयोगट | pending |
| `features.Sex` | your sex | आपका लिंग | तुमचे लिंग | pending |
| `features.BMI` | your body-mass index (BMI) | आपका बॉडी मास इंडेक्स (BMI) | तुमचा बॉडी मास इंडेक्स (BMI) | pending |
| `features.HighBP` | having been told you have high blood pressure | उच्च रक्तचाप होने के बारे में पहले बताया जाना | उच्च रक्तदाब असल्याचे पूर्वी सांगितले जाणे | pending |
| `features.HighChol` | having been told your cholesterol is high | कोलेस्ट्रॉल अधिक होने के बारे में पहले बताया जाना | कोलेस्टेरॉल जास्त असल्याचे पूर्वी सांगितले जाणे | pending |
| `features.Smoker` | your smoking history | आपका धूम्रपान का इतिहास | तुमचा धूम्रपानाचा इतिहास | pending |
| `features.PhysActivity` | your physical activity in the past 30 days | पिछले 30 दिनों में आपकी शारीरिक गतिविधि | मागील 30 दिवसांतील तुमची शारीरिक हालचाल | pending |
| `features.Fruits` | how often you eat fruit | आप कितनी बार फल खाते हैं | तुम्ही किती वेळा फळे खाता | pending |
| `features.Veggies` | how often you eat vegetables | आप कितनी बार सब्ज़ियाँ खाते हैं | तुम्ही किती वेळा भाज्या खाता | pending |
| `features.HvyAlcoholConsump` | your alcohol use | आपका शराब का सेवन | तुमचे मद्यपान | pending |
| `features.GenHlth` | how you rated your general health | आपने अपने सामान्य स्वास्थ्य को कैसा बताया | तुम्ही तुमच्या सर्वसाधारण आरोग्याला दिलेले मूल्यांकन | pending |
| `features.MentHlth` | days your mental health was not good | जिन दिनों आपका मानसिक स्वास्थ्य ठीक नहीं था | ज्या दिवशी तुमचे मानसिक आरोग्य चांगले नव्हते | pending |
| `features.PhysHlth` | days your physical health was not good | जिन दिनों आपका शारीरिक स्वास्थ्य ठीक नहीं था | ज्या दिवशी तुमचे शारीरिक आरोग्य चांगले नव्हते | pending |
| `features.DiffWalk` | difficulty walking or climbing stairs | चलने या सीढ़ियाँ चढ़ने में कठिनाई | चालण्यात किंवा जिना चढण्यात अडचण | pending |

### Guidance — `guidance.{en,hi,mr}.json` (sources in the files)

| Key | EN | HI | MR | _review |
|---|---|---|---|---|
| `items.bmi_overweight` | Your BMI is 23 or more. For South Asian adults, health risks start rising at a lower BMI than the global cut-off, so 23 or more counts as overweight. Small, steady changes in diet and activity help. | आपका BMI 23 या अधिक है। दक्षिण एशियाई वयस्कों में स्वास्थ्य जोखिम वैश्विक सीमा से कम BMI पर ही बढ़ने लगते हैं, इसलिए 23 या अधिक को अधिक वज़न माना जाता है। आहार और गतिविधि में छोटे, नियमित बदलाव मदद करते हैं। | तुमचा BMI 23 किंवा अधिक आहे. दक्षिण आशियाई प्रौढांमध्ये आरोग्य धोके जागतिक मर्यादेपेक्षा कमी BMI वरच वाढू लागतात, त्यामुळे 23 किंवा अधिक हे जास्त वजन मानले जाते. आहार आणि हालचालींमध्ये लहान, नियमित बदल उपयोगी ठरतात. | pending |
| `items.bmi_obese` | Your BMI is 27.5 or more, which is in the obese range for South Asian adults. A doctor can help you plan safe weight loss. | आपका BMI 27.5 या अधिक है, जो दक्षिण एशियाई वयस्कों के लिए मोटापे की श्रेणी में आता है। सुरक्षित रूप से वज़न घटाने की योजना बनाने में डॉक्टर आपकी मदद कर सकते हैं। | तुमचा BMI 27.5 किंवा अधिक आहे, जो दक्षिण आशियाई प्रौढांसाठी लठ्ठपणाच्या श्रेणीत येतो. सुरक्षितपणे वजन कमी करण्याची योजना आखण्यासाठी डॉक्टर मदत करू शकतात. | pending |
| `items.physical_activity` | WHO recommends adults do at least 150 minutes of moderate activity (such as brisk walking) each week. Any activity is better than none. | WHO सलाह देता है कि वयस्क हर सप्ताह कम से कम 150 मिनट मध्यम गतिविधि (जैसे तेज़ चलना) करें। कुछ भी गतिविधि न करने से थोड़ी गतिविधि बेहतर है। | WHO नुसार प्रौढांनी दर आठवड्याला किमान 150 मिनिटे मध्यम हालचाल (उदा. वेगाने चालणे) करावी. काहीच न करण्यापेक्षा थोडी हालचालही चांगली. | pending |
| `items.diet` | WHO recommends eating at least 400 g (five portions) of fruit and vegetables a day, and limiting salt, sugar and fried foods. | WHO दिन में कम से कम 400 ग्राम (पाँच हिस्से) फल और सब्ज़ियाँ खाने और नमक, चीनी तथा तले हुए भोजन को सीमित करने की सलाह देता है। | WHO दररोज किमान 400 ग्रॅम (पाच भाग) फळे आणि भाज्या खाण्याची आणि मीठ, साखर व तळलेले पदार्थ मर्यादित ठेवण्याची शिफारस करते. | pending |
| `items.tobacco` | If you still use tobacco in any form (cigarettes, bidis, gutka or khaini), stopping lowers the risk of heart disease and stroke. A doctor can help you quit. | यदि आप अब भी किसी भी रूप में तंबाकू (सिगरेट, बीड़ी, गुटखा या खैनी) लेते हैं, तो इसे छोड़ने से हृदय रोग और स्ट्रोक का जोखिम कम होता है। छोड़ने में डॉक्टर आपकी मदद कर सकते हैं। | तुम्ही अजूनही कोणत्याही स्वरूपात तंबाखू (सिगारेट, बिडी, गुटखा किंवा खैनी) घेत असाल, तर ती सोडल्याने हृदयरोग आणि स्ट्रोकचा धोका कमी होतो. ती सोडण्यासाठी डॉक्टर मदत करू शकतात. | pending |
| `items.alcohol` | Drinking less alcohol lowers health risks. WHO states there is no level of alcohol use that is safe for health. | कम शराब पीने से स्वास्थ्य जोखिम कम होते हैं। WHO के अनुसार शराब की कोई भी मात्रा स्वास्थ्य के लिए सुरक्षित नहीं है। | कमी मद्यपान केल्याने आरोग्य धोके कमी होतात. WHO नुसार मद्याचे कोणतेही प्रमाण आरोग्यासाठी सुरक्षित नाही. | pending |
| `items.blood_pressure` | You said you have been told you have high blood pressure. Keep it under control with your doctor and get it checked regularly. | आपने बताया कि आपको उच्च रक्तचाप होने के बारे में बताया गया है। अपने डॉक्टर के साथ मिलकर इसे नियंत्रण में रखें और नियमित रूप से जाँच कराएँ। | तुम्हाला उच्च रक्तदाब असल्याचे सांगितले गेले आहे असे तुम्ही सांगितले. तुमच्या डॉक्टरांसोबत तो नियंत्रणात ठेवा आणि नियमितपणे तपासणी करा. | pending |
| `items.cholesterol` | You said you have been told your cholesterol is high. Keep it under control with your doctor; diet and activity also help. | आपने बताया कि आपको कोलेस्ट्रॉल अधिक होने के बारे में बताया गया है। अपने डॉक्टर के साथ मिलकर इसे नियंत्रण में रखें; आहार और गतिविधि भी मदद करते हैं। | तुमचे कोलेस्टेरॉल जास्त असल्याचे सांगितले गेले आहे असे तुम्ही सांगितले. तुमच्या डॉक्टरांसोबत ते नियंत्रणात ठेवा; आहार आणि हालचालही मदत करतात. | pending |
| `items.mental_health` | You reported many days when your mental health was not good. Talking to someone helps. Tele-MANAS, the free national mental health helpline, is available on 14416. | आपने बताया कि कई दिनों तक आपका मानसिक स्वास्थ्य ठीक नहीं था। किसी से बात करने से मदद मिलती है। टेली-मानस, निःशुल्क राष्ट्रीय मानसिक स्वास्थ्य हेल्पलाइन, 14416 पर उपलब्ध है। | अनेक दिवस तुमचे मानसिक आरोग्य चांगले नव्हते असे तुम्ही सांगितले. कोणाशी तरी बोलल्याने मदत होते. टेली-मानस ही मोफत राष्ट्रीय मानसिक आरोग्य हेल्पलाइन 14416 वर उपलब्ध आहे. | pending |
| `items.regular_checkups` | Regular check-ups help find conditions like diabetes and high blood pressure early, often before symptoms appear. | नियमित जाँच से मधुमेह और उच्च रक्तचाप जैसी स्थितियों का जल्दी पता चलता है, अक्सर लक्षण दिखने से पहले ही। | नियमित तपासणीमुळे मधुमेह आणि उच्च रक्तदाब यांसारख्या स्थिती लवकर, अनेकदा लक्षणे दिसण्यापूर्वीच, लक्षात येतात. | pending |
