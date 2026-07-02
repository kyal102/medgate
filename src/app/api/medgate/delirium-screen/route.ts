import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { acuteOnset, inattention, alteredLOC, disorganizedThinking } = await request.json();

    if (typeof acuteOnset !== 'boolean' || typeof inattention !== 'boolean' ||
        typeof disorganizedThinking !== 'boolean' || !alteredLOC) {
      return NextResponse.json({ success: false, error: 'Invalid input parameters' }, { status: 400 });
    }

    const features: string[] = [];
    if (acuteOnset) features.push('Acute onset / fluctuating course');
    if (inattention) features.push('Inattention');
    if (alteredLOC !== 'normal') features.push(`Altered level of consciousness: ${alteredLOC}`);
    if (disorganizedThinking) features.push('Disorganized thinking');

    // CAM-ICU Algorithm: Positive if Feature 1 AND Feature 2 AND (Feature 3 OR Feature 4)
    const positive = acuteOnset && inattention && (alteredLOC !== 'normal' || disorganizedThinking);

    const recommendations: string[] = [];
    if (positive) {
      recommendations.push('Initiate non-pharmacological delirium management immediately');
      recommendations.push('Assess and treat reversible causes (infection, pain, urinary retention, constipation)');
      recommendations.push('Ensure reorientation: clock, calendar, familiar objects, family presence');
      recommendations.push('Optimize sleep-wake cycle: reduce nighttime interruptions, promote daytime activity');
      recommendations.push('Avoid benzodiazepines unless alcohol withdrawal is the cause');
      recommendations.push('Consider low-dose haloperidol (0.5-2mg) if agitation poses safety risk');
      recommendations.push('Document CAM-ICU screening result and reassess every 8-12 hours');
      recommendations.push('Involve geriatrician or psychiatrist if delirium persists >48 hours');
    } else {
      recommendations.push('Continue routine CAM-ICU screening every shift');
      recommendations.push('Maintain delirium prevention bundle (sleep, mobilization, cognition, sensory)');
      recommendations.push('Review current medications for deliriogenic potential');
    }

    return NextResponse.json({
      success: true,
      data: {
        positive,
        features,
        recommendations,
        camIcuAlgorithm: {
          feature1_acuteOnset: acuteOnset,
          feature2_inattention: inattention,
          feature3_alteredLOC: alteredLOC !== 'normal',
          feature4_disorganizedThinking: disorganizedThinking,
          criteriaMet: features.length,
        },
        reassessmentInterval: positive ? '8-12 hours' : 'Every shift',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}