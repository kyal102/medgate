import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'VERY_HIGH' | 'NORMAL' | 'MILD' | 'SEVERE';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface ScoreResult {
  score: number;
  totalPossible: number;
  riskLevel: RiskLevel;
  components: Record<string, number | string | boolean>;
  recommendations: string[];
  gateDecision: GateDecision;
  latencyMs: number;
}

function calculateNEWS2(c: Record<string, number | string | boolean>): ScoreResult {
  const rr = Number(c.rr ?? 0);
  const spO2 = Number(c.spO2 ?? 0);
  const airOxygen = Number(c.airOxygen ?? 0);
  const temp = Number(c.temp ?? 0);
  const sbp = Number(c.sbp ?? 0);
  const hr = Number(c.hr ?? 0);
  const avpu = Number(c.avpu ?? 0);

  let score = 0;
  // RR scoring
  if (rr <= 8) score += 3; else if (rr >= 25) score += 3; else if (rr <= 11) score += 1; else if (rr >= 21) score += 2;
  // SpO2 scoring
  if (spO2 <= 91) score += 3; else if (spO2 <= 93) score += 2; else if (spO2 <= 95) score += 1; else if (spO2 >= 98) score += 0; // normal=0 already
  // Air/Oxygen
  if (airOxygen === 2) score += 2; else if (airOxygen === 1) score += 1;
  // Temp
  if (temp < 35.0) score += 3; else if (temp >= 39.1) score += 3; else if (temp >= 38.1) score += 1; else if (temp <= 35.9) score += 1;
  // SBP
  if (sbp <= 90) score += 3; else if (sbp >= 220) score += 3; else if (sbp <= 100) score += 1; else if (sbp >= 180) score += 1;
  // HR
  if (hr <= 40) score += 3; else if (hr >= 131) score += 3; else if (hr <= 50) score += 1; else if (hr >= 111) score += 1;
  // AVPU
  score += avpu;

  const riskLevel: RiskLevel = score <= 4 ? 'LOW' : score <= 6 ? 'MODERATE' : 'HIGH';
  const gateDecision: GateDecision = riskLevel === 'HIGH' ? 'BLOCK' : riskLevel === 'MODERATE' ? 'NEEDS_REVIEW' : 'ALLOW';
  const recommendations = riskLevel === 'HIGH'
    ? ['Urgent medical review required', 'Consider ICU escalation', 'Continuous monitoring', 'Repeat NEWS2 within 1 hour']
    : riskLevel === 'MODERATE'
      ? ['Increased monitoring frequency', 'Notify ward physician', 'Repeat NEWS2 within 2-4 hours']
      : ['Routine monitoring', 'Continue standard care', 'Repeat NEWS2 every 4-12 hours'];

  return { score, totalPossible: 20, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateCHA2DS2VASc(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  const chf = Boolean(c.chf); if (chf) score += 1;
  const hypertension = Boolean(c.hypertension); if (hypertension) score += 1;
  const age75 = Number(c.age75); if (age75) score += 2;
  const diabetes = Boolean(c.diabetes); if (diabetes) score += 1;
  const stroke = Boolean(c.stroke); if (stroke) score += 2;
  const vascularDisease = Boolean(c.vascularDisease); if (vascularDisease) score += 1;
  const age65 = Number(c.age65); if (age65) score += 1;
  const sexCategory = String(c.sexCategory || 'male');

  const isFemale = sexCategory.toLowerCase() === 'female';
  if (isFemale) score += 1;

  let riskLevel: RiskLevel;
  if (isFemale) {
    riskLevel = score <= 0 ? 'LOW' : score <= 2 ? 'MODERATE' : 'HIGH';
  } else {
    riskLevel = score === 0 ? 'LOW' : score === 1 ? 'MODERATE' : 'HIGH';
  }

  const gateDecision: GateDecision = riskLevel === 'HIGH' ? 'NEEDS_REVIEW' : 'ALLOW';
  const recommendations = riskLevel === 'HIGH'
    ? ['Oral anticoagulant therapy recommended (DOAC preferred)', 'Assess bleeding risk with HAS-BLED', 'Cardiology consultation']
    : riskLevel === 'MODERATE'
      ? ['Consider anticoagulant therapy', 'Shared decision-making with patient', 'Reassess annually']
      : ['No anticoagulation indicated', 'Aspirin optional', 'Reassess if risk factors change'];

  return { score, totalPossible: 9, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateHASBLED(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  if (Boolean(c.hypertension)) score += 1;
  if (Boolean(c.abnormalLiver)) score += 1;
  if (Boolean(c.abnormalRenal)) score += 1;
  if (Boolean(c.stroke)) score += 1;
  if (Boolean(c.bleeding)) score += 1;
  if (Boolean(c.labileINR)) score += 1;
  if (Number(c.age65)) score += 1;
  if (Boolean(c.drugs)) score += 1;
  if (Boolean(c.alcohol)) score += 1;

  const riskLevel: RiskLevel = score <= 1 ? 'LOW' : score === 2 ? 'MODERATE' : 'HIGH';
  const gateDecision: GateDecision = riskLevel === 'HIGH' ? 'NEEDS_REVIEW' : 'ALLOW';
  const recommendations = riskLevel === 'HIGH'
    ? ['High bleeding risk — consider DOAC over warfarin', 'Correct reversible factors', 'Gastroprotection with PPI', 'More frequent INR monitoring if on warfarin']
    : riskLevel === 'MODERATE'
      ? ['Moderate bleeding risk', 'Address modifiable risk factors', 'Regular monitoring']
      : ['Low bleeding risk', 'Standard anticoagulation monitoring'];

  return { score, totalPossible: 9, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateCURB65(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  if (Boolean(c.confusion)) score += 1;
  if (Number(c.urea) > 7) score += 1;
  if (Number(c.rr) >= 30) score += 1;
  if (Number(c.sbp) < 90 || Number(c.dbp) <= 60) score += 1;
  if (Number(c.age) >= 65) score += 1;

  let riskLevel: RiskLevel;
  let gateDecision: GateDecision;
  let recommendations: string[];

  if (score === 0 || score === 1) {
    riskLevel = 'LOW';
    gateDecision = 'ALLOW';
    recommendations = ['Outpatient management may be appropriate', 'Oral antibiotics', 'Follow-up in 48 hours'];
  } else if (score === 2) {
    riskLevel = 'MODERATE';
    gateDecision = 'NEEDS_REVIEW';
    recommendations = ['Consider hospital admission', 'IV antibiotics', 'Monitor vital signs closely'];
  } else if (score >= 3 && score <= 4) {
    riskLevel = 'HIGH';
    gateDecision = 'BLOCK';
    recommendations = ['Hospital admission required', 'IV antibiotics + supportive care', 'Consider ICU if deteriorating', 'Monitor lactate and oxygenation'];
  } else {
    riskLevel = 'CRITICAL';
    gateDecision = 'BLOCK';
    recommendations = ['ICU admission strongly recommended', 'Broad-spectrum IV antibiotics', 'Aggressive hemodynamic support', 'Mortality risk >40%'];
  }

  return { score, totalPossible: 5, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateWellsPE(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  if (Boolean(c.dvtSymptoms)) score += 3;
  if (Boolean(c.peMostLikely)) score += 3;
  if (Number(c.hr) > 100) score += 1.5;
  if (Boolean(c.immobility)) score += 1.5;
  if (Boolean(c.previousDvt)) score += 1.5;
  if (Boolean(c.hemoptysis)) score += 1;
  if (Boolean(c.cancer)) score += 1;

  const isPRLikely = score >= 4.5;
  const riskLevel: RiskLevel = isPRLikely ? 'HIGH' : score >= 4 ? 'MODERATE' : 'LOW';
  const gateDecision: GateDecision = isPRLikely ? 'BLOCK' : riskLevel === 'MODERATE' ? 'NEEDS_REVIEW' : 'ALLOW';
  const recommendations = isPRLikely
    ? ['PE likely — initiate anticoagulation pending imaging', 'Urgent CT pulmonary angiogram', 'Consider bedside echocardiogram']
    : riskLevel === 'MODERATE'
      ? ['Moderate probability — obtain D-dimer', 'If D-dimer positive, proceed to CTPA', 'Consider lower extremity dopplers']
      : ['PE unlikely — D-dimer to rule out', 'If D-dimer negative, PE effectively excluded', 'Consider alternative diagnosis'];

  return { score, totalPossible: 12.5, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateGCS(c: Record<string, number | string | boolean>): ScoreResult {
  const eye = Number(c.eye ?? 0);   // 1-4
  const verbal = Number(c.verbal ?? 0); // 1-5
  const motor = Number(c.motor ?? 0);   // 1-6
  const score = eye + verbal + motor;

  let riskLevel: RiskLevel;
  let gateDecision: GateDecision;
  let recommendations: string[];

  if (score === 15) {
    riskLevel = 'NORMAL'; gateDecision = 'ALLOW';
    recommendations = ['Normal consciousness', 'No acute neurological concern'];
  } else if (score >= 13) {
    riskLevel = 'MILD'; gateDecision = 'ALLOW';
    recommendations = ['Mild impairment — monitor closely', 'Repeat GCS hourly', 'Neurological observation chart'];
  } else if (score >= 9) {
    riskLevel = 'MODERATE'; gateDecision = 'NEEDS_REVIEW';
    recommendations = ['Moderate impairment — urgent neurology review', 'Consider CT head', 'Airway assessment required', 'Prepare for potential deterioration'];
  } else {
    riskLevel = 'SEVERE'; gateDecision = 'BLOCK';
    recommendations = ['Severe impairment — emergency airway management', 'GCS ≤8: intubation likely required', 'Urgent CT head', 'ICU consultation', 'Treatable causes: hypoglycemia, opioids, sepsis'];
  }

  return { score, totalPossible: 15, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateMorseFall(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  if (Boolean(c.historyOfFalling)) score += 25;
  if (Boolean(c.secondaryDiagnosis)) score += 15;
  const aid = String(c.ambulatoryAid || 'none');
  if (aid === 'walker') score += 30;
  else if (aid === 'crutches' || aid === 'cane') score += 15;
  if (Boolean(c.ivTherapy)) score += 20;
  const gait = String(c.gait || 'normal');
  if (gait === 'impaired') score += 20;
  else if (gait === 'weak') score += 10;
  const mental = String(c.mentalStatus || 'oriented');
  if (mental === 'overestimates' || mental === 'forgets') score += 15;

  const riskLevel: RiskLevel = score <= 24 ? 'LOW' : score <= 44 ? 'MODERATE' : 'HIGH';
  const gateDecision: GateDecision = riskLevel === 'HIGH' ? 'BLOCK' : 'NEEDS_REVIEW';
  const recommendations = riskLevel === 'HIGH'
    ? ['High fall risk — implement all fall precautions', 'Bed alarm activated', '1:1 sitter recommended', 'Non-slip footwear', 'Keep bed in lowest position', 'Call light within reach']
    : riskLevel === 'MODERATE'
      ? ['Moderate fall risk', 'Yellow fall risk bracelet', 'Assistance with ambulation', 'Evaluate need for assistive device']
      : ['Low fall risk', 'Standard fall prevention', 'Educate patient and family'];

  return { score, totalPossible: 125, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateCaprini(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  if (Number(c.age) >= 80) score += 1;
  if (Number(c.age) >= 60 && Number(c.age) < 80) score += 1;
  if (Number(c.bmi) > 25) score += 1;
  const surgType = String(c.surgeryType || 'minor');
  if (surgType === 'orthopedic' || surgType === 'cancer') score += 2;
  else if (surgType === 'major') score += 1;
  if (Boolean(c.activeCancer)) score += 2;
  if (Boolean(c.priorVTE)) score += 3;
  if (Boolean(c.varicoseVeins)) score += 1;
  if (Boolean(c.centralVenousAccess)) score += 2;
  if (Boolean(c.immobilization)) score += 2;
  if (Boolean(c.paralysis)) score += 5;
  if (Boolean(c.pregnancy)) score += 1;
  if (Boolean(c.postpartum)) score += 1;
  if (Boolean(c.oralContraceptives)) score += 1;
  if (Boolean(c.hormoneReplacement)) score += 1;
  if (Boolean(c.sepsis)) score += 1;
  if (Boolean(c.pneumonia)) score += 1;
  if (Boolean(c.mi)) score += 1;
  if (Boolean(c.chf)) score += 1;
  if (Boolean(c.ibd)) score += 1;
  if (Boolean(c.nephrotic)) score += 1;
  if (Boolean(c.myeloproliferative)) score += 1;
  if (Boolean(c.familyHistoryVTE)) score += 1;
  if (Boolean(c.thrombophilia)) score += 3;
  if (Number(c.plateletCount) > 500000) score += 1;
  if (Number(c.dDimer) > 2) score += 1;

  let riskLevel: RiskLevel;
  let recommendations: string[];
  if (score === 0) {
    riskLevel = 'LOW'; recommendations = ['No pharmacologic prophylaxis needed', 'Early ambulation encouraged'];
  } else if (score <= 2) {
    riskLevel = 'LOW'; recommendations = ['Mechanical prophylaxis (TEDs, SCDs)', 'Early ambulation'];
  } else if (score <= 4) {
    riskLevel = 'MODERATE'; recommendations = ['Pharmacologic prophylaxis recommended (LMWH or fondaparinux)', 'Mechanical prophylaxis', 'Early ambulation'];
  } else {
    riskLevel = 'VERY_HIGH'; recommendations = ['Pharmacologic prophylaxis required (LMWH, fondaparinux, or DOAC)', 'Mechanical prophylaxis', 'Consider IVC filter if contraindicated to anticoagulation', 'Extended prophylaxis post-discharge (28-35 days)'];
  }

  const gateDecision: GateDecision = score >= 5 ? 'BLOCK' : score >= 3 ? 'NEEDS_REVIEW' : 'ALLOW';
  return { score, totalPossible: 40, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateChildPugh(c: Record<string, number | string | boolean>): ScoreResult {
  let score = 0;
  // Bilirubin
  const bilirubin = Number(c.bilirubin ?? 0);
  if (bilirubin < 2) score += 1; else if (bilirubin <= 3) score += 2; else score += 3;
  // Albumin
  const albumin = Number(c.albumin ?? 3.5);
  if (albumin > 3.5) score += 1; else if (albumin >= 2.8) score += 2; else score += 3;
  // INR
  const inr = Number(c.inr ?? 1.0);
  if (inr < 1.7) score += 1; else if (inr <= 2.3) score += 2; else score += 3;
  // Ascites
  const ascites = String(c.ascites || 'none');
  if (ascites === 'none') score += 1; else if (ascites === 'mild') score += 2; else score += 3;
  // Encephalopathy
  const enceph = String(c.encephalopathy || 'none');
  if (enceph === 'none') score += 1; else if (enceph === 'mild') score += 2; else score += 3;

  let riskLevel: RiskLevel;
  let gateDecision: GateDecision;
  let recommendations: string[];

  if (score <= 6) {
    riskLevel = 'LOW'; gateDecision = 'ALLOW';
    recommendations = ['Child-Pugh Class A — well-compensated liver disease', 'Standard drug dosing generally appropriate', 'Monitor LFTs regularly'];
  } else if (score <= 9) {
    riskLevel = 'MODERATE'; gateDecision = 'NEEDS_REVIEW';
    recommendations = ['Child-Pugh Class B — significant functional impairment', 'Hepatology consultation recommended', 'Dose reduction for hepatically metabolized drugs', 'Monitor for encephalopathy and ascites'];
  } else {
    riskLevel = 'HIGH'; gateDecision = 'BLOCK';
    recommendations = ['Child-Pugh Class C — decompensated liver disease', 'Urgent hepatology/GI consultation', 'Significant drug metabolism impairment — avoid hepatically cleared drugs', 'Assess for liver transplant candidacy', 'Mortality risk: 1-year ~45%, 2-year ~70%'];
  }

  return { score, totalPossible: 15, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

function calculateApacheII(c: Record<string, number | string | boolean>): ScoreResult {
  let physioScore = 0;

  const temp = Number(c.temp ?? 37);
  if (temp >= 41) physioScore += 4; else if (temp >= 39) physioScore += 3; else if (temp >= 38.5) physioScore += 1;
  else if (temp < 30) physioScore += 4; else if (temp < 32) physioScore += 3; else if (temp < 34) physioScore += 2; else if (temp < 35) physioScore += 1;

  const map = Number(c.map ?? 80);
  if (map >= 160) physioScore += 4; else if (map >= 130) physioScore += 3; else if (map >= 110) physioScore += 2; else if (map >= 70) physioScore += 0;
  else if (map < 50) physioScore += 4; else if (map < 55) physioScore += 3; else if (map < 60) physioScore += 2; else if (map < 70) physioScore += 1;

  const hr = Number(c.hr ?? 80);
  if (hr >= 180) physioScore += 4; else if (hr >= 140) physioScore += 3; else if (hr >= 110) physioScore += 2; else if (hr >= 70) physioScore += 0;
  else if (hr < 40) physioScore += 4; else if (hr < 55) physioScore += 3; else if (hr < 60) physioScore += 2; else if (hr < 70) physioScore += 1;

  const rr = Number(c.rr ?? 16);
  if (rr >= 50) physioScore += 4; else if (rr >= 35) physioScore += 3; else if (rr >= 25) physioScore += 1;
  else if (rr < 6) physioScore += 4; else if (rr < 10) physioScore += 2;

  const fiO2 = Number(c.fio2 ?? 21) / 100;
  const pao2 = Number(c.pao2 ?? 100);
  let respScore = 0;
  if (fiO2 >= 0.5) {
    const aado2 = (fiO2 * 713) - pao2 - (40 / 0.8);
    if (aado2 >= 500) respScore = 4; else if (aado2 >= 350) respScore = 3; else if (aado2 >= 200) respScore = 2; else respScore = 0;
  } else {
    if (pao2 < 55) respScore = 4; else if (pao2 < 60) respScore = 3; else if (pao2 < 70) respScore = 1;
  }
  physioScore += respScore;

  const na = Number(c.sodium ?? 140);
  if (na >= 180) physioScore += 4; else if (na >= 160) physioScore += 3; else if (na >= 155) physioScore += 2; else if (na >= 150) physioScore += 1;
  else if (na < 110) physioScore += 4; else if (na < 120) physioScore += 3; else if (na < 130) physioScore += 2;

  const k = Number(c.potassium ?? 4);
  if (k >= 7) physioScore += 4; else if (k >= 6) physioScore += 3; else if (k >= 5.5) physioScore += 1;
  else if (k < 2.5) physioScore += 4; else if (k < 3) physioScore += 2; else if (k < 3.5) physioScore += 1;

  const creatinine = Number(c.creatinine ?? 1);
  if (creatinine >= 3.5) physioScore += 4; else if (creatinine >= 2) physioScore += 3; else if (creatinine >= 1.5) physioScore += 2;

  const hematocrit = Number(c.hematocrit ?? 45);
  if (hematocrit >= 60) physioScore += 4; else if (hematocrit >= 50) physioScore += 2;
  else if (hematocrit < 20) physioScore += 4; else if (hematocrit < 30) physioScore += 2;

  const wbc = Number(c.wbc ?? 8);
  if (wbc >= 40) physioScore += 4; else if (wbc >= 20) physioScore += 2; else if (wbc >= 15) physioScore += 1;
  else if (wbc < 1) physioScore += 4; else if (wbc < 3) physioScore += 2;

  // GCS
  const gcs = Number(c.gcs ?? 15);
  physioScore += Math.max(0, 15 - gcs);

  // Age
  let ageScore = 0;
  const age = Number(c.age ?? 50);
  if (age >= 75) ageScore = 6; else if (age >= 65) ageScore = 5; else if (age >= 55) ageScore = 3; else if (age >= 45) ageScore = 2;

  // Chronic health
  let chronicScore = 0;
  if (Boolean(c.chronicHealthSevere)) chronicScore = 5;

  const score = physioScore + ageScore + chronicScore;

  let riskLevel: RiskLevel;
  let gateDecision: GateDecision;
  let recommendations: string[];

  if (score <= 9) {
    riskLevel = 'LOW'; gateDecision = 'ALLOW';
    recommendations = ['Low ICU mortality risk (~10%)', 'Continue current management'];
  } else if (score <= 19) {
    riskLevel = 'MODERATE'; gateDecision = 'NEEDS_REVIEW';
    recommendations = ['Moderate ICU mortality risk (~15-30%)', 'Close monitoring of all organ systems', 'Reassess q12-24h'];
  } else if (score <= 29) {
    riskLevel = 'HIGH'; gateDecision = 'BLOCK';
    recommendations = ['High ICU mortality risk (~40-60%)', 'Intensive monitoring and aggressive intervention', 'Family communication regarding prognosis', 'Consider goals of care discussion'];
  } else {
    riskLevel = 'CRITICAL'; gateDecision = 'BLOCK';
    recommendations = ['Critical — ICU mortality risk >70%', 'Maximal support recommended', 'Urgent family conference', 'Reassess treatment goals', 'Consider palliative care involvement'];
  }

  return { score, totalPossible: 71, riskLevel, components: c, recommendations, gateDecision, latencyMs: 0 };
}

const SCORE_CALCULATORS: Record<string, (c: Record<string, number | string | boolean>) => ScoreResult> = {
  'news2': calculateNEWS2,
  'cha2ds2-vasc': calculateCHA2DS2VASc,
  'has-bled': calculateHASBLED,
  'curb65': calculateCURB65,
  'wells-pe': calculateWellsPE,
  'gcs': calculateGCS,
  'morse-fall': calculateMorseFall,
  'caprini': calculateCaprini,
  'child-pugh': calculateChildPugh,
  'apache-ii': calculateApacheII,
};

const VALID_SCORE_TYPES = Object.keys(SCORE_CALCULATORS);

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();
    const { scoreType, components, patientContext } = body as {
      scoreType: string;
      components: Record<string, number | string | boolean>;
      patientContext?: Record<string, unknown>;
    };

    if (!scoreType || !VALID_SCORE_TYPES.includes(scoreType)) {
      return NextResponse.json(
        { error: 'Invalid scoreType', validTypes: VALID_SCORE_TYPES },
        { status: 400 }
      );
    }
    if (!components || typeof components !== 'object') {
      return NextResponse.json({ error: 'components object is required' }, { status: 400 });
    }

    const calculator = SCORE_CALCULATORS[scoreType];
    const result = calculator(components);
    result.latencyMs = Math.round((performance.now() - start) * 100) / 100;

    await db.clinicalScore.create({
      data: {
        scoreType,
        rawScore: result.score,
        totalPossible: result.totalPossible,
        riskLevel: result.riskLevel,
        components: JSON.stringify(result.components),
        recommendation: result.recommendations.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      score: result.score,
      totalPossible: result.totalPossible,
      riskLevel: result.riskLevel,
      components: result.components,
      recommendations: result.recommendations,
      gateDecision: result.gateDecision,
      latencyMs: result.latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Clinical score calculation failed', details: String(error) }, { status: 500 });
  }
}