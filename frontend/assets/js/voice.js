/* ============================================================
   SAATHI — Universal Multilingual Voice Engine (ASR + TTS)
   Speech Recognition + Synthesis across all Indian Languages
   Optimized for Google Chrome & Web Speech API Standards
   ============================================================ */

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

const LANG_CONFIG = {
  'hi-IN': { name: 'हिन्दी (Hindi)', sample: 'मुझे सिलाई और बुनाई का काम सीखना है' },
  'ta-IN': { name: 'தமிழ் (Tamil)', sample: 'நான் தையல் வேலை கற்றுக்கொள்ள விரும்புகிறேன்' },
  'te-IN': { name: 'తెలుగు (Telugu)', sample: 'నేను సోలార్ ప్యానెల్ పని నేర్చుకోవాలనుకుంటున్నాను' },
  'kn-IN': { name: 'ಕನ್ನಡ (Kannada)', sample: 'ನನಗೆ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಕೆಲಸ ಕಲಿಯಬೇಕು' },
  'bn-IN': { name: 'বাংলা (Bengali)', sample: 'আমি তাঁতশিল্প এবং সেলাইয়ের কাজ শিখতে চাই' },
  'mr-IN': { name: 'मराठी (Marathi)', sample: 'मला शिलाई आणि हस्तकला काम शिकायचे आहे' },
  'gu-IN': { name: 'ગુજરાતી (Gujarati)', sample: 'મને સોલાર એનર્જી અને વાયરિંગ શીખવું છે' },
  'pa-IN': { name: 'ਪੰਜਾਬੀ (Punjabi)', sample: 'ਮੈਂ ਮੋਟਰ ਮਕੈਨਿਕ ਦਾ ਕੰਮ ਸਿੱਖਣਾ ਚਾਹੁੰਦਾ ਹਾਂ' },
  'ml-IN': { name: 'മലയാളം (Malayalam)', sample: 'എനിക്ക് തയ്യൽ ജോലി പഠിക്കണം' },
  'ur-IN': { name: 'اردو (Urdu)', sample: 'میں سلائی اور دستکاری کا کام سیکھنا چاہتا ہوں' },
  'or-IN': { name: 'ଓଡ଼ିଆ (Odia)', sample: 'ମୁଁ ସିଲେଇ ଏବଂ ବୁଣାକାର କାମ ଶିଖିବାକୁ ଚାହୁଁଛି' },
  'en-IN': { name: 'English (Indian)', sample: 'I want to learn solar panel installation and technical skilling' },
  'auto':  { name: '🌐 Auto-detect (Hindi/English)', sample: 'I need certified skill training under PM-AJAY' }
};

const LANG_NAMES = Object.fromEntries(
  Object.entries(LANG_CONFIG).map(([k, v]) => [k, v.name])
);

