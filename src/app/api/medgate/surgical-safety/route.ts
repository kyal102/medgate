import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

const PHASE_REQUIREMENTS: Record<string, { critical: string[]; standard: string[] }> = {
  'sign-in': {
    critical: [
      'identity confirmed',
      'consent',
      'site marked',
      'allergies',
      'airway',
      'patient identity',
      'informed consent',
      'surgical site',
      'allergy status',
      'airway assessment',
    ],
    standard: [
      'anesthesia plan',
      'equipment check',
      'iv access',
      'patient positioning',
      'pre-op vitals',
      'ntp verification',
      'team introduction',
      'dvt prophylaxis',
    ],
  },
  timeout: {
    critical: [
      'patient name',
      'procedure',
      'site confirmed',
      'antibiotic given',
      'critical events discussed',
      'patient identity confirmed',
      'procedure confirmed',
      'surgical site confirmed',
      'prophylactic antibiotic',
      'anticipated critical events',
    ],
    standard: [
      'instrument availability',
      'implant availability',
      'blood availability',
      'imaging available',
      'fire risk assessment',
      'team roles confirmed',
      'estimated duration',
      'special equipment needs',
    ],
  },
  'sign-out': {
    critical: [
      'instrument count',
      'specimen labeled',
      'instrument count correct',
      'specimen',
      'needle count',
      'sponge count',
    ],
    standard: [
      'equipment count',
      'post-op plan',
      'concerns',
      'recovery plan',
      'antibiotic duration',
      'dvt prophylaxis plan',
      'follow-up plan',
      'pain management plan',
    ],
  },
};

function normalizeItem(item: string): string {
  return item.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
}

function itemMatches(item: string, requirement: string): boolean {
  const normItem = normalizeItem(item);
  const normReq = normalizeItem(requirement);
  if (normItem === normReq) return true;
  if (normItem.includes(normReq) || normReq.includes(normItem)) return true;

  const itemWords = normItem.split(' ').filter(Boolean);
  const reqWords = normReq.split(' ').filter(Boolean);
  const overlap = itemWords.filter(w => reqWords.includes(w));
  if (overlap.length >= Math.min(2, reqWords.length)) return true;

  return false;
}

function checkPhase(phase: string, itemsChecked: string[]): {
  criticalMissed: string[];
  standardMissed: string[];
  criticalMet: boolean;
  standardMet: boolean;
} {
  const reqs = PHASE_REQUIREMENTS[phase];
  if (!reqs) {
    return { criticalMissed: [], standardMissed: [], criticalMet: true, standardMet: true };
  }

  const criticalMissed = reqs.critical.filter(
    req => !itemsChecked.some(checked => itemMatches(checked, req))
  );
  const standardMissed = reqs.standard.filter(
    req => !itemsChecked.some(checked => itemMatches(checked, req))
  );

  return {
    criticalMissed,
    standardMissed,
    criticalMet: criticalMissed.length === 0,
    standardMet: standardMissed.length === 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();
    const { procedure, phase, itemsChecked, itemsMissed, safetyConcerns } = body as {
      procedure: string;
      phase: 'sign-in' | 'timeout' | 'sign-out';
      itemsChecked: string[];
      itemsMissed?: string[];
      safetyConcerns?: string[];
    };

    if (!procedure || !phase || !itemsChecked) {
      return NextResponse.json({ error: 'Missing required fields: procedure, phase, itemsChecked' }, { status: 400 });
    }
    if (!['sign-in', 'timeout', 'sign-out'].includes(phase)) {
      return NextResponse.json({ error: 'phase must be sign-in, timeout, or sign-out' }, { status: 400 });
    }

    const result = checkPhase(phase, itemsChecked);
    const allItemsMissed = [...result.criticalMissed, ...result.standardMissed, ...(itemsMissed || [])];

    // Gate decision
    let gateDecision: GateDecision;
    let riskLabel: string;

    if (!result.criticalMet) {
      gateDecision = 'BLOCK';
      riskLabel = 'CRITICAL_CHECKLIST_ITEM_MISSED';
    } else if (!result.standardMet) {
      gateDecision = 'NEEDS_REVIEW';
      riskLabel = 'NON_CRITICAL_ITEM_MISSED';
    } else {
      gateDecision = 'ALLOW';
      riskLabel = 'CHECKLIST_COMPLETE';
    }

    // If safety concerns are present, upgrade decision
    if (safetyConcerns && safetyConcerns.length > 0 && gateDecision === 'ALLOW') {
      gateDecision = 'NEEDS_REVIEW';
      riskLabel = 'SAFETY_CONCERNS_NOTED';
    }

    await db.surgicalChecklist.create({
      data: {
        procedure,
        phase,
        signInComplete: phase === 'sign-in' ? result.criticalMet : undefined,
        timeoutComplete: phase === 'timeout' ? result.criticalMet : undefined,
        signOutComplete: phase === 'sign-out' ? result.criticalMet : undefined,
        itemsChecked: JSON.stringify(itemsChecked),
        itemsMissed: JSON.stringify(allItemsMissed),
        safetyConcerns: safetyConcerns ? JSON.stringify(safetyConcerns) : null,
        gateDecision,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      phase,
      procedure,
      signInComplete: phase === 'sign-in' ? result.criticalMet : undefined,
      timeoutComplete: phase === 'timeout' ? result.criticalMet : undefined,
      signOutComplete: phase === 'sign-out' ? result.criticalMet : undefined,
      itemsChecked,
      itemsMissed: allItemsMissed,
      criticalMissed: result.criticalMissed,
      standardMissed: result.standardMissed,
      safetyConcerns: safetyConcerns || [],
      gateDecision,
      riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Surgical safety check failed', details: String(error) }, { status: 500 });
  }
}