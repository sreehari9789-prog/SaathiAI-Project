// Saathi backend — a plain Node.js HTTP API, no npm install required.
// Run with:  node server.js   (defaults to port 4000)
const http = require('http');
const https = require('https');
const url = require('url');
const store = require('./lib/store');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('./lib/auth');
const { classifyIntent, guessMachineTag, extractTaskDetails, guessSeverity, findKnowledgeAnswer } = require('./lib/intent');

const PORT = process.env.PORT || 4000;

// ---------- small helpers ----------
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
    req.on('data', (chunk) => { raw += chunk; if (raw.length > 1e6) req.destroy(); });
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

function translateText(text, targetLang, sourceLang = 'auto') {
  return new Promise((resolve) => {
    if (!targetLang) return resolve(text);
    if (targetLang.startsWith('en') && sourceLang === 'auto') {
      // Allow translating auto to english
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
    }).on('error', () => resolve(text));
  });
}

// ---------- route handlers ----------
const routes = [];
function route(method, path, handler, opts = {}) { routes.push({ method, path, handler, auth: !!opts.auth }); }

// health
route('GET', '/api/health', async (req, res) => send(res, 200, { ok: true, service: 'saathi-backend', time: new Date().toISOString() }));

// ---- auth ----
route('POST', '/api/auth/signup', async (req, res, ctx) => {
  const { name, phone, password, role, unit } = ctx.body;
  if (!name || !phone || !password) return send(res, 400, { error: 'Name, phone and password are required.' });
  if (password.length < 4) return send(res, 400, { error: 'Password must be at least 4 characters.' });
  if (store.db.users.find(u => u.phone === phone)) return send(res, 409, { error: 'An account with this phone number already exists.' });
  const user = {
    id: store.id('u'), name, phone, passwordHash: hashPassword(password),
    role: role || 'worker', unit: unit || 'Unit A', createdAt: new Date().toISOString()
  };
  store.db.users.push(user);
  store.save();
  const token = createToken({ uid: user.id });
  send(res, 201, { token, user: publicUser(user) });
});

route('POST', '/api/auth/login', async (req, res, ctx) => {
  const { phone, password } = ctx.body;
  const user = store.db.users.find(u => u.phone === phone);
  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    return send(res, 401, { error: 'Phone number or password is incorrect.' });
  }
  const token = createToken({ uid: user.id });
  send(res, 200, { token, user: publicUser(user) });
});

route('GET', '/api/auth/me', async (req, res, ctx) => send(res, 200, { user: publicUser(ctx.user) }), { auth: true });

// ---- knowledge memory ----
route('GET', '/api/memory', async (req, res, ctx) => {
  const q = (ctx.query.search || '').toLowerCase();
  let list = [...store.db.memory].sort((a, b) => new Date(b.time) - new Date(a.time));
  if (q) list = list.filter(e => (e.tag + ' ' + e.text).toLowerCase().includes(q));
  send(res, 200, { entries: list.map(e => ({ ...e, timeLabel: relTime(e.time) })) });
});

route('POST', '/api/memory', async (req, res, ctx) => {
  const { tag, text } = ctx.body;
  if (!text || !text.trim()) return send(res, 400, { error: 'Describe the fix before saving.' });
  const entry = { id: store.id('m'), userId: ctx.user.id, tag: tag || guessMachineTag(text), text: text.trim(), unit: ctx.user.unit, time: new Date().toISOString() };
  store.db.memory.unshift(entry);
  store.save();
  send(res, 201, { entry: { ...entry, timeLabel: 'just now' } });
}, { auth: true });

// ---- AI workshare ----
route('GET', '/api/workshare/tasks', async (req, res) => send(res, 200, { tasks: store.db.workshareTasks }));

route('POST', '/api/workshare/match', async (req, res, ctx) => {
  const text = (ctx.body.text || '').toLowerCase();
  let matches = store.db.workshareTasks.filter(t => t.skill.split(' ').some(s => text.includes(s)));
  if (matches.length === 0) matches = store.db.workshareTasks.slice(0, 2);
  if (ctx.user) {
    store.db.workshareRequests.unshift({ id: store.id('w'), userId: ctx.user.id, text: ctx.body.text || '', matchedTaskIds: matches.map(m => m.id), time: new Date().toISOString() });
    store.save();
  }
  send(res, 200, { matches });
});

route('GET', '/api/workshare/mine', async (req, res, ctx) => {
  const mine = store.db.workshareRequests.filter(r => r.userId === ctx.user.id).slice(0, 10);
  send(res, 200, { requests: mine });
}, { auth: true });

// ---- fairwage ----
route('GET', '/api/fairwage/rates', async (req, res) => send(res, 200, { rates: store.db.fairwageRates }));

