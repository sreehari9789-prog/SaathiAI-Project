// Demo-scale multilingual intent router. In production this step is a
// trained multilingual NLU model (see technical architecture doc) — this
// keyword scorer keeps the prototype working fully offline and for free.
const KEYWORDS = {
  workshare: [
    'free time', 'free hour', 'free tomorrow', 'free this', 'looking for work', 'need work', 'extra work',
    'part time', 'spare time', 'any work', 'available for work', 'good at', 'i am good at', 'i can do',
    'job', 'jobs', 'task', 'tasks', 'open work', 'work available', 'earn', 'earning', 'side work',
    'खाली समय', 'काम चाहिए', 'फुर्सत', 'फालतू समय', 'अतिरिक्त काम', 'नौकरी', 'काम ढूंढ',
    'வேலை வேண்டும்', 'நேரம் இருக்கு', 'வேலை தேடுகிறேன்',
    'పని కావాలి', 'ఖాళీ సమయం', 'పని దొరుకుతుందా',
    'কাজ দরকার', 'ফাঁকা সময়', 'কাজ খুঁজছি',
    'काम हवं', 'वेळ आहे',
    'કામ જોઈએ', 'ખાલી સમય',
    'ਕੰਮ ਚਾਹੀਦਾ', 'ਵਿਹਲਾ ਸਮਾਂ',
    'ಕೆಲಸ ಬೇಕು', 'ಖಾಲಿ ಸಮಯ'
  ],
  fairwage: [
    'wage', 'salary', 'how much should i be paid', 'daily wage', 'rate for', 'cost for', 'fair pay',
    'pay rate', 'minimum wage', 'payment', 'compensation', 'hourly rate', 'daily rate',
    'पैसा', 'मजदूरी', 'वेतन', 'कितना पैसा', 'भुगतान', 'तनख्वाह', 'दिहाड़ी',
    'కూలి', 'జీతం', 'ఎంత', 'చెల్లింపు',
    'கூலி', 'சம்பளம்', 'எவ்வளவு',
    'মজুরি', 'বেতন', 'কত টাকা',
    'पगार', 'किती पैसे',
    'પગાર', 'કેટલા પૈસા',
    'ਤਨਖਾਹ', 'ਕਿੰਨੇ ਪੈਸੇ',
    'ಸಂಬಳ', 'ಎಷ್ಟು ಹಣ'
  ],
  safety: [
    'danger', 'unsafe', 'hazard', 'accident', 'injury', 'injured', 'spark', 'smoke', 'gas leak', 'fire',
    'exposed wire', 'no guard', 'broken', 'crack', 'leak', 'overheat', 'overheating', 'burn', 'electric shock',
    'खतरा', 'चोट', 'आग', 'गैस लीक', 'दुर्घटना', 'टूटा', 'बिजली का झटका', 'धुआं',
    'ஆபத்து', 'விபத்து', 'தீ', 'புகை',
    'ప్రమాదం', 'గాయం', 'మంట', 'పొగ',
    'বিপদ', 'দুর্ঘটনা', 'আগুন', 'ধোঁয়া',
    'धोका', 'अपघात',
    'ਖ਼ਤਰਾ', 'ਅੱਗ', 'ਧੂੰਆਂ',
    'ಅಪಾಯ', 'ಬೆಂಕಿ'
  ],
  grievance: [
    'complaint', 'grievance', 'not paid', 'not paying', 'not being paid', "haven't been paid", 'unfair',
    'harassment', 'dispute', 'problem with employer', 'report issue', 'cheating', 'abuse', 'mistreatment',
    'overtime not paid', 'forced work',
    'शिकायत', 'अन्याय', 'परेशानी', 'भुगतान नहीं', 'उत्पीड़न', 'धोखा',
    'புகார்', 'நீதி இல்லை', 'ஊதியம் தரவில்லை',
    'ఫిర్యాదు', 'అన్యాయం',
    'অভিযোগ', 'বেতন পাইনি',
    'तक्रार', 'अन्याय',
    'ફરિયાદ', 'અન્યાય',
    'ਸ਼ਿਕਾਇਤ', 'ਬੇਇਨਸਾਫ਼ੀ',
    'ದೂರು', 'ಅನ್ಯಾಯ'
  ],
  question: [
    'how to', 'how do', 'how can', 'what is', 'what are', 'why does', 'why is', 'tell me',
    'explain', 'solution', 'solve', 'fix', 'repair', 'troubleshoot', 'problem', 'issue with',
    'not working', 'stopped working', 'broken down', 'what should i do', 'help me', 'guide',
    'steps to', 'procedure', 'best way', 'advice', 'suggest', 'recommend', 'tips',
    'कैसे', 'क्या करें', 'क्यों', 'समस्या', 'समाधान', 'ठीक करो', 'मदद', 'बताओ', 'उपाय',
    'सुझाव', 'तरीका', 'काम नहीं कर रहा', 'खराब', 'बंद हो गया', 'चालू नहीं',
    'எப்படி', 'என்ன', 'ஏன்', 'சரி செய்', 'உதவி', 'தீர்வு', 'வேலை செய்யவில்லை',
    'ఎలా', 'ఏమి', 'ఎందుకు', 'సమస్య', 'సహాయం', 'పని చేయడం లేదు',
    'কিভাবে', 'কেন', 'সমস্যা', 'সমাধান', 'সাহায্য', 'কাজ করছে না',
    'कसं', 'काय करू', 'मदत',
    'ਕਿਵੇਂ', 'ਕੀ ਕਰਾਂ', 'ਮਦਦ',
    'ಹೇಗೆ', 'ಏನು ಮಾಡಬೇಕು', 'ಸಹಾಯ',
    'કેવી રીતે', 'શું કરવું', 'મદદ'
  ],
  problemshare: [
    'problem', 'issue', 'trouble', 'not working', 'broken', 'stuck', 'jammed', 'stopped',
    'malfunction', 'defect', 'fault', 'error', 'difficulty', 'challenge', 'struggle',
    'machine problem', 'work problem', 'factory problem', 'production issue',
    'समस्या', 'परेशानी', 'खराबी', 'टूट गया', 'काम नहीं कर रहा', 'रुक गया', 'बंद हो गया', 'गड़बड़',
    'சிக்கல்', 'பிரச்சனை', 'வேலை செய்யவில்லை', 'கெட்டுப்போனது',
    'సమస్య', 'పని చేయడం లేదు', 'చెడిపోయింది',
    'সমস্যা', 'কাজ করছে না', 'নষ্ট হয়ে গেছে',
    'समस्या', 'काम नाही करत', 'बिघडलं',
    'ਸਮੱਸਿਆ', 'ਕੰਮ ਨਹੀਂ ਕਰ ਰਿਹਾ',
    'ಸಮಸ್ಯೆ', 'ಕೆಲಸ ಮಾಡುತ್ತಿಲ್ಲ',
    'સમસ્યા', 'કામ નથી કરતું'
  ]
};

