import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface NeonatalInput {
  apgar1min?: number;
  apgar5min?: number;
  apgar10min?: number;
  ballardScores?: {
    neuromuscularMaturity?: number;
    physicalMaturity?: number;
  };
  birthWeight: number;
  gestationalAge: number;
  medications?: { name: string; dose?: string; route?: string }[];
}

const APGAR_COMPONENTS = [
  { name: 'Appearance (skin color)', key: 'appearance' },
  { name: 'Pulse (heart rate)', key: 'pulse' },
  { name: 'Grimace (reflex irritability)', key: 'grimace' },
  { name: 'Activity (muscle tone)', key: 'activity' },
  { name: 'Respiration', key: 'respiration' },
] as const;

function interpretAPGAR(score: number | undefined, minute: number): string {
  if (score === undefined) return `APGAR at ${minute} min: not recorded`;
  if (score >= 7) return `APGAR at ${minute} min: ${score}/10 — Normal/vigorous`;
  if (score >= 4) return `APGAR at ${minute} min: ${score}/10 — Moderately depressed — requires close monitoring and possible intervention`;
  return `APGAR at ${minute} min: ${score}/10 — Severely depressed — requires immediate resuscitation`;
}

function calculateBallardGestationalAge(ballardScores: NeonatalInput['ballardScores']): number | null {
  if (!ballardScores) return null;
  const neuromuscular = Number(ballardScores.neuromuscularMaturity ?? 0);
  const physical = Number(ballardScores.physicalMaturity ?? 0);
  if (neuromuscular === 0 && physical === 0) return null;
  return neuromuscular + physical;
}

const NEONATAL_HIGH_RISK_MEDS: Record<string, string> = {
  'gentamicin': 'Nephrotoxicity and ototoxicity risk — monitor trough levels. Dose interval based on gestational age and postnatal age.',
  'vancomycin': 'Nephrotoxicity and Red Man syndrome risk — monitor trough levels (target 10-15 mcg/mL for sepsis). Infuse over 60+ minutes.',
  'indomethacin': 'Contraindicated in active bleeding, thrombocytopenia, NEC, or renal impairment. Monitor BUN, creatinine, platelets, urine output.',
  'ibuprofen-lysine': 'PDA closure agent — monitor BUN, creatinine, platelets, bilirubin. Contraindicated in NEC, active bleeding.',
  'caffeine-citrate': 'First-line for apnea of prematurity. Monitor levels if liver dysfunction. Generally safe therapeutic range 5-25 mcg/mL.',
  'dopamine': 'Dose-dependent effects: low dose (1-5) renal, medium (5-10) cardiac, high (10-20) vasopressor. Use lowest effective dose.',
  'surfactant': 'Administer via endotracheal tube. Monitor for desaturation and bradycardia during administration. May need repeat doses.',
  'phenobarbital': 'Saturable metabolism in neonates — loading dose may cause respiratory depression. Monitor levels.',
  'morphine': 'Prolonged half-life in neonates, especially preterm. Risk of respiratory depression. Reduce dose and extended interval for GA <34 weeks.',
  'fentanyl': 'Chest wall rigidity risk with rapid bolus — use slow infusion. Prolonged clearance in neonates.',
  'ampicillin': 'High dose required for meningitis coverage. Monitor for rash (common, often non-allergic in neonates).',
  'piperacillin-tazobactam': 'Limited neonatal data — use with caution. Adjust dose for renal function.',
};

function checkNeonatalMedications(medications: NeonatalInput['medications'], gestationalAge: number): string[] {
  const alerts: string[] = [];
  if (!medications || medications.length === 0) return alerts;

  for (const med of medications) {
    const nameKey = med.name.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const alert = NEONATAL_HIGH_RISK_MEDS[med.name.toLowerCase()] ||
      Object.entries(NEONATAL_HIGH_RISK_MEDS).find(([k]) => nameKey.includes(k))?.[1];

    if (alert) {
      alerts.push(`${med.name}: ${alert}`);
    }

    // Gestational age-specific warnings
    if (gestationalAge < 32 && /ibuprofen|indomethacin|nsaid/i.test(med.name)) {
      alerts.push(`${med.name}: Extreme preterm (<32w GA) — increased bleeding risk, monitor closely`);
    }
    if (gestationalAge < 28) {
      if (/morphine|fentanyl|midazolam/i.test(med.name)) {
        alerts.push(`${med.name}: Extreme preterm (<28w GA) — significantly prolonged half-life, consider reduced dosing and therapeutic drug monitoring`);
      }
    }
  }

  return alerts;
}

