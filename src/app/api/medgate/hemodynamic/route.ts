import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { map, cvp, co, hr, svr } = await request.json();

    // Stroke Volume = CO / HR
    const sv = hr > 0 && co ? (co * 1000) / hr : null; // mL

    // Shock type classification
    let shockType: string = 'No shock identified';
    const shockIndicators: string[] = [];

    if (map < 65) {
      shockIndicators.push(`MAP ${map} mmHg < 65 mmHg (hypotensive)`);

      if (svr !== null && svr !== undefined) {
        if (svr < 800) {
          shockType = 'Distributive Shock (Septic/Anaphylactic/Neurogenic)';
          shockIndicators.push(`Low SVR ${svr} dynes·s/cm⁵ — vasodilation pattern`);
          shockIndicators.push('Warm extremities possible, high cardiac output');
        } else if (svr > 1400) {
          shockType = 'Cardiogenic or Obstructive Shock';
          shockIndicators.push(`High SVR ${svr} dynes·s/cm⁵ — vasoconstriction pattern`);
          shockIndicators.push('Check for cardiac failure, tamponade, PE, tension pneumothorax');
        } else {
          shockType = 'Hypovolemic Shock (compensated)';
          shockIndicators.push(`SVR ${svr} within normal range — possible early/compensated hypovolemia`);
        }
      } else {
        shockType = 'Undifferentiated Shock — need SVR to classify';
      }
    }

    if (cvp !== null && cvp !== undefined) {
      if (cvp < 2) shockIndicators.push(`Low CVP ${cvp} cmH2O — suggests hypovolemia`);
      else if (cvp > 12) shockIndicators.push(`Elevated CVP ${cvp} cmH2O — suggests fluid overload or right heart dysfunction`);
    }

    // Vasoactive drug recommendations
    const vasoactiveDrugs: { drug: string; indication: string; dose: string }[] = [];

    if (map < 65) {
      if (shockType.includes('Distributive')) {
        vasoactiveDrugs.push({ drug: 'Norepinephrine', indication: 'First-line for septic shock', dose: 'Start 0.05-0.1 mcg/kg/min, titrate to MAP ≥65' });
        vasoactiveDrugs.push({ drug: 'Vasopressin', indication: 'Second-line (catecholamine-sparing)', dose: '0.03 units/min (fixed dose)' });
      }
      if (shockType.includes('Cardiogenic')) {
        vasoactiveDrugs.push({ drug: 'Dobutamine', indication: 'Inotrope for cardiogenic shock', dose: 'Start 2.5 mcg/kg/min, titrate to effect' });
        vasoactiveDrugs.push({ drug: 'Milrinone', indication: 'PDE inhibitor for low cardiac output', dose: '0.375-0.75 mcg/kg/min without loading dose' });
      }
      if (shockType.includes('Hypovolemic') || shockType.includes('Undifferentiated')) {
        vasoactiveDrugs.push({ drug: 'Norepinephrine', indication: 'Perfusion pressure support during resuscitation', dose: 'Start 0.05-0.1 mcg/kg/min' });
      }
    }

    // Fluid responsiveness assessment
    let fluidResponsiveness: string;
    if (cvp !== null && cvp !== undefined && cvp < 8) {
      fluidResponsiveness = 'Likely fluid responsive — CVP <8 cmH2O suggests underfilled venous reservoir';
    } else if (cvp !== null && cvp !== undefined && cvp > 12) {
      fluidResponsiveness = 'Unlikely fluid responsive — CVP >12 cmH2O suggests adequate/elevated filling pressures';
    } else {
      fluidResponsiveness = 'Consider dynamic assessment (passive leg raise, pulse pressure variation, or fluid challenge)';
    }

    return NextResponse.json({
      success: true,
      data: {
        sv: sv ? Number(sv.toFixed(1)) : null,
        shockType,
        shockIndicators,
        vasoactiveDrugs,
        fluidResponsiveness,
        hemodynamics: {
          map: map ? Number(map.toFixed(0)) : null,
          cvp: cvp !== null && cvp !== undefined ? Number(cvp.toFixed(1)) : null,
          co: co ? Number(co.toFixed(1)) : null,
          hr: hr ? Number(hr.toFixed(0)) : null,
          svr: svr !== null && svr !== undefined ? Number(svr.toFixed(0)) : null,
        },
        recommendations: [
          'Target MAP ≥65 mmHg for organ perfusion',
          'Reassess hemodynamics after each intervention',
          'Consider echocardiography for cardiac function assessment',
          'Monitor lactate clearance as resuscitation endpoint',
        ],
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}