import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface WoundInput {
  woundType: string;
  bradenScores: {
    sensoryPerception?: number;  // 1-4
    moisture?: number;           // 1-4
    activity?: number;           // 1-4
    mobility?: number;           // 1-4
    nutrition?: number;          // 1-4
    frictionShear?: number;      // 1-3
  };
  stage?: number;
  measurements?: {
    length?: number;
    width?: number;
    depth?: number;
    undermining?: string;
    tunneling?: string;
  };
  exudate?: string;
  woundBed?: string[];
  treatmentPlan?: string;
}

const BRADEN_SUBSCALES = {
  sensoryPerception: { max: 4, label: 'Sensory Perception' },
  moisture: { max: 4, label: 'Moisture' },
  activity: { max: 4, label: 'Activity' },
  mobility: { max: 4, label: 'Mobility' },
  nutrition: { max: 4, label: 'Nutrition' },
  frictionShear: { max: 3, label: 'Friction and Shear' },
} as const;

const WOUND_TYPE_RECOMMENDATIONS: Record<string, string[]> = {
  'pressure': ['Reposition q2h', 'Pressure redistribution surface required', 'Skin assessment daily', 'Nutritional optimization (protein 1.25-1.5g/kg/day)'],
  'surgical': ['Monitor for SSI signs: erythema, warmth, purulent drainage', 'Dress per surgical protocol', 'Document wound approximation', 'Consider negative pressure if dehisced'],
  'venous': ['Compression therapy (leg elevation, compression stockings)', 'Wound bed preparation', 'Moisture-retentive dressing', 'Vascular surgery referral if not healing in 4 weeks'],
  'arterial': ['Vascular surgery consultation URGENT', 'Avoid compression', 'Keep extremity at heart level', 'Optimize perfusion — manage BP, avoid vasoconstrictors'],
  'diabetic': ['Offloading essential (total contact cast or boot)', 'Glucose control (target <180 mg/dL)', 'Infection surveillance', 'Podiatry/surgical consultation for deep wounds'],
  'burn': ['Specialist burn center referral if criteria met', 'Silver-based antimicrobial dressing', 'Pain management priority', 'Monitor for compartment syndrome and inhalation injury'],
  'trauma': ['Assess for foreign bodies and neurovascular status', 'Tetanus status check', 'Irrigation and debridement', 'Consider antibiotic prophylaxis for contaminated wounds'],
};

const STAGE_DESCRIPTIONS: Record<number, { label: string; description: string }> = {
  1: { label: 'Stage 1', description: 'Non-blanchable erythema of intact skin' },
  2: { label: 'Stage 2', description: 'Partial-thickness skin loss with exposed dermis' },
  3: { label: 'Stage 3', description: 'Full-thickness skin loss; subcutaneous fat visible' },
  4: { label: 'Stage 4', description: 'Full-thickness skin and tissue loss; muscle, bone, tendon exposed' },
};

