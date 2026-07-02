import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cfsLevel, frailScore } = await request.json();

    if (typeof cfsLevel !== 'number' || cfsLevel < 1 || cfsLevel > 9) {
      return NextResponse.json({ success: false, error: 'CFS level must be 1-9' }, { status: 400 });
    }

    const cfsLabels: Record<number, string> = {
      1: 'Very Fit', 2: 'Well', 3: 'Managing Well', 4: 'Vulnerable',
      5: 'Mildly Frail', 6: 'Moderately Frail', 7: 'Severely Frail',
      8: 'Very Severely Frail', 9: 'Terminally Ill',
    };

    const cfsLabel = cfsLabels[cfsLevel] || 'Unknown';

    const risks = {
      surgical: cfsLevel >= 7 ? 'Very High' : cfsLevel >= 5 ? 'High' : cfsLevel >= 4 ? 'Moderate' : 'Low',
      mortality: cfsLevel >= 8 ? '30-day mortality >30%' : cfsLevel >= 7 ? '30-day mortality ~15-30%' : cfsLevel >= 5 ? '30-day mortality ~5-15%' : '30-day mortality <5%',
      los: cfsLevel >= 7 ? 'Expected LOS >14 days' : cfsLevel >= 5 ? 'Expected LOS 7-14 days' : cfsLevel >= 4 ? 'Expected LOS 4-7 days' : 'Expected LOS <4 days',
    };

    const recommendations: string[] = [];
    if (cfsLevel >= 7) {
      recommendations.push('Geriatric consultation recommended');
      recommendations.push('Goals of care discussion with patient/family');
      recommendations.push('Comprehensive geriatric assessment');
      recommendations.push('Consider palliative care involvement');
      recommendations.push('Avoid aggressive surgical interventions unless clearly beneficial');
      recommendations.push('Individualized risk-benefit discussion required');
    } else if (cfsLevel >= 5) {
      recommendations.push('Prehabilitation if surgery planned (2-4 weeks)');
      recommendations.push('Nutritional optimization (protein supplementation)');
      recommendations.push('Exercise/physical therapy referral');
      recommendations.push('Medication review to reduce polypharmacy');
      recommendations.push('Discuss elevated surgical risk with patient');
    } else if (cfsLevel >= 4) {
      recommendations.push('Optimize medical conditions before intervention');
      recommendations.push('Ensure adequate nutritional support');
      recommendations.push('Early mobilization plan post-procedure');
      recommendations.push('Medication review');
    } else {
      recommendations.push('Standard perioperative management');
      recommendations.push('Continue health maintenance');
    }

    const decision = cfsLevel >= 8
      ? 'Seriously consider non-surgical management or palliative approach'
      : cfsLevel >= 7
        ? 'Surgery only if strongly indicated; discuss risks thoroughly'
        : cfsLevel >= 5
          ? 'Surgery acceptable with enhanced perioperative care'
          : 'Proceed with standard surgical management';

    return NextResponse.json({
      success: true,
      data: {
        cfsLevel,
        cfsLabel,
        frailScore: frailScore || null,
        risks,
        recommendations,
        decision,
        frailtyCategory: cfsLevel <= 3 ? 'Fit' : cfsLevel <= 4 ? 'Vulnerable' : cfsLevel <= 6 ? 'Frail' : 'Severely Frail',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}