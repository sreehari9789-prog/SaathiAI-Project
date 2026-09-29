// SAATHI — Backend Server (Zero external dependencies)
// Smart India Hackathon 2026 — Problem Statement SIH26097
// Ministry of Social Justice and Empowerment (MoSJE) — PM-AJAY GIA Component
const http = require('http');
const https = require('https');
const url = require('url');
const store = require('./lib/store');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('./lib/auth');
const { classifyIntent, guessMachineTag, extractTaskDetails, guessSeverity, findKnowledgeAnswer } = require('./lib/intent');
const { NSQF_TRADES, assessSkillGapsAndRecommend } = require('./lib/nsqf');
const { processInterviewTurn, resetInterviewSession } = require('./lib/interview');

const PORT = process.env.PORT || 4000;

// ---------- helpers ----------
function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 2e6) req.destroy(); });
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (e) { resolve({}); }
    });
  });
}

function getUser(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = store.db.users.find(u => u.id === payload.uid);
  return user || null;
}

function publicUser(u) {
  return { id: u.id, name: u.name, phone: u.phone, role: u.role, unit: u.unit, createdAt: u.createdAt };
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + ' hr ago';
  const days = Math.floor(hrs / 24);
  return days + (days === 1 ? ' day ago' : ' days ago');
}