route('POST', '/api/fairwage/estimate', async (req, res, ctx) => {
  const { type, hours } = ctx.body;
  const rate = store.db.fairwageRates[type] || 50;
  const h = (!hours || hours <= 0) ? 8 : Number(hours);
  const wageLow = Math.round(rate * h * 0.95);
  const wageHigh = Math.round(rate * h * 1.1);
  const employerCost = Math.round(wageHigh * 1.22);
  const result = { type: type || 'cutting', hours: h, rate, wageLow, wageHigh, employerCost };
  if (ctx.user) {
    store.db.fairwageEstimates.unshift({ id: store.id('f'), userId: ctx.user.id, ...result, time: new Date().toISOString() });
    store.save();
  }
  send(res, 200, { result });
});

// ---- safety ----
route('POST', '/api/safety/report', async (req, res, ctx) => {
  const { machine, description, severity } = ctx.body;
  if (!description || !description.trim()) return send(res, 400, { error: 'Describe the hazard before reporting.' });
  const report = {
    id: store.id('s'), userId: ctx.user.id, machine: machine || 'Unspecified',
    description: description.trim(), severity: severity || guessSeverity(description),
    unit: ctx.user.unit, time: new Date().toISOString(), status: 'open'
  };
  store.db.safetyReports.unshift(report);
  store.save();
  send(res, 201, { report: { ...report, timeLabel: 'just now' } });
}, { auth: true });

route('GET', '/api/safety/recent', async (req, res) => {
  const list = [...store.db.safetyReports].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 20);
  send(res, 200, { reports: list.map(r => ({ ...r, timeLabel: relTime(r.time) })) });
});

// ---- grievance / helpline ----
route('POST', '/api/grievance/submit', async (req, res, ctx) => {
  const { category, description } = ctx.body;
  if (!description || !description.trim()) return send(res, 400, { error: 'Describe the issue before submitting.' });
  const g = {
    id: store.id('g'), userId: ctx.user.id, category: category || 'general',
    description: description.trim(), unit: ctx.user.unit, time: new Date().toISOString(), status: 'received'
  };
  store.db.grievances.unshift(g);
  store.save();
  send(res, 201, { grievance: { ...g, timeLabel: 'just now' } });
}, { auth: true });

route('GET', '/api/grievance/mine', async (req, res, ctx) => {
  const mine = store.db.grievances.filter(g => g.userId === ctx.user.id).sort((a, b) => new Date(b.time) - new Date(a.time));
  send(res, 200, { grievances: mine.map(g => ({ ...g, timeLabel: relTime(g.time) })) });
}, { auth: true });

// ---- employer job posting ----
route('POST', '/api/employer/postjob', async (req, res, ctx) => {
  if (ctx.user.role !== 'employer') return send(res, 403, { error: 'Only employers can post jobs.' });
  const { task, skill, duration, dist } = ctx.body;
  if (!task || !skill) return send(res, 400, { error: 'Task description and skill are required.' });
  const job = {
    id: store.id('j'), employerId: ctx.user.id, unit: ctx.user.unit,
    task: task.trim(), skill: (skill || '').toLowerCase().trim(),
    duration: duration || 'Flexible', dist: dist || 'On-site',
    time: new Date().toISOString(), status: 'open'
  };
  store.db.employerJobs.unshift(job);
  // Also add to workshareTasks so workers can find it
  store.db.workshareTasks.unshift({ id: job.id, unit: job.unit, dist: job.dist, task: job.task, skill: job.skill });
  store.save();
  send(res, 201, { job });
}, { auth: true });

route('GET', '/api/employer/myjobs', async (req, res, ctx) => {
  const jobs = store.db.employerJobs.filter(j => j.employerId === ctx.user.id);
  send(res, 200, { jobs });
}, { auth: true });

// ---- problemshare ----
route('POST', '/api/problemshare/ask', async (req, res, ctx) => {
  const text = (ctx.body.text || '').trim();
  const lang = ctx.body.lang || 'en-IN';
  if (!text) return send(res, 400, { error: 'Describe your problem.' });
  
  let englishText = text;
  if (!lang.startsWith('en')) {
    englishText = await translateText(text, 'en', lang);
  }
  
  const answer = findKnowledgeAnswer(englishText);
  const tag = guessMachineTag(englishText);
  const uid = ctx.user ? ctx.user.id : null;
  const unit = ctx.user ? ctx.user.unit : 'Guest';
  const problem = {
    id: store.id('p'), userId: uid, problem: text, problemEn: englishText,
    solution: answer, tag, unit, time: new Date().toISOString()
  };
  store.db.problems.unshift(problem);
  store.save();
  
  let translatedAnswer = answer;
  if (!lang.startsWith('en')) {
    translatedAnswer = await translateText(answer, lang, 'en');
  }
  send(res, 200, { problem: { ...problem, solution: translatedAnswer } });
});

