import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ph, paco2, pao2, hco3, sao2, baseExcess, lactate, fio2 } = await request.json();

    // Classification
    const classification: string[] = [];
    const compensation: string[] = [];
    const alerts: string[] = [];

    // pH classification
    if (ph < 7.35) classification.push('Acidemia');
    else if (ph > 7.45) classification.push('Alkalemia');
    else classification.push('Normal pH');

    // Respiratory component
    if (paco2 < 35) {
      classification.push('Respiratory Alkalosis');
      compensation.push(pH >= 7.35 ? 'Compensated respiratory alkalosis' : 'Acute respiratory alkalosis with metabolic compensation needed');
    } else if (paco2 > 45) {
      classification.push('Respiratory Acidosis');
      if (pH >= 7.35) {
        compensation.push('Compensated respiratory acidosis — chronic CO2 retention');
      } else {
        compensation.push('Acute respiratory acidosis — consider ventilation support');
        alerts.push('Elevated PaCO2 with acidosis — assess for respiratory failure');
      }
    } else {
      classification.push('Normal PaCO2');
    }

    // Metabolic component
    if (hco3 < 22) {
      classification.push('Metabolic Acidosis');
      // Determine anion gap if possible (not directly provided, use base excess as proxy)
      if (baseExcess < -4) {
        classification.push('(High Anion Gap pattern suggested by negative base excess)');
        compensation.push('Respiratory compensation: expected PaCO2 = 1.5 x HCO3 + 8 ± 2');
        const expectedPaco2 = 1.5 * hco3 + 8;
        const actualVsExpected = paco2 - expectedPaco2;
        if (actualVsExpected > 2) {
          compensation.push('Additional respiratory acidosis component (PaCO2 higher than expected)');
        } else if (actualVsExpected < -2) {
          compensation.push('Concurrent respiratory alkalosis (PaCO2 lower than expected)');
        } else {
          compensation.push('Appropriate respiratory compensation');
        }
      } else {
        compensation.push('Non-anion gap metabolic acidosis — consider GI losses, renal tubular acidosis');
      }
    } else if (hco3 > 26) {
      classification.push('Metabolic Alkalosis');
      const expectedPaco2 = 0.7 * hco3 + 21;
      const actualVsExpected = paco2 - expectedPaco2;
      if (actualVsExpected > 2) {
        compensation.push('Additional respiratory acidosis component');
      } else if (actualVsExpected < -2) {
        compensation.push('Concurrent respiratory alkalosis');
      } else {
        compensation.push('Appropriate respiratory compensation');
      }
    }

    // A-a Gradient: A-a = FiO2(Patm - PH2O) - (PaCO2/0.8) - PaO2
    const patm = 760;
    const ph2o = 47;
    const fiO2 = fio2 || 0.21;
    const aaGradient = (fiO2 * (patm - ph2o)) - (paco2 / 0.8) - pao2;
    const expectedAA = (fiO2 * (patm - ph2o)) - (paco2 / 0.8) - (fiO2 * (patm - ph2o) - (paco2 / 0.8)) * (1 - 1); // simplified
    const ageAdjustedAA = (2.5 + paco2 / 4); // Expected A-a for age (approximate, assuming ~40y)
    const aaElevated = aaGradient > ageAdjustedAA + 10;

    if (aaElevated) {
      alerts.push(`Elevated A-a gradient (${aaGradient.toFixed(0)} mmHg) — suggests V/Q mismatch, shunt, or diffusion impairment`);
      if (pao2 / fiO2 < 200) alerts.push('Possible ARDS — P/F ratio <200');
    }

    // P/F Ratio (PaO2 / FiO2 * 100)
    const pfRatio = fiO2 > 0 ? pao2 / (fiO2 * 100) : 0;

    let ardsSeverity: string;
    if (pfRatio < 100) {
      ardsSeverity = 'Severe ARDS (Berlin criteria)';
      alerts.push('🔴 SEVERE ARDS — consider prone positioning, neuromuscular blockade, ECMO');
    } else if (pfRatio < 200) {
      ardsSeverity = 'Moderate ARDS (Berlin criteria)';
      alerts.push('⚠️ Moderate ARDS — lung protective ventilation, PEEP optimization');
    } else if (pfRatio < 300) {
      ardsSeverity = 'Mild ARDS (Berlin criteria)';
      alerts.push('Mild ARDS — monitor for progression, lung protective ventilation');
    } else if (pfRatio < 400) {
      ardsSeverity = 'Abnormal — acute lung injury possible';
    } else {
      ardsSeverity = 'Normal oxygenation';
    }

    // Lactate interpretation
    let lactateInterp: string;
    if (lactate > 4.0) {
      lactateInterp = 'Severely elevated — consider sepsis, shock, or tissue hypoperfusion';
      alerts.push('🔴 LACTATE >4 mmol/L — sepsis/shock protocol, reassess after resuscitation');
    } else if (lactate > 2.0) {
      lactateInterp = 'Elevated — assess for tissue hypoperfusion, sepsis, or liver dysfunction';
      alerts.push('Lactate >2 mmol/L — monitor trend, consider fluid resuscitation if clinically indicated');
    } else {
      lactateInterp = 'Normal lactate — adequate tissue perfusion likely';
    }

    return NextResponse.json({
      success: true,
      data: {
        classification,
        compensation,
        aaGradient: Number(aaGradient.toFixed(1)),
        pfRatio: Number(pfRatio.toFixed(1)),
        ardsSeverity,
        lactateInterp,
        alerts,
        values: {
          pH: Number(ph?.toFixed(2)),
          PaCO2: Number(paco2?.toFixed(1)),
          PaO2: Number(pao2?.toFixed(1)),
          HCO3: Number(hco3?.toFixed(1)),
          SaO2: sao2,
          BaseExcess: Number(baseExcess?.toFixed(1)),
          Lactate: Number(lactate?.toFixed(1)),
          FiO2: fiO2,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}