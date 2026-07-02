import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { currentCreatinine, baselineCreatinine, urineOutput, urinePeriod, weight, riskFactors } = await request.json();

    if (!currentCreatinine || !baselineCreatinine || !urineOutput || !urinePeriod || !weight) {
      return NextResponse.json({ success: false, error: 'All clinical values are required' }, { status: 400 });
    }

    // KDIGO Staging
    const creatinineRatio = currentCreatinine / baselineCreatinine;
    const absoluteIncrease = currentCreatinine - baselineCreatinine;
    const urineRateMlKgHr = (urineOutput / urinePeriod) / weight;

    let stage = 0;
    let stageReason = 'No AKI';

    if (creatinineRatio >= 3.0 || currentCreatinine >= 4.0 || urineRateMlKgHr < 0.3) {
      stage = 3;
      stageReason = 'Stage 3: Creatinine ≥3x baseline, or ≥4.0 mg/dL, or UO <0.3 mL/kg/hr for ≥24h';
    } else if (creatinineRatio >= 2.0) {
      stage = 3;
      stageReason = 'Stage 3: Creatinine ≥2x baseline';
    } else if (creatinineRatio >= 1.5 || absoluteIncrease >= 0.3 || urineRateMlKgHr < 0.5) {
      stage = 1;
      stageReason = 'Stage 1: Creatinine 1.5-1.9x baseline or increase ≥0.3 mg/dL, or UO <0.5 mL/kg/hr for 6-12h';
    }

    // Reclassify stage 1 to stage 2 if ratio >= 2.0 but < 3.0
    if (creatinineRatio >= 2.0 && creatinineRatio < 3.0 && currentCreatinine < 4.0) {
      stage = 2;
      stageReason = 'Stage 2: Creatinine 2-2.9x baseline';
    }

    let riskLevel: string;
    if (stage === 0) riskLevel = 'Low';
    else if (stage === 1) riskLevel = 'Moderate';
    else if (stage === 2) riskLevel = 'High';
    else riskLevel = 'Critical';

    const interventions: string[] = [];
    if (stage >= 1) {
      interventions.push('Discontinue nephrotoxic agents (NSAIDs, aminoglycosides, contrast)');
      interventions.push('Optimize volume status: fluid challenge if euvolemic/hypovolemic');
      interventions.push('Avoid hyperglycemia: target glucose 140-180 mg/dL');
    }
    if (stage >= 2) {
      interventions.push('Nephrology consultation URGENT');
      interventions.push('Strict I&O monitoring every 1-2 hours');
      interventions.push('Daily basic metabolic panel');
      interventions.push('Prepare for possible renal replacement therapy');
      interventions.push('Adjust all renally-cleared medications');
    }
    if (stage === 3) {
      interventions.push('CRITICAL: Initiate RRT evaluation immediately');
      interventions.push('ICU transfer if not already in critical care');
      interventions.push('Monitor for uremic complications (encephalopathy, pericarditis, bleeding)');
    }
    if (stage === 0) {
      interventions.push('Maintain adequate hydration');
      interventions.push('Monitor creatinine daily while on nephrotoxins');
    }

    // Additional risk from risk factors
    const additionalRisks: string[] = [];
    const knownRiskFactors = ['sepsis', 'shock', 'nephrotoxins', 'contrast', 'heartFailure', 'liverDisease', 'diabetes', 'hypertension', 'advancedAge', 'surgery'];
    for (const rf of (riskFactors || [])) {
      if (knownRiskFactors.includes(rf)) {
        additionalRisks.push(rf);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        stage,
        stageReason,
        creatinineRatio: Number(creatinineRatio.toFixed(3)),
        absoluteIncrease: Number(absoluteIncrease.toFixed(2)),
        urineRateMlKgHr: Number(urineRateMlKgHr.toFixed(3)),
        riskLevel,
        interventions,
        additionalRiskFactors: additionalRisks,
        monitoringFrequency: stage >= 2 ? 'Every 4-6 hours' : stage === 1 ? 'Every 12 hours' : 'Daily',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}