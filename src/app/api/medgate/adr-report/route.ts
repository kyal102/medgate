import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type NaranjoAnswer = 'yes' | 'no' | 'unknown';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

const NARANJO_QUESTIONS: Record<string, { yes: number; no: number; unknown: number }> = {
  q1: { yes: 1, no: 0, unknown: 0 },   // Previous conclusive reports
  q2: { yes: 2, no: -1, unknown: 0 },   // Adverse event after drug given
  q3: { yes: 1, no: 0, unknown: 0 },    // Improved on discontinuation
  q4: { yes: 2, no: -1, unknown: 0 },   // Reappeared on re-administration
  q5: { yes: -1, no: 2, unknown: 0 },   // Alternative causes
  q6: { yes: -1, no: 1, unknown: 0 },   // Placebo reaction
  q7: { yes: 1, no: 0, unknown: 0 },    // Drug in toxic concentration
  q8: { yes: 1, no: 0, unknown: 0 },    // Dose-response
  q9: { yes: 1, no: 0, unknown: 0 },    // Similar drug reaction
  q10: { yes: 1, no: 0, unknown: 0 },   // Objective evidence
};

function calculateNaranjoScore(answers: Record<string, NaranjoAnswer>): number {
  let score = 0;
  for (const [key, answer] of Object.entries(answers)) {
    const q = NARANJO_QUESTIONS[key];
    if (q) {
      score += q[answer];
    }
  }
  return score;
}

function getCausalityCategory(score: number): { category: string; label: string } {
  if (score >= 9) return { category: 'DEFINITE', label: 'Definite' };
  if (score >= 5) return { category: 'PROBABLE', label: 'Probable' };
  if (score >= 1) return { category: 'POSSIBLE', label: 'Possible' };
  return { category: 'DOUBTFUL', label: 'Doubtful' };
}

function getRiskLabel(category: string, reaction: string): string {
  const reactionLower = reaction.toLowerCase();
  const isSevere = reactionLower.includes('anaphylaxis') ||
    reactionLower.includes('death') ||
    reactionLower.includes('sjs') ||
    reactionLower.includes('stevens-johnson') ||
    reactionLower.includes('ten') ||
    reactionLower.includes('epidermal necrolysis') ||
    reactionLower.includes('angioedema') ||
    reactionLower.includes('respiratory failure') ||
    reactionLower.includes('cardiac arrest') ||
    reactionLower.includes('hemorrhage');

  if (category === 'DEFINITE') return isSevere ? 'DEFINITE_SEVERE_ADR' : 'DEFINITE_ADR';
  if (category === 'PROBABLE') return isSevere ? 'PROBABLE_SEVERE_ADR' : 'PROBABLE_ADR';
  if (category === 'POSSIBLE') return 'POSSIBLE_ADR';
  return 'DOUBTFUL_ADR';
}

function getRecommendations(category: string, riskLabel: string, drugName: string): string[] {
  const recs: string[] = [];

  if (category === 'DEFINITE') {
    recs.push(`IMMEDIATE: ${drugName} is definitely causative — discontinue immediately`);
    recs.push('Report to FDA MedWatch / national pharmacovigilance system');
    recs.push('Document in patient allergy list permanently');
    recs.push('Alert pharmacy and clinical team');
  } else if (category === 'PROBABLE') {
    recs.push(`STRONG SUSPICION: ${drugName} is probable cause — consider discontinuation`);
    recs.push('Report to pharmacovigilance system');
    recs.push('Evaluate alternative therapies');
  } else if (category === 'POSSIBLE') {
    recs.push(`${drugName} is a possible cause — monitor closely`);
    recs.push('Consider differential diagnoses');
    recs.push('Reassess if additional evidence emerges');
  } else {
    recs.push(`${drugName} causality is doubtful — investigate alternative causes`);
    recs.push('Consider other medications, disease progression, or non-drug etiologies');
  }

  if (riskLabel.includes('SEVERE')) {
    recs.push('SEVERE REACTION: Activate rapid response if clinically indicated');
    recs.push('Ensure emergency medications available (epinephrine, steroids, antihistamines)');
    recs.push('Consider ICU monitoring');
  }

  return recs;
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();
    const {
      drugName,
      reaction,
      onsetDate,
      naranjoAnswers,
      outcome,
      actionTaken,
      description,
      reporter,
    } = body as {
      drugName: string;
      reaction: string;
      onsetDate?: string;
      naranjoAnswers: Record<string, NaranjoAnswer>;
      outcome: string;
      actionTaken: string;
      description: string;
      reporter?: string;
    };

    if (!drugName || !reaction || !naranjoAnswers || !outcome || !actionTaken || !description) {
      return NextResponse.json({ error: 'Missing required fields: drugName, reaction, naranjoAnswers, outcome, actionTaken, description' }, { status: 400 });
    }

    const naranjoScore = calculateNaranjoScore(naranjoAnswers);
    const { category: causalityCategory, label: causalityLabel } = getCausalityCategory(naranjoScore);
    const riskLabel = getRiskLabel(causalityCategory, reaction);
    const recommendations = getRecommendations(causalityCategory, riskLabel, drugName);

    // Gate decision
    let gateDecision: GateDecision = 'ALLOW';
    if (causalityCategory === 'DEFINITE' && riskLabel.includes('SEVERE')) {
      gateDecision = 'BLOCK';
    } else if (causalityCategory === 'PROBABLE') {
      gateDecision = 'NEEDS_REVIEW';
    } else if (causalityCategory === 'DEFINITE') {
      gateDecision = 'NEEDS_REVIEW';
    }

    const saved = await db.adverseEvent.create({
      data: {
        drugName,
        reaction,
        severity: riskLabel,
        onsetDate: onsetDate || null,
        causalityScore: naranjoScore,
        causalityCategory: causalityLabel,
        naranjoAnswers: JSON.stringify(naranjoAnswers),
        outcome,
        actionTaken,
        reporter: reporter || null,
        description,
        gateDecision,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      naranjoScore,
      causalityCategory: causalityLabel,
      causalityCode: causalityCategory,
      gateDecision,
      riskLabel,
      recommendations,
      savedId: saved.id,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'ADR report failed', details: String(error) }, { status: 500 });
  }
}