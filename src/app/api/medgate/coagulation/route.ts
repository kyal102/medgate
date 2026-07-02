import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { pt, inr, aptt, fibrinogen, platelets, dDimer } = await request.json();

    const pattern: string[] = [];
    const interpretation: string[] = [];
    const bloodProducts: string[] = [];

    // PT/INR assessment
    if (inr > 3.0) {
      pattern.push('Severely prolonged INR');
      interpretation.push('Severe coagulation factor deficiency or warfarin excess');
      bloodProducts.push('Consider FFP 10-15 mL/kg or 4-factor PCC (Kcentra)');
    } else if (inr > 1.5) {
      pattern.push('Prolonged INR');
      interpretation.push('Mild-moderate coagulation factor deficiency or warfarin effect');
      if (inr > 2.0) bloodProducts.push('Consider vitamin K 2.5-5mg IV for warfarin reversal if bleeding');
    } else {
      pattern.push('Normal INR');
    }

    // aPTT assessment
    if (aptt > 100) {
      pattern.push('Severely prolonged aPTT');
      interpretation.push('Severe intrinsic pathway deficiency or heparin excess');
      bloodProducts.push('Consider protamine sulfate if heparin-related (1mg per 100 units heparin in last 2-3h)');
    } else if (aptt > 40) {
      pattern.push('Prolonged aPTT');
      interpretation.push('Intrinsic pathway issue — check for heparin, lupus anticoagulant, factor deficiency');
    } else {
      pattern.push('Normal aPTT');
    }

    // Fibrinogen
    if (fibrinogen !== null && fibrinogen !== undefined) {
      if (fibrinogen < 100) {
        pattern.push('Severely low fibrinogen');
        interpretation.push('DIC, severe liver disease, or massive transfusion — critical bleeding risk');
        bloodProducts.push('Cryoprecipitate: 2 pools (10 units) to raise fibrinogen by ~100 mg/dL');
      } else if (fibrinogen < 200) {
        pattern.push('Low fibrinogen');
        interpretation.push('Consumptive coagulopathy, liver dysfunction, or dilutional coagulopathy');
        if (fibrinogen < 150) bloodProducts.push('Consider cryoprecipitate if actively bleeding');
      }
    }

    // Platelets
    if (platelets < 50) {
      pattern.push('Severe thrombocytopenia');
      interpretation.push('High bleeding risk — consider transfusion trigger');
      bloodProducts.push('Platelet transfusion: 1 apheresis unit (or 6-pack pooled) for bleeding/procedure');
    } else if (platelets < 100) {
      pattern.push('Mild-moderate thrombocytopenia');
      interpretation.push('Moderate bleeding risk — transfuse for invasive procedures');
    } else if (platelets > 450) {
      pattern.push('Thrombocytosis');
      interpretation.push('Reactive or primary — risk of thrombosis');
    }

    // D-dimer
    if (dDimer !== null && dDimer !== undefined && dDimer > 0.5) {
      pattern.push('Elevated D-dimer');
      interpretation.push(dDimer > 2.0
        ? 'Significantly elevated D-dimer — consider DIC, VTE, or other thrombotic process'
        : 'Mildly elevated D-dimer — clinical correlation needed');
    }

    // DIC assessment
    let dicScore = 0;
    if (platelets < 50) dicScore += 3;
    else if (platelets < 100) dicScore += 2;
    else if (platelets < 150) dicScore += 1;
    if (fibrinogen !== null && fibrinogen < 100) dicScore += 3;
    else if (fibrinogen !== null && fibrinogen < 200) dicScore += 1;
    if (pt > 15 || inr > 1.5) dicScore += 1;
    if (dDimer !== null && dDimer > 2.0) dicScore += 2;
    else if (dDimer !== null && dDimer > 0.5) dicScore += 1;

    if (dicScore >= 5) {
      interpretation.push('⚠️ DIC SCORE ≥5 — highly suggestive of DIC. Treat underlying cause.');
    }

    const anticoagTargets: { parameter: string; therapeuticRange: string; criticalLow: string; criticalHigh: string }[] = [
      { parameter: 'INR (warfarin)', therapeuticRange: '2.0-3.0 (most indications)', criticalLow: '<1.5', criticalHigh: '>4.0' },
      { parameter: 'aPTT (heparin)', therapeuticRange: '1.5-2.5x control (~60-80 sec)', criticalLow: '<45 sec', criticalHigh: '>100 sec' },
      { parameter: 'Fibrinogen', therapeuticRange: '150-400 mg/dL', criticalLow: '<100 mg/dL', criticalHigh: '>700 mg/dL' },
      { parameter: 'Platelets', therapeuticRange: '150-400 x10⁹/L', criticalLow: '<50 x10⁹/L', criticalHigh: '>1000 x10⁹/L' },
    ];

    return NextResponse.json({
      success: true,
      data: {
        pattern,
        interpretation,
        anticoagTargets,
        bloodProducts: bloodProducts.length > 0 ? bloodProducts : ['No specific blood product recommendations at this time'],
        dicScore,
        dicInterpretation: dicScore >= 5 ? 'Compatible with DIC' : dicScore >= 3 ? 'Suggestive of DIC — repeat in 24h' : 'Not suggestive of DIC',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}