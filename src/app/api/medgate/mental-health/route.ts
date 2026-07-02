import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface MentalHealthInput {
  phq9Scores: number[];  // 9 items, each 0-3
  gad7Scores: number[];  // 7 items, each 0-3
  cssrsAnswers: Record<string, boolean>;
  safetyPlan?: string;
}

const PHQ9_SEVERITY: Record<string, { range: [number, number]; label: string; recommendations: string[] }> = {
  'minimal':  { range: [0, 4],  label: 'Minimal Depression', recommendations: ['No treatment may be needed', 'Monitor and reassess if symptoms persist', 'Psychoeducation and wellness promotion'] },
  'mild':     { range: [5, 9],  label: 'Mild Depression', recommendations: ['Watchful waiting with re-assessment', 'Consider psychotherapy (CBT)', 'Exercise and sleep hygiene counseling', 'Reassess in 2-4 weeks'] },
  'moderate': { range: [10, 14], label: 'Moderate Depression', recommendations: ['Active treatment recommended', 'Psychotherapy (CBT or IPT)', 'Consider antidepressant medication (SSRI first-line)', 'Safety assessment required', 'Follow-up in 1-2 weeks'] },
  'moderately-severe': { range: [15, 19], label: 'Moderately Severe Depression', recommendations: ['Pharmacotherapy + psychotherapy recommended', 'SSRI/SNRI initiation', 'Psychiatry consultation recommended', 'Safety plan required', 'Weekly follow-up', 'Consider crisis resources'] },
  'severe':   { range: [20, 27], label: 'Severe Depression', recommendations: ['Urgent psychiatric evaluation', 'Pharmacotherapy + psychotherapy', 'Consider hospitalization if safety concerns', 'Active safety planning', 'Frequent follow-up (q1-3 days)', 'Coordinate with support system'] },
};

const GAD7_SEVERITY: Record<string, { range: [number, number]; label: string; recommendations: string[] }> = {
  'minimal':  { range: [0, 4],  label: 'Minimal Anxiety', recommendations: ['No treatment may be needed', 'Monitor and reassess'] },
  'mild':     { range: [5, 9],  label: 'Mild Anxiety', recommendations: ['Watchful waiting with re-assessment', 'Consider psychotherapy', 'Relaxation techniques and stress management'] },
  'moderate': { range: [10, 14], label: 'Moderate Anxiety', recommendations: ['Active treatment recommended', 'CBT or SSRIs', 'Consider buspirone', 'Follow-up in 2-4 weeks'] },
  'severe':   { range: [15, 21], label: 'Severe Anxiety', recommendations: ['Pharmacotherapy + psychotherapy recommended', 'SSRI/SNRI initiation', 'Psychiatry consultation', 'Benzodiazepine short-term only if acute crisis', 'Follow-up in 1-2 weeks'] },
};

// C-SSRS key questions
const CSSRS_QUESTIONS = {
  'wish-to-be-dead': 'Wish to be dead or not alive',
  'non-specific-active': 'Non-specific active suicidal thoughts',
  'active-ideation-method': 'Active suicidal ideation with any method',
  'active-ideation-plan': 'Active suicidal ideation with some intent to act',
  'active-ideation-plan-without-intent': 'Active suicidal ideation with plan but no intent',
  'active-ideation-plan-with-intent': 'Active suicidal ideation with plan and intent',
  'suicidal-behavior': 'Suicidal behavior (actual attempt, interrupted, aborted, preparatory)',
};