// Built-in knowledge base for common MSME / factory problems and solutions.
// Each entry has keywords for matching and a detailed answer.
const KNOWLEDGE_BASE = [
  {
    keywords: ['compressor', 'hissing', 'air leak', 'pressure drop', 'valve'],
    answer: 'For a compressor air leak: First, turn off the compressor and release pressure. Check all valve joints and fittings — apply soapy water to find the leak (bubbles will appear). Tighten loose fittings with a wrench. If a valve gasket is worn, replace it. If the pressure gauge needle is sticking, tap it gently or replace the gauge. Always check the oil level and clean air filters monthly.'
  },
  {
    keywords: ['loom', 'thread', 'snapping', 'breaking', 'tension', 'weaving', 'fabric'],
    answer: 'For loom thread snapping issues: Check the tension screw — if too tight, loosen it by half a turn. Make sure the thread is not old or of poor quality. Clean the heddle eyes and reed with a dry brush. If thread keeps breaking at the same spot, check for burrs or rough edges on the shuttle or reed. Oil all moving parts weekly. For uneven fabric, check the warp beam alignment.'
  },
  {
    keywords: ['motor', 'overheat', 'hot', 'heating', 'not starting', 'vibration', 'noise', 'rpm'],
    answer: 'For motor overheating: Stop the motor immediately and let it cool. Clean the cooling vents thoroughly — dust buildup is the number one cause. Check the belt tension (too tight causes strain). Verify the power supply voltage matches motor rating. For excessive vibration, check motor mounts and bearing condition. If the motor hums but does not start, the capacitor may need replacement. Standard RPM for most factory motors is 1440 or 2880 — check the nameplate.'
  },
  {
    keywords: ['boiler', 'pressure', 'steam', 'temperature', 'water level', 'gauge'],
    answer: 'For boiler issues: Check the water level gauge — low water is the most dangerous condition, never operate with low water. If the pressure gauge reads high, check the safety valve. Descale the boiler regularly (every 3 to 6 months depending on water quality). For uneven heating, check burner nozzles and clean them. Always perform a blowdown at the start of each shift to remove sediment.'
  },
  {
    keywords: ['cutting', 'blade', 'dull', 'uneven', 'jam', 'jammed', 'stuck'],
    answer: 'For cutting machine problems: If the blade is dull, sharpen or replace it — a dull blade causes uneven cuts and overheats the motor. For a jammed machine, turn it off first, then clear the material carefully. Lubricate the guide rails weekly. Check blade alignment if cuts are going crooked. Always use the right blade type for the material (metal vs fabric vs wood).'
  },
  {
    keywords: ['electric', 'wiring', 'shock', 'circuit', 'breaker', 'tripping', 'fuse', 'short circuit'],
    answer: 'For electrical issues: If a circuit breaker keeps tripping, there may be an overload or short circuit — do NOT keep resetting it. Call a qualified electrician. For exposed wires, immediately turn off the main power and tape or replace the wire. Never work on electrical systems with wet hands. Check fuse ratings match the equipment. If machines give electric shocks, the earthing or grounding may be faulty.'
  },
  {
    keywords: ['pump', 'water', 'flow', 'suction', 'prime', 'priming', 'cavitation'],
    answer: 'For pump issues: If the pump is not drawing water, it may have lost prime — fill the suction line with water and restart. Check for air leaks in the suction pipe. If the pump makes a rattling noise, it may be cavitating — check the inlet filter for blockage. Clean the impeller every month. For reduced flow, check for clogs in the discharge pipe.'
  },
  {
    keywords: ['welding', 'spatter', 'porosity', 'crack', 'bead', 'arc', 'electrode'],
    answer: 'For welding problems: Excessive spatter means the voltage is too high or the work piece is dirty — clean the surface first. Porosity (holes in the weld) is caused by moisture — dry your electrodes and clean the base metal. For a weak bead, increase amperage or slow your travel speed. Always check gas flow rate for MIG or TIG welding. Store electrodes in a dry place.'
  },
  {
    keywords: ['safety', 'ppe', 'protective', 'gear', 'equipment', 'gloves', 'helmet', 'goggles'],
    answer: 'Essential safety equipment: Always wear safety goggles near machines, heat-resistant gloves for welding and hot work, ear plugs in noisy areas (above 85 dB), steel-toe boots in loading and unloading areas, and a dust mask when cutting or grinding. Check PPE for damage before each use. Report missing guard rails or machine covers immediately to your supervisor.'
  },
  {
    keywords: ['rust', 'corrosion', 'maintenance', 'oil', 'lubrication', 'grease'],
    answer: 'For rust and corrosion prevention: Apply machine oil or WD-40 to metal surfaces weekly. Keep machines covered when not in use. For existing rust, use a wire brush or sandpaper to remove it, then apply a rust converter or primer. Grease all bearings and moving joints on a regular schedule. In humid environments, use dehumidifiers or silica gel packs near sensitive equipment.'
  },
  {
    keywords: ['first aid', 'burn', 'cut', 'wound', 'bleeding', 'injury treatment'],
    answer: 'Basic first aid: For burns, cool the area under running water for 10 minutes — do not apply ice or butter. For cuts, apply firm pressure with a clean cloth to stop bleeding, then clean with water and apply a bandage. For chemical splashes in eyes, flush with clean water for 15 minutes. For electric shock, do not touch the person — cut the power first. Always keep a first aid kit accessible on the shop floor.'
  },
  {
    keywords: ['spinning machine', 'vibration', 'textile'],
    answer: 'For spinning machine vibration: Check spindle alignment and balance. Inspect bearings for wear and replace if necessary. Ensure drive belts are properly tensioned.'
  },
  {
    keywords: ['dyeing', 'color inconsistency', 'textile'],
    answer: 'For dyeing color inconsistency: Verify temperature and pH of the dye bath. Check for uneven yarn tension and ensure the dye liquor is properly mixed and circulated.'
  },
  {
    keywords: ['finishing machine', 'roller', 'textile'],
    answer: 'For finishing machine roller issues: Inspect rollers for uneven wear or build-up. Clean rollers thoroughly and check the pressure settings across the width.'
  },
  {
    keywords: ['lathe', 'chatter', 'metal'],
    answer: 'For lathe chatter: Ensure the tool is sharp and properly centered. Check for loose gibs or bearings. Adjust spindle speed and feed rate for the material.'
  },
  {
    keywords: ['grinding wheel', 'metal', 'vibration'],
    answer: 'For grinding wheel issues: Dress the wheel to expose fresh abrasive. Balance the wheel properly and check for cracks before use. Never over-tighten the mounting nut.'
  },
  {
    keywords: ['drill bit', 'breaking', 'metal'],
    answer: 'For drill bit breaking: Use the correct speed and feed rate. Apply cutting fluid. Ensure the workpiece is securely clamped and clear chips frequently.'
  },
  {
    keywords: ['sealing machine', 'temperature', 'packaging'],
    answer: 'For sealing machine temperature issues: Check the thermocouple and heating element. Verify the temperature controller settings. Clean the sealing jaws of any residue.'
  },
  {
    keywords: ['labeling', 'misalignment', 'packaging'],
    answer: 'For labeling misalignment: Adjust the label web tension and guide rollers. Clean the peeler plate and check the sensor alignment.'
  },
  {
    keywords: ['angle grinder', 'safety', 'power tools'],
    answer: 'For angle grinder safety: Always use the guard. Match the disc to the RPM rating. Wear eye protection and heavy gloves. Never use a cracked or dropped disc.'
  },
  {
    keywords: ['drill', 'overheating', 'power tools'],
    answer: 'For drill overheating: Let it cool down. Clean the air vents. Do not force the tool; let the bit do the work. Use sharp bits.'
  },
  {
    keywords: ['chemical', 'storage', 'handling'],
    answer: 'For chemical storage: Keep incompatible chemicals separated. Store in cool, dry, well-ventilated areas. Ensure all containers are properly labeled and tightly closed.'
  },
  {
    keywords: ['spill', 'cleanup', 'chemical'],
    answer: 'For spill cleanup: Contain the spill immediately. Use appropriate absorbent materials. Wear PPE, including gloves and goggles. Dispose of waste according to local regulations.'
  },
  {
    keywords: ['back pain', 'standing', 'ergonomics'],
    answer: 'For back pain from standing: Use anti-fatigue mats. Wear supportive shoes. Take frequent short breaks to stretch and adjust your posture.'
  },
  {
    keywords: ['repetitive strain', 'ergonomics'],
    answer: 'For repetitive strain: Rotate tasks if possible. Use tools with ergonomic handles. Perform stretching exercises and take regular micro-breaks.'
  },
  {
    keywords: ['tool', 'maintenance', 'daily-wage'],
    answer: 'For tool maintenance: Clean tools after every shift. Keep cutting tools sharp. Oil moving parts regularly and report any damage immediately.'
  },
  {
    keywords: ['work site', 'safety', 'daily-wage'],
    answer: 'For work site safety: Keep walkways clear of debris. Ensure adequate lighting. Always use provided PPE and report hazards to the supervisor.'
  }
];

