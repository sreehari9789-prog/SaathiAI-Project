// Tiny JSON-file persistence layer. Zero external dependencies.
// Aligned with SIH26097 — MoSJE PM-AJAY Livelihood Mapping & NSQF Recommendations
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function seed() {
  return {
    users: [
      { id: 'u_demo1', name: 'Rameshwar Kumar', phone: '9876543210', passwordHash: 'demo', role: 'beneficiary', unit: 'Varanasi Weaving Cluster', createdAt: daysAgo(30) },
      { id: 'u_officer1', name: 'Dr. Sunita Verma (IAS)', phone: '9123456780', passwordHash: 'demo', role: 'admin', unit: 'MoSJE PM-AJAY National Mission', createdAt: daysAgo(60) }
    ],
    // Beneficiary Profiles captured through Voice Assistant / Multi-Turn Interview
    beneficiaries: [
      {
        id: 'ben_101',
        name: 'Sunita Devi',
        phone: '9845123456',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        education: '8th Pass',
        familyOccupation: 'Traditional Handloom Weaving',
        currentLivelihood: 'Informal daily thread helper (₹150/day)',
        skills: 'weaving, warp preparation, traditional saree motifs',
        mobilityConstraints: 'Within district only',
        employmentPreference: 'Self-employment / Handloom Producer Group',
        recommendedTrade: 'Handloom Weaver (Traditional & Jacquard)',
        nsqfLevel: 3,
        trainingBatch: 'PM-AJAY Varanasi Batch-14',
        trainingStatus: 'Completed',
        placementStatus: 'Self-Employed',
        monthlyIncome: 18500,
        retentionMonths: 8,
        financialConsultantAssigned: 'Rajesh Mishra (CA & Rural Livelihood Consultant)',
        enterpriseGrantReceived: 50000,
        createdAt: daysAgo(90)
      },
      {
        id: 'ben_102',
        name: 'Arjun Paswan',
        phone: '9711223344',
        district: 'Gaya',
        state: 'Bihar',
        education: '10th Pass',
        familyOccupation: 'Smallholder Agriculture & Daily Wage',
        currentLivelihood: 'Casual farm laborer (irregular work)',
        skills: 'electrical wiring, bicycle repair, solar pump curiosity',
        mobilityConstraints: 'Open to nearby industrial towns (up to 50 km)',
        employmentPreference: 'Salaried technician job',
        recommendedTrade: 'Solar PV Installer (Suryamitra)',
        nsqfLevel: 4,
        trainingBatch: 'PM-AJAY Patna Solar Mission-08',
        trainingStatus: 'Completed',
        placementStatus: 'Placed',
        employer: 'Ujjawal Solar Energy Pvt Ltd',
        monthlyIncome: 21500,
        retentionMonths: 6,
        financialConsultantAssigned: 'Pooja Sahay (Financial Inclusion Lead)',
        enterpriseGrantReceived: 0,
        createdAt: daysAgo(75)
      },
      {
        id: 'ben_103',
        name: 'Kavitha R.',
        phone: '9655443322',
        district: 'Salem',
        state: 'Tamil Nadu',
        education: '5th Pass',
        familyOccupation: 'Agricultural wage laborer',
        currentLivelihood: 'Unemployed / homemaker',
        skills: 'basic hand stitching, measuring tape, garment interest',
        mobilityConstraints: 'Salem industrial cluster (bus accessible)',
        employmentPreference: 'Factory wage job with employer PF & health insurance',
        recommendedTrade: 'Sewing Machine Operator',
        nsqfLevel: 4,
        trainingBatch: 'PM-AJAY Salem Apparel Hub-21',
        trainingStatus: 'In-Training',
        placementStatus: 'Under Skilling',
        monthlyIncome: 0,
        retentionMonths: 0,
        financialConsultantAssigned: 'S. Chandrasekar (MSME Advisor)',
        enterpriseGrantReceived: 0,
        createdAt: daysAgo(20)
      },
      {
        id: 'ben_104',
        name: 'Santosh Meghwal',
        phone: '9414556677',
        district: 'Bikaner',
        state: 'Rajasthan',
        education: '8th Pass',
        familyOccupation: 'Leather artisan & shoemaking',
        currentLivelihood: 'Local footwear repair booth',
        skills: 'leather cutting, stitching, tooling, sole bonding',
        mobilityConstraints: 'Within Bikaner city',
        employmentPreference: 'Upgrading family workshop into modern footwear brand',
        recommendedTrade: 'Leather Goods & Footwear Technician',
        nsqfLevel: 4,
        trainingBatch: 'PM-AJAY Leather Skill Corridor-03',
        trainingStatus: 'Completed',
        placementStatus: 'Self-Employed',
        monthlyIncome: 24000,
        retentionMonths: 12,
        financialConsultantAssigned: 'Anil Sharma (District Financial Facilitator)',
        enterpriseGrantReceived: 75000,
        createdAt: daysAgo(120)
      }
    ],
    // GIA (Grant-in-Aid) Perspective Plans & Ministry Resource Management
    giaPerspectivePlans: [
      {
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        scPopulationPercentage: 28.4,
        totalGiaFundAllocatedCr: 4.85,
        totalGiaFundUtilizedCr: 3.92,
        targetBeneficiaries: 1200,
        enrolledBeneficiaries: 1140,
        certifiedBeneficiaries: 980,
        placedBeneficiaries: 840,
        activeBatches: 6,
        assignedConsultants: 4,
        coordinationGaps: 'Needs additional post-placement monitoring in handloom export clusters'
      },
      {
        district: 'Gaya',
        state: 'Bihar',
        scPopulationPercentage: 30.1,
        totalGiaFundAllocatedCr: 5.20,
        totalGiaFundUtilizedCr: 4.10,
        targetBeneficiaries: 1500,
        enrolledBeneficiaries: 1390,
        certifiedBeneficiaries: 1120,
        placedBeneficiaries: 910,
        activeBatches: 8,
        assignedConsultants: 5,
        coordinationGaps: 'Solar sector partners require faster state corporation MOU clearances'
      },
      {
        district: 'Salem',
        state: 'Tamil Nadu',
        scPopulationPercentage: 22.8,
        totalGiaFundAllocatedCr: 3.80,
        totalGiaFundUtilizedCr: 3.45,
        targetBeneficiaries: 950,
        enrolledBeneficiaries: 910,
        certifiedBeneficiaries: 820,
        placedBeneficiaries: 760,
        activeBatches: 5,
        assignedConsultants: 3,
        coordinationGaps: 'None — Excellent retention (>85%) in garment export sector'
      },
      {
        district: 'Bikaner',
        state: 'Rajasthan',
        scPopulationPercentage: 26.5,
        totalGiaFundAllocatedCr: 4.10,
        totalGiaFundUtilizedCr: 3.25,
        targetBeneficiaries: 1100,
        enrolledBeneficiaries: 980,
        certifiedBeneficiaries: 810,
        placedBeneficiaries: 690,
        activeBatches: 4,
        assignedConsultants: 3,
        coordinationGaps: 'Artisan cluster micro-loan sanction turnaround time needs acceleration'
      }
    ],
    // Skilled Financial & Enterprise Consultants (MoSJE PM-AJAY Scheme)
    financialConsultants: [
      { id: 'fc_01', name: 'Rajesh Mishra', qualification: 'Chartered Accountant & Rural Enterprise Specialist', district: 'Varanasi', state: 'Uttar Pradesh', activeBeneficiariesSupported: 42, phone: '+91 98390 11223', specialisation: 'Artisan Credit Linkage & DPR Preparation' },
      { id: 'fc_02', name: 'Pooja Sahay', qualification: 'MBA Rural Finance, ex-NABARD Consultant', district: 'Gaya', state: 'Bihar', activeBeneficiariesSupported: 56, phone: '+91 94311 44556', specialisation: 'Green Energy & Solar Venture Financing' },
      { id: 'fc_03', name: 'S. Chandrasekar', qualification: 'Cost Accountant & MSME Certified Advisor', district: 'Salem', state: 'Tamil Nadu', activeBeneficiariesSupported: 38, phone: '+91 98402 77889', specialisation: 'Apparel Cluster Working Capital Management' },
      { id: 'fc_04', name: 'Anil Sharma', qualification: 'M.Com, Certified Lead Bank District Coordinator', district: 'Bikaner', state: 'Rajasthan', activeBeneficiariesSupported: 31, phone: '+91 94141 88990', specialisation: 'Handicraft & Leather Micro-Enterprise Subsidy' }
    ],
    // Multi-Channel Low-Tech Simulation Logs
    multiChannelSessions: [
      { id: 'chan_01', channel: 'IVR Call (Button Phone)', phone: '+91 98451 XXXXX', language: 'Hindi', durationSecs: 184, result: 'Candidate profiled -> Matched to Sewing Machine Operator NSQF-4', timestamp: daysAgo(1) },
      { id: 'chan_02', channel: 'WhatsApp Voice Note', phone: '+91 97112 XXXXX', language: 'Bilingual (Hindi + English)', durationSecs: 210, result: 'Voice note transcribed -> Sent NSQF Solar Suryamitra PDF & audio note', timestamp: daysAgo(2) },
      { id: 'chan_03', channel: 'CSC Village Kiosk', phone: '+91 96554 XXXXX', language: 'Tamil', durationSecs: 245, result: 'Kiosk touchscreen interview -> Enrolled into Salem Apparel Batch', timestamp: daysAgo(3) }
    ],
    // AI Peer Work & Problem-Sharing Network
    peerClusters: [
      {
        id: 'cluster_01',
        trade: 'Handloom & Textile Artisans',
        district: 'Varanasi Cluster',
        membersCount: 48,
        activeOrdersShared: 3,
        commonProblemsLogged: [
          { issue: 'Jacquard card perforation accuracy error on warp 120', status: 'Solved by Master Weaver peer response', timeLabel: '2 days ago' },
          { issue: 'Bulk silk thread delivery delay from central godown', status: 'Escalated to PM-AJAY District Coordinator', timeLabel: '4 days ago' }
        ]
      },
      {
        id: 'cluster_02',
        trade: 'Solar & Electrical Technicians',
        district: 'Gaya-Patna Green Corridor',
        membersCount: 32,
        activeOrdersShared: 5,
        commonProblemsLogged: [
          { issue: '3kW on-grid inverter net-metering grid code mismatch', status: 'Resolved with technical wiring guide', timeLabel: 'Yesterday' },
          { issue: 'Safety harness shortage for 4 rooftop sites in block 3', status: 'Escalated to Training Partner safety officer', timeLabel: '3 days ago' }
        ]
      },
      {
        id: 'cluster_03',
        trade: 'Footwear & Leather Crafters',
        district: 'Bikaner Artisan Hub',
        membersCount: 26,
        activeOrdersShared: 2,
        commonProblemsLogged: [
          { issue: 'Eco-friendly water-based adhesive drying time in winter', status: 'Solved by peer suggestion (warm curing box)', timeLabel: '5 days ago' }
        ]
      }
    ],
    // NSQF-Aligned Fair Wage Benchmarks (Hourly & Monthly by Region)
    fairwageRates: {
      'sewing machine operator': 65,
      'solar pv installer': 85,
      'handloom weaver': 75,
      'assistant electrician': 80,
      'automotive service technician': 85,
      'general duty assistant': 80,
      'data entry operator': 75,
      'organic farming specialist': 70,
      'food processing technician': 70,
      'mobile repair technician': 90,
      'cutting': 60,
      'welding': 85,
      'weaving': 75,
      'packing': 50,
      'loading': 55,
      'machine operating': 75,
      'cleaning': 45,
      'stitching': 65,
      'assembly line': 70,
      'fabrication': 85,
      'carpentry': 75,
      'plumbing': 80,
      'electrical': 85,
      'masonry': 80
    },
    fairwageEstimates: [],
    // Legacy support
    memory: [
      { id: 'm1', userId: null, tag: 'Handloom', text: 'Tension screw adjusted half turn counter-clockwise stopped thread breaking on warp edge.', unit: 'Varanasi', time: daysAgo(2) },
      { id: 'm2', userId: null, tag: 'Solar', text: 'DC isolator switch wiring check prevented false inverter ground fault trip.', unit: 'Gaya', time: daysAgo(5) }
    ],
    problems: [
      { id: 'p1', userId: null, problem: 'Loom thread snapping on left side during weft beat-up', solution: 'Adjust shuttle race alignment and apply beeswax to edge threads.', tag: 'Handloom', unit: 'Varanasi', time: daysAgo(1) }
    ],
    workshareTasks: [],
    workshareRequests: [],
    employerJobs: [],
    safetyReports: [],
    grievances: []
  };
}

let db = seed();
try {
  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    db = { ...seed(), ...parsed };
  } else {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  }
} catch (e) {
  db = seed();
}

function save() {
  try {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}

function id(prefix = 'item') {
  return prefix + '_' + Math.random().toString(36).substring(2, 9);
}

module.exports = {
  get db() { return db; },
  save,
  id
};