route('GET', '/api/problemshare/recent', async (req, res) => {
  const list = (store.db.problems || []).slice(0, 20).map(p => ({ ...p, timeLabel: relTime(p.time) }));
  send(res, 200, { problems: list });
});

// ---- voice assistant: single entry point that classifies + routes + acts ----
route('POST', '/api/assistant/query', async (req, res, ctx) => {
  const text = (ctx.body.text || '').trim();
  const lang = ctx.body.lang || 'en-IN';
  if (!text) return send(res, 400, { error: 'No speech text received.' });
  
  // Step 1: Translate user text to English for reliable intent classification
  let englishText = text;
  let detectedLang = lang;
  if (!lang.startsWith('en')) {
    const tr = await translateText(text, 'en', lang);
    englishText = tr.toString();
    if (lang === 'auto' && tr.detectedLang) detectedLang = tr.detectedLang;
  }

  // Step 2: Classify intent on English text
  const intent = classifyIntent(englishText);
  const uid = ctx.user ? ctx.user.id : null;
  const unit = ctx.user ? ctx.user.unit : 'Guest';
  let replyText = '';
  let data = {};
  let featurePage = '';
  let featureLabel = '';

  // Step 3: Route to the correct feature and generate a rich, contextual reply
  if (intent === 'question') {
    // Problem-solving: search knowledge base for answer
    const answer = findKnowledgeAnswer(englishText);
    const tag = guessMachineTag(englishText);
    // Also save to memory so other workers can find this Q&A
    const entry = { id: store.id('m'), userId: uid, tag, text: 'Q: ' + text, unit, time: new Date().toISOString() };
    store.db.memory.unshift(entry);
    replyText = `You asked about ${tag.toLowerCase()} related issues. Here is what I know: ${answer} — I have also saved your question in Knowledge Memory so other workers can benefit from it. You can browse more solutions on the Knowledge Memory page.`;
    data = { entry, answer };
    featurePage = 'memory.html';
    featureLabel = 'Knowledge Memory';

  } else if (intent === 'workshare') {
    let matches = store.db.workshareTasks.filter(t => t.skill.split(' ').some(s => englishText.toLowerCase().includes(s)));
    if (matches.length === 0) matches = store.db.workshareTasks.slice(0, 2);
    if (uid) { store.db.workshareRequests.unshift({ id: store.id('w'), userId: uid, text, matchedTaskIds: matches.map(m => m.id), time: new Date().toISOString() }); }
    const topTask = matches[0];
    replyText = `I understood you are looking for work. I found ${matches.length} open task${matches.length === 1 ? '' : 's'} matching your skills. The best match is: "${topTask.task}" at ${topTask.unit}, ${topTask.dist}. You can view all available tasks and apply on the AI WorkShare page.`;
    data = { matches };
    featurePage = 'workshare.html';
    featureLabel = 'AI WorkShare';

  } else if (intent === 'fairwage') {
    const { type, hours, period } = extractTaskDetails(englishText);
    const rate = store.db.fairwageRates[type] || 50;
    
    let wageLow, wageHigh;
    if (period === 'weekly') {
      wageLow = Math.round(rate * 8 * 6 * 0.95);
      wageHigh = Math.round(rate * 8 * 6 * 1.1);
    } else if (period === 'monthly') {
      wageLow = Math.round(rate * 8 * 26 * 0.95);
      wageHigh = Math.round(rate * 8 * 26 * 1.1);
    } else {
      // daily
      wageLow = Math.round(rate * hours * 0.95);
      wageHigh = Math.round(rate * hours * 1.1);
    }
    
    const employerCost = Math.round(wageHigh * 1.22);
    if (uid) store.db.fairwageEstimates.unshift({ id: store.id('f'), userId: uid, type, hours, period, rate, wageLow, wageHigh, employerCost, time: new Date().toISOString() });
    
    let periodText = period === 'weekly' ? 'a week' : period === 'monthly' ? 'a month' : `${hours} hours`;
    replyText = `You asked about wages for ${type} work. For ${periodText} of ${type}, a fair wage is between ₹${wageLow} and ₹${wageHigh}. The total employer cost including benefits comes to roughly ₹${employerCost}. You can calculate more estimates on the FairWage Estimator page.`;
    data = { type, hours, period, wageLow, wageHigh, employerCost };
    featurePage = 'fairwage.html';
    featureLabel = 'FairWage Estimator';

  } else if (intent === 'safety') {
    const severity = guessSeverity(englishText);
    const machine = guessMachineTag(englishText);
    const report = { id: store.id('s'), userId: uid, machine, description: englishText, severity, unit, time: new Date().toISOString(), status: 'open' };
    store.db.safetyReports.unshift(report);
    if (severity === 'high') {
      replyText = `This sounds urgent! I understood you are reporting a safety hazard related to ${machine}. I have logged it as HIGH severity and flagged your unit supervisor immediately. Please move away from the danger area. You can track all safety reports on the Safety Reporter page.`;
    } else {
      replyText = `I understood you are reporting a safety concern related to ${machine}. I have logged it with ${severity} severity so the maintenance team can review it. You can track the status of all reports on the Safety Reporter page.`;
    }
    data = { report };
    featurePage = 'safety.html';
    featureLabel = 'Safety Reporter';

  } else if (intent === 'problemshare') {
    const answer = findKnowledgeAnswer(englishText);
    const tag = guessMachineTag(englishText);
    const problem = { id: store.id('p'), userId: uid, problem: text, problemEn: englishText, solution: answer, tag, unit, time: new Date().toISOString() };
    store.db.problems.unshift(problem);
    replyText = `You reported a ${tag.toLowerCase()} related problem. Here is what I suggest: ${answer} — I have saved this in ProblemShare so other workers facing similar issues can benefit. Visit the ProblemShare page to see more solutions.`;
    data = { problem };
    featurePage = 'problemshare.html';
    featureLabel = 'ProblemShare';

  } else if (intent === 'grievance') {
    const g = { id: store.id('g'), userId: uid, category: 'voice-reported', description: englishText, unit, time: new Date().toISOString(), status: 'received' };
    store.db.grievances.unshift(g);
    replyText = 'I understood your concern. I have filed this as a confidential grievance. Only the helpline reviewer can see it — your identity is protected. You will be notified when there is an update. You can check the status of your grievances on the Helpline page.';
    data = { grievance: g };
    featurePage = 'grievance.html';
    featureLabel = 'Helpline';

  } else {
    // Default: save to knowledge memory
    const tag = guessMachineTag(englishText);
    const entry = { id: store.id('m'), userId: uid, tag, text, unit, time: new Date().toISOString() };
    store.db.memory.unshift(entry);
    replyText = `I have saved what you said to Knowledge Memory under the "${tag}" category. Any worker searching for a similar fix will be able to find it. You can browse and search all saved knowledge on the Knowledge Memory page.`;
    data = { entry };
    featurePage = 'memory.html';
    featureLabel = 'Knowledge Memory';
  }

  store.save();

  // Step 4: Translate reply back to user's language
  if (detectedLang && !detectedLang.startsWith('en') && detectedLang !== 'auto') {
    replyText = (await translateText(replyText, detectedLang, 'en')).toString();
  }

  send(res, 200, { intent, replyText, data, detectedLang, featurePage, featureLabel });
});

