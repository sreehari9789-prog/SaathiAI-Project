// Tiny JSON-file persistence layer. No external dependencies on purpose —
// this backend is meant to run with nothing but `node server.js`.
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function seed() {
  return {
    users: [],
    memory: [
      { id: 'm1', userId: null, tag: 'Compressor', text: 'Hissing sound near the second valve joint, tightened the fitting and the leak stopped.', unit: 'Unit A', time: daysAgo(2) },
      { id: 'm2', userId: null, tag: 'Loom', text: 'Thread kept snapping on the left side, tension screw was too tight, loosened it half a turn.', unit: 'Unit B', time: daysAgo(5) },
      { id: 'm3', userId: null, tag: 'Motor', text: 'Motor was overheating after lunch break, cleaned the vents, was full of dust.', unit: 'Unit A', time: daysAgo(7) }
    ],
    workshareTasks: [
      { id: 't1', unit: 'Unit B', dist: '2 km away', task: 'Need 2 workers for packing, tomorrow morning, 4 hours', skill: 'packing' },
      { id: 't2', unit: 'Unit D', dist: '3.5 km away', task: 'Stitching help needed for 2 days, festival order', skill: 'stitching weaving' },
      { id: 't3', unit: 'Unit A', dist: '1 km away', task: 'Loading and unloading a truck, this evening, urgent', skill: 'loading' },
      { id: 't4', unit: 'Unit C', dist: '4 km away', task: 'Machine operator needed for one week, cutting section', skill: 'cutting machine' },
      { id: 't5', unit: 'Unit E', dist: '2.8 km away', task: 'General cleaning help needed, half day', skill: 'cleaning' }
    ],
    workshareRequests: [],
    employerJobs: [],
    problems: [
      { id: 'p1', userId: null, problem: 'Loom thread keeps snapping on the left side during weaving', solution: 'Check the tension screw...', tag: 'Loom', unit: 'Unit A', time: daysAgo(1) },
      { id: 'p2', userId: null, problem: 'Motor vibrating a lot', solution: 'Check motor mounts and bearing condition.', tag: 'Motor', unit: 'Unit C', time: daysAgo(3) },
      { id: 'p3', userId: null, problem: 'Machine oil leaking', solution: 'Tighten the valve fittings or replace gaskets.', tag: 'General', unit: 'Unit B', time: daysAgo(6) }
    ],
    fairwageRates: { 
      cutting: 55, welding: 70, weaving: 60, packing: 45, loading: 50, 'machine operating': 65, cleaning: 40, stitching: 50,
      'assembly line': 60, fabrication: 75, 'quality checking': 55,
      'handloom weaving': 70, handicraft: 60, 'village industry': 50,
      painting: 55, carpentry: 65, plumbing: 60, electrical: 70, masonry: 65, gardening: 40, cooking: 45, driving: 55, security: 45, tailoring: 55
    },
    fairwageEstimates: [],
    safetyReports: [
      { id: 's1', userId: null, machine: 'Boiler', description: 'Pressure gauge needle sticking, flagged for maintenance before next shift.', severity: 'medium', unit: 'Unit A', time: daysAgo(1), status: 'open' }
    ],
    grievances: []
  };
}

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function load() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = seed();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {
    const initial = seed();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
}

let db = load();
let writeQueued = false;

function save() {
  // Debounce writes slightly so bursts of requests don't hammer the disk.
  if (writeQueued) return;
  writeQueued = true;
  setTimeout(() => {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    writeQueued = false;
  }, 50);
}

function id(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = { get db() { return db; }, save, id };
