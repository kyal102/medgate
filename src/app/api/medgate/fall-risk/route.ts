import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface FallRiskInput {
  historyOfFalling: boolean;
  secondaryDiagnosis: boolean;
  ambulatoryAid: 'none' | 'crutches' | 'cane' | 'walker';
  ivTherapy: boolean;
  gait: 'normal' | 'weak' | 'impaired';
  mentalStatus: 'oriented' | 'overestimates' | 'forgets';
}

function calculateMorseScore(input: FallRiskInput): {
  score: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  interventions: string[];
  gateDecision: GateDecision;
  riskLabel: string;
} {
  let score = 0;

  // History of falling (within 3 months)
  if (input.historyOfFalling) score += 25;

  // Secondary diagnosis (≥2 active medical diagnoses)
  if (input.secondaryDiagnosis) score += 15;

  // Ambulatory aid
  switch (input.ambulatoryAid) {
    case 'walker': score += 30; break;
    case 'crutches':
    case 'cane': score += 15; break;
    case 'none': score += 0; break;
  }

  // IV therapy / heparin lock
  if (input.ivTherapy) score += 20;

  // Gait
  switch (input.gait) {
    case 'impaired': score += 20; break;
    case 'weak': score += 10; break;
    case 'normal': score += 0; break;
  }

  // Mental status
  switch (input.mentalStatus) {
    case 'overestimates':
    case 'forgets': score += 15; break;
    case 'oriented': score += 0; break;
  }

  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  let riskLabel: string;
  let interventions: string[];
  let gateDecision: GateDecision;

  if (score >= 45) {
    riskLevel = 'HIGH';
    riskLabel = 'HIGH_FALL_RISK';
    interventions = [
      'Activate bed alarm immediately',
      '1:1 sitter or continuous observation',
      'Keep bed in lowest position with brakes locked',
      'Non-slip socks/footwear required',
      'Call light within reach — verify patient can demonstrate use',
      'Toileting schedule — every 2 hours or on demand',
      'Remove unnecessary objects/obstacles from room',
      'Supervised ambulation only — assistive device verified',
      'Fall risk signage at bedside and door',
      'Medication review: sedatives, opioids, antihypertensives, diuretics',
      'Physical therapy consultation for gait assessment',
      'Vitamin D level check — supplement if deficient',
      'Ensure bedside rails appropriate (not a restraint substitute)',
    ];
    gateDecision = 'BLOCK';
  } else if (score >= 25) {
    riskLevel = 'MODERATE';
    riskLabel = 'MODERATE_FALL_RISK';
    interventions = [
      'Yellow fall risk bracelet applied',
      'Assistance with ambulation and transfers',
      'Keep bed in low position',
      'Call light within reach',
      'Non-slip footwear',
      'Toileting assistance offered regularly',
      'Fall risk signage at bedside',
      'Medication review for fall-risk drugs',
      'Supervised mobility as needed',
    ];
    gateDecision = 'NEEDS_REVIEW';
  } else {
    riskLevel = 'LOW';
    riskLabel = 'LOW_FALL_RISK';
    interventions = [
      'Standard fall prevention education',
      'Encourage early mobility',
      'Call light within reach',
      'Non-slip footwear recommended',
    ];
    gateDecision = 'ALLOW';
  }

  return { score, riskLevel, interventions, gateDecision, riskLabel };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();
    const {
      historyOfFalling,
      secondaryDiagnosis,
      ambulatoryAid,
      ivTherapy,
      gait,
      mentalStatus,
    } = body as FallRiskInput;

    if (
      historyOfFalling === undefined ||
      secondaryDiagnosis === undefined ||
      !ambulatoryAid ||
      ivTherapy === undefined ||
      !gait ||
      !mentalStatus
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: historyOfFalling, secondaryDiagnosis, ambulatoryAid, ivTherapy, gait, mentalStatus' },
        { status: 400 }
      );
    }

    const validAids: string[] = ['none', 'crutches', 'cane', 'walker'];
    const validGaits: string[] = ['normal', 'weak', 'impaired'];
    const validMental: string[] = ['oriented', 'overestimates', 'forgets'];

    if (!validAids.includes(ambulatoryAid)) {
      return NextResponse.json({ error: `ambulatoryAid must be one of: ${validAids.join(', ')}` }, { status: 400 });
    }
    if (!validGaits.includes(gait)) {
      return NextResponse.json({ error: `gait must be one of: ${validGaits.join(', ')}` }, { status: 400 });
    }
    if (!validMental.includes(mentalStatus)) {
      return NextResponse.json({ error: `mentalStatus must be one of: ${validMental.join(', ')}` }, { status: 400 });
    }

    const result = calculateMorseScore({
      historyOfFalling,
      secondaryDiagnosis,
      ambulatoryAid: ambulatoryAid as FallRiskInput['ambulatoryAid'],
      ivTherapy,
      gait: gait as FallRiskInput['gait'],
      mentalStatus: mentalStatus as FallRiskInput['mentalStatus'],
    });

    await db.clinicalScore.create({
      data: {
        scoreType: 'morse-fall',
        rawScore: result.score,
        totalPossible: 125,
        riskLevel: result.riskLevel,
        components: JSON.stringify({ historyOfFalling, secondaryDiagnosis, ambulatoryAid, ivTherapy, gait, mentalStatus }),
        recommendation: result.interventions.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      score: result.score,
      riskLevel: result.riskLevel,
      interventions: result.interventions,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Fall risk assessment failed', details: String(error) }, { status: 500 });
  }
}