/* ============================================================
   SAATHI — Universal Multilingual Voice Engine (ASR + TTS)
   Smart India Hackathon 2026 — MoSJE PM-AJAY (SIH26097)
   Speech Recognition + Synthesis across all Indian Languages
   ============================================================ */

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const LANG_NAMES = {
  'auto': '🌐 Auto-detect',
  'en-IN': 'English',
  'hi-IN': 'हिन्दी (Hindi)',
  'ta-IN': 'தமிழ் (Tamil)',
  'te-IN': 'తెలుగు (Telugu)',
  'kn-IN': 'ಕನ್ನಡ (Kannada)',
  'mr-IN': 'मराठी (Marathi)',
  'bn-IN': 'বাংলা (Bengali)',
  'gu-IN': 'ગુજરાતી (Gujarati)',
  'pa-IN': 'ਪੰਜਾਬੀ (Punjabi)',
  'ml-IN': 'മലയാളം (Malayalam)',
  'ur-IN': 'اردو (Urdu)',
  'or-IN': 'ଓଡ଼ିଆ (Odia)'
};

const GREETINGS = {
  'auto': 'Namaste! Welcome to Saathi PM-AJAY Livelihood Assistant. Tap the microphone and speak in any language.',
  'en-IN': 'Hello! I am Saathi, your PM-AJAY Livelihood and Skilling Guide. Please tell me your skills or questions.',
  'hi-IN': 'नमस्ते! मैं साथी हूँ, आपका पीएम-अजय आजीविका और कौशल मार्गदर्शक। कृपया अपनी बात कहिए।',
  'ta-IN': 'வணக்கம்! நான் சாத்தி, உங்கள் பிஎம்-அஜய் வாழ்வாதார வழிகாட்டி. தயவுசெய்து பேசுங்கள்.',
  'te-IN': 'నమస్కారం! నేను సాథి, మీ పిఎమ్-అజయ్ జీవనోపాధి మరియు నైపుణ్య మార్గదర్శిని. దయచేసి మాట్లాడండి.',
  'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಸಾಥಿ, ನಿಮ್ಮ ಪಿಎಂ-ಅಜಯ್ ಜೀವನೋಪಾಯ ಮತ್ತು ಕೌಶಲ್ಯ ಮಾರ್ಗದರ್ಶಿ. ದಯವಿಟ್ಟು ಮಾತನಾಡಿ.',
  'mr-IN': 'नमस्कार! मी साथी आहे, आपला पीएम-अजय उपजीविका आणि कौशल्य मार्गदर्शक. कृपया बोला.',
  'bn-IN': 'নমস্কার! আমি সাথী, আপনার পিএম-অজয়ের জীবিকা ও দক্ষতা নির্দেশক। অনুগ্রহ করে বলুন।',
  'gu-IN': 'નમસ્તે! હું સાથી છું, તમારો પીએમ-અજય આજીવિકા માર્ગદર્શક. કૃપા કરીને બોલો.',
  'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਸਾਥੀ ਹਾਂ, ਤੁਹਾਡਾ ਪੀਐਮ-ਅਜੈ ਕੌਸ਼ਲ ਮਾਰਗਦਰਸ਼ਕ। ਕਿਰਪਾ ਕਰਕੇ ਬੋਲੋ।',
  'ml-IN': 'നമസ്കാരം! ഞാൻ സാഥി, നിങ്ങളുടെ പിഎം-അജയ് ജീവിതോപാധി സഹായി. ദയവായി സംസാരിക്കൂ.',
  'ur-IN': 'سلام! میں ساتھی ہوں، آپ کا پی ایم-اجے رہبر۔ براہ کرم اپنی بات کہیے۔',
  'or-IN': 'ନମସ୍କାର! ମୁଁ ସାଥୀ, ଆପଣଙ୍କ ପିଏମ୍-ଅଜୟ ଜୀବିକା ସହାୟକ | ଦୟାକରି କୁହନ୍ତୁ |'
};

