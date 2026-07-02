import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bloodGlucose, weight, currentInsulin, carbIntake, insulinSensitivityFactor, targetGlucose, scenario } = await request.json();

    const bg = bloodGlucose;
    const w = weight;
    const target = targetGlucose || 140;
    const isf = insulinSensitivityFactor || Math.round(1800 / w); // Default rule of 1800

    // Correction dose using insulin sensitivity factor
    const correctionDose = bg > target ? Math.max(0, Math.round((bg - target) / isf)) : 0;

    // Basal rate calculation (units/hour) — typically 0.5-1.0 units/hour
    const basalRate = Math.round((w * 0.01) * 10) / 10; // ~0.5-1.0 U/hr for 50-100kg

    // Bolus/meal dose based on carb intake (if applicable)
    const carbRatio = Math.round(500 / w); // Approximate I:C ratio
    const bolusDose = carbIntake ? Math.round(carbIntake / carbRatio) : 0;

    // Protocol determination
    let protocol: string;
    const alerts: string[] = [];

    if (scenario === 'dka' || scenario === 'hhs' || scenario === 'diabetic-emergency') {
      protocol = 'DKA/HHS Protocol';
      if (bg > 250) {
        protocol += ': Regular insulin IV bolus 0.1 U/kg, then infusion 0.1 U/kg/hr';
        alerts.push('CRITICAL: DKA/HHS — frequent BG monitoring (Q1h) required');
        alerts.push('Monitor K+ closely — insulin shifts K+ intracellularly');
        alerts.push('Do NOT correct BG too rapidly — risk of cerebral edema');
        alerts.push('Target glucose reduction: 50-75 mg/dL/hour');
      }
    } else if (bg > 300) {
      protocol = 'Subcutaneous Sliding Scale — consider insulin drip if persistently >300';
      alerts.push('Blood glucose critically elevated. Notify provider.');
      alerts.push('Assess for DKA/HHS if ketones present or mental status altered');
      alerts.push('Ensure IV access and D50 available');
    } else if (bg > 250) {
      protocol = 'Subcutaneous Sliding Scale with frequent monitoring';
      alerts.push('High glucose — increase monitoring to Q2-4h');
    } else if (bg < 70) {
      protocol = 'HYPOGLYCEMIA PROTOCOL';
      if (bg < 54) {
        protocol += ' — SEVERE';
        alerts.push('🔴 SEVERE HYPOGLYCEMIA — Administer D50 25mL IV push immediately');
        alerts.push('If unable to give IV: Glucagon 1mg IM');
        alerts.push('Recheck BG in 15 minutes after treatment');
      } else {
        alerts.push('⚠️ HYPOGLYCEMIA: Administer 15g fast-acting carbs (D50 15mL or 4oz juice)');
        alerts.push('Recheck BG in 15 minutes, repeat if still <70');
      }
      protocol += ' — Hold insulin until BG >100 with stable trend';
    } else if (bg < 100) {
      protocol = 'Reduce insulin by 50%, provide snack if safe to eat';
      alerts.push('Borderline low glucose — monitor closely');
    } else {
      protocol = 'Maintenance — continue current insulin regimen';
    }

    return NextResponse.json({
      success: true,
      data: {
        correctionDose,
        basalRate,
        bolusDose,
        protocol,
        alerts,
        calculations: {
          insulinSensitivityFactor: isf,
          carbToInsulinRatio: carbRatio,
          targetGlucose: target,
        },
        monitoringFrequency: bg < 70 || bg > 250 ? 'Q1h' : bg > 180 ? 'Q2h' : 'Q4-6h',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}