// ---- dashboard ----
route('GET', '/api/dashboard/summary', async (req, res, ctx) => {
  const uid = ctx.user.id;
  const myMemory = store.db.memory.filter(e => e.userId === uid);
  const myWorkshare = store.db.workshareRequests.filter(r => r.userId === uid);
  const myWage = store.db.fairwageEstimates.filter(e => e.userId === uid);
  const mySafety = store.db.safetyReports.filter(r => r.userId === uid);
  const myGrievance = store.db.grievances.filter(g => g.userId === uid);

  const activity = [
    ...myMemory.map(e => ({ type: 'memory', label: `Saved a fix: ${e.tag}`, time: e.time })),
    ...myWorkshare.map(e => ({ type: 'workshare', label: 'Searched for open work', time: e.time })),
    ...myWage.map(e => ({ type: 'fairwage', label: `Estimated wage for ${e.type}`, time: e.time })),
    ...mySafety.map(e => ({ type: 'safety', label: `Reported hazard: ${e.machine}`, time: e.time })),
    ...myGrievance.map(e => ({ type: 'grievance', label: 'Filed a grievance', time: e.time }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
   .map(a => ({ ...a, timeLabel: relTime(a.time) }));

  send(res, 200, {
    counts: {
      memory: myMemory.length, workshare: myWorkshare.length, fairwage: myWage.length,
      safety: mySafety.length, grievance: myGrievance.length
    },
    unitTotals: {
      memory: store.db.memory.length, safetyOpen: store.db.safetyReports.filter(r => r.status === 'open').length
    },
    activity
  });
}, { auth: true });

// ---------- server ----------
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, {});

  const match = routes.find(r => r.method === req.method && r.path === pathname);
  if (!match) return send(res, 404, { error: 'Not found' });

  const body = (req.method === 'POST' || req.method === 'PUT') ? await readBody(req) : {};
  const user = getUser(req);

  if (match.auth && !user) return send(res, 401, { error: 'Please log in to continue.' });

  try {
    await match.handler(req, res, { body, query: parsed.query, user });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Something went wrong on the server.' });
  }
});

server.listen(PORT, () => {
  console.log(`Saathi backend running → http://localhost:${PORT}`);
  console.log('No external packages required — pure Node.js.');
});