const GREETINGS = {
  'auto': 'नमस्ते! साथी आजीविका सहायक में आपका स्वागत है। बोलिए, मैं आपकी क्या सहायता कर सकता हूँ?',
  'hi-IN': 'नमस्ते! साथी आजीविका सहायक में आपका स्वागत है। बोलिए, मैं आपकी क्या सहायता कर सकता हूँ?',
  'ta-IN': 'வணக்கம்! சாத்தி வாழ்வாதார உதவியாளருக்கு வரவேற்கிறோம். நீங்கள் என்ன வேலை கற்றுக்கொள்ள விரும்புகிறீர்கள்?',
  'te-IN': 'నమస్కారం! సాథి జీవనోపాధి సహాయకుడికి స్వాగతం. మీరు ఏ నైపుణ్యం నేర్చుకోవాలనుకుంటున్నారు?',
  'kn-IN': 'ನಮಸ್ಕಾರ! ಸಾಥಿ ಜೀವನೋಪಾಯ ಸಹಾಯಕ್ಕೆ ಸ್ವಾಗತ. ನೀವು ಯಾವ ಕೆಲಸ ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?',
  'mr-IN': 'नमस्कार! साथी उपजीविका सहाय्यकामध्ये आपले स्वागत आहे. आपल्याला कोणते कौशल्य शिकायचे आहे?',
  'bn-IN': 'নমস্কার! সাথী জীবিকা সহকারীতে আপনাকে স্বাগতম। আপনি কোন কাজ শিখতে আগ্রহী?',
  'gu-IN': 'નમસ્તે! સાથી આજીવિકા સહાયકમાં તમારું સ્વાગત છે. તમે કયું કામ શીખવા માંગો છો?',
  'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਸਾਥੀ ਕੌਸ਼ਲ ਸਹਾਇਕ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਤੁਸੀਂ ਕਿਹੜਾ ਕੰਮ ਸਿੱਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?',
  'ml-IN': 'നമസ്കാരം! സാഥി ജീവിതോപാധി സഹായിയിലേക്ക് സ്വാഗതം. നിങ്ങൾക്ക് ഏത് ജോലിയാണ് പഠിക്കേണ്ടത്?',
  'ur-IN': 'سلام! ساتھی روزگار معاون میں خوش آمدید۔ آپ کون سا ہنر سیکھنا چاہتے ہیں؟',
  'or-IN': 'ନମସ୍କାର! ସାଥୀ ଜୀବିକା ସହାୟକରେ ଆପଣଙ୍କୁ ସ୍ୱାଗତ | ଆପଣ କେଉଁ କାମ ଶିଖିବାକୁ ଚାହାଁନ୍ତି?',
  'en-IN': 'Hello! Welcome to Saathi PM-AJAY Livelihood Assistant. What skill or trade would you like to explore?'
};

function getLangName(code) {
  if (!code) return 'हिन्दी (Hindi)';
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

// Speech Synthesizer (TTS) — Chrome Garbage-Collection Safe
function saathiSpeak(text, lang = 'hi-IN', onDone) {
  if (!('speechSynthesis' in window) || !text) {
    if (onDone) onDone();
    return;
  }

  // Cancel any ongoing audio
  window.speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  let targetLang = (lang && lang !== 'auto') ? lang : 'hi-IN';
  u.lang = targetLang;
  u.rate = 0.95;
  u.pitch = 1.0;

  // Find native voice match
  const voices = window.speechSynthesis.getVoices();
  const shortLang = targetLang.split('-')[0].toLowerCase();
  let matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-') === targetLang.toLowerCase());
  if (!matchedVoice) {
    matchedVoice = voices.find(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(shortLang));
  }
  if (matchedVoice) u.voice = matchedVoice;

  saathiStartWaveform('waveform');

  u.onend = () => {
    saathiStopWaveform('waveform');
    window._activeUtterance = null;
    if (onDone) onDone();
  };

  u.onerror = (err) => {
    console.warn('SpeechSynthesis error:', err);
    saathiStopWaveform('waveform');
    window._activeUtterance = null;
    if (onDone) onDone();
  };

  // Crucial Chrome fix: store reference on window to prevent garbage collection mid-speech
  window._activeUtterance = u;
  window.speechSynthesis.speak(u);
}

// Spoken greeting in chosen language
function saathiGreet(lang = 'hi-IN', onDone) {
  let langKey = lang || 'hi-IN';
  let greeting = GREETINGS[langKey] || GREETINGS[langKey.split('-')[0]] || GREETINGS['hi-IN'];
  saathiSpeak(greeting, langKey, onDone);
}

// Speech Recognizer (ASR)
function saathiCreateRecognizer({ onStart, onInterim, onFinal, onError, onEnd }) {
  if (!SpeechRecognitionAPI) return null;
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
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
    // Ignore no-speech harmless event
    if (e.error === 'no-speech') {
      if (onEnd) onEnd(finalText);
    } else {
      if (onError) onError(e);
    }
  };

  recognition.onend = () => {
    saathiStopWaveform('waveform');
    if (onEnd) onEnd(finalText);
  };

  return {
    start(lang) {
      if (!lang || lang === 'auto') {
        recognition.lang = 'hi-IN'; // Chrome requires valid BCP 47 locale
      } else {
        recognition.lang = lang;
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
