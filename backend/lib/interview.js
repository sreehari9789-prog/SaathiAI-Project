// SAATHI — Multi-Turn Conversational Voice Interview & Slot-Filling Engine
// Aligned with PM-AJAY: Replaces form-filling with empathetic, multi-turn voice dialogue

const { assessSkillGapsAndRecommend } = require('./nsqf');

// In-memory conversation state cache (keyed by sessionId)
const SESSIONS = new Map();

// Required interview profile slots
const REQUIRED_SLOTS = [
  'name',
  'education',
  'familyOccupation',
  'currentLivelihood',
  'skills',
  'mobilityConstraints',
  'employmentPreference'
];

// Conversational prompts with empathetic phrasing
const SLOT_PROMPTS = {
  name: {
    en: "Namaste! Welcome to Saathi PM-AJAY Livelihood Assistant. May I know your name and where you are from?",
    hi: "नमस्ते! साथी पीएम-अजय आजीविका सहायक में आपका स्वागत है। क्या मैं आपका शुभ नाम और आप कहाँ से हैं, यह जान सकता हूँ?",
    ta: "வணக்கம்! சாத்தி பிஎம்-அஜய் வாழ்வாதார உதவியாளருக்கு வரவேற்கிறோம். உங்கள் பெயரையும் ஊரையும் தெரிந்து கொள்ளலாமா?",
    te: "నమస్కారం! సాథి పిఎమ్-అజయ్ జీవనోపాధి సహాయకుడికి స్వాగతం. మీ పేరు మరియు మీరు ఎక్కడి నుండి వచ్చారో తెలుసుకోవచ్చా?",
    kn: "ನಮಸ್ಕಾರ! ಸಾಥಿ ಪಿಎಂ-ಅಜಯ್ ಜೀವನೋಪಾಯ ಸಹಾಯಕ್ಕೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಹೆಸರು ಮತ್ತು ಊರು ತಿಳಿಸಬಹುದೇ?",
    bn: "নমস্কার! সাথী পিএম-অজয়ে আপনাকে স্বাগতম। আপনার নাম এবং গ্রামের নাম জানতে পারি কি?",
    mr: "नमस्कार! साथी पीएम-अजय उपजीविका सहाय्यकामध्ये आपले स्वागत आहे. आपले नाव आणि गाव सांगू शकाल का?",
    gu: "નમસ્તે! સાથી પીએમ-અજય સહાયકમાં તમારું સ્વાગત છે. તમારું નામ અને ગામ જણાવશો?",
    pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਸਾਥੀ ਪੀਐਮ-ਅਜੈ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਕੀ ਤੁਸੀਂ ਆਪਣਾ ਨਾਮ ਅਤੇ ਪਿੰਡ ਦੱਸ ਸਕਦੇ ਹੋ?",
    ml: "നമസ്കാരം! സാഥി പിഎം-അജയ് സഹായിയിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ പേരും സ്ഥലവും പറയാമോ?",
    ur: "سلام! ساتھی پی ایم-اجے میں خوش آمدید۔ کیا میں آپ کا نام اور علاقہ جان سکتا ہوں؟"
  },
  education: {
    en: "Thank you! Could you please share your education level? (For example: 5th class, 8th pass, 10th pass, or learning on the job)",
    hi: "बहुत अच्छा! क्या आप अपनी पढ़ाई के बारे में बता सकते हैं? (जैसे 5वीं पास, 8वीं, 10वीं पास या काम करते हुए सीखना)",
    ta: "நன்றி! உங்கள் கல்வித் தகுதியை பற்றி கூற முடியுமா? (உதாரணமாக: 5-ஆம் வகுப்பு, 8-ஆம் வகுப்பு, 10-ஆம் வகுப்பு அல்லது நேரடியாக கற்றுக்கொண்டது)",
    te: "ధన్యవాదాలు! మీ చదువు వివరాలు చెప్పగలరా? (ఉదాహరణకు: 5వ తరగతి, 8వ తరగతి, 10వ తరగతి లేదా పని చేస్తూ నేర్చుకున్నది)",
    kn: "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ವಿದ್ಯಾಭ್ಯಾಸದ ಬಗ್ಗೆ ತಿಳಿಸಬಹುದೇ? (ಉದಾಹರಣೆಗೆ: 5ನೇ ತರಗತಿ, 8ನೇ, 10ನೇ ತರಗತಿ)",
    bn: "ধন্যবাদ! আপনার শিক্ষাগত যোগ্যতা সম্পর্কে বলতে পারেন কি? (যেমন পঞ্চম, অষ্টম বা দশম শ্রেণী পাশ)",
    mr: "धन्यवाद! आपण आपले शिक्षण कितवे झाले आहे ते सांगू शकाल का? (उदा. ५वी, ८वी, १०वी किंवा अनुभवातून शिकणे)",
    gu: "આભાર! તમારો અભ્યાસ કેટલો છે તે જણાવશો? (જેમ કે 5મું પાસ, 8મું પાસ, 10મું પાસ)",
    pa: "ਧੰਨਵਾਦ! ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਪੜ੍ਹਾਈ ਬਾਰੇ ਦੱਸ ਸਕਦੇ ਹੋ? (ਜਿਵੇਂ 5ਵੀਂ, 8ਵੀਂ ਜਾਂ 10ਵੀਂ ਪਾਸ)",
    ml: "നന്ദി! നിങ്ങളുടെ വിദ്യാഭ്യാസ യോഗ്യത പറയാമോ? (ഉദാഹരണത്തിന്: 5-ാം ക്ലാസ്, 8-ാം ക്ലാസ്, 10-ാം ക്ലാസ്)",
    ur: "شکریہ! کیا آپ اپنی تعلیم کے بارے میں بتا سکتے ہیں؟ (جیسے پانچویں، آٹھویں، دسویں پاس)"
  },
  familyOccupation: {
    en: "Understood. What kind of work do members of your family traditionally or currently do? (Like farming, weaving, electrical, repair, or handicrafts)",
    hi: "समझ गया। आपके परिवार में परंपरागत रूप से या अभी कौन-सा काम होता है? (जैसे खेती, बुनाई, सिलाई, बिजली काम या कारीगरी)",
    ta: "புரிந்தது. உங்கள் குடும்பத்தினர் பாரம்பரியமாக அல்லது தற்போது என்ன வேலை செய்கிறார்கள்? (விவசாயம், நெசவு, தையல், எலக்ட்ரிக்கல் போன்றவை)",
    te: "అర్థమైంది. మీ కుటుంబంలో సాంప్రదాయకంగా లేదా ప్రస్తుతం ఏ పని చేస్తారు? (వ్యవసాయం, నేత పని, కుట్టు పని, ఎలక్ట్రికల్ వంటివి)",
    kn: "ತಿಳಿಯಿತು. ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಸಾಂಪ್ರದಾಯಿಕವಾಗಿ ಅಥವಾ ಈಗ ಯಾವ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ? (ಕೃಷಿ, ನೇಯ್ಗೆ, ಹೊಲಿಗೆ ಇತ್ಯಾದಿ)",
    bn: "বুঝেছি। আপনার পরিবারে ঐতিহ্যগতভাবে বা বর্তমানে কি ধরণের কাজ করা হয়? (যেমন চাষাবাদ, তাঁতশিল্প, সেলাই, ইলেকট্রিক্যাল)",
    mr: "समजले. आपल्या कुटुंबात पारंपरिक किंवा सध्या कोणती कामे चालतात? (उदा. शेती, विणकाम, शिवणकाम किंवा कारागिरी)",
    gu: "સમજાયું. તમારા પરિવારમાં પરંપરાગત કે અત્યારે શું કામ થાય છે? (જેમ કે ખેતી, વણાટકામ, સિલાઈ, ઇલેક્ટ્રિકલ)",
    pa: "ਸਮਝ ਗਿਆ। ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਵਿੱਚ ਰਵਾਇਤੀ ਤੌਰ 'ਤੇ ਜਾਂ ਹੁਣ ਕਿਹੜਾ ਕੰਮ ਹੁੰਦਾ ਹੈ?",
    ml: "മനസ്സിലായി. നിങ്ങളുടെ കുടുംബത്തിൽ പരമ്പരാഗതമായി അല്ലെങ്കിൽ ഇപ്പോൾ എന്താണ് ജോലി ചെയ്യുന്നത്?",
    ur: "سمجھ گیا۔ آپ کے خاندان میں روایتی طور پر یا اب کیا کام ہوتا ہے؟"
  },
  currentLivelihood: {
    en: "What is your current source of daily or monthly earnings, and are you getting regular work?",
    hi: "अभी आपकी रोज़मर्रा या महीने की कमाई किस काम से होती है, और क्या आपको नियमित काम मिल पा रहा है?",
    ta: "தற்போது நீங்கள் தினமும் அல்லது மாதந்தோறும் என்ன வேலை செய்து வருமானம் ஈட்டுகிறீர்கள்? தொடர் வேலை கிடைக்கிறதா?",
    te: "ప్రస్తుతం మీరు రోజువారీ లేదా నెలవారీ సంపాదన కోసం ఏమి చేస్తున్నారు? క్రమం తప్పకుండా పని దొరుకుతోందా?",
    kn: "ಪ್ರಸ್ತುತ ನಿಮ್ಮ ದಿನನಿತ್ಯದ ಅಥವಾ ಮಾಸಿಕ ಆದಾಯದ ಮೂಲ ಯಾವುದು? ನಿಯಮಿತ ಕೆಲಸ ಸಿಗುತ್ತಿದೆಯೇ?",
    bn: "বর্তমানে আপনার দৈনিক বা মাসিক রোজগারের উৎস কি, এবং নিয়মিত কাজ পাচ্ছেন কি?",
    mr: "सध्या आपल्या दैनंदिन किंवा मासिक उत्पन्नाचे साधन काय आहे, आणि नियमित काम मिळते का?",
    gu: "હાલમાં તમારી દૈનિક કે માસિક આવકનું સાધન શું છે? નિયમિત કામ મળે છે?",
    pa: "ਅੱਜ-ਕੱਲ੍ਹ ਤੁਹਾਡੀ ਕਮਾਈ ਦਾ ਮੁੱਖ ਜ਼ਰੀਆ ਕੀ ਹੈ ਅਤੇ ਕੀ ਰੋਜ਼ਾਨਾ ਕੰਮ ਮਿਲਦਾ ਹੈ?",
    ml: "നിലവിൽ നിങ്ങളുടെ വരുമാന മാർഗ്ഗം എന്താണ്? സ്ഥിരമായി ജോലി ലഭിക്കുന്നുണ്ടോ?",
    ur: "فی الحال آپ کی روزانہ یا ماہانہ آمدنی کا کیا ذریعہ ہے؟ کیا باقاعدہ کام ملتا ہے؟"
  },
  skills: {
    en: "Wonderful. What specific skills or work interests do you have? Even if you learned on your own, tell me what you enjoy doing!",
    hi: "बहुत बढ़िया। आपके पास कौन सा हुनर या रुचि है? भले ही आपने खुद से सीखा हो, बताइए आपको क्या काम करना पसंद है!",
    ta: "அருமை. உங்களிடம் உள்ள கைத்திறன் அல்லது விருப்பமான வேலை என்ன? நீங்களே சொந்தமாகக் கற்றுக்கொண்டிருந்தாலும் சொல்லுங்கள்!",
    te: "చాలా బాగుంది. మీకు ఏ రంగంలో నైపుణ్యం లేదా ఆసక్తి ఉంది? సొంతంగా నేర్చుకున్నదైనా సరే నిరభ్యంతరంగా చెప్పండి!",
    kn: "ತುಂಬಾ ಒಳ್ಳೆಯದು. ನಿಮ್ಮಲ್ಲಿ ಯಾವ ಕೌಶಲ್ಯ ಅಥವಾ ಆಸಕ್ತಿ ಇದೆ? ಸ್ವಂತವಾಗಿ ಕಲಿತದ್ದಾದರೂ ಹೇಳಿ!",
    bn: "চমৎকার। আপনার কি বিশেষ দক্ষতা বা আগ্রহ রয়েছে? নিজে নিজে শিখে থাকলেও নিঃসংকোচে বলুন!",
    mr: "छान! आपल्याकडे कोणती कला किंवा कौशल्य आहे? जरी आपण स्वतः शिकला असाल तरी सांगा!",
    gu: "ખૂબ સરસ. તમારી પાસે કઈ કુશળતા અથવા રુચિ છે? તમે જાતે શીખ્યા હોવ તો પણ જણાવો!",
    pa: "ਬਹੁਤ ਵਧੀਆ। ਤੁਹਾਡੇ ਕੋਲ ਕਿਹੜਾ ਹੁਨਰ ਹੈ ਜਾਂ ਤੁਹਾਨੂੰ ਕਿਹੜਾ ਕੰਮ ਕਰਨਾ ਪਸੰਦ ਹੈ?",
    ml: "വളരെ നല്ലത്. നിങ്ങൾക്ക് എന്ത് പ്രത്യേക കഴിവുകൾ അല്ലെങ്കിൽ താൽപ്പര്യങ്ങൾ ഉണ്ട്? സ്വയം പഠിച്ചതാണെങ്കിലും പറയൂ!",
    ur: "بہت خوب۔ آپ کے پاس کون سا ہنر یا دلچسپی ہے؟ خواہ آپ نے خود سیکھا ہو، ضرور بتائیں!"
  },
  mobilityConstraints: {
    en: "Good to know. For training and livelihood, do you prefer opportunities within your home village/district, or are you open to nearby towns?",
    hi: "यह जानकर अच्छा लगा। ट्रेनिंग और रोज़गार के लिए, क्या आप अपने गाँव या ज़िले में ही काम चाहते हैं, या पास के शहर जाने को तैयार हैं?",
    ta: "மகிழ்ச்சி. பயிற்சி மற்றும் வேலைக்காக உங்கள் சொந்த ஊர்/மாவட்டத்திலேயே இருக்க விரும்புகிறீர்களா, அல்லது அருகிலுள்ள நகரங்களுக்கு செல்ல தயாரா?",
    te: "సంతోషం. శిక్షణ మరియు ఉపాధి కోసం మీరు మీ సొంత గ్రామం/జిల్లాలోనే ఉండాలనుకుంటున్నారా, లేదా సమీప నగరాలకు వెళ్ళగలరా?",
    kn: "ಸಂತೋಷ. ತರಬೇತಿ ಮತ್ತು ಕೆಲಸಕ್ಕೆ ನಿಮ್ಮ ಊರಿನಲ್ಲೇ ಇರಲು ಬಯಸುತ್ತೀರಾ ಅಥವಾ ಹತ್ತಿರದ ನಗರಗಳಿಗೆ ಹೋಗಲು ಸಿದ್ಧರಿದ್ದೀರಾ?",
    bn: "জেনে ভালো লাগলো। প্রশিক্ষণ ও কাজের জন্য আপনি কি নিজের গ্রাম/জেলাতেই থাকতে চান, নাকি কাছের শহরে যেতে পারেন?",
    mr: "छान. ट्रेनिंग आणि रोजगारासाठी आपल्याला आपल्या गावात/जिल्ह्यात काम हवे आहे की जवळच्या शहरात जायची तयारी आहे?",
    gu: "સારું. તાલીમ અને આજીવિકા માટે તમે તમારા ગામ/જિલ્લામાં જ કામ ઈચ્છો છો કે નજીકના શહેરમાં જવા તૈયાર છો?",
    pa: "ਵਧੀਆ। ਟ੍ਰੇਨਿੰਗ ਤੇ ਨੌਕਰੀ ਲਈ ਕੀ ਤੁਸੀਂ ਆਪਣੇ ਜ਼ਿਲ੍ਹੇ ਵਿੱਚ ਹੀ ਰਹਿਣਾ ਚਾਹੁੰਦੇ ਹੋ ਜਾਂ ਨੇੜਲੇ ਸ਼ਹਿਰ ਜਾ ਸਕਦੇ ਹੋ?",
    ml: "പരിശീലനത്തിനും ജോലിക്കുമായി സ്വന്തം സ്ഥലത്ത് തന്നെ നിൽക്കാനാണോ, അതോ അടുത്തുള്ള നഗരങ്ങളിലേക്ക് പോകാൻ തയ്യാറാണോ?",
    ur: "تربیت اور روزگار کے لیے کیا آپ اپنے گاؤں/ضلع میں ہی رہنا چاہتے ہیں یا قریبی شہر جا سکتے ہیں؟"
  },
  employmentPreference: {
    en: "Finally, would you prefer a secure monthly wage job with an employer, or do you aspire to set up your own micro-enterprise with PM-AJAY financial support?",
    hi: "अंतिम सवाल: क्या आप किसी कंपनी या कारखाने में मासिक वेतन वाली पक्की नौकरी चाहते हैं, या पीएम-अजय सहायता से अपना खुद का स्वरोज़गार शुरू करना चाहते हैं?",
    ta: "கடைசி கேள்வி: ஒரு நிறுவனத்தில் மாத சம்பள வேலையை விரும்புகிறீர்களா, அல்லது அரசு ஆதரவுடன் உங்கள் சொந்த சுயதொழில் தொடங்க விரும்புகிறீர்களா?",
    te: "చివరి ప్రశ్న: మీరు ఒక సంస్థలో నెలవారీ జీతం పొందే ఉద్యోగం చేయాలనుకుంటున్నారా, లేదా ప్రభుత్వ సహాయంతో సొంత వ్యాపారం ప్రారంభించాలనుకుంటున్నారా?",
    kn: "ಕೊನೆಯ ಪ್ರಶ್ನೆ: ನೀವು ಮಾಸಿಕ ಸಂಬಳದ ಉದ್ಯೋಗ ಬಯಸುತ್ತೀರಾ ಅಥವಾ ಸರಕಾರದ ಸಹಾಯದಿಂದ ಸ್ವಂತ ಉದ್ಯಮ ಪ್ರಾರಂಭಿಸಲು ಇಷ್ಟಪಡುತ್ತೀರಾ?",
    bn: "শেষ প্রশ্ন: আপনি কি মাসিক বেতনের নিশ্চিত চাকরি চান, নাকি সরকারি সহায়তায় নিজের ক্ষুদ্র ব্যবসা শুরু করতে চান?",
    mr: "शेवटचा प्रश्न: आपल्याला कंपनीत खात्रीशीर मासिक पगाराची नोकरी हवी आहे की स्वतःचा छोटा व्यवसाय सुरू करायचा आहे?",
    gu: "છેલ્લો પ્રશ્ન: તમે દર મહિને પગારવાળી નોકરી ઈચ્છો છો કે સરકારી સહાયથી પોતાનો વ્યવસાય શરૂ કરવા માંગો છો?",
    pa: "ਆਖ਼ਰੀ ਸਵਾਲ: ਕੀ ਤੁਸੀਂ ਮਾਸਿਕ ਤਨਖਾਹ ਵਾਲੀ ਨੌਕਰੀ ਚਾਹੁੰਦੇ ਹੋ ਜਾਂ ਆਪਣਾ ਨਿੱਜੀ ਕਾਰੋਬਾਰ ਸ਼ੁਰੂ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
    ml: "അവസാന ചോദ്യം: പ്രതിമാസ ശമ്പളമുള്ള ജോലിയാണോ താൽപ്പര്യം, അതോ സ്വന്തമായി സ്വയംതൊഴിൽ ആരംഭിക്കാനാണോ ആഗ്രഹം?",
    ur: "آخری سوال: کیا آپ ماہانہ تنخواہ والی نوکری پسند کریں گے یا اپنا کاروبار شروع کرنا چاہتے ہیں؟"
  }
};

