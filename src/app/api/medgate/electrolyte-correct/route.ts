import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { electrolyte, currentLevel, targetLevel, weight, route } = await request.json();

    if (!electrolyte || currentLevel === undefined || targetLevel === undefined || !weight) {
      return NextResponse.json({ success: false, error: 'Electrolyte, current level, target level, and weight required' }, { status: 400 });
    }

    const wt = weight;
    const deficit = targetLevel - currentLevel;
    const rt = route || 'iv';
    let replacementDose = 0;
    let rate = '';
    let maxRate = '';
    const safetyAlerts: string[] = [];
    const protocol: string[] = [];

    const lowerElectrolyte = electrolyte.toLowerCase();

    if (lowerElectrolyte === 'potassium' || lowerElectrolyte === 'k') {
      const kDeficit = deficit; // mEq/L
      replacementDose = Math.max(0, kDeficit * 0.4 * wt); // mEq needed (0.4 is approximate distribution factor)
      replacementDose = Math.round(replacementDose * 10) / 10;
      rate = rt === 'iv' ? '10 mEq/hr (peripheral) or 20 mEq/hr (central line)' : '';
      maxRate = '20 mEq/hr via central line; 10 mEq/hr via peripheral IV';

      if (currentLevel < 2.5) {
        safetyAlerts.push('🔴 CRITICAL: K < 2.5 mEq/L — life-threatening arrhythmia risk');
        safetyAlerts.push('Continuous cardiac monitoring MANDATORY');
        safetyAlerts.push('Central line preferred for rapid replacement');
        safetyAlerts.push('Consider IV KCl 20-40 mEq/hr via central line with monitoring');
      } else if (currentLevel < 3.0) {
        safetyAlerts.push('⚠️ SEVERE hypokalemia — cardiac monitoring required');
        safetyAlerts.push('IV replacement preferred over oral');
      }

      if (currentLevel > 5.5) {
        safetyAlerts.push('🔴 HYPERKALEMIA — stop all potassium intake');
        safetyAlerts.push('Consider calcium gluconate for cardiac protection if ECG changes');
        safetyAlerts.push('Insulin + D50, albuterol nebs, kayexalate, dialysis');
      } else if (currentLevel > 5.0) {
        safetyAlerts.push('⚠️ Mild hyperkalemia — do not supplement potassium');
      }

      protocol.push('Check renal function before replacement');
      protocol.push('Recheck K level 2-4 hours after IV replacement');
      protocol.push('Concentrated KCl solutions: max 40 mEq/L via peripheral, 80 mEq/L via central');
    } else if (lowerElectrolyte === 'sodium' || lowerElectrolyte === 'na') {
      const naDeficit = deficit; // mEq/L
      const tbw = wt * 0.6; // Total body water (men) — simplified
      replacementDose = Math.max(0, naDeficit * tbw);
      replacementDose = Math.round(replacementDose);
      rate = 'No more than 8-10 mEq/L/hr (to avoid osmotic demyelination)';
      maxRate = '12 mEq/L in 24 hours; 18 mEq/L in 48 hours for chronic hyponatremia';

      if (currentLevel < 120) {
        safetyAlerts.push('🔴 CRITICAL: Na < 120 mEq/L — seizure risk');
        safetyAlerts.push('Use hypertonic saline (3% NaCl)');
        safetyAlerts.push('Frequent sodium monitoring (Q2h)');
      }

      if (currentLevel > 145) {
        safetyAlerts.push('⚠️ Hypernatremia — use free water or D5W for correction');
        safetyAlerts.push('Rate: correct by no more than 10 mEq/L/day');
      }

      protocol.push('For symptomatic hyponatremia: 3% NaCl 100-150 mL over 20 min');
      protocol.push('For chronic hyponatremia: limit correction to 8 mEq/L in 24 hours');
      protocol.push('Recheck Na Q4-6h during active correction');
    } else if (lowerElectrolyte === 'magnesium' || lowerElectrolyte === 'mg') {
      replacementDose = Math.max(0, deficit * 0.3 * wt); // Approximate
      replacementDose = Math.round(replacementDose * 10) / 10;
      rate = '1-2 g/hr IV (normal) or 3-4 g/hr (severe)';
      maxRate = '4 g/hr (severe deficiency or torsades)';

      if (currentLevel < 1.0) {
        safetyAlerts.push('🔴 CRITICAL: Mg < 1.0 mg/dL — cardiac arrhythmia risk');
        safetyAlerts.push('Monitor for hypocalcemia and hypokalemia (refractory to replacement)');
      }

      protocol.push('IV Magnesium Sulfate: 1-2 g over 1 hour for mild deficiency');
      protocol.push('Severe deficiency: 4-6 g loading dose, then 1-2 g/hr infusion');
      protocol.push('Monitor deep tendon reflexes during IV replacement');
    } else if (lowerElectrolyte === 'calcium' || lowerElectrolyte === 'ca') {
      replacementDose = Math.max(0, deficit * 0.2 * wt);
      replacementDose = Math.round(replacementDose * 10) / 10;
      rate = '100-200 mg elemental Ca/hr IV';
      maxRate = '200 mg elemental Ca/hr';

      if (currentLevel < 7.0) {
        safetyAlerts.push('🔴 CRITICAL: Ca < 7.0 mg/dL — tetany, seizures, arrhythmia risk');
        safetyAlerts.push('Calcium gluconate 1g IV over 10 min (preferred over CaCl for peripheral)');
      }

      protocol.push('Correct ionized calcium for accurate assessment');
      protocol.push('Check albumin: Corrected Ca = Measured Ca + 0.8 x (4 - albumin)');
    }

    return NextResponse.json({
      success: true,
      data: {
        electrolyte: lowerElectrolyte,
        currentLevel: Number(currentLevel),
        targetLevel: Number(targetLevel),
        deficit: Number(deficit.toFixed(1)),
        replacementDose,
        unit: lowerElectrolyte === 'sodium' || lowerElectrolyte === 'na' ? 'mEq' : 'mEq',
        rate,
        maxRate,
        safetyAlerts,
        protocol,
        monitoringFrequency: currentLevel < (targetLevel * 0.7) ? 'Q2-4h' : 'Q6-8h',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}