import { NextRequest, NextResponse } from 'next/server';

interface ISBARData {
  identify: {
    patientName?: string;
    dob?: string;
    urNumber?: string;
    ward?: string;
    room?: string;
    bed?: string;
    responsibleClinician?: string;
  };
  situation: {
    presentingProblem?: string;
    currentStatus?: string;
    codeStatus?: string;
    acuteChanges?: string;
  };
  background: {
    pmh?: string;
    allergies?: string;
    currentMeds?: string;
    socialHistory?: string;
    baselineFunction?: string;
  };
  assessment: {
    clinicalImpression?: string;
    investigations?: string;
    currentScores?: string;
    treatmentResponse?: string;
  };
  recommendation: {
    tasksRequired?: string;
    followUpPlan?: string;
    contingencyPlan?: string;
    expectedDischarge?: string;
  };
}

// Required fields per section for completeness scoring
const SECTION_REQUIREMENTS = {
  identify: ['patientName', 'dob', 'urNumber', 'ward', 'room', 'bed', 'responsibleClinician'] as const,
  situation: ['presentingProblem', 'currentStatus', 'codeStatus', 'acuteChanges'] as const,
  background: ['pmh', 'allergies', 'currentMeds', 'socialHistory', 'baselineFunction'] as const,
  assessment: ['clinicalImpression', 'investigations', 'currentScores', 'treatmentResponse'] as const,
  recommendation: ['tasksRequired', 'followUpPlan', 'contingencyPlan', 'expectedDischarge'] as const,
};

// Weights for overall compliance score
const SECTION_WEIGHTS: Record<string, number> = {
  identify: 0.15,
  situation: 0.25,
  background: 0.20,
  assessment: 0.25,
  recommendation: 0.15,
};

function scoreSection<T extends Record<string, unknown>>(section: T, requiredFields: readonly string[]): { score: number; missing: string[] } {
  const missing: string[] = [];
  let filled = 0;
  for (const field of requiredFields) {
    const val = section[field];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      filled++;
    } else {
      missing.push(field);
    }
  }
  const score = Math.round((filled / requiredFields.length) * 100);
  return { score, missing };
}

function getQualityGrade(overallScore: number): string {
  if (overallScore >= 90) return 'A — Excellent';
  if (overallScore >= 80) return 'B — Good';
  if (overallScore >= 75) return 'C — Satisfactory';
  if (overallScore >= 60) return 'D — Needs Improvement';
  if (overallScore >= 50) return 'E — Below Standard';
  return 'F — Critical Deficiency';
}

function getRiskLabel(overallScore: number): string {
  if (overallScore < 50) return 'HANDOVER_CRITICAL_DEFICIENCY';
  if (overallScore < 75) return 'HANDOVER_INCOMPLETE';
  if (overallScore < 90) return 'HANDOVER_ADEQUATE';
  return 'HANDOVER_EXCELLENT';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { isbarData } = body as { isbarData: ISBARData };

    if (!isbarData) {
      return NextResponse.json({ error: 'Missing required field: isbarData' }, { status: 400 });
    }

    const start = performance.now();

    // Score each section
    const identifyResult = scoreSection(isbarData.identify || {}, SECTION_REQUIREMENTS.identify);
    const situationResult = scoreSection(isbarData.situation || {}, SECTION_REQUIREMENTS.situation);
    const backgroundResult = scoreSection(isbarData.background || {}, SECTION_REQUIREMENTS.background);
    const assessmentResult = scoreSection(isbarData.assessment || {}, SECTION_REQUIREMENTS.assessment);
    const recommendationResult = scoreSection(isbarData.recommendation || {}, SECTION_REQUIREMENTS.recommendation);

    const sectionScores = {
      identify: identifyResult.score,
      situation: situationResult.score,
      background: backgroundResult.score,
      assessment: assessmentResult.score,
      recommendation: recommendationResult.score,
    };

    // Weighted overall score
    const overallScore = Math.round(
      identifyResult.score * SECTION_WEIGHTS.identify +
      situationResult.score * SECTION_WEIGHTS.situation +
      backgroundResult.score * SECTION_WEIGHTS.background +
      assessmentResult.score * SECTION_WEIGHTS.assessment +
      recommendationResult.score * SECTION_WEIGHTS.recommendation
    );

    // Collect all missing items with section labels
    const missingItems: { section: string; field: string }[] = [];
    for (const field of identifyResult.missing) missingItems.push({ section: 'Identify', field });
    for (const field of situationResult.missing) missingItems.push({ section: 'Situation', field });
    for (const field of backgroundResult.missing) missingItems.push({ section: 'Background', field });
    for (const field of assessmentResult.missing) missingItems.push({ section: 'Assessment', field });
    for (const field of recommendationResult.missing) missingItems.push({ section: 'Recommendation', field });

    // Gate decision
    let gateDecision: 'BLOCK' | 'NEEDS_REVIEW' | 'ALLOW';
    if (overallScore < 50) {
      gateDecision = 'BLOCK';
    } else if (overallScore < 75) {
      gateDecision = 'NEEDS_REVIEW';
    } else {
      gateDecision = 'ALLOW';
    }

    const riskLabel = getRiskLabel(overallScore);
    const qualityGrade = getQualityGrade(overallScore);

    const latency = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      sectionScores,
      overallScore,
      gateDecision,
      riskLabel,
      missingItems,
      qualityGrade,
      weights: SECTION_WEIGHTS,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Handover audit failed', details: String(error) }, { status: 500 });
  }
}