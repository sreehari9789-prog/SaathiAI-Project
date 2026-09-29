// SAATHI — NSQF (National Skills Qualifications Framework) Aligned Recommendation & Skill-Gap Engine
// Aligned with Ministry of Social Justice and Empowerment (MoSJE) PM-AJAY GIA Component

const NSQF_TRADES = [
  {
    id: 'nsqf_01',
    qpCode: 'AMH/Q0301',
    tradeName: 'Sewing Machine Operator',
    sector: 'Apparel, Made-Ups & Home Furnishing',
    nsqfLevel: 4,
    minEducation: '5th Pass',
    trainingHours: 300,
    durationWeeks: 10,
    requiredSkills: ['stitching', 'machine operation', 'fabric cutting', 'pattern matching', 'basic measurement'],
    typicalWageRange: { min: 14000, max: 18500, period: 'monthly' },
    selfEmploymentPotential: 'High (Boutique / Tailoring unit / Micro-garment enterprise)',
    pmAjaySupport: '100% GIA Grant + tool kit subsidy up to ₹50,000 under PM-AJAY Enterprise Support',
    careerProgression: 'Helper -> Machine Operator -> Sample Tailor -> Line Supervisor -> Apparel Entrepreneur',
    suitableFor: ['textile', 'stitching', 'tailoring', 'embroidery', 'cloth', 'garment', 'fashion', 'sewing'],
    regionHotspots: ['Tiruppur', 'Surat', 'Ludhiana', 'Bengaluru', 'Noida', 'Indore', 'Bhilwara']
  },
  {
    id: 'nsqf_02',
    qpCode: 'SGJ/Q0101',
    tradeName: 'Solar PV Installer (Suryamitra)',
    sector: 'Green Jobs & Renewable Energy',
    nsqfLevel: 4,
    minEducation: '10th Pass or ITI Electrical/Fitter',
    trainingHours: 400,
    durationWeeks: 12,
    requiredSkills: ['electrical wiring', 'solar panel mounting', 'inverter connection', 'safety protocols', 'basic troubleshooting'],
    typicalWageRange: { min: 17000, max: 24000, period: 'monthly' },
    selfEmploymentPotential: 'Very High (Rooftop solar installation & maintenance contractor)',
    pmAjaySupport: '100% GIA Skilling subsidy + priority credit linkage under PM Surya Ghar Muft Bijli Yojana',
    careerProgression: 'Assistant Installer -> Suryamitra Certified Installer -> Site Supervisor -> Solar EPC Contractor',
    suitableFor: ['electrical', 'wire', 'solar', 'energy', 'rooftop', 'technician', 'wiring', 'hardware'],
    regionHotspots: ['Rajasthan', 'Gujarat', 'Maharashtra', 'Madhya Pradesh', 'Tamil Nadu', 'Karnataka']
  },
  {
    id: 'nsqf_03',
    qpCode: 'HCS/Q5401',
    tradeName: 'Handloom Weaver (Traditional & Jacquard)',
    sector: 'Handicrafts and Carpet',
    nsqfLevel: 3,
    minEducation: 'No formal education required',
    trainingHours: 280,
    durationWeeks: 8,
    requiredSkills: ['loom preparation', 'warp and weft handling', 'pattern drafting', 'yarn counting', 'traditional motif weaving'],
    typicalWageRange: { min: 13000, max: 20000, period: 'monthly' },
    selfEmploymentPotential: 'High (Cluster Weaver Producer Group / Cooperative Society)',
    pmAjaySupport: 'PM-AJAY Artisan Grant + Free jacquard loom attachment + Raw material revolving fund',
    careerProgression: 'Apprentice Weaver -> Master Weaver -> Cluster Head -> Artisan Exporter',
    suitableFor: ['weaving', 'loom', 'thread', 'handloom', 'yarn', 'artisan', 'cottage', 'craft', 'saree'],
    regionHotspots: ['Varanasi', 'Kanchipuram', 'Sambalpur', 'Chanderi', 'Pochampally', 'Shantipur']
  },
  {
    id: 'nsqf_04',
    qpCode: 'CON/Q0602',
    tradeName: 'Assistant Electrician (Domestic & Industrial)',
    sector: 'Construction & Infrastructure',
    nsqfLevel: 3,
    minEducation: '8th Pass',
    trainingHours: 350,
    durationWeeks: 11,
    requiredSkills: ['conduit wiring', 'switchboard assembly', 'earthing installation', 'single-phase power maintenance', 'safety gear'],
    typicalWageRange: { min: 16000, max: 22000, period: 'monthly' },
    selfEmploymentPotential: 'Very High (Independent electrician / Maintenance service provider)',
    pmAjaySupport: 'GIA Training + Free electrician toolkit (worth ₹8,000) upon certification',
    careerProgression: 'Helper Electrician -> General Electrician -> Electrical Contractor / Unit Maintenance Lead',
    suitableFor: ['electric', 'wiring', 'shock', 'switch', 'light', 'breaker', 'fan', 'repair', 'motor'],
    regionHotspots: ['All Tier-1, Tier-2 and Rural Industrial Corridors nationwide']
  },
  {
    id: 'nsqf_05',
    qpCode: 'ASC/Q1401',
    tradeName: 'Automotive Service Technician (Two & Three Wheeler)',
    sector: 'Automotive',
    nsqfLevel: 4,
    minEducation: '8th or 10th Pass',
    trainingHours: 450,
    durationWeeks: 14,
    requiredSkills: ['engine dismantling', 'brake servicing', 'carburetor/EFI tuning', 'battery & EV motor diagnostics', 'lubrication'],
    typicalWageRange: { min: 15500, max: 23000, period: 'monthly' },
    selfEmploymentPotential: 'High (Automobile garage / EV repair point / Doorstep service unit)',
    pmAjaySupport: 'Skill voucher + PM-AJAY capital subsidy for garage diagnostic tools',
    careerProgression: 'Lube Tech -> Service Tech -> Master Mechanic -> Workshop Owner',
    suitableFor: ['mechanic', 'bike', 'auto', 'engine', 'vehicle', 'automotive', 'scooter', 'motorcycle', 'garage'],
    regionHotspots: ['Pune', 'Chennai', 'Gurugram', 'Manesar', 'Pantnagar', 'Coimbatore', 'Jamshedpur']
  },
  {
    id: 'nsqf_06',
    qpCode: 'HSS/Q5101',
    tradeName: 'General Duty Assistant (Healthcare Nursing Aide)',
    sector: 'Healthcare',
    nsqfLevel: 4,
    minEducation: '10th Pass',
    trainingHours: 400,
    durationWeeks: 12,
    requiredSkills: ['patient care', 'vital sign monitoring', 'first aid & CPR', 'hygiene & sterilization', 'medication schedule tracking'],
    typicalWageRange: { min: 16000, max: 24000, period: 'monthly' },
    selfEmploymentPotential: 'Moderate to High (Home health care provider / Elderly caregiver agency)',
    pmAjaySupport: 'Full residential skilling grant + Hospital internship placement guarantee',
    careerProgression: 'General Duty Assistant -> Senior Care Aide -> Patient Care Coordinator',
    suitableFor: ['health', 'hospital', 'nursing', 'patient', 'medical', 'care', 'clinic', 'first aid', 'medicine'],
    regionHotspots: ['Delhi NCR', 'Mumbai', 'Hyderabad', 'Kolkata', 'Kochi', 'Nagpur', 'Lucknow']
  },
  {
    id: 'nsqf_07',
    qpCode: 'SSC/Q2212',
    tradeName: 'Domestic Data Entry Operator & Digital Assistant',
    sector: 'IT-ITeS',
    nsqfLevel: 4,
    minEducation: '10th Pass',
    trainingHours: 300,
    durationWeeks: 9,
    requiredSkills: ['computer basics', 'typing 30+ wpm', 'spreadsheet formulas', 'bilingual data entry', 'digital document verification'],
    typicalWageRange: { min: 15000, max: 21000, period: 'monthly' },
    selfEmploymentPotential: 'High (Common Service Centre / Online service kiosk / Freelance data services)',
    pmAjaySupport: 'Digital literacy + hardware subsidy for PM-AJAY CSC village kiosks',
    careerProgression: 'Data Entry Operator -> Back-office Executive -> MIS Coordinator -> CSC Village Level Entrepreneur (VLE)',
    suitableFor: ['computer', 'data', 'typing', 'office', 'internet', 'digital', 'english', 'account', 'documents'],
    regionHotspots: ['District Headquarters, Tehsil Blocks, Tier-2/3 Digital Centres']
  },
  {
    id: 'nsqf_08',
    qpCode: 'AGR/Q1201',
    tradeName: 'Organic Farming & Vermicompost Producer',
    sector: 'Agriculture',
    nsqfLevel: 4,
    minEducation: '5th Pass or Literate',
    trainingHours: 240,
    durationWeeks: 8,
    requiredSkills: ['bio-fertilizer preparation', 'soil testing basics', 'crop rotation', 'organic pest control', 'packaging & market linkage'],
    typicalWageRange: { min: 14000, max: 22000, period: 'monthly / seasonal' },
    selfEmploymentPotential: 'Very High (Farmer Producer Organization / Bio-input micro enterprise)',
    pmAjaySupport: 'Input support package + Vermicompost bed construction subsidy under PM-AJAY Village Development Component',
    careerProgression: 'Small Farmer -> Certified Organic Producer -> FPO Lead / Agri-Entrepreneur',
    suitableFor: ['farming', 'agriculture', 'soil', 'crops', 'plants', 'seeds', 'compost', 'village', 'cow', 'dairy'],
    regionHotspots: ['Punjab', 'Haryana', 'Madhya Pradesh', 'Andhra Pradesh', 'Maharashtra', 'Assam']
  },
  {
    id: 'nsqf_09',
    qpCode: 'FIC/Q0103',
    tradeName: 'Food & Vegetable Processing Technician',
    sector: 'Food Processing',
    nsqfLevel: 4,
    minEducation: '8th Pass',
    trainingHours: 320,
    durationWeeks: 10,
    requiredSkills: ['raw material grading', 'sanitation & preservation', 'cold storage management', 'packaging & labeling', 'FSSAI standards'],
    typicalWageRange: { min: 14500, max: 19500, period: 'monthly' },
    selfEmploymentPotential: 'Very High (Pickle, spice, dried fruit, or snack packaging enterprise / SHG unit)',
    pmAjaySupport: 'PM-AJAY SHG enterprise loan subsidy + free testing laboratory access',
    careerProgression: 'Food Helper -> Processing Technician -> Quality Inspector -> Food Processing Enterprise Head',
    suitableFor: ['food', 'processing', 'cooking', 'pickle', 'spices', 'snacks', 'fruit', 'vegetable', 'packaging'],
    regionHotspots: ['Nashik', 'Chittoor', 'Hajipur', 'Baddi', 'Guntur', 'Kurnool']
  },
  {
    id: 'nsqf_10',
    qpCode: 'ELE/Q5804',
    tradeName: 'Mobile Phone & Smart Appliance Hardware Repair Tech',
    sector: 'Electronics & Hardware',
    nsqfLevel: 4,
    minEducation: '10th Pass',
    trainingHours: 360,
    durationWeeks: 11,
    requiredSkills: ['micro-soldering', 'multimeter testing', 'screen & battery replacement', 'motherboard component diagnosis', 'software flashing'],
    typicalWageRange: { min: 16500, max: 25000, period: 'monthly' },
    selfEmploymentPotential: 'Extremely High (Local mobile repair shop / Consumer electronic clinic)',
    pmAjaySupport: 'Toolkit grant + Micro-credit under Stand-Up India / PM-AJAY Financial Inclusion',
    careerProgression: 'Apprentice Technician -> Senior Hardware Tech -> Multi-brand Service Center Owner',
    suitableFor: ['mobile', 'phone', 'electronics', 'chip', 'screen', 'soldering', 'hardware', 'gadgets', 'appliances'],
    regionHotspots: ['Every urban & rural market hub nationwide']
  }
];

