/* Shared voice engine used by the landing mini-console and the full
   assistant page. Speech capture + synthesis happen in the browser
   (Web Speech API); the transcript is sent to the backend, which runs
   intent classification and the matching tool logic, and returns a
   text reply that we both show and speak back.

   Now supports auto-language detection: when language is set to 'auto',
   the recognizer lets Chrome detect the spoken language automatically. */

const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// Map of language codes to their display names (for showing detected language)
const LANG_NAMES = {
  'en': 'English', 'en-IN': 'English', 'en-US': 'English',
  'hi': 'हिन्दी', 'hi-IN': 'हिन्दी',
  'ta': 'தமிழ்', 'ta-IN': 'தமிழ்',
  'te': 'తెలుగు', 'te-IN': 'తెలుగు',
  'mr': 'मराठी', 'mr-IN': 'मराठी',
  'bn': 'বাংলা', 'bn-IN': 'বাংলা',
  'gu': 'ગુજરાતી', 'gu-IN': 'ગુજરાતી',
  'kn': 'ಕನ್ನಡ', 'kn-IN': 'ಕನ್ನಡ',
  'pa': 'ਪੰਜਾਬੀ', 'pa-IN': 'ਪੰਜਾਬੀ',
  'ml': 'മലയാളം', 'ml-IN': 'മലയാളം',
  'ur': 'اردو', 'ur-IN': 'اردو'
};

const GREETINGS = {
  'auto': 'Hello! I am Saathi, your work assistant. Please speak now.',
  'en-IN': 'Hello! I am Saathi, your work assistant. Please speak now.',
  'hi-IN': 'नमस्ते! मैं साथी हूँ, आपका कार्य सहायक। कृपया अब बोलिए।',
  'ta-IN': 'வணக்கம்! நான் சாத்தி, உங்கள் பணி உதவியாளர். இப்போது பேசுங்கள்.',
  'te-IN': 'నమస్కారం! నేను సాథి, మీ పని సహాయకుడిని. దయచేసి ఇప్పుడు మాట్లాడండి.',
  'mr-IN': 'नमस्कार! मी साथी आहे, तुमचा कार्य सहाय्यक. कृपया आता बोला.',
  'bn-IN': 'নমস্কার! আমি সাথী, আপনার কাজের সহকারী। অনুগ্রহ করে এখন বলুন।',
  'gu-IN': 'નમસ્તે! હું સાથી છું, તમારો કાર્ય સહાયક. કૃપા કરીને હવે બોલો.',
  'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ಸಾಥಿ, ನಿಮ್ಮ ಕೆಲಸದ ಸಹಾಯಕ. ದಯವಿಟ್ಟು ಈಗ ಮಾತನಾಡಿ.',
  'pa-IN': 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਸਾਥੀ ਹਾਂ, ਤੁਹਾਡਾ ਕੰਮ ਸਹਾਇਕ। ਕਿਰਪਾ ਕਰਕੇ ਹੁਣ ਬੋਲੋ।'
};

function saathiGreet(lang, onDone) {
  const greeting = GREETINGS[lang] || GREETINGS['en-IN'];
  if (!('speechSynthesis' in window)) { onDone && onDone(); return; }
  const u = new SpeechSynthesisUtterance(greeting);
  u.lang = (lang && lang !== 'auto') ? lang : 'en-IN';
  u.rate = 0.95;
  u.pitch = 1.0;
  const voices = speechSynthesis.getVoices();
  const shortLang = u.lang.split('-')[0];
  const matchedVoice = voices.find(v => v.lang.startsWith(shortLang));
  if (matchedVoice) u.voice = matchedVoice;
  u.onend = () => { onDone && onDone(); };
  u.onerror = () => { onDone && onDone(); };
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

function getLangName(code) {
  if (!code) return 'Unknown';
  return LANG_NAMES[code] || LANG_NAMES[code.split('-')[0]] || code;
}

function saathiCreateRecognizer({ onStart, onInterim, onFinal, onError, onEnd }) {
  if (!SpeechRecognitionAPI) return null;
  const recognition = new SpeechRecognitionAPI();
  recognition.continuous = false;
  recognition.interimResults = true;
  let finalText = '';

  recognition.onstart = () => { finalText = ''; onStart && onStart(); };
  recognition.onresult = (event) => {
    let text = '';
    for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
    finalText = text;
    onInterim && onInterim(text);
  };
  recognition.onerror = (e) => { onError && onError(e); };
  recognition.onend = () => { onEnd && onEnd(finalText); };

  return {
    start(lang) {
      if (lang === 'auto') {
        // Auto-detect: set to empty string or a broad default
        // Chrome will try to detect the language automatically
        recognition.lang = '';
      } else {
        recognition.lang = lang || 'en-IN';
      }
      try { recognition.start(); } catch(e) {}
    },
    stop() { try { recognition.stop(); } catch(e) {} }
  };
}

function saathiSpeak(text, lang) {
  if (!('speechSynthesis' in window) || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  // For auto-detect, try to pick a reasonable lang; otherwise use the provided one
  if (lang && lang !== 'auto') {
    u.lang = lang;
  } else {
    u.lang = 'en-IN'; // fallback for TTS
  }
  u.rate = 0.95;
  u.pitch = 1.0;
  speechSynthesis.cancel();

  // Try to find a matching voice for better pronunciation
  const voices = speechSynthesis.getVoices();
  const shortLang = u.lang.split('-')[0];
  const matchedVoice = voices.find(v => v.lang.startsWith(shortLang));
  if (matchedVoice) u.voice = matchedVoice;

  speechSynthesis.speak(u);
}

// Pre-load voices (some browsers load them asynchronously)
if ('speechSynthesis' in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => { speechSynthesis.getVoices(); };
}

async function saathiAskAssistant(text, lang) {
  return Saathi.post('/assistant/query', { text, lang });
}

const INTENT_META = {
  memory:    { label: 'Knowledge Memory',   page: 'memory.html',    color: '#3F6B67', icon: '📚' },
  workshare: { label: 'AI WorkShare',       page: 'workshare.html', color: '#E8963C', icon: '👷' },
  fairwage:  { label: 'FairWage Estimator', page: 'fairwage.html',  color: '#C97A28', icon: '💰' },
  safety:    { label: 'Safety Reporter',    page: 'safety.html',    color: '#B94A32', icon: '🛡️' },
  grievance: { label: 'Helpline',           page: 'grievance.html', color: '#5B6670', icon: '📞' },
  question:  { label: 'Problem Solver',     page: 'memory.html',    color: '#2E86AB', icon: '🔧' },
  problemshare: { label: 'ProblemShare', page: 'problemshare.html', color: '#8B5CF6', icon: '🔧' }
};
