import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { rr, spo2, oxygen, systolicBP, pulse, consciousness, temperature } = await request.json();

    // NEWS2 Scoring
    const score = { rr: 0, spo2: 0, oxygen: 0, systolicBP: 0, pulse: 0, consciousness: 0, temperature: 0 };

    // Respiratory Rate
    if (rr <= 8) score.rr = 3;
    else if (rr <= 11) score.rr = 1;
    else if (rr <= 20) score.rr = 0;
    else if (rr <= 24) score.rr = 2;
    else score.rr = 3;

    // SpO2
    if (spo2 <= 91) score.spo2 = 3;
    else if (spo2 <= 93) score.spo2 = 2;
    else if (spo2 <= 95) score.spo2 = 1;
    else score.spo2 = 0;

    // Supplemental Oxygen
    if (oxygen === true || oxygen === 'yes' || (typeof oxygen === 'number' && oxygen > 0)) {
      score.oxygen = 2;
    }

    // Systolic BP
    if (systolicBP <= 90) score.systolicBP = 3;
    else if (systolicBP <= 100) score.systolicBP = 2;
    else if (systolicBP <= 110) score.systolicBP = 1;
    else if (systolicBP <= 219) score.systolicBP = 0;
    else score.systolicBP = 3;

    // Pulse
    if (pulse <= 40) score.pulse = 3;
    else if (pulse <= 50) score.pulse = 1;
    else if (pulse <= 90) score.pulse = 0;
    else if (pulse <= 110) score.pulse = 1;
    else if (pulse <= 130) score.pulse = 2;
    else score.pulse = 3;

    // Consciousness (ACVPU)
    const concLower = (consciousness || '').toLowerCase();
    if (concLower === 'a' || concLower === 'alert') score.consciousness = 0;
    else if (concLower === 'cv' || concLower === 'confusion' || concLower === 'c/v' || concLower === 'newconfusion') score.consciousness = 3;
    else if (concLower === 'v' || concLower === 'voice') score.consciousness = 3;
    else if (concLower === 'p' || concLower === 'pain') score.consciousness = 3;
    else if (concLower === 'u' || concLower === 'unresponsive') score.consciousness = 3;
    else score.consciousness = 0;

    // Temperature
    if (temperature <= 35.0) score.temperature = 3;
    else if (temperature <= 36.0) score.temperature = 1;
    else if (temperature <= 38.0) score.temperature = 0;
    else if (temperature <= 39.0) score.temperature = 1;
    else score.temperature = 2;

    const totalScore = score.rr + score.spo2 + score.oxygen + score.systolicBP + score.pulse + score.consciousness + score.temperature;

    let riskLevel: string;
    let escalation: string;
    let responseTime: string;
    let clinicalResponse: string[];

    if (totalScore >= 7) {
      riskLevel = 'HIGH';
      escalation = 'URGENT — Critical Care / Rapid Response Team';
      responseTime = 'Immediate';
      clinicalResponse = [
        'Transfer to level 2/3 care (ICU/HDU)',
        'Urgent medical review within 30 minutes',
        'Continuous vital sign monitoring',
        'Consider sepsis screening (SIRS/qSOFA criteria)',
        'Prepare for possible resuscitation',
      ];
    } else if (totalScore >= 5) {
      riskLevel = 'MEDIUM';
      escalation = 'URGENT — Ward-based urgent review';
      responseTime = '< 1 hour';
      clinicalResponse = [
        'Urgent assessment by clinician/acute team',
        'Increase monitoring frequency to minimum Q1h',
        'Consider escalation to critical care outreach',
        'Develop management plan for acute deterioration',
      ];
    } else if (totalScore === 3) {
      riskLevel = 'LOW-MEDIUM';
      escalation = 'Ward-level review';
      responseTime = '< 4 hours';
      clinicalResponse = [
        'Clinical review within 4 hours',
        'Increase monitoring frequency to Q4-6h',
        'Assess for underlying cause of score elevation',
        'Document clinical decision and plan',
      ];
    } else {
      riskLevel = 'LOW';
      escalation = 'Routine monitoring';
      responseTime = 'Routine (12 hourly)';
      clinicalResponse = [
        'Continue routine monitoring (minimum Q12h)',
        'No escalation required at this time',
        'Reassess if clinical condition changes',
      ];
    }

    // Single high-score parameter triggers immediate concern
    const redScoreParams: string[] = [];
    if (score.rr === 3) redScoreParams.push('Respiratory rate = 3');
    if (score.spo2 === 3) redScoreParams.push('SpO2 = 3');
    if (score.systolicBP === 3) redScoreParams.push('Systolic BP = 3');
    if (score.pulse === 3) redScoreParams.push('Pulse = 3');
    if (score.consciousness === 3 && concLower !== 'a' && concLower !== 'alert') redScoreParams.push('Consciousness = 3');

    if (redScoreParams.length > 0 && totalScore < 5) {
      clinicalResponse.unshift(`⚠️ RED SCORE on: ${redScoreParams.join(', ')} — escalate regardless of total`);
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM';
    }

    return NextResponse.json({
      success: true,
      data: {
        score: totalScore,
        riskLevel,
        escalation,
        responseTime,
        clinicalResponse,
        breakdown: score,
        redScoreParameters: redScoreParams,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}