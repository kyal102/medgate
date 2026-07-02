import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { readiness, duration, rassEnd, outcome, lastSatDate } = await request.json();

    // Assess protocol compliance
    const today = new Date();
    const lastSat = lastSatDate ? new Date(lastSatDate) : null;

    // Ideal: daily SAT from day 1 of mechanical ventilation
    // Minimum duration: target 30 min to 2 hours unless patient fails sooner
    const idealDuration = 30; // minutes minimum
    const targetDuration = 120; // minutes target

    const durationAdequate = duration >= idealDuration;
    const durationTarget = duration >= targetDuration;

    // RASS at end of SAT
    const rassAtEnd = rassEnd !== null && rassEnd !== undefined ? rassEnd : null;
    const rassAwake = rassAtEnd !== null && rassAtEnd >= 0;
    const rassOverSedated = rassAtEnd !== null && rassAtEnd <= -2;

    // Outcome assessment
    const outcomeLower = (outcome || '').toLowerCase();
    let outcomeInterpretation: string;
    if (outcomeLower === 'success') {
      outcomeInterpretation = 'SAT successful — patient tolerated sedation interruption';
    } else if (outcomeLower === 'failed') {
      outcomeInterpretation = 'SAT failed — return to previous sedation level';
    } else {
      outcomeInterpretation = 'Outcome not clearly documented';
    }

    // Missed days calculation
    let missedDays = 0;
    if (lastSat) {
      const diffMs = today.getTime() - lastSat.getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      missedDays = Math.max(0, diffDays - 1); // Today counts if done today
    }

    // Protocol compliance
    const protocolCompliant = readiness && durationAdequate && (rassAwake || rassAtEnd === null);

    const recommendation: string[] = [];
    if (!readiness) {
      recommendation.push('Patient not ready for SAT — document contraindication');
      recommendation.push('Reassess readiness next shift');
    } else if (!durationAdequate) {
      recommendation.push(`SAT duration ${duration} min is below minimum ${idealDuration} min`);
      recommendation.push('Extend SAT duration if patient tolerating');
    } else if (rassOverSedated) {
      recommendation.push('Patient over-sedated at end of SAT (RASS ≤-2)');
      recommendation.push('Reduce sedation infusion before next SAT');
      recommendation.push('Goal: RASS ≥0 during SAT');
    }

    if (missedDays >= 2) {
      recommendation.push(`⚠️ ${missedDays} days since last SAT — protocol non-compliant`);
      recommendation.push('Perform SAT today unless absolute contraindication exists');
    }

    if (outcomeLower === 'success') {
      recommendation.push('Consider SBT if patient meets weaning criteria');
      recommendation.push('Continue lighter sedation target');
    }

    const decision = !readiness
      ? 'SAT not performed — contraindication documented. Reassess next shift.'
      : protocolCompliant && outcomeLower === 'success'
        ? 'SAT completed successfully. Patient may be ready for spontaneous breathing trial.'
        : protocolCompliant
          ? 'SAT completed. Continue daily sedation assessments.'
          : 'SAT not fully compliant — address gaps before next assessment.';

    return NextResponse.json({
      success: true,
      data: {
        protocolCompliant,
        missedDays,
        recommendation,
        decision,
        outcome: outcomeInterpretation,
        durationAssessment: {
          actual: duration || 0,
          minimum: idealDuration,
          target: targetDuration,
          adequate: durationAdequate,
          atTarget: durationTarget,
        },
        rassAssessment: {
          endRass: rassAtEnd,
          awake: rassAwake,
          overSedated: rassOverSedated,
        },
        lastSatDate,
        complianceMetrics: {
          readiness,
          durationAdequate,
          rassAwake,
          dailyAttempt: missedDays === 0,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}