function assessWound(input: WoundInput) {
  const { woundType, bradenScores, stage, measurements, exudate, woundBed, treatmentPlan } = input;
  const recommendations: string[] = [];
  let gateDecision: GateDecision = 'ALLOW';

  // Calculate Braden score
  const subscaleEntries = Object.entries(BRADEN_SUBSCALES) as [keyof typeof BRADEN_SUBSCALES, typeof BRADEN_SUBSCALES[keyof typeof BRADEN_SUBSCALES]][];
  let bradenTotal = 0;
  const bradenComponents: Record<string, number> = {};

  for (const [key, info] of subscaleEntries) {
    const val = Number(bradenScores[key] ?? 0);
    bradenComponents[info.label] = val;
    bradenTotal += val;
  }

  const bradenMax = 23; // 4+4+4+4+4+3
  const clampedBraden = Math.max(6, Math.min(bradenMax, bradenTotal));

  // Risk levels
  let riskLevel: string;
  if (clampedBraden <= 9) {
    riskLevel = 'Very High';
    gateDecision = 'BLOCK';
    recommendations.push('VERY HIGH pressure injury risk — implement all prevention interventions', 'Activate wound care team consult', 'Q1h repositioning', 'Specialized pressure redistribution mattress');
  } else if (clampedBraden <= 12) {
    riskLevel = 'High';
    gateDecision = 'BLOCK';
    recommendations.push('HIGH pressure injury risk — intensified prevention protocol', 'Q2h repositioning minimum', 'Pressure redistribution surface', 'Nutritional supplementation');
  } else if (clampedBraden <= 14) {
    riskLevel = 'Moderate';
    gateDecision = 'NEEDS_REVIEW';
    recommendations.push('MODERATE pressure injury risk — standard prevention measures', 'Q2h repositioning', 'Skin protection', 'Monitor nutrition');
  } else if (clampedBraden <= 18) {
    riskLevel = 'Mild';
    recommendations.push('MILD pressure injury risk — standard care', 'Q2-3h repositioning', 'Daily skin assessment');
  } else {
    riskLevel = 'No Risk';
    recommendations.push('No significant pressure injury risk identified');
  }

  // Wound type-specific recommendations
  const typeKey = woundType?.toLowerCase() || '';
  const typeRecs = WOUND_TYPE_RECOMMENDATIONS[typeKey];
  if (typeRecs) {
    recommendations.push(...typeRecs);
  } else if (woundType) {
    recommendations.push(`Assess wound type "${woundType}" — general wound care principles apply`, 'Monitor for signs of infection');
  }

  // Staging
  let staging: string | null = null;
  if (stage !== undefined) {
    const stageInfo = STAGE_DESCRIPTIONS[stage];
    if (stageInfo) {
      staging = `${stageInfo.label}: ${stageInfo.description}`;
      if (stage >= 3) {
        recommendations.push(`${stageInfo.label} pressure injury — surgical/wound care specialist consultation required`);
        recommendations.push('Consider imaging to assess depth of tissue involvement');
      }
    } else {
      staging = `Unstageable or unknown stage (${stage})`;
      if (stage >= 3) {
        recommendations.push('Deep wound — wound care specialist evaluation needed');
      }
    }
  }

  // Exudate assessment
  if (exudate) {
    const exudateLower = exudate.toLowerCase();
    if (exudateLower.includes('purulent') || exudateLower.includes('foul') || exudateLower.includes('malodorous')) {
      recommendations.push('PURULENT/FOUL EXUDATE — suspect infection, obtain wound culture', 'Initiate antimicrobial dressing', 'Consider systemic antibiotics');
      gateDecision = 'BLOCK';
    } else if (exudateLower.includes('heavy') || exudateLower.includes('copious')) {
      recommendations.push('Heavy exudate — highly absorbent dressing (foam or alginate)', 'Assess for periwound maceration', 'Monitor fluid balance');
    } else if (exudateLower.includes('none') || exudateLower.includes('minimal')) {
      recommendations.push('Minimal exudate — moisture-retentive dressing to maintain optimal wound moisture');
    }
  }

  // Wound bed assessment
  if (woundBed && woundBed.length > 0) {
    const hasNecrotic = woundBed.some(w => /necrotic|eschar|slough|devitalized/i.test(w));
    const hasGranulation = woundBed.some(w => /granulation|granular/i.test(w));
    const hasEpithelial = woundBed.some(w => /epithelial|epithelializ/i.test(w));

    if (hasNecrotic) {
      recommendations.push('NECROTIC TISSUE — debridement required (sharp, enzymatic, or autolytic)', 'Do not stage if eschar is present (unstageable)');
      gateDecision = gateDecision === 'ALLOW' ? 'NEEDS_REVIEW' : gateDecision;
    }
    if (hasGranulation) {
      recommendations.push('Healthy granulation tissue present — continue moisture-retentive therapy');
    }
    if (hasEpithelial) {
      recommendations.push('Epithelialization occurring — protect fragile new tissue');
    }
  }

  // Measurements
  if (measurements) {
    if (measurements.depth && measurements.depth > 3) {
      recommendations.push(`Deep wound (${measurements.depth}cm) — risk of osteomyelitis, vascular involvement`);
      gateDecision = gateDecision === 'ALLOW' ? 'NEEDS_REVIEW' : gateDecision;
    }
    if (measurements.undermining) {
      recommendations.push(`Undermining present (${measurements.undermining}) — document extent using clock-face method`);
    }
    if (measurements.tunneling) {
      recommendations.push(`Tunneling present (${measurements.tunneling}) — may require wound packing`);
    }
  }

  // Gate: BLOCK if Stage 3-4 + no pressure redistribution plan
  if (stage !== undefined && stage >= 3) {
    const tp = (treatmentPlan ?? '').toLowerCase();
    const hasPressureRedistribution = tp.includes('redistribution') ||
      tp.includes('reposition') ||
      tp.includes('mattress') ||
      tp.includes('surface') ||
      tp.includes('offload');

    if (!hasPressureRedistribution) {
      gateDecision = 'BLOCK';
      recommendations.push('STAGE 3-4 WOUND WITHOUT PRESSURE REDISTRIBUTION PLAN — blocked until addressed');
    }
  }

  return { bradenScore: clampedBraden, riskLevel, staging, recommendations, gateDecision };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as WoundInput;
    const { bradenScores, woundType } = body;

    if (!bradenScores || typeof bradenScores !== 'object') {
      return NextResponse.json({ error: 'bradenScores object is required' }, { status: 400 });
    }
    if (!woundType) {
      return NextResponse.json({ error: 'woundType is required' }, { status: 400 });
    }

    const result = assessWound(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    await db.clinicalScore.create({
      data: {
        scoreType: 'wound-assessment',
        rawScore: result.bradenScore,
        totalPossible: 23,
        riskLevel: result.riskLevel,
        components: JSON.stringify(body),
        recommendation: result.recommendations.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      bradenScore: result.bradenScore,
      riskLevel: result.riskLevel,
      staging: result.staging,
      recommendations: result.recommendations,
      gateDecision: result.gateDecision,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Wound assessment failed', details: String(error) }, { status: 500 });
  }
}