function evaluateMentalHealth(input: MentalHealthInput) {
  const { phq9Scores, gad7Scores, cssrsAnswers, safetyPlan } = input;
  const safetyRecommendations: string[] = [];
  let gateDecision: GateDecision = 'ALLOW';
  let riskLabel = 'LOW';

  // PHQ-9 calculation
  const phq9Total = phq9Scores.reduce((sum, s) => sum + (Number(s) || 0), 0);
  let phq9Severity = 'minimal';
  let phq9Recs: string[] = [];

  for (const [, info] of Object.entries(PHQ9_SEVERITY)) {
    if (phq9Total >= info.range[0] && phq9Total <= info.range[1]) {
      phq9Severity = info.label;
      phq9Recs = [...info.recommendations];
      break;
    }
  }

  // Question 9 (suicidal ideation)
  const q9Score = phq9Scores[8] ?? 0;
  if (q9Score >= 1) {
    phq9Recs.push('Question 9 (suicidal ideation) endorsed — immediate safety assessment required');
    safetyRecommendations.push('Suicidal ideation present on PHQ-9 — conduct full C-SSRS assessment');
    if (q9Score >= 2) {
      safetyRecommendations.push('Frequent suicidal thoughts — consider psychiatric emergency evaluation');
    }
  }

  // GAD-7 calculation
  const gad7Total = gad7Scores.reduce((sum, s) => sum + (Number(s) || 0), 0);
  let gad7Severity = 'minimal';
  let gad7Recs: string[] = [];

  for (const [, info] of Object.entries(GAD7_SEVERITY)) {
    if (gad7Total >= info.range[0] && gad7Total <= info.range[1]) {
      gad7Severity = info.label;
      gad7Recs = [...info.recommendations];
      break;
    }
  }

  // C-SSRS triage
  let cssrsTriage = 'No Risk';
  const positiveCssrsItems: string[] = [];

  for (const [key, label] of Object.entries(CSSRS_QUESTIONS)) {
    if (cssrsAnswers[key]) {
      positiveCssrsItems.push(label);
    }
  }

  if (cssrsAnswers['suicidal-behavior'] || cssrsAnswers['active-ideation-plan-with-intent']) {
    cssrsTriage = 'Crisis — Immediate Action Required';
    gateDecision = 'BLOCK';
    riskLabel = 'HIGH';
    safetyRecommendations.push('C-SSRS CRISIS LEVEL — immediate psychiatric evaluation', 'Do not leave patient alone', 'Activate crisis protocol', 'Consider emergency department transfer or inpatient psychiatric admission', 'Remove access to means');
  } else if (cssrsAnswers['active-ideation-plan'] || cssrsAnswers['active-ideation-plan-without-intent'] || cssrsAnswers['active-ideation-method']) {
    cssrsTriage = 'High Risk — Urgent Safety Plan Needed';
    gateDecision = 'BLOCK';
    riskLabel = 'HIGH';
    safetyRecommendations.push('C-SSRS HIGH RISK — urgent psychiatric consultation', 'Develop/review safety plan', 'Means restriction counseling', 'Increase support contacts', 'Follow-up within 24 hours');
  } else if (cssrsAnswers['non-specific-active']) {
    cssrsTriage = 'Moderate Risk — Safety Assessment Required';
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    riskLabel = riskLabel === 'LOW' ? 'MODERATE' : riskLabel;
    safetyRecommendations.push('C-SSRS moderate risk — document safety assessment', 'Explore ambivalence and reasons for living', 'Provide crisis resources (988 Lifeline)', 'Schedule follow-up');
  } else if (cssrsAnswers['wish-to-be-dead']) {
    cssrsTriage = 'Elevated Risk — Further Assessment Needed';
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    riskLabel = riskLabel === 'LOW' ? 'MODERATE' : riskLabel;
    safetyRecommendations.push('Passive death wish present — clinical assessment of suicide risk', 'Assess hopelessness, substance use, and protective factors', 'Provide crisis resources');
  }

  // If Q9≥1 and no C-SSRS answers provided
  if (q9Score >= 1 && positiveCssrsItems.length === 0) {
    safetyRecommendations.push('PHQ-9 Q9 positive but C-SSRS not completed — C-SSRS assessment recommended');
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // Safety plan check
  if (positiveCssrsItems.length > 0 && !safetyPlan) {
    safetyRecommendations.push('NO SAFETY PLAN DOCUMENTED — required for any positive C-SSRS response');
    if (gateDecision === 'ALLOW') gateDecision = 'BLOCK';
  }

  // Gate: BLOCK if C-SSRS crisis + no safety plan
  if ((cssrsTriage.includes('Crisis') || cssrsTriage.includes('High Risk')) && !safetyPlan) {
    gateDecision = 'BLOCK';
    safetyRecommendations.push('CANNOT PROCEED — C-SSRS crisis/high risk without documented safety plan');
  }
  // NEEDS_REVIEW if C-SSRS positive
  if (positiveCssrsItems.length > 0 && gateDecision === 'ALLOW') {
    gateDecision = 'NEEDS_REVIEW';
  }

  // Elevate gate for severe depression
  if (phq9Total >= 20 && gateDecision === 'ALLOW') {
    gateDecision = 'NEEDS_REVIEW';
    riskLabel = 'MODERATE';
  }

  const allRecommendations = [...phq9Recs, ...gad7Recs];

  return {
    phq9Score: phq9Total,
    phq9Severity,
    gad7Score: gad7Total,
    gad7Severity,
    cssrsTriage,
    cssrsPositiveItems: positiveCssrsItems,
    safetyRecommendations,
    allRecommendations,
    gateDecision,
    riskLabel,
  };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as MentalHealthInput;
    const { phq9Scores, gad7Scores } = body;

    if (!phq9Scores || !Array.isArray(phq9Scores) || phq9Scores.length !== 9) {
      return NextResponse.json({ error: 'phq9Scores must be an array of 9 numbers (0-3 each)' }, { status: 400 });
    }
    if (!gad7Scores || !Array.isArray(gad7Scores) || gad7Scores.length !== 7) {
      return NextResponse.json({ error: 'gad7Scores must be an array of 7 numbers (0-3 each)' }, { status: 400 });
    }

    const result = evaluateMentalHealth(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    const totalRiskScore = result.phq9Score + result.gad7Score + (result.cssrsPositiveItems.length * 5);

    await db.clinicalScore.create({
      data: {
        scoreType: 'mental-health',
        rawScore: totalRiskScore,
        totalPossible: 48, // 27 (PHQ-9) + 21 (GAD-7)
        riskLevel: result.riskLabel,
        components: JSON.stringify(body),
        recommendation: [...result.allRecommendations, ...result.safetyRecommendations].join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      phq9Score: result.phq9Score,
      phq9Severity: result.phq9Severity,
      gad7Score: result.gad7Score,
      gad7Severity: result.gad7Severity,
      cssrsTriage: result.cssrsTriage,
      safetyRecommendations: result.safetyRecommendations,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Mental health assessment failed', details: String(error) }, { status: 500 });
  }
}