function classifyIntent(text) {
  const t = (text || '').toLowerCase();
  const scores = { workshare: 0, fairwage: 0, safety: 0, grievance: 0, question: 0, problemshare: 0 };
  for (const [intent, words] of Object.entries(KEYWORDS)) {
    for (const w of words) if (t.includes(w.toLowerCase())) scores[intent]++;
  }
  let best = 'memory';
  let bestScore = 0;
  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  return best;
}

function findKnowledgeAnswer(text) {
  const t = (text || '').toLowerCase();
  let bestMatch = null;
  let bestScore = 0;
  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (t.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) { bestScore = score; bestMatch = entry; }
  }
  if (bestMatch && bestScore >= 1) return bestMatch.answer;
  // Generic helpful response when no specific knowledge match is found
  return 'I understand you have a question. Based on what you described, I recommend checking the machine manual first, inspecting for loose connections or worn parts, and consulting your unit supervisor. You can also search our Knowledge Memory for similar fixes reported by other workers. If this is urgent, please report it through the Safety Reporter tool.';
}

function guessMachineTag(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('compressor')) return 'Compressor';
  if (t.includes('loom') || t.includes('thread') || t.includes('weav')) return 'Loom';
  if (t.includes('motor')) return 'Motor';
  if (t.includes('boiler')) return 'Boiler';
  if (t.includes('cut') || t.includes('blade')) return 'Cutting machine';
  if (t.includes('pump') || t.includes('water')) return 'Pump';
  if (t.includes('weld')) return 'Welding machine';
  if (t.includes('electric') || t.includes('wire') || t.includes('circuit')) return 'Electrical';
  return 'General';
}

