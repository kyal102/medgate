import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { los, acuteAdmission, charlsonComorbidities, edVisits } = await request.json();

    if (typeof los !== 'number' || typeof acuteAdmission !== 'boolean') {
      return NextResponse.json({ success: false, error: 'Length of stay and acute admission status required' }, { status: 400 });
    }

    // LACE Index Calculation
    // L: Length of stay (0-7 points)
    let lScore: number;
    if (los <= 0) lScore = 0;
    else if (los <= 1) lScore = 1;
    else if (los <= 3) lScore = 2;
    else if (los <= 4) lScore = 3;
    else if (los <= 6) lScore = 4;
    else if (los <= 7) lScore = 4;
    else if (los <= 13) lScore = 5;
    else lScore = 7;

    // A: Acute admission (0 or 3)
    const aScore = acuteAdmission ? 3 : 0;

    // C: Charlson comorbidity index (0-5 points)
    const cScore = Math.min(charlsonComorbidities?.length || 0, 5);

    // E: ED visits in last 6 months (0-4)
    const edCount = edVisits || 0;
    let eScore: number;
    if (edCount === 0) eScore = 0;
    else if (edCount === 1) eScore = 1;
    else if (edCount === 2) eScore = 2;
    else if (edCount === 3) eScore = 3;
    else eScore = 4;

    const laceScore = lScore + aScore + cScore + eScore;

    let riskLevel: string;
    let readmissionProb: string;
    if (laceScore >= 10) {
      riskLevel = 'High';
      readmissionProb = '>20% 30-day readmission risk';
    } else if (laceScore >= 5) {
      riskLevel = 'Moderate';
      readmissionProb = '10-20% 30-day readmission risk';
    } else {
      riskLevel = 'Low';
      readmissionProb = '<10% 30-day readmission risk';
    }

    const dischargeChecklist: { item: string; critical: boolean; completed: boolean }[] = [
      { item: 'Medication reconciliation completed', critical: true, completed: false },
      { item: 'Follow-up appointment scheduled within 7 days', critical: true, completed: false },
      { item: 'Discharge summary sent to PCP within 24 hours', critical: true, completed: false },
      { item: 'Patient education provided and documented', critical: true, completed: false },
      { item: 'Teach-back method used to verify understanding', critical: false, completed: false },
      { item: 'Home medications reviewed and adjusted', critical: true, completed: false },
      { item: 'Warning signs/symptoms discussed with patient', critical: true, completed: false },
      { item: 'Durable medical equipment arranged if needed', critical: false, completed: false },
      { item: 'Home health or PT/OT referral if needed', critical: false, completed: false },
      { item: 'Post-discharge phone call scheduled (24-48h)', critical: riskLevel !== 'Low', completed: false },
    ];

    const recommendations: string[] = [];
    if (riskLevel === 'High') {
      recommendations.push('Consider discharge planning conference with multidisciplinary team');
      recommendations.push('Arrange transitional care nurse follow-up');
      recommendations.push('Ensure follow-up within 48-72 hours');
      recommendations.push('Consider hospital-at-home or SNF if unable to safely discharge home');
      recommendations.push('Pharmacist-led medication counseling');
    } else if (riskLevel === 'Moderate') {
      recommendations.push('Ensure all critical checklist items completed');
      recommendations.push('Schedule follow-up within 7 days');
      recommendations.push('Post-discharge phone call at 48 hours');
    }

    return NextResponse.json({
      success: true,
      data: {
        laceScore,
        components: { lScore, aScore, cScore, eScore },
        riskLevel,
        readmissionProb,
        dischargeChecklist,
        recommendations,
        comorbiditiesCount: cScore,
        losDays: los,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}