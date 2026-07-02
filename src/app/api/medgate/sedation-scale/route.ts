import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { rassScore, targetMin, targetMax } = await request.json();

    if (typeof rassScore !== 'number' || rassScore < -5 || rassScore > 4) {
      return NextResponse.json({ success: false, error: 'RASS score must be -5 to +4' }, { status: 400 });
    }

    const rassLabels: Record<number, { label: string; description: string }> = {
      [-5]: { label: 'Unarousable', description: 'No response to voice or physical stimulation' },
      [-4]: { label: 'Deep Sedation', description: 'No response to voice, but movement or eye opening to physical stimulation' },
      [-3]: { label: 'Moderate Sedation', description: 'Any movement (but no eye contact) to voice' },
      [-2]: { label: 'Light Sedation', description: 'Eye opening to voice (no eye contact)' },
      [-1]: { label: 'Drowsy', description: 'Not fully alert, but has sustained (>10 sec) awakening to voice' },
      [0]: { label: 'Alert and Calm', description: 'Spontaneously paying attention to caregiver' },
      [1]: { label: 'Restless', description: 'Anxious but movements not aggressive or vigorous' },
      [2]: { label: 'Agitated', description: 'Frequent non-purposeful movement, fights ventilator' },
      [3]: { label: 'Very Agitated', description: 'Pulls or removes tube(s)/catheter(s), aggressive' },
      [4]: { label: 'Combative', description: 'Overtly combative, dangerous to staff' },
    };

    const rassInfo = rassLabels[rassScore] || { label: 'Unknown', description: '' };
    const inTarget = rassScore >= targetMin && rassScore <= targetMax;

    const alert = !inTarget
      ? `RASS ${rassScore} is outside target range (${targetMin} to ${targetMax}). Intervention required.`
      : null;

    const sedativeRecommendations: string[] = [];
    if (rassScore >= 2) {
      sedativeRecommendations.push('Increase sedation: Propofol infusion increase by 5-10 mcg/kg/min');
      sedativeRecommendations.push('Consider bolus: Midazolam 1-2mg IV or Propofol 10-20mg IV');
      sedativeRecommendations.push('Rule out pain (CPOT assessment) and delirium (CAM-ICU)');
      sedativeRecommendations.push('Assess for reversible causes: urinary retention, constipation, hypoxia');
      sedativeRecommendations.push('Consider chemical restraint only if immediate danger to patient/staff');
    } else if (rassScore >= 1) {
      sedativeRecommendations.push('Assess for underlying discomfort or anxiety');
      sedativeRecommendations.push('Consider non-pharmacological interventions first');
      sedativeRecommendations.push('Mild sedative adjustment if persistent');
    } else if (rassScore <= -3) {
      sedativeRecommendations.push('Reduce sedation infusion by 25-50%');
      sedativeRecommendations.push('Hold sedation and reassess in 30 minutes');
      sedativeRecommendations.push('Assess for neurological deterioration');
      sedativeRecommendations.push('Consider sedation vacation protocol');
    } else if (rassScore <= -1 && !inTarget) {
      sedativeRecommendations.push('Mildly reduce sedation — patient may be over-sedated for current target');
      sedativeRecommendations.push('Assess readiness for sedation vacation');
    }

    if (inTarget) {
      sedativeRecommendations.push('Current sedation level is within target. Continue monitoring Q2-4h.');
    }

    return NextResponse.json({
      success: true,
      data: {
        rassScore,
        label: rassInfo.label,
        description: rassInfo.description,
        inTarget,
        alert,
        targetRange: { min: targetMin, max: targetMax },
        sedativeRecommendations,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}