// Skill Gap Matrix & Recommendation Scoring
function assessSkillGapsAndRecommend(profile = {}) {
  const userText = `${profile.skills || ''} ${profile.currentLivelihood || ''} ${profile.interests || ''} ${profile.familyOccupation || ''}`.toLowerCase();
  const education = (profile.education || '').toLowerCase();
  const mobility = (profile.mobilityConstraints || 'local').toLowerCase();
  const preference = (profile.employmentPreference || 'any').toLowerCase();

  const userSkills = (profile.skills || '')
    .toLowerCase()
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const scoredTrades = NSQF_TRADES.map(trade => {
    let score = 20; // base score

    // Keyword match against trade suitable tags
    trade.suitableFor.forEach(tag => {
      if (userText.includes(tag)) score += 15;
    });

    // Skills match
    const matchedSkills = [];
    const missingSkills = [];

    trade.requiredSkills.forEach(reqSkill => {
      const isMatched = userSkills.some(us => reqSkill.includes(us) || us.includes(reqSkill)) ||
                        userText.includes(reqSkill.toLowerCase());
      if (isMatched) {
        matchedSkills.push(reqSkill);
        score += 10;
      } else {
        missingSkills.push(reqSkill);
      }
    });

    // Education match adjustment
    if (trade.minEducation.includes('No formal') || trade.minEducation.includes('5th')) {
      score += 10;
    } else if (trade.minEducation.includes('8th') && (education.includes('8') || education.includes('10') || education.includes('12') || education.includes('graduate'))) {
      score += 10;
    } else if (trade.minEducation.includes('10th') && (education.includes('10') || education.includes('12') || education.includes('graduate') || education.includes('diploma'))) {
      score += 12;
    }

    // Preference alignment
    if (preference.includes('self') || preference.includes('business') || preference.includes('enterprise')) {
      if (trade.selfEmploymentPotential.includes('Very High') || trade.selfEmploymentPotential.includes('High')) {
        score += 15;
      }
    } else if (preference.includes('wage') || preference.includes('job') || preference.includes('salary')) {
      score += 10;
    }

    // Readiness calculation
    const totalRequired = trade.requiredSkills.length;
    const readinessPercentage = Math.round(Math.min(100, Math.max(15, (matchedSkills.length / (totalRequired || 1)) * 100)));

    return {
      ...trade,
      matchScore: Math.min(98, score),
      readinessPercentage,
      matchedSkills,
      missingSkills,
      skillGapSummary: missingSkills.length === 0
        ? 'Fully aligned: Immediate placement or direct enterprise funding recommended.'
        : `Requires targeted ${trade.trainingHours}-hour PM-AJAY skill training in: ${missingSkills.slice(0, 3).join(', ')}.`
    };
  });

  // Sort descending by matchScore
  scoredTrades.sort((a, b) => b.matchScore - a.matchScore);

  const topRecommendations = scoredTrades.slice(0, 3);
  const primaryTrade = topRecommendations[0];

  return {
    candidateSummary: {
      name: profile.name || 'Beneficiary',
      education: profile.education || 'Not specified',
      currentLivelihood: profile.currentLivelihood || 'Informal / Underemployed',
      targetSector: primaryTrade.sector,
      topRecommendedTrade: primaryTrade.tradeName,
      nsqfLevel: primaryTrade.nsqfLevel,
      readinessScore: primaryTrade.readinessPercentage,
      pmAjayEligibleScheme: 'PM-AJAY GIA Component (100% Free Skilling + Stipend + Tool Kit Support)'
    },
    topRecommendations,
    allTrades: scoredTrades
  };
}

module.exports = {
  NSQF_TRADES,
  assessSkillGapsAndRecommend
};
