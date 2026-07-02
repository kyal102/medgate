import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { alert, sitting, oralHygiene, dentures, waterTestResults, symptoms } = await request.json();

    if (!waterTestResults || typeof waterTestResults.stage1 === 'undefined') {
      return NextResponse.json({ success: false, error: 'Water test results are required' }, { status: 400 });
    }

    // Pre-screening criteria
    const preScreenPass = alert && sitting && oralHygiene;

    const issues: string[] = [];
    if (!alert) issues.push('Patient not alert — NPO and reassess');
    if (!sitting) issues.push('Patient not in upright position — elevate to ≥60°');

    // Water test stages
    const stage1Fail = !waterTestResults.stage1; // Unable to hold in mouth
    const stage2Fail = !waterTestResults.stage2; // Unable to swallow or delayed
    const stage3Fail = !waterTestResults.stage3; // Wet voice, cough, or desaturation

    let aspirationRisk: string;
    let result: string;
    let dietRecommendation: string;
    let fluidConsistency: string;
    let needsSLP = false;

    if (!preScreenPass) {
      result = 'FAIL — Pre-screening criteria not met';
      aspirationRisk = 'Unknown — unable to assess';
      dietRecommendation = 'NPO (Nothing by mouth)';
      fluidConsistency = 'IV fluids only';
      needsSLP = true;
    } else if (stage1Fail) {
      result = 'FAIL — Stage 1: Unable to hold water in mouth';
      aspirationRisk = 'High';
      dietRecommendation = 'NPO — urgent SLP referral';
      fluidConsistency = 'IV fluids';
      needsSLP = true;
    } else if (stage2Fail) {
      result = 'FAIL — Stage 2: Swallowing difficulty or delay';
      aspirationRisk = 'High';
      dietRecommendation = 'NPO pending SLP evaluation';
      fluidConsistency = 'IV fluids until SLP assessment';
      needsSLP = true;
    } else if (stage3Fail) {
      result = 'FAIL — Stage 3: Signs of aspiration (cough, wet voice, desaturation)';
      aspirationRisk = 'High';
      dietRecommendation = 'NPO immediately';
      fluidConsistency = 'IV fluids — do NOT give any oral intake';
      needsSLP = true;
    } else {
      const hasSymptoms = (symptoms || []).length > 0;
      if (hasSymptoms) {
        result = 'CAUTION — Water test passed but symptoms reported';
        aspirationRisk = 'Moderate';
        dietRecommendation = 'Modified diet pending SLP';
        fluidConsistency = 'Thickened liquids (honey consistency)';
        needsSLP = true;
      } else {
        result = 'PASS — All stages completed without aspiration signs';
        aspirationRisk = 'Low';
        dietRecommendation = 'Regular diet may be initiated';
        fluidConsistency = 'Thin liquids permitted';
        needsSLP = false;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        result,
        aspirationRisk,
        dietRecommendation,
        fluidConsistency,
        needsSLP,
        preScreen: { alert, sitting, oralHygiene, denturesRemoved: dentures },
        waterTest: { stage1: waterTestResults.stage1, stage2: waterTestResults.stage2, stage3: waterTestResults.stage3 },
        symptoms: symptoms || [],
        recommendations: needsSLP
          ? ['Request SLP consultation within 24 hours', 'Maintain NPO until SLP evaluation', 'Monitor for signs of aspiration during oral care', 'Position patient upright ≥60° for all oral intake']
          : ['Initiate diet as tolerated', 'Monitor during first few meals', 'Reassess if any swallowing difficulty develops'],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}