import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { sensory, moisture, activity, mobility, nutrition, friction } = await request.json();

    const params = { sensory, moisture, activity, mobility, nutrition, friction };
    for (const [key, val] of Object.entries(params)) {
      if (typeof val !== 'number' || val < 1 || val > 4) {
        return NextResponse.json({ success: false, error: `${key} must be 1-4` }, { status: 400 });
      }
    }

    // Braden Scale: Higher score = lower risk. Subscales scored 1-4, except friction (1-3)
    // But here using all 1-4 as specified. Braden total is 6-23
    const totalScore = sensory + moisture + activity + mobility + nutrition + friction;

    let risk: string;
    let riskPercentile: string;
    if (totalScore <= 12) {
      risk = 'Very High';
      riskPercentile = '>90th percentile risk';
    } else if (totalScore <= 14) {
      risk = 'High';
      riskPercentile = '75-90th percentile risk';
    } else if (totalScore <= 18) {
      risk = 'Moderate';
      riskPercentile = '50-75th percentile risk';
    } else if (totalScore <= 21) {
      risk = 'Mild';
      riskPercentile = '25-50th percentile risk';
    } else {
      risk = 'No Risk';
      riskPercentile = '<25th percentile risk';
    }

    const interventions: string[] = [
      'Reposition every 2 hours (more frequently if high risk)',
      'Use pressure redistribution mattress/surface',
      'Keep skin clean and dry — use pH-balanced cleansers',
      'Apply moisturizer to dry skin BID',
      'Minimize shear and friction during repositioning (use lift sheet)',
      'Ensure adequate nutrition and hydration (protein 1.25-1.5 g/kg/day)',
    ];

    if (totalScore <= 14) {
      interventions.unshift('CRITICAL: Initiate intensive pressure injury prevention protocol');
      interventions.push('Consult wound care specialist');
      interventions.push('Consider silicone border foam dressings to bony prominences');
      interventions.push('Heel suspension devices');
      interventions.push('Microclimate management (absorbent underpads)');
    }

    if (moisture >= 3) {
      interventions.push('Moisture management: frequent skin checks, barrier cream');
    }
    if (nutrition >= 3) {
      interventions.push('Nutrition consult for pressure injury risk');
    }
    if (sensory >= 3) {
      interventions.push('Sensory impaired: more frequent skin inspections required');
    }

    const preventionBundle = {
      repositioning: 'Q2h minimum with offloading',
      surface: totalScore <= 18 ? 'Pressure redistribution mattress required' : 'Standard mattress acceptable',
      skinCare: 'Cleanse with pH-balanced products, moisture barrier',
      nutrition: 'Protein 1.25-1.5g/kg/day, adequate calories, hydration 30mL/kg/day',
      moisture: 'Prompt incontinence care, barrier cream BID',
      education: 'Document all interventions and patient/family education',
    };

    return NextResponse.json({
      success: true,
      data: {
        totalScore,
        risk,
        riskPercentile,
        subscales: {
          sensoryPerception: { score: sensory, meaning: sensory >= 3 ? 'Very Limited' : sensory === 2 ? 'Slightly Limited' : 'Intact' },
          moisture: { score: moisture, meaning: moisture >= 3 ? 'Constantly Moist' : moisture === 2 ? 'Very Moist' : 'Rarely Moist' },
          activity: { score: activity, meaning: activity >= 3 ? 'Bedfast' : activity === 2 ? 'Chairfast' : 'Walks Occasionally' },
          mobility: { score: mobility, meaning: mobility >= 3 ? 'Completely Immobile' : mobility === 2 ? 'Very Limited' : 'No Limitations' },
          nutrition: { score: nutrition, meaning: nutrition >= 3 ? 'Very Poor' : nutrition === 2 ? 'Probably Inadequate' : 'Excellent' },
          frictionShear: { score: friction, meaning: friction >= 3 ? 'Problem' : friction === 2 ? 'Potential Problem' : 'No Apparent Problem' },
        },
        interventions,
        preventionBundle,
        reassessment: totalScore <= 14 ? 'Every shift' : totalScore <= 18 ? 'Daily' : 'Every 3 days',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}