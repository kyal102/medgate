import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cpotScore, rassScore, camIcuPositive } = await request.json();

    if (typeof cpotScore !== 'number' || typeof rassScore !== 'number') {
      return NextResponse.json({ success: false, error: 'CPOT and RASS scores are required' }, { status: 400 });
    }

    // Pain assessment (CPOT 0-8)
    let painLevel: string;
    if (cpotScore <= 2) painLevel = 'No/Mild Pain';
    else if (cpotScore <= 4) painLevel = 'Moderate Pain';
    else painLevel = 'Severe Pain';

    // Agitation assessment (RASS)
    let agitationLevel: string;
    if (rassScore >= -1 && rassScore <= 0) agitationLevel = 'Calm/Target';
    else if (rassScore >= 1 && rassScore <= 2) agitationLevel = 'Mild-Moderate Agitation';
    else if (rassScore >= 3) agitationLevel = 'Severe Agitation';
    else if (rassScore <= -3) agitationLevel = 'Deep Sedation';
    else if (rassScore === -1) agitationLevel = 'Light Sedation';
    else agitationLevel = 'Over-Sedated';

    // Delirium status
    const deliriumStatus = camIcuPositive ? 'Positive — Delirium Present' : 'Negative — No Delirium';

    // PADIS compliance scoring
    let complianceScore = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (cpotScore > 4) {
      complianceScore -= 25;
      issues.push('Severe pain uncontrolled (CPOT >4)');
      recommendations.push('Administer analgesic: Fentanyl 25-50mcg IV or Morphine 2-4mg IV');
      recommendations.push('Reassess CPOT in 30 minutes');
      recommendations.push('Consider non-pharmacological pain relief measures');
    } else if (cpotScore > 2) {
      complianceScore -= 10;
      issues.push('Moderate pain (CPOT 3-4)');
      recommendations.push('Consider PRN analgesic if not recently administered');
      recommendations.push('Assess for source of pain');
    }

    if (rassScore >= 2) {
      complianceScore -= 25;
      issues.push('Significant agitation (RASS ≥+2)');
      recommendations.push('Increase sedation or treat underlying cause');
      recommendations.push('Assess for pain, delirium, and discomfort');
    } else if (rassScore <= -3) {
      complianceScore -= 15;
      issues.push('Over-sedation (RASS ≤-3)');
      recommendations.push('Reduce sedation by 25-50%');
      recommendations.push('Hold sedation and reassess in 30 min');
    }

    if (camIcuPositive) {
      complianceScore -= 20;
      issues.push('Delirium present (CAM-ICU positive)');
      recommendations.push('Initiate non-pharmacological delirium bundle');
      recommendations.push('Remove unnecessary catheters/tubes');
      recommendations.push('Reorientation, sleep promotion, early mobilization');
      recommendations.push('Avoid benzodiazepines unless alcohol withdrawal');
    }

    complianceScore = Math.max(0, complianceScore);

    return NextResponse.json({
      success: true,
      data: {
        painLevel,
        cpotScore,
        agitationLevel,
        rassScore,
        deliriumStatus,
        camIcuPositive,
        complianceScore,
        issues,
        recommendations: recommendations.length > 0 ? recommendations : ['PADIS bundle compliant. Continue current management and routine monitoring.'],
        padisComponents: {
          painAssessed: cpotScore !== null,
          agitationMonitored: rassScore !== null,
          deliriumScreened: camIcuPositive !== null && camIcuPositive !== undefined,
          sedationTargeted: true,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}