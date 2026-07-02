import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface VTERiskInput {
  age: number;
  bmi: number;
  surgeryType: 'minor' | 'major' | 'orthopedic' | 'cancer';
  activeCancer: boolean;
  priorVTE: boolean;
  varicoseVeins: boolean;
  centralVenousAccess: boolean;
  immobilization: boolean;
  paralysis: boolean;
  pregnancy: boolean;
  postpartum: boolean;
  oralContraceptives: boolean;
  hormoneReplacement: boolean;
  sepsis: boolean;
  pneumonia: boolean;
  mi: boolean;
  chf: boolean;
  ibd: boolean;
  nephrotic: boolean;
  myeloproliferative: boolean;
  plateletCount?: number;
  dDimer?: number;
  familyHistoryVTE: boolean;
  thrombophilia: boolean;
}

function calculateCapriniScore(input: VTERiskInput): {
  score: number;
  riskLevel: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH';
  recommendedProphylaxis: string[];
  gateDecision: GateDecision;
  riskLabel: string;
  factors: { name: string; points: number }[];
} {
  const factors: { name: string; points: number }[] = [];
  let score = 0;

  // Age scoring
  if (input.age >= 80) {
    score += 1; factors.push({ name: 'Age ≥ 80', points: 1 });
  } else if (input.age >= 60) {
    score += 1; factors.push({ name: 'Age 60-79', points: 1 });
  } else if (input.age >= 41) {
    score += 1; factors.push({ name: 'Age 41-59', points: 1 });
  }

  // BMI
  if (input.bmi > 25) {
    score += 1; factors.push({ name: `BMI ${input.bmi.toFixed(1)} (>25)`, points: 1 });
  }

  // Surgery type
  switch (input.surgeryType) {
    case 'orthopedic':
      score += 2; factors.push({ name: 'Orthopedic surgery', points: 2 }); break;
    case 'cancer':
      score += 2; factors.push({ name: 'Cancer surgery', points: 2 }); break;
    case 'major':
      score += 1; factors.push({ name: 'Major surgery (>45 min)', points: 1 }); break;
    case 'minor':
      factors.push({ name: 'Minor surgery', points: 0 }); break;
  }

  // Individual risk factors
  if (input.activeCancer) { score += 2; factors.push({ name: 'Active cancer', points: 2 }); }
  if (input.priorVTE) { score += 3; factors.push({ name: 'Prior VTE', points: 3 }); }
  if (input.varicoseVeins) { score += 1; factors.push({ name: 'Varicose veins', points: 1 }); }
  if (input.centralVenousAccess) { score += 2; factors.push({ name: 'Central venous access', points: 2 }); }
  if (input.immobilization) { score += 2; factors.push({ name: 'Immobilization/bed rest', points: 2 }); }
  if (input.paralysis) { score += 5; factors.push({ name: 'Paralysis (lower extremity)', points: 5 }); }
  if (input.pregnancy) { score += 1; factors.push({ name: 'Pregnancy', points: 1 }); }
  if (input.postpartum) { score += 1; factors.push({ name: 'Postpartum (<1 month)', points: 1 }); }
  if (input.oralContraceptives) { score += 1; factors.push({ name: 'Oral contraceptives', points: 1 }); }
  if (input.hormoneReplacement) { score += 1; factors.push({ name: 'Hormone replacement therapy', points: 1 }); }
  if (input.sepsis) { score += 1; factors.push({ name: 'Sepsis (<1 month)', points: 1 }); }
  if (input.pneumonia) { score += 1; factors.push({ name: 'Pneumonia (<1 month)', points: 1 }); }
  if (input.mi) { score += 1; factors.push({ name: 'MI (<1 month)', points: 1 }); }
  if (input.chf) { score += 1; factors.push({ name: 'CHF (<1 month)', points: 1 }); }
  if (input.ibd) { score += 1; factors.push({ name: 'Inflammatory bowel disease', points: 1 }); }
  if (input.nephrotic) { score += 1; factors.push({ name: 'Nephrotic syndrome', points: 1 }); }
  if (input.myeloproliferative) { score += 1; factors.push({ name: 'Myeloproliferative disorder', points: 1 }); }
  if (input.familyHistoryVTE) { score += 1; factors.push({ name: 'Family history of VTE', points: 1 }); }
  if (input.thrombophilia) { score += 3; factors.push({ name: 'Inherited thrombophilia', points: 3 }); }

  // Lab values
  if (input.plateletCount !== undefined && input.plateletCount > 500000) {
    score += 1; factors.push({ name: `Platelets ${input.plateletCount} (>500K)`, points: 1 });
  }
  if (input.dDimer !== undefined && input.dDimer > 2) {
    score += 1; factors.push({ name: `D-dimer ${input.dDimer} (>2x ULN)`, points: 1 });
  }

  // Determine risk level and prophylaxis
  let riskLevel: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH';
  let recommendedProphylaxis: string[];
  let gateDecision: GateDecision;
  let riskLabel: string;

  if (score >= 5) {
    riskLevel = 'HIGH';
    riskLabel = 'HIGH_VTE_RISK';
    recommendedProphylaxis = [
      'Pharmacologic prophylaxis REQUIRED: LMWH (enoxaparin 40mg SC daily) or fondaparinux 2.5mg SC daily',
      'Mechanical prophylaxis: SCDs or TEDs (in addition to pharmacologic)',
      'Consider DOAC (rivaroxaban, apixaban, dabigatran) for extended prophylaxis',
      'Extended prophylaxis post-discharge (28-35 days) for orthopedic/cancer surgery',
      'If anticoagulation contraindicated: IVC filter consultation',
      'Serial ultrasound surveillance if unable to anticoagulate',
      'DVT education for patient: signs/symptoms, when to seek care',
    ];
    gateDecision = 'BLOCK';
  } else if (score >= 3) {
    riskLevel = 'MODERATE';
    riskLabel = 'MODERATE_VTE_RISK';
    recommendedProphylaxis = [
      'Pharmacologic prophylaxis recommended: LMWH (enoxaparin 40mg SC daily) or fondaparinux',
      'Mechanical prophylaxis: SCDs if not already on pharmacologic',
      'Early ambulation encouraged',
      'Assess bleeding risk before initiating pharmacologic prophylaxis',
      'Consider extended prophylaxis if additional risk factors present',
    ];
    gateDecision = 'NEEDS_REVIEW';
  } else if (score >= 1) {
    riskLevel = 'LOW';
    riskLabel = 'LOW_VTE_RISK';
    recommendedProphylaxis = [
      'Mechanical prophylaxis: Sequential compression devices (SCDs) or TEDs',
      'Early and frequent ambulation',
      'No routine pharmacologic prophylaxis required',
      'Reassess if clinical status changes',
    ];
    gateDecision = 'ALLOW';
  } else {
    riskLevel = 'VERY_LOW';
    riskLabel = 'VERY_LOW_VTE_RISK';
    recommendedProphylaxis = [
      'Early ambulation',
      'General VTE prevention measures',
      'No pharmacologic or mechanical prophylaxis routinely required',
    ];
    gateDecision = 'ALLOW';
  }

  return { score, riskLevel, recommendedProphylaxis, gateDecision, riskLabel, factors };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();

    const requiredFields = ['age', 'bmi', 'surgeryType', 'activeCancer', 'priorVTE', 'varicoseVeins', 'centralVenousAccess', 'immobilization', 'paralysis', 'pregnancy', 'postpartum', 'oralContraceptives', 'hormoneReplacement', 'sepsis', 'pneumonia', 'mi', 'chf', 'ibd', 'nephrotic', 'myeloproliferative', 'familyHistoryVTE', 'thrombophilia'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const input: VTERiskInput = {
      age: Number(body.age),
      bmi: Number(body.bmi),
      surgeryType: body.surgeryType,
      activeCancer: Boolean(body.activeCancer),
      priorVTE: Boolean(body.priorVTE),
      varicoseVeins: Boolean(body.varicoseVeins),
      centralVenousAccess: Boolean(body.centralVenousAccess),
      immobilization: Boolean(body.immobilization),
      paralysis: Boolean(body.paralysis),
      pregnancy: Boolean(body.pregnancy),
      postpartum: Boolean(body.postpartum),
      oralContraceptives: Boolean(body.oralContraceptives),
      hormoneReplacement: Boolean(body.hormoneReplacement),
      sepsis: Boolean(body.sepsis),
      pneumonia: Boolean(body.pneumonia),
      mi: Boolean(body.mi),
      chf: Boolean(body.chf),
      ibd: Boolean(body.ibd),
      nephrotic: Boolean(body.nephrotic),
      myeloproliferative: Boolean(body.myeloproliferative),
      plateletCount: body.plateletCount !== undefined ? Number(body.plateletCount) : undefined,
      dDimer: body.dDimer !== undefined ? Number(body.dDimer) : undefined,
      familyHistoryVTE: Boolean(body.familyHistoryVTE),
      thrombophilia: Boolean(body.thrombophilia),
    };

    if (!['minor', 'major', 'orthopedic', 'cancer'].includes(input.surgeryType)) {
      return NextResponse.json({ error: 'surgeryType must be: minor, major, orthopedic, or cancer' }, { status: 400 });
    }

    const result = calculateCapriniScore(input);

    await db.clinicalScore.create({
      data: {
        scoreType: 'caprini-vte',
        rawScore: result.score,
        totalPossible: 40,
        riskLevel: result.riskLevel,
        components: JSON.stringify(input),
        recommendation: result.recommendedProphylaxis.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      score: result.score,
      riskLevel: result.riskLevel,
      recommendedProphylaxis: result.recommendedProphylaxis,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      factors: result.factors,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'VTE risk assessment failed', details: String(error) }, { status: 500 });
  }
}