function assessNeonatal(input: NeonatalInput) {
  const { apgar1min, apgar5min, apgar10min, ballardScores, birthWeight, gestationalAge, medications } = input;
  const recommendations: string[] = [];
  const medicationAlerts = checkNeonatalMedications(medications, gestationalAge);
  let gateDecision: GateDecision = 'ALLOW';
  let riskLabel = 'LOW';

  // APGAR interpretation
  const apgarInterpretation: string[] = [];
  if (apgar1min !== undefined) apgarInterpretation.push(interpretAPGAR(apgar1min, 1));
  if (apgar5min !== undefined) apgarInterpretation.push(interpretAPGAR(apgar5min, 5));
  if (apgar10min !== undefined) apgarInterpretation.push(interpretAPGAR(apgar10min, 10));

  // APGAR 5-min assessment
  if (apgar5min !== undefined && apgar5min <= 3) {
    gateDecision = 'BLOCK';
    riskLabel = 'HIGH';
    const resuscitationInitiated = medications?.some(m =>
      /epinephrine|adrenaline|surfactant|intubat|cpr|resuscit|ppv|positive.pressure/i.test(m.name)
    ) ?? false;

    if (!resuscitationInitiated) {
      recommendations.push('CRITICAL: APGAR 0-3 at 5 minutes — IMMEDIATE RESUSCITATION REQUIRED', 'Initiate positive pressure ventilation', 'Consider intubation', 'Epinephrine if HR <60 despite effective ventilation');
    } else {
      recommendations.push('APGAR 0-3 at 5 min with resuscitation in progress — continue resuscitative efforts', 'Consider NICU transfer', 'Prepare for possible ECMO if available');
    }
  } else if (apgar5min !== undefined && apgar5min <= 6) {
    riskLabel = 'MODERATE';
    gateDecision = 'NEEDS_REVIEW';
    recommendations.push('Moderately low APGAR at 5 min — close monitoring required', 'Consider NICU observation', 'Monitor for transition complications');
  } else if (apgar1min !== undefined && apgar1min <= 3 && apgar5min !== undefined && apgar5min >= 7) {
    recommendations.push('APGAR improved from 1-min to 5-min — good response to initial resuscitation', 'Continue monitoring');
  }

  // Birth weight classification
  if (birthWeight < 1000) {
    recommendations.push('ELBW (Extremely Low Birth Weight, <1000g) — NICU admission required', 'Thermal management critical', 'Consider surfactant prophylaxis', 'Minimal handling protocol');
    if (riskLabel === 'LOW') { riskLabel = 'HIGH'; gateDecision = gateDecision === 'ALLOW' ? 'NEEDS_REVIEW' : gateDecision; }
  } else if (birthWeight < 1500) {
    recommendations.push('VLBW (Very Low Birth Weight, <1500g) — NICU care recommended', 'Thermal management, glucose monitoring', 'Consider surfactant if RDS risk');
    if (riskLabel === 'LOW') { riskLabel = 'MODERATE'; if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW'; }
  } else if (birthWeight < 2500) {
    recommendations.push('LBW (Low Birth Weight, <2500g) — increased monitoring needed');
    if (riskLabel === 'LOW') riskLabel = 'MODERATE';
  } else if (birthWeight > 4500) {
    recommendations.push('Macrosomia (>4500g) — monitor for hypoglycemia, polycythemia, birth injury');
    riskLabel = 'MODERATE';
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // Gestational age
  if (gestationalAge < 28) {
    recommendations.push('Extreme preterm (<28w) — Level III/IV NICU required', 'Antenatal steroids benefit assessment', 'Consider magnesium sulfate for neuroprotection', 'Parenteral nutrition planning');
    riskLabel = 'HIGH';
    gateDecision = gateDecision === 'ALLOW' ? 'NEEDS_REVIEW' : gateDecision;
  } else if (gestationalAge < 34) {
    recommendations.push('Moderate-late preterm (34-37w) — increased surveillance for temperature, glucose, bilirubin, and feeding');
  } else if (gestationalAge >= 42) {
    recommendations.push('Post-term (≥42w) — monitor for meconium aspiration, dysmaturity syndrome, polycythemia');
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // Ballard score
  const ballardAge = calculateBallardGestationalAge(ballardScores);
  if (ballardAge !== null) {
    const diff = Math.abs(ballardAge - gestationalAge);
    if (diff > 2) {
      recommendations.push(`Ballard score (${ballardAge}w) differs from stated GA (${gestationalAge}w) by ${diff}w — verify gestational age`);
      if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    }
  }

  // Medication alerts elevation
  if (medicationAlerts.length > 0) {
    if (medicationAlerts.some(a => /contraindicated|critical|severe/i.test(a))) {
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    } else if (gateDecision === 'ALLOW') {
      gateDecision = 'NEEDS_REVIEW';
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Neonatal assessment within normal parameters', 'Continue routine newborn care');
  }

  return { apgarInterpretation, ballardAge, medicationAlerts, recommendations, gateDecision, riskLabel };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as NeonatalInput;
    const { birthWeight, gestationalAge } = body;

    if (birthWeight === undefined) {
      return NextResponse.json({ error: 'birthWeight is required' }, { status: 400 });
    }
    if (gestationalAge === undefined) {
      return NextResponse.json({ error: 'gestationalAge is required' }, { status: 400 });
    }

    const result = assessNeonatal(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    await db.clinicalScore.create({
      data: {
        scoreType: 'neonatal-check',
        rawScore: result.ballardAge ?? gestationalAge,
        totalPossible: 50,
        riskLevel: result.riskLabel,
        components: JSON.stringify(body),
        recommendation: result.recommendations.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      apgarInterpretation: result.apgarInterpretation,
      ballardAge: result.ballardAge,
      medicationAlerts: result.medicationAlerts,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Neonatal check failed', details: String(error) }, { status: 500 });
  }
}