function extractTaskDetails(text) {
  const t = (text || '').toLowerCase();
  const hourMatch = t.match(/(\d+)\s*(hour|hr|ghanta|ghante|घंटा|घंटे)/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 8;
  
  let period = 'daily';
  if (t.includes('week') || t.includes('hafta') || t.includes('हफ्ता')) period = 'weekly';
  else if (t.includes('month') || t.includes('mahina') || t.includes('महीना')) period = 'monthly';
  
  const map = {
    cutting: 'cutting', 'कटिंग': 'cutting',
    welding: 'welding', 'वेल्डिंग': 'welding',
    weav: 'weaving', 'बुनाई': 'weaving',
    pack: 'packing', 'पैकिंग': 'packing',
    load: 'loading', 'लोडिंग': 'loading',
    machine: 'machine operating', 'मशीन': 'machine operating',
    clean: 'cleaning', 'सफाई': 'cleaning',
    stitch: 'stitching', 'सिलाई': 'stitching',
    assembl: 'assembly line', fabricat: 'fabrication', quality: 'quality checking',
    handloom: 'handloom weaving', handicraft: 'handicraft', village: 'village industry',
    paint: 'painting', carpent: 'carpentry', plumb: 'plumbing', electri: 'electrical',
    mason: 'masonry', garden: 'gardening', cook: 'cooking', driv: 'driving', secur: 'security', tailor: 'tailoring'
  };
  let type = 'cutting';
  for (const [k, v] of Object.entries(map)) { if (t.includes(k)) { type = v; break; } }
  return { type, hours, period };
}

function guessSeverity(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('fire') || t.includes('injur') || t.includes('आग') || t.includes('விபத்') || t.includes('gas leak') || t.includes('electric shock') || t.includes('explosion')) return 'high';
  if (t.includes('spark') || t.includes('smoke') || t.includes('exposed') || t.includes('overheat') || t.includes('crack') || t.includes('leak')) return 'medium';
  return 'low';
}

module.exports = { classifyIntent, guessMachineTag, extractTaskDetails, guessSeverity, findKnowledgeAnswer };
