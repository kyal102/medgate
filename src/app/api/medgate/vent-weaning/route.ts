import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { respiratoryRate, tidalVolume, sbtPassed, cuffLeak, mip } = await request.json();

    // Rapid Shallow Breathing Index: RR / VT (L)
    const tidalVolumeL = tidalVolume / 1000;
    const rsbi = tidalVolumeL > 0 ? respiratoryRate / tidalVolumeL : 999;

    let rsbiLevel: string;
    if (rsbi < 80) rsbiLevel = 'Favorable — low RSBI predicts successful extubation';
    else if (rsbi < 105) rsbiLevel = 'Indeterminate — additional weaning predictors needed';
    else rsbiLevel = 'Unfavorable — high RSBI predicts extubation failure';

    // SBT result assessment
    const sbtResult = sbtPassed
      ? 'Spontaneous Breathing Trial PASSED'
      : 'Spontaneous Breathing Trial FAILED';

    // Cuff leak assessment
    const cuffLeakAdequate = cuffLeak !== null && cuffLeak !== undefined && cuffLeak >= 110 || cuffLeak === true;
    const cuffLeakResult = cuffLeak === null || cuffLeak === undefined
      ? 'Not assessed'
      : cuffLeakAdequate
        ? 'Adequate cuff leak — low post-extubation stridor risk'
        : 'Absent/minimal cuff leak — HIGH risk of post-extubation stridor';

    // MIP (Maximal Inspiratory Pressure) assessment
    const mipAdequate = mip !== null && mip !== undefined && mip >= -20;
    const mipResult = mip === null || mip === undefined
      ? 'Not measured'
      : mipAdequate
        ? `MIP ${mip} cmH2O — adequate respiratory muscle strength`
        : `MIP ${mip} cmH2O — weak respiratory muscles, high failure risk`;

    // Weaning readiness
    const readyCriteria = {
      rsbiFavorable: rsbi < 105,
      sbtPassed: !!sbtPassed,
      cuffLeakAdequate,
      mipAdequate,
    };

    const criteriaMet = Object.values(readyCriteria).filter(Boolean).length;
    const weaningReady = criteriaMet >= 3;

    const decision: string[] = [];
    if (weaningReady && readyCriteria.sbtPassed) {
      decision.push('✅ Patient meets weaning readiness criteria — proceed with extubation');
      decision.push('Ensure backup airway equipment at bedside');
      decision.push('Pre-extubation: suction oropharynx, deflate cuff, assess for stridor');
      decision.push('Post-extubation: monitor for 24-48 hours, have reintubation plan ready');
    } else if (!readyCriteria.sbtPassed) {
      decision.push('❌ SBT failed — do NOT extubate');
      decision.push('Return to ventilator support, optimize conditioning');
      decision.push('Address reversible causes: fluid overload, secretions, cardiac ischemia');
      decision.push('Reattempt SBT in 24 hours');
    } else {
      decision.push('⚠️ Partial readiness criteria met — exercise caution');
      if (!readyCriteria.rsbiFavorable) decision.push(`RSBI ${rsbi.toFixed(0)} is elevated — consider longer conditioning`);
      if (!cuffLeakAdequate) decision.push('Cuff leak inadequate — consider steroids before extubation');
      if (!mipAdequate) decision.push('Weak respiratory muscles — consider inspiratory muscle training');
    }

    return NextResponse.json({
      success: true,
      data: {
        rsbi: Number(rsbi.toFixed(1)),
        rsbiLevel,
        sbtResult,
        cuffLeakResult,
        mipResult,
        weaningReady,
        criteriaMet,
        totalCriteria: 4,
        readyCriteria,
        decision,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}