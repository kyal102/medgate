import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { temperature, heartRate, respiratoryRate, systolicBP, wbc, lactate, consciousness } = await req.json();
    // qSOFA
    let qsofa = 0;
    if (respiratoryRate >= 22) qsofa++;
    if (systolicBP <= 100) qsofa++;
    if (consciousness && consciousness !== 'A' && consciousness !== 'Alert') qsofa++;
    // SIRS
    let sirs = 0; const sirsCriteria: string[] = [];
    if (temperature > 38 || temperature < 36) { sirs++; sirsCriteria.push(`Temp ${temperature}°C`); }
    if (heartRate > 90) { sirs++; sirsCriteria.push(`HR ${heartRate} bpm`); }
    if (respiratoryRate > 20) { sirs++; sirsCriteria.push(`RR ${respiratoryRate}`); }
    if (wbc > 12 || wbc < 4) { sirs++; sirsCriteria.push(`WBC ${wbc}`); }
    // SOFA (simplified)
    let sofa = 0;
    if (systolicBP < 90) sofa += 1; // Cardiovascular
    if (respiratoryRate >= 22 || (lactate && lactate > 2)) sofa += 1; // Respiratory
    if (wbc > 12 || wbc < 4) sofa += 1; // Coagulation (simplified)
    if (lactate && lactate > 4) sofa += 2;
    // Sepsis determination
    let sepsisLikelihood = 'low' as 'low' | 'moderate' | 'high';
    if (qsofa >= 2 || sofa >= 2) sepsisLikelihood = 'high';
    else if (sirs >= 2 || qsofa >= 1) sepsisLikelihood = 'moderate';
    const septicShock = lactate > 2 && systolicBP < 90;
    const recommendations: string[] = [];
    if (sepsisLikelihood === 'high') {
      recommendations.push('HIGH SUSPICION: qSOFA ≥ 2 or SOFA ≥ 2 — consider sepsis. Obtain cultures, start broad-spectrum antibiotics within 1 hour.');
      recommendations.push('Measure lactate. If > 2 mmol/L, remeasure within 2-4 hours.');
    } else if (sepsisLikelihood === 'moderate') {
      recommendations.push('MODERATE: Monitor closely. Reassess qSOFA/SOFA if clinical status changes.');
    }
    if (septicShock) recommendations.push('SEPTIC SHOCK: Lactate > 2 + Hypotension despite fluids — initiate vasopressors. Target MAP ≥ 65 mmHg.');
    // 1-hour bundle
    const bundle = [
      { item: 'Measure lactate level', done: lactate !== undefined },
      { item: 'Obtain blood cultures', done: false },
      { item: 'Administer broad-spectrum antibiotics', done: false },
      { item: 'Administer 30 mL/kg crystalloid', done: false },
    ];
    return NextResponse.json({ qsofa, sirs, sofa, sirsCriteria, sepsisLikelihood, septicShock, recommendations, bundle, timestamp: new Date().toISOString() });
  } catch (error) { return NextResponse.json({ error: 'Sepsis screening failed' }, { status: 500 }); }
}
