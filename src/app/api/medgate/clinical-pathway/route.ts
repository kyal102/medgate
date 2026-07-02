import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pathway, steps } = await request.json();

    if (!pathway || !steps || !Array.isArray(steps)) {
      return NextResponse.json({ success: false, error: 'Pathway name and steps array required' }, { status: 400 });
    }

    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.completed).length;
    const pendingSteps = steps.filter(s => !s.completed);

    // Compliance calculation
    const compliance = totalSteps > 0 ? Number(((completedSteps / totalSteps) * 100).toFixed(1)) : 0;

    // Check for critical (mandatory) steps that were missed
    // In a real system, steps would have an `isCritical` flag. Here we flag steps 0 and 1 as typical critical steps.
    const missedCriticalSteps = steps
      .filter((s, i) => !s.completed && (i === 0 || i === 1))
      .map(s => s.name);

    // Time compliance — check if steps are done within expected time windows
    // Simple approach: if a step has a timestamp, check it exists for completed steps
    const stepsMissingTimestamp = steps.filter(s => s.completed && !s.timestamp);
    const timeCompliance = steps.length > 0
      ? Number(((completedSteps - stepsMissingTimestamp.length) / completedSteps) * 100).toFixed(1)
      : '100.0';

    // Pathway-specific decision support
    const decision: string[] = [];
    const pathwayLower = (pathway || '').toLowerCase();

    if (compliance === 100) {
      decision.push('✅ All pathway steps completed');
      decision.push('Document pathway completion and outcomes');
    } else {
      decision.push(`⚠️ ${completedSteps}/${totalSteps} steps completed (${compliance}%)`);

      if (missedCriticalSteps.length > 0) {
        decision.push(`🔴 CRITICAL steps missed: ${missedCriticalSteps.join(', ')}`);
        decision.push('These steps must be completed before patient progression');
      }

      if (pendingSteps.length > 0) {
        const nextStep = pendingSteps[0];
        decision.push(`Next required step: ${nextStep.name}`);
      }
    }

    // Pathway-specific recommendations
    const pathwayRecommendations: string[] = [];
    if (pathwayLower.includes('sepsis')) {
      if (compliance < 100) pathwayRecommendations.push('Sepsis pathway incomplete — time-sensitive, escalate immediately');
      pathwayRecommendations.push('All sepsis bundle elements should be completed within 1-3 hours');
    } else if (pathwayLower.includes('stroke')) {
      if (compliance < 100) pathwayRecommendations.push('Stroke pathway — time is brain. Complete remaining steps ASAP');
      pathwayRecommendations.push('Document door-to-needle time if tPA administered');
    } else if (pathwayLower.includes('ami') || pathwayLower.includes('acs')) {
      if (compliance < 100) pathwayRecommendations.push('ACS pathway — ensure cardiac cath lab activated if STEMI');
    } else if (pathwayLower.includes('trauma')) {
      if (compliance < 100) pathwayRecommendations.push('Trauma pathway — ensure primary and secondary surveys completed');
    }

    return NextResponse.json({
      success: true,
      data: {
        pathway,
        compliance,
        totalSteps,
        completedSteps,
        missedCriticalSteps,
        timeCompliance,
        decision,
        pathwayRecommendations,
        pendingSteps: pendingSteps.map(s => ({ name: s.name, completed: false })),
        completedStepsList: steps.filter(s => s.completed).map(s => ({ name: s.name, timestamp: s.timestamp || null })),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}