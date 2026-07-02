import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ppsLevel } = await request.json();

    if (typeof ppsLevel !== 'number' || ppsLevel < 0 || ppsLevel > 100 || ppsLevel % 10 !== 0) {
      return NextResponse.json({ success: false, error: 'PPS level must be 0-100 in increments of 10' }, { status: 400 });
    }

    const ppsData: Record<number, { label: string; prognosis: string; ambulation: string; careLevel: string }> = {
      0: { label: 'Dead', prognosis: 'Deceased', ambulation: 'None', careLevel: 'Post-mortem care' },
      10: { label: 'Moribund', prognosis: 'Hours to days', ambulation: 'None', careLevel: 'Comfort measures only' },
      20: { label: 'Very Sick', prognosis: 'Days to weeks', ambulation: 'None', careLevel: 'Comfort-focused care' },
      30: { label: 'Sick', prognosis: 'Weeks', ambulation: 'None — bedbound', careLevel: 'Palliative care primary focus' },
      40: { label: 'Mostly Bedbound', prognosis: 'Weeks to months', ambulation: 'Mostly in bed', careLevel: 'Symptom management priority' },
      50: { label: 'Sitting', prognosis: 'Months', ambulation: 'Sitting in chair', careLevel: 'Balance comfort and function' },
      60: { label: 'Reduced Ambulation', prognosis: 'Months+', ambulation: 'Limited ambulation', careLevel: 'Active rehabilitation with comfort' },
      70: { label: 'Decreasing Ambulation', prognosis: 'Many months', ambulation: 'Decreasing ability', careLevel: 'Rehabilitation focus' },
      80: { label: 'Ambulatory', prognosis: 'Variable', ambulation: 'Ambulatory', careLevel: 'Disease-modifying with comfort' },
      90: { label: 'Fully Ambulatory', prognosis: 'Variable', ambulation: 'Fully ambulatory', careLevel: 'Active treatment focus' },
      100: { label: 'Fully Active', prognosis: 'Good', ambulation: 'Normal activity', careLevel: 'Full active treatment' },
    };

    const data = ppsData[ppsLevel] || ppsData[100];

    const careGoals: string[] = [];
    if (ppsLevel <= 20) {
      careGoals.push('Primary goal: Comfort and dignity at end of life');
      careGoals.push('Discontinue non-comfort interventions');
      careGoals.push('Family presence and spiritual support');
      careGoals.push('Symptom control: pain, dyspnea, secretions, agitation');
    } else if (ppsLevel <= 40) {
      careGoals.push('Palliative care as primary approach');
      careGoals.push('Focus on quality of life');
      careGoals.push('Advance care planning discussions');
      careGoals.push('Symptom burden management');
    } else if (ppsLevel <= 60) {
      careGoals.push('Balance disease management with comfort');
      careGoals.push('Functional preservation');
      careGoals.push('Discuss goals of care and advance directives');
    } else {
      careGoals.push('Active disease management');
      careGoals.push('Maintenance of functional status');
      careGoals.push('Advance care planning if not completed');
    }

    const interventions: string[] = [];
    if (ppsLevel <= 30) {
      interventions.push('Opioid drip for pain/dyspnea management');
      interventions.push('Anticholinergics for secretions (glycopyrrolate)');
      interventions.push('Anxiolytics as needed (lorazepam/midazolam)');
      interventions.push('Oxygen for comfort if dyspneic');
      interventions.push('Mouth care every 1-2 hours');
    } else if (ppsLevel <= 60) {
      interventions.push('PRN pain management with scheduled baseline');
      interventions.push('Physical therapy for function maintenance');
      interventions.push('Occupational therapy for ADL adaptation');
      interventions.push('Nutritional support as tolerated');
    }

    const eolTriggers = ppsLevel <= 20
      ? ['PPS ≤20: Active dying phase — comfort care protocol', 'Consider hospice enrollment if not already', 'Notify family of declining status']
      : ppsLevel <= 40
        ? ['Decline from PPS 50→40→30 may signal rapid decline', 'Discuss code status and intubation preferences']
        : [];

    return NextResponse.json({
      success: true,
      data: {
        ppsLevel,
        label: data.label,
        prognosis: data.prognosis,
        ambulation: data.ambulation,
        careLevel: data.careLevel,
        careGoals,
        interventions,
        eolTriggers,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}