function getLangName(code) {
  if (!code) return 'Unknown';
  return LANG_NAMES[code] || LANG_NAMES[code.split('-')[0]] || code;
}

// Waveform visualizer controller
function saathiStartWaveform(elementId = 'waveform') {
  const el = document.getElementById(elementId);
  if (el) el.classList.add('waveform-active');
}

function saathiStopWaveform(elementId = 'waveform') {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('waveform-active');
}

// Speech Synthesizer (TTS)
function saathiSpeak(text, lang = 'en-IN', onDone) {
  if (!('speechSynthesis' in window) || !text) {
    if (onDone) onDone();
    return;
  }

  const u = new SpeechSynthesisUtterance(text);
  let targetLang = (lang && lang !== 'auto') ? lang : 'en-IN';
  u.lang = targetLang;
  u.rate = 0.95;
  u.pitch = 1.0;

  saathiStartWaveform('waveform');

  // Cancel any ongoing utterance before speaking
  window.speechSynthesis.cancel();

  // Find native voice match
  const voices = window.speechSynthesis.getVoices();
  const shortLang = targetLang.split('-')[0].toLowerCase();
  const matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(shortLang));
  if (matchedVoice) u.voice = matchedVoice;

  u.onend = () => {
    saathiStopWaveform('waveform');
    if (onDone) onDone();
  };

  u.onerror = () => {
    saathiStopWaveform('waveform');
    if (onDone) onDone();
  };

  window.speechSynthesis.speak(u);
}

// Spoken greeting in chosen language
function saathiGreet(lang = 'en-IN', onDone) {
  let langKey = lang || 'en-IN';
  let greeting = GREETINGS[langKey] || GREETINGS[langKey.split('-')[0]] || GREETINGS['en-IN'];
  saathiSpeak(greeting, langKey, onDone);
}

// Speech Recognizer (ASR)
function saathiCreateRecognizer({ onStart, onInterim, onFinal, onError, onEnd }) {
  if (!SpeechRecognitionAPI) return null;
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true;
  let finalText = '';

  recognition.onstart = () => {
    finalText = '';
    saathiStartWaveform('waveform');
    if (onStart) onStart();
  };

  recognition.onresult = (event) => {
    let interimText = '';
    for (let i = 0; i < event.results.length; i++) {
      interimText += event.results[i][0].transcript;
    }
    finalText = interimText;
    if (onInterim) onInterim(interimText);
  };

  recognition.onerror = (e) => {
    saathiStopWaveform('waveform');
    if (onError) onError(e);
  };

  recognition.onend = () => {
    saathiStopWaveform('waveform');
    if (onEnd) onEnd(finalText);
  };

  return {
    start(lang) {
      if (lang === 'auto') {
        recognition.lang = ''; // Let browser auto-detect
      } else {
        recognition.lang = lang || 'en-IN';
      }
      try {
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition start error:', e);
      }
    },
    stop() {
      try { recognition.stop(); } catch (e) {}
    }
  };
}

// Pre-load voices into memory
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Async Assistant API query
async function saathiAskAssistant(text, lang) {
  return Saathi.post('/assistant/query', { text, lang });
}

const INTENT_META = {
  nsqf:         { label: 'NSQF Skilling Engine', page: 'nsqf.html',        color: '#144272', icon: '🎓' },
  interview:    { label: 'Voice Interview',      page: 'interview.html',   color: '#0A2647', icon: '🎙️' },
  workshare:    { label: 'AI WorkShare',         page: 'nsqf.html',        color: '#E8963C', icon: '👷' },
  fairwage:     { label: 'FairWage Estimator',   page: 'fairwage.html',    color: '#D97706', icon: '💰' },
  problemshare: { label: 'Peer Work Network',    page: 'peerwork.html',    color: '#2E7D32', icon: '🤝' },
  question:     { label: 'Livelihood Advisory',  page: 'nsqf.html',        color: '#2563EB', icon: '💡' },
  memory:       { label: 'Skilling Registry',    page: 'nsqf.html',        color: '#059669', icon: '📋' }
};
