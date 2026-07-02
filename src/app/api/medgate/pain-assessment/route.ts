import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface PainInput {
  intensity: number;
  quality: string;
  location: string;
  type: string;
  onset: string;
  functionalImpact: string;
  medications: string[];
  redFlags: string[];
}

const RED_FLAG_DEFINITIONS: Record<string, string> = {
  'weight-loss': 'Unexplained weight loss (>10% in 6 months)',
  'night-pain': 'Night pain disturbing sleep',
  'history-cancer': 'History of malignancy',
  'fever': 'Fever or recent infection',
  'trauma': 'Recent significant trauma',
  'neuro-deficit': 'Neurological deficit (motor, sensory, bowel/bladder)',
  'immunosuppressed': 'Immunosuppression',
  'anticoagulation': 'Current anticoagulation therapy',
  'age-50-new': 'New onset pain age >50',
  'progressive': 'Progressively worsening despite treatment',
  'bilateral-swelling': 'Bilateral leg swelling',
  'chest-pain': 'Chest pain with exertion',
  'sudden-onset': 'Sudden severe onset ("thunderclap")',
  'radiating': 'Radiating pain with neuro symptoms',
};

function assessPain(input: PainInput) {
  const { intensity, quality, location, type, onset, functionalImpact, medications, redFlags } = input;

  const recommendations: string[] = [];
  const redFlagAlerts: string[] = [];
  let severity: string;
  let riskLabel: string;
  let gateDecision: GateDecision = 'ALLOW';

  // Severity classification
  if (intensity >= 8) {
    severity = 'Severe';
    riskLabel = 'HIGH';
    recommendations.push('Severe pain — urgent pharmacological intervention required', 'Consider parenteral analgesia', 'Frequent reassessment (q1-2h)', 'Multimodal analgesia recommended');
  } else if (intensity >= 5) {
    severity = 'Moderate';
    riskLabel = 'MODERATE';
    recommendations.push('Moderate pain — step up analgesic regimen', 'Consider adjuvant therapies', 'Reassess in 2-4 hours', 'Non-pharmacological interventions recommended');
  } else if (intensity >= 1) {
    severity = 'Mild';
    riskLabel = 'LOW';
    recommendations.push('Mild pain — current management may be adequate', 'Non-pharmacological measures', 'PRN analgesia as needed');
  } else {
    severity = 'None';
    riskLabel = 'LOW';
    recommendations.push('No pain reported', 'Continue monitoring');
  }

  // Quality-based recommendations
  const qualityLower = quality.toLowerCase();
  if (qualityLower.includes('burning') || qualityLower.includes('neuropathic')) {
    recommendations.push('Neuropathic quality — consider gabapentinoids, SNRIs, or topical agents');
    riskLabel = riskLabel === 'LOW' ? 'MODERATE' : riskLabel;
  }
  if (qualityLower.includes('cramping') || qualityLower.includes('colicky')) {
    recommendations.push('Colicky pain pattern — consider renal, biliary, or intestinal obstruction');
    gateDecision = gateDecision === 'ALLOW' ? 'NEEDS_REVIEW' : gateDecision;
  }
  if (qualityLower.includes('pressure') || qualityLower.includes('crushing')) {
    recommendations.push('Consider cardiac etiology — obtain ECG and troponin');
    gateDecision = 'BLOCK';
    riskLabel = 'HIGH';
  }

  // Onset-based
  const onsetLower = onset.toLowerCase();
  if (onsetLower.includes('sudden') || onsetLower.includes('acute')) {
    recommendations.push('Acute onset — thorough evaluation for acute pathology required');
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // Functional impact
  const impactLower = functionalImpact.toLowerCase();
  if (impactLower.includes('severe') || impactLower.includes('bedbound') || impactLower.includes('cannot')) {
    recommendations.push('Significant functional impairment — consider specialist pain consultation', 'Interdisciplinary pain management approach');
    if (riskLabel === 'LOW') riskLabel = 'MODERATE';
  }

  // Medication review
  if (medications && medications.length > 0) {
    const hasOpioid = medications.some(m => /morphine|fentanyl|hydromorphone|oxycodone|hydrocodone|methadone|tramadol/i.test(m));
    const hasNSAID = medications.some(m => /ibuprofen|naproxen|celecoxib|diclofenac|ketorolac/i.test(m));
    const hasAcetaminophen = medications.some(m => /acetaminophen|paracetamol|tylenol/i.test(m));

    if (hasOpioid) {
      recommendations.push('Opioid therapy in use — monitor for sedation, respiratory depression, and constipation');
      recommendations.push('Consider naloxone co-prescribing per CDC guidelines');
      if (intensity < 4) recommendations.push('Opioid for mild pain — reassess appropriateness, consider tapering');
    }
    if (hasNSAID) {
      recommendations.push('NSAID in use — monitor renal function, GI symptoms, and blood pressure');
    }
    if (hasAcetaminophen && medications.some(m => /percocet|vicodin|norco|lortab/i.test(m))) {
      recommendations.push('Acetaminophen-containing combination product — verify total daily acetaminophen < 4g');
    }
  } else {
    recommendations.push('No current analgesics documented — consider initiating pain management plan');
  }

  // Red flags
  const urgentReferralDocumented = medications?.some(m => /referral|consult|urgent|specialist/i.test(m)) ?? false;
  let hasRedFlags = false;

  for (const flag of redFlags) {
    const description = RED_FLAG_DEFINITIONS[flag] || flag;
    redFlagAlerts.push(description);
    hasRedFlags = true;

    if (flag === 'neuro-deficit') {
      recommendations.push('NEUROLOGICAL RED FLAG — urgent imaging and neurosurgical consultation');
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    } else if (flag === 'history-cancer') {
      recommendations.push('CANCER HISTORY — urgent oncology workup, consider metastatic disease');
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    } else if (flag === 'chest-pain') {
      recommendations.push('CHEST PAIN — cardiac workup required (ECG, troponin, chest X-ray)');
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    } else if (flag === 'sudden-onset' || flag === 'trauma') {
      recommendations.push('TRAUMA/SUDDEN ONSET — rule out fracture, dislocation, vascular injury');
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    }
  }

  // Gate decision: BLOCK if red flags present + no urgent referral documented
  if (hasRedFlags && !urgentReferralDocumented) {
    gateDecision = 'BLOCK';
    recommendations.push('RED FLAGS PRESENT — urgent referral required before proceeding');
  }
  if (hasRedFlags && gateDecision === 'ALLOW') {
    gateDecision = 'NEEDS_REVIEW';
  }

  if (redFlagAlerts.length === 0) {
    redFlagAlerts.push('No red flags identified');
  }

  return { severity, recommendations, redFlagAlerts, gateDecision, riskLabel };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as PainInput;
    const { intensity, quality, location } = body;

    if (intensity === undefined || intensity < 0 || intensity > 10) {
      return NextResponse.json({ error: 'intensity is required (0-10 scale)' }, { status: 400 });
    }
    if (!quality) {
      return NextResponse.json({ error: 'quality is required' }, { status: 400 });
    }
    if (!location) {
      return NextResponse.json({ error: 'location is required' }, { status: 400 });
    }

    const result = assessPain(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    await db.clinicalScore.create({
      data: {
        scoreType: 'pain-assessment',
        rawScore: intensity,
        totalPossible: 10,
        riskLevel: result.riskLabel,
        components: JSON.stringify(body),
        recommendation: result.recommendations.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      severity: result.severity,
      recommendations: result.recommendations,
      redFlagAlerts: result.redFlagAlerts,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Pain assessment failed', details: String(error) }, { status: 500 });
  }
}