function getOrCreateSession(sessionId) {
  if (!SESSIONS.has(sessionId)) {
    SESSIONS.set(sessionId, {
      sessionId,
      currentSlotIndex: 0,
      profile: {
        name: '',
        education: '',
        familyOccupation: '',
        currentLivelihood: '',
        skills: '',
        mobilityConstraints: '',
        employmentPreference: ''
      },
      history: [],
      isComplete: false,
      sentiment: 'positive',
      startTime: new Date().toISOString()
    });
  }
  return SESSIONS.get(sessionId);
}

// Empathetic sentiment & tone extraction
function analyzeSentimentAndTone(text = '') {
  const t = text.toLowerCase();
  if (t.includes('scared') || t.includes('fear') || t.includes('डर') || t.includes('परेशान') || t.includes('help') || t.includes('poor') || t.includes('गरीब')) {
    return { sentiment: 'hesitant', encouragement: "Don't worry, Saathi is here with you at every step." };
  }
  if (t.includes('excited') || t.includes('ready') || t.includes('seekh') || t.includes('सीख') || t.includes('करना चाहता') || t.includes('want to')) {
    return { sentiment: 'enthusiastic', encouragement: "That is wonderful enthusiasm! Government PM-AJAY has full support for your dream." };
  }
  return { sentiment: 'positive', encouragement: "Thank you for sharing openly." };
}

