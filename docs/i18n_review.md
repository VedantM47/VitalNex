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

## Added in Phase P5 (web UI)

Web UI strings in `apps/web/src/messages/{en,hi,mr}.json` with medical meaning (questions, levels, next steps, emergency, recourse, what-if). All `_review: pending`.
Removed in P5 (no longer used): `status.assessmentUnavailableTitle/Body`, `status.noAssessmentTitle/Body`, `status.profileRebuildTitle/Body` — their rows above can be ignored.

| Key | EN | HI | MR | _review |
|---|---|---|---|---|
| `assess.notDiagnosis` | This is not a diagnosis. | यह निदान नहीं है। | हे निदान नाही. | pending |
| `assess.bmiRangeError` | This height and weight give a BMI of {bmi}, which is outside 12–70. Please check them. | इस लंबाई और वज़न से BMI {bmi} आता है, जो 12–70 के बाहर है। कृपया इन्हें जाँचें। | या उंची आणि वजनावरून BMI {bmi} येतो, जो 12–70 च्या बाहेर आहे. कृपया ते तपासा. | pending |
| `assess.q.age` | Your age (years) | आपकी आयु (वर्ष) | तुमचे वय (वर्षे) | pending |
| `assess.q.ageHelp` | You must be 18 or older to use the screening. | स्क्रीनिंग के लिए आपकी आयु 18 वर्ष या अधिक होनी चाहिए। | स्क्रीनिंगसाठी तुमचे वय 18 वर्षे किंवा अधिक असणे आवश्यक आहे. | pending |
| `assess.q.sex` | Sex assigned at birth | जन्म के समय निर्धारित लिंग | जन्माच्या वेळी नोंदवलेले लिंग | pending |
| `assess.q.sexHelp` | Used only for the risk calculation. | केवल जोखिम की गणना के लिए उपयोग होता है। | फक्त धोक्याच्या गणनेसाठी वापरले जाते. | pending |
| `assess.q.height` | Height (cm) | लंबाई (सेमी) | उंची (सेमी) | pending |
| `assess.q.weight` | Weight (kg) | वज़न (किलो) | वजन (किलो) | pending |
| `assess.q.highBp` | Has a doctor or nurse ever told you that you have high blood pressure? | क्या किसी डॉक्टर या नर्स ने कभी आपको बताया है कि आपको उच्च रक्तचाप है? | तुम्हाला उच्च रक्तदाब आहे असे डॉक्टर किंवा नर्सने कधी सांगितले आहे का? | pending |
| `assess.q.highChol` | Has a doctor or nurse ever told you that your cholesterol is high? | क्या किसी डॉक्टर या नर्स ने कभी आपको बताया है कि आपका कोलेस्ट्रॉल अधिक है? | तुमचे कोलेस्टेरॉल जास्त आहे असे डॉक्टर किंवा नर्सने कधी सांगितले आहे का? | pending |
| `assess.q.smoker` | Have you smoked at least 100 cigarettes (5 packs) in your life? | क्या आपने अपने जीवन में कम से कम 100 सिगरेट (5 पैकेट) पी हैं? | तुम्ही आयुष्यात किमान 100 सिगारेट (5 पाकिटे) ओढल्या आहेत का? | pending |
| `assess.q.smokerHelp` | Answer yes even if you have stopped smoking. | यदि आपने धूम्रपान छोड़ दिया है, तब भी हाँ चुनें। | तुम्ही धूम्रपान सोडले असले तरीही होय निवडा. | pending |
| `assess.q.physActivity` | In the past 30 days, did you do any physical activity or exercise other than your regular job? | पिछले 30 दिनों में, क्या आपने अपने नियमित काम के अलावा कोई शारीरिक गतिविधि या व्यायाम किया? | मागील 30 दिवसांत, तुम्ही तुमच्या नेहमीच्या कामाशिवाय कोणती शारीरिक हालचाल किंवा व्यायाम केला का? | pending |
| `assess.q.fruits` | Do you eat fruit at least once a day? | क्या आप दिन में कम से कम एक बार फल खाते हैं? | तुम्ही दिवसातून किमान एकदा फळे खाता का? | pending |
| `assess.q.veggies` | Do you eat vegetables at least once a day? | क्या आप दिन में कम से कम एक बार सब्ज़ियाँ खाते हैं? | तुम्ही दिवसातून किमान एकदा भाज्या खाता का? | pending |
| `assess.q.heavyAlcohol` | Do you drink more than 14 drinks a week (men) / 7 a week (women)? | क्या आप सप्ताह में 14 से अधिक ड्रिंक (पुरुष) / 7 से अधिक (महिलाएँ) पीते हैं? | तुम्ही आठवड्याला 14 पेक्षा जास्त ड्रिंक (पुरुष) / 7 पेक्षा जास्त (महिला) घेता का? | pending |
| `assess.q.genHealth` | In general, how is your health? | सामान्य रूप से, आपका स्वास्थ्य कैसा है? | सर्वसाधारणपणे, तुमचे आरोग्य कसे आहे? | pending |
| `assess.q.mentHealth` | In the past 30 days, how many days was your mental health not good? | पिछले 30 दिनों में, कितने दिन आपका मानसिक स्वास्थ्य ठीक नहीं था? | मागील 30 दिवसांत, किती दिवस तुमचे मानसिक आरोग्य चांगले नव्हते? | pending |
| `assess.q.physHealth` | In the past 30 days, how many days was your physical health not good? | पिछले 30 दिनों में, कितने दिन आपका शारीरिक स्वास्थ्य ठीक नहीं था? | मागील 30 दिवसांत, किती दिवस तुमचे शारीरिक आरोग्य चांगले नव्हते? | pending |
| `assess.q.daysHelp` | Enter a number from 0 to 30. | 0 से 30 तक की संख्या लिखें। | 0 ते 30 मधील संख्या लिहा. | pending |
| `assess.q.diffWalk` | Do you have serious difficulty walking or climbing stairs? | क्या आपको चलने या सीढ़ियाँ चढ़ने में गंभीर कठिनाई होती है? | तुम्हाला चालण्यात किंवा जिना चढण्यात गंभीर अडचण येते का? | pending |
| `assess.genHealthOption.1` | Excellent | उत्कृष्ट | उत्कृष्ट | pending |
| `assess.genHealthOption.2` | Very good | बहुत अच्छा | खूप चांगले | pending |
| `assess.genHealthOption.3` | Good | अच्छा | चांगले | pending |
| `assess.genHealthOption.4` | Fair | ठीक-ठाक | ठीक | pending |
| `assess.genHealthOption.5` | Poor | खराब | वाईट | pending |
| `assess.bmi.label` | Your BMI | आपका BMI | तुमचा BMI | pending |
| `assess.bmi.under` | below the healthy range | स्वस्थ सीमा से कम | निरोगी मर्यादेपेक्षा कमी | pending |
| `assess.bmi.normal` | in the healthy range for South Asian adults | दक्षिण एशियाई वयस्कों के लिए स्वस्थ सीमा में | दक्षिण आशियाई प्रौढांसाठी निरोगी मर्यादेत | pending |
| `assess.bmi.overweight` | overweight for South Asian adults (23 or more) | दक्षिण एशियाई वयस्कों के लिए अधिक वज़न (23 या अधिक) | दक्षिण आशियाई प्रौढांसाठी जास्त वजन (23 किंवा अधिक) | pending |
| `assess.bmi.obese` | obese range for South Asian adults (27.5 or more) | दक्षिण एशियाई वयस्कों के लिए मोटापे की श्रेणी (27.5 या अधिक) | दक्षिण आशियाई प्रौढांसाठी लठ्ठपणाची श्रेणी (27.5 किंवा अधिक) | pending |
| `assess.bmi.note` | BMI guidance uses Asian-Indian cut-offs: overweight from 23, obese from 27.5. BMI does not show everything about your health. | BMI मार्गदर्शन एशियाई-भारतीय सीमाओं का उपयोग करता है: 23 से अधिक वज़न, 27.5 से मोटापा। BMI आपके स्वास्थ्य के बारे में सब कुछ नहीं बताता। | BMI मार्गदर्शन आशियाई-भारतीय मर्यादा वापरते: 23 पासून जास्त वजन, 27.5 पासून लठ्ठपणा. BMI तुमच्या आरोग्याबद्दल सर्व काही सांगत नाही. | pending |
| `assess.under18.title` | The screening is only for adults (18 or older) | स्क्रीनिंग केवल वयस्कों (18 वर्ष या अधिक) के लिए है | स्क्रीनिंग फक्त प्रौढांसाठी (18 वर्षे किंवा अधिक) आहे | pending |
| `assess.under18.body` | VITALNEX was built from data about adults, so it cannot give a result for people under 18. If you are worried about your health, please talk to a doctor or a trusted adult. In an emergency, call 108 / 112. | VITALNEX वयस्कों के डेटा से बना है, इसलिए यह 18 वर्ष से कम आयु के लोगों के लिए परिणाम नहीं दे सकता। यदि आप अपने स्वास्थ्य को लेकर चिंतित हैं, तो किसी डॉक्टर या भरोसेमंद वयस्क से बात करें। आपात स्थिति में 108 / 112 पर कॉल करें। | VITALNEX प्रौढांच्या डेटावरून तयार केले आहे, त्यामुळे ते 18 वर्षांखालील व्यक्तींसाठी निकाल देऊ शकत नाही. तुम्हाला तुमच्या आरोग्याची काळजी वाटत असल्यास, डॉक्टर किंवा विश्वासू प्रौढ व्यक्तीशी बोला. आपत्कालीन परिस्थितीत 108 / 112 वर कॉल करा. | pending |
| `assess.under18.change` | I entered my age wrongly | मैंने अपनी आयु गलत लिखी | मी माझे वय चुकीचे लिहिले | pending |
| `assess.symptoms.intro` | Do you have any of these right now? Tick all that apply. | क्या अभी आपको इनमें से कोई लक्षण है? जो लागू हों, सभी चुनें। | आत्ता तुम्हाला यापैकी काही आहे का? लागू असलेले सर्व निवडा. | pending |
| `assess.symptoms.chest_pain` | Chest pain or pressure now | अभी सीने में दर्द या दबाव | आत्ता छातीत दुखणे किंवा दाब | pending |
| `assess.symptoms.stroke_signs` | Sudden face drooping, arm weakness or difficulty speaking | अचानक चेहरा लटकना, बाँह में कमज़ोरी या बोलने में कठिनाई | अचानक चेहरा वाकडा होणे, हातात अशक्तपणा किंवा बोलण्यात अडचण | pending |
| `assess.symptoms.severe_breathlessness` | Severe breathlessness | साँस लेने में गंभीर तकलीफ़ | श्वास घेण्यास तीव्र त्रास | pending |
| `assess.symptoms.fainting` | Fainting | बेहोशी | बेशुद्ध होणे | pending |
| `assess.symptoms.none` | None ticked | कोई नहीं चुना | काहीही निवडले नाही | pending |
| `assess.symptoms.tickedWarning` | These can be signs of an emergency. Call 108 / 112 now. Do not wait for a screening result. | ये आपात स्थिति के संकेत हो सकते हैं। अभी 108 / 112 पर कॉल करें। स्क्रीनिंग परिणाम की प्रतीक्षा न करें। | ही आपत्कालीन स्थितीची लक्षणे असू शकतात. आत्ताच 108 / 112 वर कॉल करा. स्क्रीनिंग निकालाची वाट पाहू नका. | pending |
| `assess.symptoms.freeText` | Anything else you want to tell us? | क्या आप हमें कुछ और बताना चाहते हैं? | तुम्हाला आम्हाला आणखी काही सांगायचे आहे का? | pending |
| `assess.symptoms.freeTextHelp` | Only checked for emergency warning signs. It is not saved. | केवल आपात चेतावनी संकेतों के लिए जाँचा जाता है। इसे सहेजा नहीं जाता। | फक्त आपत्कालीन धोक्याच्या लक्षणांसाठी तपासले जाते. ते जतन केले जात नाही. | pending |
| `assess.errors.unavailable` | The screening service is not available right now. Nothing was saved and no result was made. If you have symptoms such as chest pain, call 108 / 112. | स्क्रीनिंग सेवा अभी उपलब्ध नहीं है। कुछ भी सहेजा नहीं गया और कोई परिणाम नहीं बना। यदि आपको सीने में दर्द जैसे लक्षण हैं, तो 108 / 112 पर कॉल करें। | स्क्रीनिंग सेवा सध्या उपलब्ध नाही. काहीही जतन झाले नाही आणि कोणताही निकाल तयार झाला नाही. तुम्हाला छातीत दुखणे यांसारखी लक्षणे असल्यास 108 / 112 वर कॉल करा. | pending |
| `results.disclaimer` | VITALNEX is a screening and care-navigation prototype. It does not diagnose disease, does not recommend medicines, and does not replace a qualified healthcare professional. If you have chest pain, signs of stroke or severe breathlessness, call 108 / 112 now. | VITALNEX एक स्क्रीनिंग और देखभाल-मार्गदर्शन प्रोटोटाइप है। यह रोग का निदान नहीं करता, दवाएँ नहीं सुझाता, और योग्य स्वास्थ्य पेशेवर का स्थान नहीं लेता। यदि आपको सीने में दर्द, स्ट्रोक के संकेत या साँस लेने में गंभीर तकलीफ़ है, तो अभी 108 / 112 पर कॉल करें। | VITALNEX हा स्क्रीनिंग आणि उपचार-मार्गदर्शन प्रोटोटाइप आहे. तो रोगाचे निदान करत नाही, औषधे सुचवत नाही आणि पात्र आरोग्य व्यावसायिकाची जागा घेत नाही. तुम्हाला छातीत दुखणे, स्ट्रोकची लक्षणे किंवा श्वास घेण्यास तीव्र त्रास असल्यास आत्ताच 108 / 112 वर कॉल करा. | pending |
| `results.condition.diabetes` | Diabetes or prediabetes | मधुमेह या प्री-डायबिटीज़ | मधुमेह किंवा प्री-डायबिटीज | pending |
| `results.condition.heart` | Heart disease or heart attack | हृदय रोग या दिल का दौरा | हृदयरोग किंवा हृदयविकाराचा झटका | pending |
| `results.condition.stroke` | Stroke | स्ट्रोक | स्ट्रोक | pending |
| `results.conditionShort.diabetes` | diabetes or prediabetes | मधुमेह या प्री-डायबिटीज़ | मधुमेह किंवा प्री-डायबिटीज | pending |
| `results.conditionShort.heart` | heart disease or a heart attack | हृदय रोग या दिल का दौरा | हृदयरोग किंवा हृदयविकाराचा झटका | pending |
| `results.conditionShort.stroke` | a stroke | स्ट्रोक | स्ट्रोक | pending |
| `results.band.low` | Low | कम | कमी | pending |
| `results.band.moderate` | Moderate | मध्यम | मध्यम | pending |
| `results.band.high` | High | अधिक | जास्त | pending |
| `results.similar.low` | Your answers are less similar to people who have been told they have {condition}. | आपके उत्तर उन लोगों से कम मिलते-जुलते हैं जिन्हें {condition} होने के बारे में बताया गया है। | ज्यांना {condition} असल्याचे सांगितले गेले आहे अशा लोकांशी तुमची उत्तरे कमी जुळतात. | pending |
| `results.similar.moderate` | Your answers are somewhat similar to people who have been told they have {condition}. | आपके उत्तर उन लोगों से कुछ हद तक मिलते-जुलते हैं जिन्हें {condition} होने के बारे में बताया गया है। | ज्यांना {condition} असल्याचे सांगितले गेले आहे अशा लोकांशी तुमची उत्तरे काही प्रमाणात जुळतात. | pending |
| `results.similar.high` | Your answers are similar to people who have been told they have {condition}. | आपके उत्तर उन लोगों से मिलते-जुलते हैं जिन्हें {condition} होने के बारे में बताया गया है। | ज्यांना {condition} असल्याचे सांगितले गेले आहे अशा लोकांशी तुमची उत्तरे जुळतात. | pending |
| `results.notConfident` | Not confident — see a doctor | निश्चित नहीं — डॉक्टर से मिलें | खात्री नाही — डॉक्टरांना भेटा | pending |
| `results.notConfidentBody` | VITALNEX is not confident about your answers for this condition, so no level is shown. Please see a doctor. | इस स्थिति के लिए VITALNEX आपके उत्तरों को लेकर निश्चित नहीं है, इसलिए कोई स्तर नहीं दिखाया गया। कृपया डॉक्टर से मिलें। | या स्थितीसाठी VITALNEX ला तुमच्या उत्तरांबद्दल खात्री नाही, म्हणून कोणताही स्तर दाखवला नाही. कृपया डॉक्टरांना भेटा. | pending |
| `results.abstainReason.conformal_uncertain` | Your answers fall where the model could go either way. | आपके उत्तर ऐसी जगह हैं जहाँ मॉडल किसी भी ओर जा सकता है। | तुमची उत्तरे अशा ठिकाणी आहेत जिथे मॉडेल कोणत्याही बाजूला जाऊ शकते. | pending |
| `results.abstainReason.out_of_distribution` | Your answers are unlike most of the people the model learned from. | आपके उत्तर उन अधिकांश लोगों से अलग हैं जिनसे मॉडल ने सीखा। | मॉडेलने ज्या बहुतेक लोकांकडून शिकले त्यांच्यापेक्षा तुमची उत्तरे वेगळी आहेत. | pending |
| `results.nextStepLabel` | Next step | अगला कदम | पुढील पाऊल | pending |
| `results.nextStep.emergency.title` | Emergency: call 108 / 112 now | आपात स्थिति: अभी 108 / 112 पर कॉल करें | आपत्कालीन स्थिती: आत्ताच 108 / 112 वर कॉल करा | pending |
| `results.nextStep.emergency.body` | Emergency symptoms were reported. | आपात लक्षण बताए गए। | आपत्कालीन लक्षणे नोंदवली गेली. | pending |
| `results.nextStep.correct_inputs.title` | Please correct your answers | कृपया अपने उत्तर ठीक करें | कृपया तुमची उत्तरे दुरुस्त करा | pending |
| `results.nextStep.correct_inputs.body` | Some answers do not look possible. | कुछ उत्तर संभव नहीं लगते। | काही उत्तरे शक्य वाटत नाहीत. | pending |
| `results.nextStep.not_confident.title` | VITALNEX is not confident for you. Please see a doctor. | VITALNEX आपके लिए निश्चित नहीं है। कृपया डॉक्टर से मिलें। | VITALNEX ला तुमच्याबद्दल खात्री नाही. कृपया डॉक्टरांना भेटा. | pending |
| `results.nextStep.not_confident.body` | For at least one condition the screening could not give a confident level. | कम से कम एक स्थिति के लिए स्क्रीनिंग निश्चित स्तर नहीं दे सकी। | किमान एका स्थितीसाठी स्क्रीनिंग खात्रीशीर स्तर देऊ शकले नाही. | pending |
| `results.nextStep.see_doctor_soon.title` | See a doctor soon (within 2 weeks) | जल्द डॉक्टर से मिलें (2 सप्ताह के भीतर) | लवकर डॉक्टरांना भेटा (2 आठवड्यांच्या आत) | pending |
| `results.nextStep.see_doctor_soon.body` | At least one condition is at the High level. A doctor can check this properly. | कम से कम एक स्थिति अधिक स्तर पर है। डॉक्टर इसे ठीक से जाँच सकते हैं। | किमान एक स्थिती जास्त स्तरावर आहे. डॉक्टर हे नीट तपासू शकतात. | pending |
| `results.nextStep.discuss_next_checkup.title` | Discuss this at your next check-up | अगली जाँच में इस पर बात करें | पुढील तपासणीत याबद्दल बोला | pending |
| `results.nextStep.discuss_next_checkup.body` | At least one condition is at the Moderate level. | कम से कम एक स्थिति मध्यम स्तर पर है। | किमान एक स्थिती मध्यम स्तरावर आहे. | pending |
| `results.nextStep.routine_checkup.title` | Keep up regular check-ups | नियमित जाँच कराते रहें | नियमित तपासणी सुरू ठेवा | pending |
| `results.nextStep.routine_checkup.body` | All three conditions are at the Low level. Low does not mean no risk. | तीनों स्थितियाँ कम स्तर पर हैं। कम का अर्थ कोई जोखिम नहीं होना नहीं है। | तिन्ही स्थिती कमी स्तरावर आहेत. कमी म्हणजे कोणताही धोका नाही असे नाही. | pending |
| `results.queued` | A clinician will review this result. | एक चिकित्सक इस परिणाम की समीक्षा करेंगे। | एक डॉक्टर या निकालाचे पुनरावलोकन करतील. | pending |
| `results.notStored` | This result was not saved to your history, because saving is turned off in your consent settings. | यह परिणाम आपके इतिहास में सहेजा नहीं गया, क्योंकि आपकी सहमति सेटिंग में सहेजना बंद है। | हा निकाल तुमच्या इतिहासात जतन झाला नाही, कारण तुमच्या संमती सेटिंगमध्ये जतन करणे बंद आहे. | pending |
| `results.notes.age_under_40_less_reliable` | Results are less reliable for people under 40. In testing, VITALNEX missed more cases in younger people than in older people. | 40 वर्ष से कम आयु के लोगों के लिए परिणाम कम भरोसेमंद हैं। परीक्षण में, VITALNEX ने बड़ी उम्र के लोगों की तुलना में कम उम्र के लोगों में अधिक मामले छोड़े। | 40 वर्षांखालील लोकांसाठी निकाल कमी विश्वसनीय आहेत. चाचणीत, VITALNEX ने वयस्कर लोकांपेक्षा तरुण लोकांमध्ये जास्त प्रकरणे चुकवली. | pending |
| `results.notes.sex_not_stated_higher_band_used` | You chose not to say your sex, so VITALNEX checked both and shows the higher level for each condition. | आपने अपना लिंग नहीं बताया, इसलिए VITALNEX ने दोनों की जाँच की और हर स्थिति के लिए अधिक स्तर दिखाया। | तुम्ही तुमचे लिंग सांगितले नाही, म्हणून VITALNEX ने दोन्ही तपासले आणि प्रत्येक स्थितीसाठी जास्त स्तर दाखवला. | pending |
| `results.notes.no_clinician_review_without_consent` | This result would normally be sent for clinician review, but sharing with clinicians is turned off in your consent settings. | यह परिणाम सामान्यतः चिकित्सक समीक्षा के लिए भेजा जाता, लेकिन आपकी सहमति सेटिंग में चिकित्सकों के साथ साझा करना बंद है। | हा निकाल सामान्यतः डॉक्टरांच्या पुनरावलोकनासाठी पाठवला गेला असता, पण तुमच्या संमती सेटिंगमध्ये डॉक्टरांसोबत शेअर करणे बंद आहे. | pending |
| `results.warnings.excellent_health_but_many_unwell_days` | You rated your health as excellent but reported many days of not feeling well. Please check these answers. | आपने अपना स्वास्थ्य उत्कृष्ट बताया, लेकिन कई दिन ठीक महसूस न करने की बात भी कही। कृपया ये उत्तर जाँचें। | तुम्ही तुमचे आरोग्य उत्कृष्ट सांगितले, पण अनेक दिवस बरे वाटत नसल्याचेही सांगितले. कृपया ही उत्तरे तपासा. | pending |
| `results.warnings.excellent_health_but_difficulty_walking` | You rated your health as excellent but reported serious difficulty walking. Please check these answers. | आपने अपना स्वास्थ्य उत्कृष्ट बताया, लेकिन चलने में गंभीर कठिनाई भी बताई। कृपया ये उत्तर जाँचें। | तुम्ही तुमचे आरोग्य उत्कृष्ट सांगितले, पण चालण्यात गंभीर अडचण असल्याचेही सांगितले. कृपया ही उत्तरे तपासा. | pending |
| `results.why.title` | Why this result? | यह परिणाम क्यों? | हा निकाल का? | pending |
| `results.why.intro` | The answers that mattered most for each condition. | हर स्थिति के लिए सबसे अधिक प्रभाव डालने वाले उत्तर। | प्रत्येक स्थितीसाठी सर्वात जास्त परिणाम करणारी उत्तरे. | pending |
| `results.why.none` | No factors are shown when VITALNEX is not confident. | जब VITALNEX निश्चित नहीं होता, तब कारण नहीं दिखाए जाते। | VITALNEX ला खात्री नसताना घटक दाखवले जात नाहीत. | pending |
| `results.change.title` | What you can change | आप क्या बदल सकते हैं | तुम्ही काय बदलू शकता | pending |
| `results.change.intro` | The smallest realistic change in your answers that would lower a level. | आपके उत्तरों में सबसे छोटा व्यावहारिक बदलाव जो किसी स्तर को कम कर सकता है। | तुमच्या उत्तरांमधील सर्वात लहान व्यावहारिक बदल जो एखादा स्तर कमी करू शकतो. | pending |
| `results.change.unavailable` | Suggestions are not available right now. | सुझाव अभी उपलब्ध नहीं हैं। | सूचना सध्या उपलब्ध नाहीत. | pending |
| `results.change.suggestion` | If {changes}, the level for {condition} could move from {from} to {to}. | यदि {changes}, तो {condition} का स्तर {from} से {to} हो सकता है। | जर {changes}, तर {condition} साठीचा स्तर {from} वरून {to} होऊ शकतो. | pending |
| `results.change.already_low` | Already at the Low level. Keep up healthy habits and regular check-ups. | पहले से कम स्तर पर। स्वस्थ आदतें और नियमित जाँच जारी रखें। | आधीच कमी स्तरावर. निरोगी सवयी आणि नियमित तपासणी सुरू ठेवा. | pending |
| `results.change.abstained` | No suggestion, because VITALNEX is not confident for this condition. Please see a doctor. | कोई सुझाव नहीं, क्योंकि इस स्थिति के लिए VITALNEX निश्चित नहीं है। कृपया डॉक्टर से मिलें। | कोणतीही सूचना नाही, कारण या स्थितीसाठी VITALNEX ला खात्री नाही. कृपया डॉक्टरांना भेटा. | pending |
| `results.change.no_small_change_found` | No small change in the answers you can change lowered this level. A doctor can help you plan next steps. | बदले जा सकने वाले उत्तरों में किसी छोटे बदलाव से यह स्तर कम नहीं हुआ। अगले कदम तय करने में डॉक्टर मदद कर सकते हैं। | बदलता येणाऱ्या उत्तरांमधील कोणत्याही लहान बदलाने हा स्तर कमी झाला नाही. पुढील पावले ठरवण्यासाठी डॉक्टर मदत करू शकतात. | pending |
| `results.change.controlNote` | Blood pressure and cholesterol are not changed here. If you have been told you have them, keep them under control with your doctor. | रक्तचाप और कोलेस्ट्रॉल यहाँ नहीं बदले जाते। यदि आपको इनके बारे में बताया गया है, तो अपने डॉक्टर के साथ इन्हें नियंत्रण में रखें। | रक्तदाब आणि कोलेस्टेरॉल येथे बदलले जात नाहीत. तुम्हाला ते असल्याचे सांगितले असल्यास, तुमच्या डॉक्टरांसोबत ते नियंत्रणात ठेवा. | pending |
| `results.changeText.weight_kg` | your weight were about {v} kg | आपका वज़न लगभग {v} किलो हो | तुमचे वजन सुमारे {v} किलो असेल | pending |
| `results.changeText.phys_activity` | you did some physical activity | आप कुछ शारीरिक गतिविधि करें | तुम्ही थोडी शारीरिक हालचाल केली | pending |
| `results.changeText.fruits` | you ate fruit every day | आप रोज़ फल खाएँ | तुम्ही दररोज फळे खाल्ली | pending |
| `results.changeText.veggies` | you ate vegetables every day | आप रोज़ सब्ज़ियाँ खाएँ | तुम्ही दररोज भाज्या खाल्ल्या | pending |
| `results.changeText.heavy_alcohol` | you drank less alcohol | आप कम शराब पिएँ | तुम्ही कमी मद्यपान केले | pending |
| `results.changeText.gen_health` | your general health felt {v} | आपका सामान्य स्वास्थ्य {v} लगे | तुमचे सर्वसाधारण आरोग्य {v} वाटले | pending |
| `results.changeText.ment_health_days` | your mental health was not good on {v} days a month | महीने में {v} दिन आपका मानसिक स्वास्थ्य ठीक न हो | महिन्यातील {v} दिवस तुमचे मानसिक आरोग्य चांगले नसेल | pending |
| `results.changeText.phys_health_days` | your physical health was not good on {v} days a month | महीने में {v} दिन आपका शारीरिक स्वास्थ्य ठीक न हो | महिन्यातील {v} दिवस तुमचे शारीरिक आरोग्य चांगले नसेल | pending |
| `results.sure.title` | How sure is VITALNEX? | VITALNEX कितना निश्चित है? | VITALNEX ला किती खात्री आहे? | pending |
| `results.sure.intro` | When VITALNEX is not confident, it shows no level and asks you to see a doctor. | जब VITALNEX निश्चित नहीं होता, तो वह कोई स्तर नहीं दिखाता और डॉक्टर से मिलने को कहता है। | VITALNEX ला खात्री नसताना तो कोणताही स्तर दाखवत नाही आणि डॉक्टरांना भेटायला सांगतो. | pending |
| `results.sure.confident` | Confident | निश्चित | खात्री आहे | pending |
| `results.sure.notConfident` | Not confident | निश्चित नहीं | खात्री नाही | pending |
| `results.sure.missRate` | In testing, for every 100 people who had been told they have {condition}, about {n} were shown as Low. | परीक्षण में, जिन 100 लोगों को {condition} होने के बारे में बताया गया था, उनमें से लगभग {n} को कम स्तर पर दिखाया गया। | चाचणीत, ज्या 100 लोकांना {condition} असल्याचे सांगितले गेले होते, त्यांपैकी सुमारे {n} जणांना कमी स्तरावर दाखवले गेले. | pending |
| `results.sure.trustLink` | See the Trust Passport | ट्रस्ट पासपोर्ट देखें | ट्रस्ट पासपोर्ट पहा | pending |
| `results.shared.title` | Shared factors | साझा कारण | सामायिक घटक | pending |
| `results.shared.intro` | Answers that mattered for more than one condition. | ऐसे उत्तर जिनका एक से अधिक स्थिति पर प्रभाव पड़ा। | एकापेक्षा जास्त स्थितींवर परिणाम करणारी उत्तरे. | pending |
| `results.shared.none` | No answer mattered for more than one condition in this result. | इस परिणाम में किसी उत्तर का एक से अधिक स्थिति पर प्रभाव नहीं पड़ा। | या निकालात कोणत्याही उत्तराचा एकापेक्षा जास्त स्थितींवर परिणाम झाला नाही. | pending |
| `results.shared.raises` | more similar | अधिक मिलते-जुलते | जास्त जुळते | pending |
| `results.shared.lowers` | less similar | कम मिलते-जुलते | कमी जुळते | pending |
| `results.features.Age` | Age | आयु | वय | pending |
| `results.features.Sex` | Sex | लिंग | लिंग | pending |
| `results.features.BMI` | Body-mass index (BMI) | बॉडी मास इंडेक्स (BMI) | बॉडी मास इंडेक्स (BMI) | pending |
| `results.features.Height` | Height | लंबाई | उंची | pending |
| `results.features.Weight` | Weight | वज़न | वजन | pending |
| `results.features.HighBP` | Told you have high blood pressure | उच्च रक्तचाप होने के बारे में बताया गया | उच्च रक्तदाब असल्याचे सांगितले | pending |
| `results.features.HighChol` | Told your cholesterol is high | कोलेस्ट्रॉल अधिक होने के बारे में बताया गया | कोलेस्टेरॉल जास्त असल्याचे सांगितले | pending |
| `results.features.Smoker` | Smoking history | धूम्रपान का इतिहास | धूम्रपानाचा इतिहास | pending |
| `results.features.PhysActivity` | Physical activity | शारीरिक गतिविधि | शारीरिक हालचाल | pending |
| `results.features.Fruits` | Fruit | फल | फळे | pending |
| `results.features.Veggies` | Vegetables | सब्ज़ियाँ | भाज्या | pending |
| `results.features.HvyAlcoholConsump` | Alcohol use | शराब का सेवन | मद्यपान | pending |
| `results.features.GenHlth` | General health | सामान्य स्वास्थ्य | सर्वसाधारण आरोग्य | pending |
| `results.features.MentHlth` | Days mental health not good | मानसिक स्वास्थ्य ठीक न होने के दिन | मानसिक आरोग्य चांगले नसलेले दिवस | pending |
| `results.features.PhysHlth` | Days physical health not good | शारीरिक स्वास्थ्य ठीक न होने के दिन | शारीरिक आरोग्य चांगले नसलेले दिवस | pending |
| `results.features.DiffWalk` | Difficulty walking or climbing stairs | चलने या सीढ़ियाँ चढ़ने में कठिनाई | चालण्यात किंवा जिना चढण्यात अडचण | pending |
| `results.guidance.title` | General guidance | सामान्य मार्गदर्शन | सर्वसाधारण मार्गदर्शन | pending |
| `results.guidance.intro` | From public WHO and ICMR material. Not personal medical advice. | WHO और ICMR की सार्वजनिक सामग्री से। यह व्यक्तिगत चिकित्सा सलाह नहीं है। | WHO आणि ICMR च्या सार्वजनिक माहितीवरून. हा वैयक्तिक वैद्यकीय सल्ला नाही. | pending |
| `results.correct.title` | Please check your answers | कृपया अपने उत्तर जाँचें | कृपया तुमची उत्तरे तपासा | pending |
| `results.correct.body` | Some answers do not look possible, so no result was made. | कुछ उत्तर संभव नहीं लगते, इसलिए कोई परिणाम नहीं बना। | काही उत्तरे शक्य वाटत नाहीत, त्यामुळे कोणताही निकाल तयार झाला नाही. | pending |
| `results.correct.bmi` | Your height and weight give a BMI outside 12–70. | आपकी लंबाई और वज़न से BMI 12–70 के बाहर आता है। | तुमच्या उंची आणि वजनावरून BMI 12–70 च्या बाहेर येतो. | pending |
| `results.correct.back` | Go back to my answers | मेरे उत्तरों पर वापस जाएँ | माझ्या उत्तरांकडे परत जा | pending |
| `whatIf.intro` | Change the answers you can change and see how the levels would move. Nothing is saved. | जो उत्तर बदले जा सकते हैं उन्हें बदलें और देखें कि स्तर कैसे बदलते। कुछ भी सहेजा नहीं जाता। | बदलता येणारी उत्तरे बदला आणि स्तर कसे बदलतील ते पहा. काहीही जतन होत नाही. | pending |
| `whatIf.fixedNote` | Age, sex, blood pressure, cholesterol and difficulty walking are not changed here. | आयु, लिंग, रक्तचाप, कोलेस्ट्रॉल और चलने में कठिनाई यहाँ नहीं बदले जाते। | वय, लिंग, रक्तदाब, कोलेस्टेरॉल आणि चालण्यातील अडचण येथे बदलले जात नाहीत. | pending |
| `whatIf.smokerNote` | The question asks whether you have ever smoked 100 cigarettes, so the answer cannot change back. Quitting still lowers your real-world risk of heart disease and stroke. | प्रश्न पूछता है कि क्या आपने कभी 100 सिगरेट पी हैं, इसलिए यह उत्तर वापस नहीं बदल सकता। फिर भी धूम्रपान छोड़ने से हृदय रोग और स्ट्रोक का वास्तविक जोखिम कम होता है। | प्रश्न विचारतो की तुम्ही कधी 100 सिगारेट ओढल्या आहेत का, त्यामुळे हे उत्तर परत बदलू शकत नाही. तरीही धूम्रपान सोडल्याने हृदयरोग आणि स्ट्रोकचा प्रत्यक्ष धोका कमी होतो. | pending |
| `whatIf.estimateNote` | These are estimates from the model, not a promise. This is not a diagnosis. | ये मॉडल के अनुमान हैं, कोई वादा नहीं। यह निदान नहीं है। | हे मॉडेलचे अंदाज आहेत, वचन नाही. हे निदान नाही. | pending |
| `emergency.title` | Call for emergency help now | अभी आपात सहायता के लिए कॉल करें | आत्ताच आपत्कालीन मदतीसाठी कॉल करा | pending |
| `emergency.body` | The symptoms you reported can be signs of a heart attack or stroke. Call an ambulance now. Do not drive yourself. | आपके बताए लक्षण दिल के दौरे या स्ट्रोक के संकेत हो सकते हैं। अभी एम्बुलेंस बुलाएँ। स्वयं गाड़ी न चलाएँ। | तुम्ही सांगितलेली लक्षणे हृदयविकाराचा झटका किंवा स्ट्रोकची लक्षणे असू शकतात. आत्ताच रुग्णवाहिका बोलवा. स्वतः गाडी चालवू नका. | pending |
| `emergency.call108` | Call 108 | 108 पर कॉल करें | 108 वर कॉल करा | pending |
| `emergency.call112` | Call 112 | 112 पर कॉल करें | 112 वर कॉल करा | pending |
| `emergency.noScores` | No screening levels are shown, because these symptoms need urgent care. | कोई स्क्रीनिंग स्तर नहीं दिखाया गया, क्योंकि इन लक्षणों में तुरंत देखभाल चाहिए। | कोणताही स्क्रीनिंग स्तर दाखवला नाही, कारण या लक्षणांसाठी तातडीची काळजी आवश्यक आहे. | pending |
| `emergency.back` | Back to my answers | मेरे उत्तरों पर वापस जाएँ | माझ्या उत्तरांकडे परत जा | pending |
| `historyPage.subtitle` | Your saved screenings. Levels only — this is not a diagnosis. | आपकी सहेजी गई स्क्रीनिंग। केवल स्तर — यह निदान नहीं है। | तुमची जतन केलेली स्क्रीनिंग. फक्त स्तर — हे निदान नाही. | pending |
| `historyPage.trendIntro` | Each line is one condition. A gap means VITALNEX was not confident that time. | हर रेखा एक स्थिति है। खाली जगह का अर्थ है कि उस बार VITALNEX निश्चित नहीं था। | प्रत्येक रेषा एक स्थिती आहे. रिकामी जागा म्हणजे त्या वेळी VITALNEX ला खात्री नव्हती. | pending |
| `historyPage.reviewed` | Reviewed by a clinician | चिकित्सक द्वारा समीक्षा की गई | डॉक्टरांनी पुनरावलोकन केले | pending |
| `historyPage.reviewPending` | Waiting for clinician review | चिकित्सक समीक्षा की प्रतीक्षा | डॉक्टरांच्या पुनरावलोकनाची प्रतीक्षा | pending |
| `historyPage.emergencyRow` | Emergency symptoms reported — no levels shown | आपात लक्षण बताए गए — कोई स्तर नहीं दिखाया गया | आपत्कालीन लक्षणे नोंदवली — कोणताही स्तर दाखवला नाही | pending |
| `historyPage.clinicianLevel` | Clinician's level | चिकित्सक द्वारा तय स्तर | डॉक्टरांनी ठरवलेला स्तर | pending |
