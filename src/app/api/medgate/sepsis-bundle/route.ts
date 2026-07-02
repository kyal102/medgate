import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bundle, startTime } = await request.json();

    if (!bundle || !startTime) {
      return NextResponse.json({ success: false, error: 'Bundle data and start time required' }, { status: 400 });
    }

    const now = Date.now();
    const elapsed = now - new Date(startTime).getTime();
    const elapsedMin = Math.floor(elapsed / 60000);
    const oneHourMs = 3600000;
    const threeHourMs = 10800000;

    // Bundle items
    const hour1Items = [
      { key: 'lactate', label: 'Lactate level measured', completed: bundle.lactate || false, timeLimit: '1 hour' },
      { key: 'cultures', label: 'Blood cultures obtained', completed: bundle.cultures || false, timeLimit: '1 hour' },
      { key: 'antibiotics', label: 'Broad-spectrum antibiotics administered', completed: bundle.antibiotics || false, timeLimit: '1 hour' },
      { key: 'fluids', label: '30 mL/kg crystalloid for hypotension or lactate ≥4', completed: bundle.fluids || false, timeLimit: '3 hours' },
    ];

    const hour3Items = [
      { key: 'vasopressors', label: 'Vasopressors for MAP <65 mmHg', completed: bundle.vasopressors || false, timeLimit: 'As needed' },
      { key: 'recheckLactate', label: 'Lactate rechecked if initial ≥2 mmol/L', completed: bundle.recheckLactate || false, timeLimit: '2-4 hours' },
    ];

    const allItems = [...hour1Items, ...hour3Items];
    const completed = allItems.filter(i => i.completed).length;
    const total = allItems.length;
    const compliance = Number(((completed / total) * 100).toFixed(1));

    // Time-based compliance check
    const hour1ItemsDone = hour1Items.filter(i => i.completed).length;
    const hour3ItemsDone = hour3Items.filter(i => i.completed).length;
    const hour1Compliant = elapsed <= oneHourMs ? hour1ItemsDone >= 3 : 'N/A (past 1hr)';
    const hour3Compliant = elapsed <= threeHourMs ? hour3ItemsDone >= 1 : 'N/A (past 3hr)';

    // Decision support
    const decision: string[] = [];
    if (!bundle.lactate) decision.push('⚠️ MEASURE LACTATE IMMEDIATELY — target <1 hour from recognition');
    if (!bundle.cultures) decision.push('⚠️ OBTAIN BLOOD CULTURES BEFORE ANTIBIOTICS — 2 sets from different sites');
    if (!bundle.antibiotics) decision.push('🔴 ADMINISTER BROAD-SPECTRUM ANTIBIOTICS — every hour delay increases mortality 7.6%');
    if (!bundle.fluids) decision.push('⚠️ INITIATE 30 mL/kg crystalloid bolus if hypotensive or lactate ≥4 mmol/L');
    if (bundle.lactate && bundle.lactate !== false && typeof bundle.lactate === 'number' && bundle.lactate >= 4) {
      decision.push('🔴 LACTATE ≥4 mmol/L: Sepsis shock — escalate to ICU, consider vasopressors');
    }
    if (completed === total) {
      decision.push('✅ SEP-1 bundle fully completed. Continue monitoring and source control.');
    }

    return NextResponse.json({
      success: true,
      data: {
        completed,
        total,
        compliance,
        timeElapsed: {
          minutes: elapsedMin,
          hours: Number((elapsedMin / 60).toFixed(1)),
          within1Hour: elapsed <= oneHourMs,
          within3Hours: elapsed <= threeHourMs,
        },
        hour1Items: hour1Items.map(i => ({ label: i.label, completed: i.completed, timeLimit: i.timeLimit })),
        hour3Items: hour3Items.map(i => ({ label: i.label, completed: i.completed, timeLimit: i.timeLimit })),
        decision,
        hour1Compliance: hour1Compliant,
        hour3Compliance: hour3Compliant,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}