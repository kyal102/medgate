import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { spo2, heartRate, systolicBP, respiratoryRate, temperature, consciousness } = await req.json();
    let news2 = 0; const recommendations: string[] = []; const params: Record<string, { value: number; score: number; status: string }> = {};
    // SpO2
    let spo2Score = 0;
    if (spo2 <= 91) spo2Score = 3; else if (spo2 <= 93) spo2Score = 2; else if (spo2 <= 95) spo2Score = 1;
    news2 += spo2Score;
    params['SpO2'] = { value: spo2, score: spo2Score, status: spo2Score >= 3 ? 'CRITICAL' : spo2Score >= 2 ? 'LOW' : spo2Score >= 1 ? 'BELOW_TARGET' : 'NORMAL' };
    // Heart Rate
    let hrScore = 0;
    if (heartRate <= 40) hrScore = 3; else if (heartRate <= 50) hrScore = 1; else if (heartRate >= 131) hrScore = 3; else if (heartRate >= 111) hrScore = 2; else if (heartRate >= 91) hrScore = 1;
    news2 += hrScore;
    params['Heart Rate'] = { value: heartRate, score: hrScore, status: hrScore >= 3 ? 'CRITICAL' : hrScore >= 2 ? 'ELEVATED' : hrScore >= 1 ? 'NOTED' : 'NORMAL' };
    // Systolic BP
    let sbpScore = 0;
    if (systolicBP <= 90) sbpScore = 3; else if (systolicBP <= 100) sbpScore = 2; else if (systolicBP <= 110) sbpScore = 1; else if (systolicBP >= 220) sbpScore = 3;
    news2 += sbpScore;
    params['Systolic BP'] = { value: systolicBP, score: sbpScore, status: sbpScore >= 3 ? 'CRITICAL' : sbpScore >= 2 ? 'LOW' : sbpScore >= 1 ? 'BELOW_NORMAL' : 'NORMAL' };
    // Respiratory Rate
    let rrScore = 0;
    if (respiratoryRate <= 8) rrScore = 3; else if (respiratoryRate <= 11) rrScore = 1; else if (respiratoryRate >= 25) rrScore = 3; else if (respiratoryRate >= 21) rrScore = 2;
    news2 += rrScore;
    params['Respiratory Rate'] = { value: respiratoryRate, score: rrScore, status: rrScore >= 3 ? 'CRITICAL' : rrScore >= 2 ? 'ELEVATED' : rrScore >= 1 ? 'LOW' : 'NORMAL' };
    // Temperature
    let tempScore = 0;
    if (temperature <= 35.0) tempScore = 3; else if (temperature <= 36.0) tempScore = 1; else if (temperature >= 39.1) tempScore = 3; else if (temperature >= 38.1) tempScore = 1;
    news2 += tempScore;
    params['Temperature'] = { value: temperature, score: tempScore, status: tempScore >= 3 ? 'CRITICAL' : tempScore >= 1 ? 'ELEVATED' : 'NORMAL' };
    // Consciousness
    let concScore = 0;
    if (consciousness && consciousness !== 'A' && consciousness !== 'Alert') concScore = 3;
    news2 += concScore;
    // Risk level
    let riskLevel = 'LOW';
    if (news2 >= 7) riskLevel = 'HIGH';
    else if (news2 >= 5) riskLevel = 'MEDIUM';
    if (riskLevel === 'HIGH') recommendations.push('URGENT: NEWS2 ≥ 7 — Immediate clinical assessment required. Escalate to critical care team.');
    else if (riskLevel === 'MEDIUM') recommendations.push('WARNING: NEWS2 5-6 — Increased monitoring frequency. Inform medical team.');
    else recommendations.push('LOW RISK: NEWS2 0-4 — Routine monitoring (minimum 4-12 hourly).');
    if (spo2 < 92) recommendations.push('Supplemental oxygen required. Target SpO2 94-98% (88-92% if COPD).');
    if (systolicBP < 90) recommendations.push('Hypotension — consider fluid resuscitation, vasopressor assessment.');
    // qSOFA
    let qsofa = 0;
    if (respiratoryRate >= 22) qsofa++;
    if (systolicBP <= 100) qsofa++;
    if (consciousness && consciousness !== 'A' && consciousness !== 'Alert') qsofa++;
    return NextResponse.json({ news2, qsofa, riskLevel, parameters: params, consciousness: consciousness || 'A', consciousnessScore: concScore, recommendations });
  } catch (error) { return NextResponse.json({ error: 'Vital signs analysis failed' }, { status: 500 }); }
}
