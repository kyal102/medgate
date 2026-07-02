import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ivFluids, poIntake, ngOutput, urineOutput, drains, insensibleLosses, weight } = await request.json();

    const iv = ivFluids || 0;
    const po = poIntake || 0;
    const ng = ngOutput || 0;
    const urine = urineOutput || 0;
    const drain = drains || 0;
    const insensible = insensibleLosses || 0;

    const totalInput = iv + po;
    const totalOutput = ng + urine + drain + insensible;
    const balance = totalInput - totalOutput;

    // Maintenance rate (4-2-1 rule + 20 mL/kg first 10kg + 10 mL/kg next 10kg + 2 mL/kg remaining)
    const w = weight || 70;
    let maintenanceRate: number;
    if (w <= 10) {
      maintenanceRate = w * 4;
    } else if (w <= 20) {
      maintenanceRate = 40 + (w - 10) * 2;
    } else {
      maintenanceRate = 60 + (w - 20) * 1;
    }

    // Deficit calculation (negative balance)
    const deficit = balance < 0 ? Math.abs(balance) : 0;

    const alerts: string[] = [];
    if (balance > 2000) {
      alerts.push('⚠️ Significant positive fluid balance (>2L). Risk of fluid overload, pulmonary edema, and heart failure.');
      alerts.push('Consider diuretic therapy if hemodynamically stable.');
      alerts.push('Assess for crackles, JVD, peripheral edema.');
    } else if (balance > 1000) {
      alerts.push('Positive fluid balance (>1L). Monitor closely for fluid overload signs.');
    }

    if (balance < -2000) {
      alerts.push('🔴 Severe negative fluid balance (>-2L). Risk of hypovolemia, AKI, and hemodynamic instability.');
      alerts.push('Aggressive fluid resuscitation may be required.');
      alerts.push('Assess hemodynamic status and tissue perfusion.');
    } else if (balance < -1000) {
      alerts.push('⚠️ Negative fluid balance (>-1L). Assess for ongoing losses and replace accordingly.');
    }

    // Urine output assessment
    const urineRateMlKgHr = w > 0 ? urine / 24 / w : 0;
    if (urineRateMlKgHr < 0.5) {
      alerts.push(`Low urine output: ${urineRateMlKgHr.toFixed(2)} mL/kg/hr (target >0.5). Assess for AKI.`);
    } else if (urineRateMlKgHr > 3) {
      alerts.push(`High urine output: ${urineRateMlKgHr.toFixed(2)} mL/kg/kg/hr. Assess for diabetes insipidus or diuretic effect.`);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalInput: Number(totalInput.toFixed(0)),
        totalOutput: Number(totalOutput.toFixed(0)),
        balance: Number(balance.toFixed(0)),
        maintenanceRate: Number(maintenanceRate.toFixed(0)),
        deficit: Number(deficit.toFixed(0)),
        breakdown: {
          ivFluids: iv,
          oralIntake: po,
          ngOutput: ng,
          urineOutput: urine,
          drains: drain,
          insensibleLosses: insensible,
        },
        urineRateMlKgHr: Number(urineRateMlKgHr.toFixed(2)),
        alerts,
        recommendation: balance > 1000
          ? 'Reduce IV fluid rate, consider diuretic if overloaded'
          : balance < -1000
            ? 'Increase fluid intake, assess for ongoing losses'
            : 'Fluid balance within acceptable range',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}