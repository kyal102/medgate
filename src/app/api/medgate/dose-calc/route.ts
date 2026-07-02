import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { drug, dose, unit, weight_kg, age, egfr } = await req.json();
    const drugLower = (drug || '').toLowerCase(); let decision = 'ALLOW'; let reason = ''; let maxDose = 0; let therapeuticRange = '';
    if (drugLower.includes('acetaminophen') || drugLower.includes('paracetamol')) {
      maxDose = age < 18 ? 75 * weight_kg : 4000;
      therapeuticRange = age < 18 ? `10-15 mg/kg/q6h (max ${Math.round(maxDose)}mg/day)` : '325-1000mg q4-6h (max 4000mg/day)';
      const dailyEstimate = dose >= 1000 ? dose * 4 : dose * 3;
      if (age < 18 && dailyEstimate > maxDose) { decision = 'BLOCK'; reason = `LETHAL_DOSE: Estimated daily ${dailyEstimate}mg exceeds pediatric max ${Math.round(maxDose)}mg`; }
      else if (dailyEstimate > maxDose) { decision = 'BLOCK'; reason = `DOSE_EXCEEDS_MAXIMUM: ${dailyEstimate}mg exceeds 4000mg/day`; }
      else if (dailyEstimate > maxDose * 0.75) { decision = 'NEEDS_REVIEW'; reason = `DOSE_BOUNDARY: ${dailyEstimate}mg approaching ${maxDose}mg limit`; }
      else { reason = `DOSE_THERAPEUTIC: ${dose}${unit} within safe range`; }
    } else if (drugLower.includes('gentamicin')) {
      maxDose = 7; therapeuticRange = `5-7 mg/kg once daily`;
      if (dose / weight_kg > 7) { decision = 'BLOCK'; reason = 'DOSE_EXCEEDS_MAXIMUM'; } else { reason = 'DOSE_THERAPEUTIC'; }
    } else if (drugLower.includes('digoxin')) {
      maxDose = 0.25; therapeuticRange = '0.125-0.25mg daily';
      if (egfr && egfr < 30 && dose > 0.125) { decision = 'BLOCK'; reason = `DOSE_EXCEEDS_MAXIMUM: eGFR ${egfr} requires dose reduction`;
      } else if (dose > 0.5) { decision = 'BLOCK'; reason = 'DOSE_EXCEEDS_MAXIMUM: >0.5mg is toxic'; } else { reason = 'DOSE_THERAPEUTIC'; }
    } else { therapeuticRange = 'Consult pharmacopeia'; reason = 'No specific dose rule for this medication'; }
    return NextResponse.json({ drug, dose, unit, weight_kg, age, decision, reason, maxDose, therapeuticRange, renalAdjustment: egfr && egfr < 30 ? 'Required' : 'Not needed' });
  } catch (error) { return NextResponse.json({ error: 'Dose calculation failed' }, { status: 500 }); }
}