// Extract information from natural speech into slots
function fillSlotFromText(slotName, text = '') {
  const clean = text.trim();
  if (!clean) return '';
  return clean;
}

// Process turn in the interview
function processInterviewTurn(sessionId, userSpeech = '', lang = 'en-IN') {
  const session = getOrCreateSession(sessionId);
  const shortLang = (lang || 'en-IN').split('-')[0].toLowerCase();

  // If initial turn with empty speech
  if (!userSpeech && session.currentSlotIndex === 0 && !session.profile.name) {
    const promptObj = SLOT_PROMPTS[REQUIRED_SLOTS[0]];
    const promptText = promptObj[shortLang] || promptObj['en'];
    return {
      sessionId,
      aiPrompt: promptText,
      currentSlot: REQUIRED_SLOTS[0],
      currentSlotIndex: 0,
      completionPercentage: 0,
      profile: session.profile,
      isComplete: false,
      recommendations: null
    };
  }

  // Current slot being answered
  const activeSlot = REQUIRED_SLOTS[session.currentSlotIndex];
  if (activeSlot && userSpeech) {
    session.profile[activeSlot] = fillSlotFromText(activeSlot, userSpeech);
    session.history.push({
      slot: activeSlot,
      userSpeech,
      timestamp: new Date().toISOString()
    });
    session.currentSlotIndex++;
  }

  const { sentiment, encouragement } = analyzeSentimentAndTone(userSpeech);
  session.sentiment = sentiment;

  // Check if finished
  if (session.currentSlotIndex >= REQUIRED_SLOTS.length) {
    session.isComplete = true;
    const recommendations = assessSkillGapsAndRecommend(session.profile);

    const completionMsg = {
      en: `Thank you so much, ${session.profile.name || 'friend'}! We have completed your profile interview. ${encouragement} Based on your aspirations, SAATHI has created your NSQF Skill Recommendations and PM-AJAY Pathway!`,
      hi: `बहुत-बहुत धन्यवाद, ${session.profile.name || 'साथी'}! आपका साक्षात्कार पूरा हो गया है। आपकी रुचि और कौशल के अनुसार साथी ने आपके लिए NSQF कौशल प्रशिक्षण और पीएम-अजय योजना की सिफारिशें तैयार कर ली हैं!`,
      ta: `மிக்க நன்றி, ${session.profile.name || 'நண்பரே'}! உங்கள் சுயவிவர உரையாடல் முடிந்தது. உங்களுக்கான சிறந்த NSQF திறன் பயிற்சிகள் தயாராக உள்ளன!`,
      te: `చాలా ధన్యవాదాలు, ${session.profile.name || 'మిత్రమా'}! మీ ముఖాముఖి పూర్తయింది. మీ కోసం NSQF నైపుణ్య శిక్షణ సిఫార్సులు సిద్ధంగా ఉన్నాయి!`,
      kn: `ತುಂಬಾ ಧನ್ಯವಾದಗಳು, ${session.profile.name || 'ಸ್ನೇಹಿತರೆ'}! ನಿಮ್ಮ ಸಂಭಾಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ನಿಮಗಾಗಿ NSQF ಕೌಶಲ್ಯ ಶಿಫಾರಸುಗಳು ಸಿದ್ಧವಾಗಿವೆ!`,
      bn: `অসংখ্য ধন্যবাদ, ${session.profile.name || 'বন্ধু'}! আপনার সাক্ষাৎকার সম্পন্ন হয়েছে। আপনার জন্য NSQF প্রশিক্ষণ সুপারিশ প্রস্তুত করা হয়েছে!`,
      mr: `खूप खूप धन्यवाद, ${session.profile.name || 'मित्रा'}! आपली मुलाखत पूर्ण झाली आहे. आपल्यासाठी NSQF कौशल्य प्रशिक्षण शिफारसी तयार आहेत!`,
      gu: `ખૂબ ખૂબ આભાર, ${session.profile.name || 'મિત્ર'}! તમારો ઇન્ટરવ્યુ પૂર્ણ થયો છે. તમારા માટે NSQF તાલીમ ભલામણો તૈયાર છે!`,
      pa: `ਬਹੁਤ ਬਹੁਤ ਧੰਨਵਾਦ, ${session.profile.name || 'ਦੋਸਤ'}! ਤੁਹਾਡੀ ਇੰਟਰਵਿਊ ਮੁਕੰਮਲ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡੇ ਲਈ NSQF ਸਿਫ਼ਾਰਸ਼ਾਂ ਤਿਆਰ ਹਨ!`,
      ml: `വളരെ നന്ദി, ${session.profile.name || 'സുഹൃത്തേ'}! നിങ്ങളുടെ പ്രൊഫൈൽ പൂർത്തിയായി. നിങ്ങൾക്കായുള്ള NSQF ശുപാർശകൾ തയ്യാറാണ്!`,
      ur: `بہت بہت شکریہ، ${session.profile.name || 'دوست'}! آپ کا انٹرویو مکمل ہو گیا ہے۔ آپ کے لیے تربیتی سفارشات تیار ہیں!`
    };

    return {
      sessionId,
      aiPrompt: completionMsg[shortLang] || completionMsg['en'],
      currentSlot: 'completed',
      currentSlotIndex: REQUIRED_SLOTS.length,
      completionPercentage: 100,
      profile: session.profile,
      isComplete: true,
      recommendations
    };
  }

  // Next slot
  const nextSlot = REQUIRED_SLOTS[session.currentSlotIndex];
  const nextPromptObj = SLOT_PROMPTS[nextSlot];
  const nextPromptText = nextPromptObj[shortLang] || nextPromptObj['en'];
  const completionPercentage = Math.round((session.currentSlotIndex / REQUIRED_SLOTS.length) * 100);

  return {
    sessionId,
    aiPrompt: nextPromptText,
    currentSlot: nextSlot,
    currentSlotIndex: session.currentSlotIndex,
    completionPercentage,
    profile: session.profile,
    isComplete: false,
    recommendations: null
  };
}

function resetInterviewSession(sessionId) {
  SESSIONS.delete(sessionId);
  return getOrCreateSession(sessionId);
}

module.exports = {
  REQUIRED_SLOTS,
  SLOT_PROMPTS,
  processInterviewTurn,
  resetInterviewSession,
  getOrCreateSession
};