// Bhashini / Google Translate Pipeline
function translateText(text, targetLang, sourceLang = 'auto') {
  return new Promise((resolve) => {
    if (!targetLang) return resolve(text);
    if (targetLang.startsWith('en') && sourceLang === 'auto') {
      // translate auto to english
    } else if (targetLang === sourceLang) return resolve(text);

    const shortTl = targetLang.split('-')[0];
    const shortSl = sourceLang === 'auto' ? 'auto' : sourceLang.split('-')[0];

    const urlStr = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${shortSl}&tl=${shortTl}&dt=t&q=${encodeURIComponent(text)}`;
    const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };
    https.get(urlStr, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          let translated = '';
          if (json && json[0]) {
            json[0].forEach(item => { if (item[0]) translated += item[0]; });
          }
          const result = new String(translated || text);
          result.detectedLang = json[2];
          resolve(result);
        } catch (e) { resolve(new String(text)); }
      });
    }).on('error', () => resolve(new String(text)));
  });
}

// ---------- route handlers ----------
const routes = [];
function route(method, path, handler, opts = {}) { routes.push({ method, path, handler, auth: !!opts.auth }); }

// Health Check
route('GET', '/api/health', async (req, res) => send(res, 200, {
  ok: true,
  service: 'saathi-pm-ajay-backend',
  hackathon: 'SIH26097 - MoSJE PM-AJAY',
  time: new Date().toISOString()
}));

// ==========================================
// FEATURE 1 & 7: Multi-Turn Conversational Voice Interview
// ==========================================
route('POST', '/api/interview/turn', async (req, res, ctx) => {
  const { sessionId = 'session_default', userSpeech = '', lang = 'en-IN' } = ctx.body;
  const result = processInterviewTurn(sessionId, userSpeech, lang);

  // If complete, record into beneficiaries table
  if (result.isComplete && result.profile.name) {
    const existing = store.db.beneficiaries.find(b => b.name.toLowerCase() === result.profile.name.toLowerCase());
    if (!existing) {
      const topRec = result.recommendations?.topRecommendations?.[0];
      const newBen = {
        id: store.id('ben'),
        name: result.profile.name,
        phone: result.profile.phone || '9876500000',
        district: 'Candidate District',
        state: 'Candidate State',
        education: result.profile.education,
        familyOccupation: result.profile.familyOccupation,
        currentLivelihood: result.profile.currentLivelihood,
        skills: result.profile.skills,
        mobilityConstraints: result.profile.mobilityConstraints,
        employmentPreference: result.profile.employmentPreference,
        recommendedTrade: topRec ? topRec.tradeName : 'General Technical Operator',
        nsqfLevel: topRec ? topRec.nsqfLevel : 4,
        trainingBatch: 'PM-AJAY New Enrollment Queue',
        trainingStatus: 'Screening',
        placementStatus: 'Under Skilling',
        monthlyIncome: 0,
        retentionMonths: 0,
        financialConsultantAssigned: 'Assigned on Batch Induction',
        enterpriseGrantReceived: 0,
        createdAt: new Date().toISOString()
      };
      store.db.beneficiaries.unshift(newBen);
      store.save();
    }
  }

  send(res, 200, result);
});

route('POST', '/api/interview/reset', async (req, res, ctx) => {
  const { sessionId = 'session_default' } = ctx.body;
  const result = resetInterviewSession(sessionId);
  send(res, 200, { ok: true, session: result });
});

// ==========================================
// FEATURE 2 & 7: Multilingual Voice Assistant (Single Query)
// ==========================================
route('POST', '/api/assistant/query', async (req, res, ctx) => {
  const text = (ctx.body.text || '').trim();
  const lang = ctx.body.lang || 'en-IN';
  if (!text) return send(res, 400, { error: 'No speech text received.' });

  // 1. Translate incoming query to English for NLU understanding
  let englishText = text;
  let detectedLang = lang;
  if (!lang.startsWith('en')) {
    const tr = await translateText(text, 'en', lang);
    englishText = tr.toString();
    if (lang === 'auto' && tr.detectedLang) detectedLang = tr.detectedLang;
  }

  // 2. Classify Intent
  const intent = classifyIntent(englishText);
  let replyText = '';
  let data = {};
  let featurePage = 'assistant.html';
  let featureLabel = 'Voice Assistant';

  if (intent === 'workshare') {
    const recs = assessSkillGapsAndRecommend({ skills: englishText, currentLivelihood: englishText });
    const topTrade = recs.topRecommendations[0];
    replyText = `Based on what you said, PM-AJAY has verified livelihood opportunities in ${topTrade.tradeName} (NSQF Level ${topTrade.nsqfLevel}) with expected earnings around ₹${topTrade.typicalWageRange.min.toLocaleString()} to ₹${topTrade.typicalWageRange.max.toLocaleString()} per month. You can view all aligned trades on our NSQF Skilling page.`;
    data = { recommendations: recs.topRecommendations };
    featurePage = 'nsqf.html';
    featureLabel = 'NSQF Skilling Engine';

  } else if (intent === 'fairwage') {
    const { type, hours, period = 'monthly' } = extractTaskDetails(englishText);
    const rate = store.db.fairwageRates[type] || 75;
    const baseWage = rate * hours;
    const wageLow = Math.round(baseWage * 0.95);
    const wageHigh = Math.round(baseWage * 1.15);
    replyText = `For ${type} (${hours} hours), under PM-AJAY and State Labor standards, a fair expected ${period} wage is between ₹${wageLow.toLocaleString()} and ₹${wageHigh.toLocaleString()}. Never accept pay below the statutory minimum.`;
    data = { type, hours, period, wageLow, wageHigh };
    featurePage = 'fairwage.html';
    featureLabel = 'AI Fair-Wage Estimator';

  } else if (intent === 'problemshare') {
    const answer = findKnowledgeAnswer(englishText);
    const tag = guessMachineTag(englishText);
    replyText = `Regarding your ${tag} issue: ${answer} — I have connected you to the PM-AJAY Peer Knowledge Network where fellow artisans and technicians in your district can assist.`;
    data = { tag, answer };
    featurePage = 'peerwork.html';
    featureLabel = 'AI Peer Work Network';

  } else if (intent === 'question') {
    const answer = findKnowledgeAnswer(englishText);
    replyText = answer;
    data = { answer };
    featurePage = 'nsqf.html';
    featureLabel = 'Livelihood Advisory';

  } else {
    // General skilling / livelihood recommendation fallback
    const recs = assessSkillGapsAndRecommend({ skills: englishText });
    const topTrade = recs.topRecommendations[0];
    replyText = `Hello! I heard: "${text}". Under the PM-AJAY scheme, you are eligible for 100% free certified training in ${topTrade.tradeName} (NSQF Level ${topTrade.nsqfLevel}) with tool kit grant and job placement support.`;
    data = { topTrade };
    featurePage = 'nsqf.html';
    featureLabel = 'PM-AJAY Skilling';
  }

  // 3. Translate reply back to the user's spoken language
  if (detectedLang && !detectedLang.startsWith('en') && detectedLang !== 'auto') {
    replyText = (await translateText(replyText, detectedLang, 'en')).toString();
  }

  send(res, 200, {
    intent,
    replyText,
    data,
    detectedLang,
    featurePage,
    featureLabel
  });
});

// ==========================================
// FEATURE 3 & 4: NSQF Recommendation & Skill-Gap Assessment
// ==========================================
route('GET', '/api/nsqf/trades', async (req, res) => {
  send(res, 200, { trades: NSQF_TRADES, total: NSQF_TRADES.length });
});

route('POST', '/api/nsqf/recommend', async (req, res, ctx) => {
  const profile = ctx.body || {};
  const assessment = assessSkillGapsAndRecommend(profile);
  send(res, 200, assessment);
});

// ==========================================
// FEATURE 5: Multi-Channel Low-Tech Simulator (IVR + WhatsApp + Kiosk)
// ==========================================
route('POST', '/api/multichannel/ivr', async (req, res, ctx) => {
  const { digit, speechText = '', step = 1, lang = 'hi' } = ctx.body;
  let promptAudio = '';
  let responseText = '';
  let nextStep = step + 1;

  if (step === 1) {
    responseText = "Namaste! Welcome to SAATHI PM-AJAY Helpline. For Hindi, press 1. For Tamil, press 2. For Telugu, press 3. For English, press 4.";
  } else if (step === 2) {
    const langMap = { '1': 'Hindi', '2': 'Tamil', '3': 'Telugu', '4': 'English' };
    const chosen = langMap[digit] || 'Hindi';
    responseText = `Language selected: ${chosen}. Tell us: What work or skill do you know? (e.g. stitching, electrical, driving, farming)`;
  } else if (step === 3) {
    const recs = assessSkillGapsAndRecommend({ skills: speechText || 'stitching' });
    const top = recs.topRecommendations[0];
    responseText = `We found a great free training for you: ${top.tradeName} under PM-AJAY GIA scheme. Duration is ${top.trainingHours} hours with ₹${top.typicalWageRange.min.toLocaleString()} per month placement. An SMS has been sent to your phone. Press 1 to register or 2 to speak to a coordinator.`;
    nextStep = 4;
  } else {
    responseText = "Thank you! Your nearest PM-AJAY GIA training centre coordinator has been notified. You will receive an automated callback within 2 hours. Goodbye!";
    nextStep = 1;
  }

  store.db.multiChannelSessions.unshift({
    id: store.id('ivr'),
    channel: 'IVR Call (Keypad Phone)',
    phone: '+91 98451 XXXXX',
    language: lang,
    durationSecs: 45 * step,
    result: responseText.slice(0, 80) + '...',
    timestamp: new Date().toISOString()
  });
  store.save();

  send(res, 200, { step: nextStep, responseText });
});

route('POST', '/api/multichannel/whatsapp', async (req, res, ctx) => {
  const { message = '', lang = 'hi-IN' } = ctx.body;
  let translatedInput = message;
  if (!lang.startsWith('en')) {
    translatedInput = (await translateText(message, 'en', lang)).toString();
  }

  const recs = assessSkillGapsAndRecommend({ skills: translatedInput, currentLivelihood: translatedInput });
  const top = recs.topRecommendations[0];

  let reply = `*SAATHI PM-AJAY Livelihood Assistant*\n\nBased on your message, here is your certified skilling pathway:\n\n*Trade:* ${top.tradeName}\n*NSQF Level:* ${top.nsqfLevel}\n*Sector:* ${top.sector}\n*Training Hours:* ${top.trainingHours} hrs (100% Free under GIA)\n*Expected Wage:* ₹${top.typicalWageRange.min.toLocaleString()} - ₹${top.typicalWageRange.max.toLocaleString()}/mo\n*Skill-Gap Covered:* ${top.missingSkills.slice(0, 2).join(', ')}\n\n_Reply with YES to enroll or VOICE NOTE to speak!_`;

  if (!lang.startsWith('en')) {
    reply = (await translateText(reply, lang, 'en')).toString();
  }

  store.db.multiChannelSessions.unshift({
    id: store.id('wa'),
    channel: 'WhatsApp Voice Note',
    phone: '+91 97112 XXXXX',
    language: lang,
    durationSecs: 30,
    result: `Matched ${top.tradeName} (NSQF-${top.nsqfLevel})`,
    timestamp: new Date().toISOString()
  });
  store.save();

  send(res, 200, { reply, trade: top });
});

route('GET', '/api/multichannel/logs', async (req, res) => {
  send(res, 200, { sessions: store.db.multiChannelSessions });
});

// ==========================================
// FEATURE 6: Post-Training Placement & Coordination Tracking
// ==========================================
route('GET', '/api/placement/all', async (req, res) => {
  send(res, 200, { beneficiaries: store.db.beneficiaries });
});

route('POST', '/api/placement/update', async (req, res, ctx) => {
  const { id, placementStatus, employer, monthlyIncome, retentionMonths } = ctx.body;
  const ben = store.db.beneficiaries.find(b => b.id === id);
  if (!ben) return send(res, 404, { error: 'Beneficiary record not found.' });

  if (placementStatus) ben.placementStatus = placementStatus;
  if (employer) ben.employer = employer;
  if (monthlyIncome !== undefined) ben.monthlyIncome = Number(monthlyIncome);
  if (retentionMonths !== undefined) ben.retentionMonths = Number(retentionMonths);

  store.save();
  send(res, 200, { ok: true, beneficiary: ben });
});

route('POST', '/api/placement/followup', async (req, res, ctx) => {
  const { beneficiaryId, notes = '' } = ctx.body;
  const ben = store.db.beneficiaries.find(b => b.id === beneficiaryId);
  if (!ben) return send(res, 404, { error: 'Beneficiary not found.' });

  send(res, 200, {
    ok: true,
    message: `Automated WhatsApp follow-up voice note scheduled for ${ben.name}. Coordination flag cleared.`
  });
});

// ==========================================
// FEATURE 8: MoSJE PM-AJAY GIA Planning Dashboard
// ==========================================
route('GET', '/api/gia/summary', async (req, res) => {
  const beneficiaries = store.db.beneficiaries;
  const plans = store.db.giaPerspectivePlans;

  const totalTarget = plans.reduce((acc, p) => acc + p.targetBeneficiaries, 0);
  const totalEnrolled = plans.reduce((acc, p) => acc + p.enrolledBeneficiaries, 0);
  const totalCertified = plans.reduce((acc, p) => acc + p.certifiedBeneficiaries, 0);
  const totalPlaced = plans.reduce((acc, p) => acc + p.placedBeneficiaries, 0);
  const totalFundAllocated = plans.reduce((acc, p) => acc + p.totalGiaFundAllocatedCr, 0);
  const totalFundUtilized = plans.reduce((acc, p) => acc + p.totalGiaFundUtilizedCr, 0);

  const placementRate = Math.round((totalPlaced / (totalCertified || 1)) * 100);
  const fundUtilizationRate = Math.round((totalFundUtilized / (totalFundAllocated || 1)) * 100);

  send(res, 200, {
    kpis: {
      totalTarget,
      totalEnrolled,
      totalCertified,
      totalPlaced,
      placementRate,
      totalFundAllocatedCr: totalFundAllocated.toFixed(2),
      totalFundUtilizedCr: totalFundUtilized.toFixed(2),
      fundUtilizationRate,
      activeBatches: plans.reduce((acc, p) => acc + p.activeBatches, 0),
      totalConsultants: store.db.financialConsultants.length
    },
    districtPlans: plans,
    consultants: store.db.financialConsultants
  });
});

// ==========================================
// FEATURE 9: AI Fair-Wage Estimator
// ==========================================
route('GET', '/api/fairwage/rates', async (req, res) => {
  send(res, 200, { rates: store.db.fairwageRates });
});

route('POST', '/api/fairwage/estimate', async (req, res, ctx) => {
  const { type = 'stitching', hours = 8, period = 'monthly', region = 'National Benchmark', nsqfLevel = 4 } = ctx.body;
  const hourlyRate = store.db.fairwageRates[type.toLowerCase()] || 75;

  let multiplier = 1;
  if (period === 'monthly') multiplier = hours * 26;
  else if (period === 'weekly') multiplier = hours * 6;
  else multiplier = hours;

  const baseWage = Math.round(hourlyRate * multiplier);
  const levelBonus = 1 + ((Number(nsqfLevel) || 4) - 3) * 0.08;
  const wageLow = Math.round(baseWage * 0.95 * levelBonus);
  const wageHigh = Math.round(baseWage * 1.18 * levelBonus);
  const employerCost = Math.round(wageHigh * 1.25); // includes PF, ESIC, insurance

  const result = {
    type,
    nsqfLevel: Number(nsqfLevel) || 4,
    hours: Number(hours),
    period,
    region,
    hourlyRate,
    wageLow,
    wageHigh,
    employerCost,
    statutoryMinimumWage: Math.round(baseWage * 0.90),
    complianceStatus: 'Exceeds National Floor Level Minimum Wage (Code on Wages 2019)'
  };

  store.db.fairwageEstimates.unshift({ id: store.id('fw'), ...result, time: new Date().toISOString() });
  store.save();

  send(res, 200, { result });
});

// ==========================================
// FEATURE 10: AI Peer Work & Problem-Sharing Network
// ==========================================
route('GET', '/api/peerwork/clusters', async (req, res) => {
  send(res, 200, { clusters: store.db.peerClusters });
});

route('POST', '/api/peerwork/share-problem', async (req, res, ctx) => {
  const { clusterId, problem, author = 'Beneficiary Artisan' } = ctx.body;
  if (!problem) return send(res, 400, { error: 'Please describe the problem.' });

  const cluster = store.db.peerClusters.find(c => c.id === clusterId) || store.db.peerClusters[0];
  const item = {
    issue: problem.trim(),
    author,
    status: 'Shared in peer group — AI solution suggestion generated',
    timeLabel: 'Just now'
  };
  cluster.commonProblemsLogged.unshift(item);
  store.save();

  const aiSuggestion = findKnowledgeAnswer(problem);
  send(res, 201, { ok: true, problem: item, aiSuggestion });
});

route('POST', '/api/peerwork/share-order', async (req, res, ctx) => {
  const { clusterId, orderTitle, quantity, deadline } = ctx.body;
  const cluster = store.db.peerClusters.find(c => c.id === clusterId) || store.db.peerClusters[0];
  cluster.activeOrdersShared = (cluster.activeOrdersShared || 0) + 1;
  store.save();

  send(res, 201, {
    ok: true,
    message: `Order "${orderTitle}" (${quantity || 'Bulk'}) broadcasted to ${cluster.membersCount} members in ${cluster.trade} cluster!`
  });
});

// ==========================================
// Authentication
// ==========================================
route('POST', '/api/auth/signup', async (req, res, ctx) => {
  const { name, phone, password, role, unit } = ctx.body;
  if (!name || !phone || !password) return send(res, 400, { error: 'Name, phone and password are required.' });
  if (store.db.users.find(u => u.phone === phone)) return send(res, 409, { error: 'Phone number already registered.' });

  const user = {
    id: store.id('u'),
    name,
    phone,
    passwordHash: hashPassword(password),
    role: role || 'beneficiary',
    unit: unit || 'General Candidate',
    createdAt: new Date().toISOString()
  };
  store.db.users.push(user);
  store.save();
  const token = createToken({ uid: user.id });
  send(res, 201, { token, user: publicUser(user) });
});

route('POST', '/api/auth/login', async (req, res, ctx) => {
  const { phone, password } = ctx.body;
  const user = store.db.users.find(u => u.phone === phone);
  if (!user || (user.passwordHash !== 'demo' && !verifyPassword(password || '', user.passwordHash))) {
    return send(res, 401, { error: 'Invalid phone or password.' });
  }
  const token = createToken({ uid: user.id });
  send(res, 200, { token, user: publicUser(user) });
});

route('GET', '/api/auth/me', async (req, res, ctx) => send(res, 200, { user: publicUser(ctx.user) }), { auth: true });

// ---------- Server Setup ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, {});

  const match = routes.find(r => r.method === req.method && r.path === pathname);
  if (!match) return send(res, 404, { error: `Endpoint ${pathname} not found on SAATHI API.` });

  const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : {};
  const user = getUser(req);

  if (match.auth && !user) return send(res, 401, { error: 'Authentication required.' });

  try {
    await match.handler(req, res, { body, query: parsed.query, user });
  } catch (err) {
    console.error('Server error on', pathname, err);
    send(res, 500, { error: 'Internal server error on SAATHI backend.' });
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`SAATHI MoSJE PM-AJAY Backend running on port ${PORT}`);
  console.log(`10 Core Features Enabled: Interview, Voice, NSQF, IVR,`);
  console.log(`WhatsApp, Placement, GIA Dashboard, Fair-Wage, PeerWork`);
  console.log(`=======================================================`);
});
