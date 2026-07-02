import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { weightLoss, appetiteDecreased, bmi } = await request.json();

    if (typeof weightLoss !== 'number' || typeof appetiteDecreased !== 'boolean' || typeof bmi !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid input parameters' }, { status: 400 });
    }

    // MST Scoring (Malnutrition Screening Tool)
    let mstScore = 0;
    if (weightLoss > 0) {
      mstScore += 1;
      if (weightLoss >= 10) mstScore += 1;
    }
    if (appetiteDecreased) mstScore += 1;
    mstScore = Math.min(mstScore, 2);

    // Risk classification
    let risk: string;
    if (mstScore === 0) risk = 'Low';
    else if (mstScore === 1) risk = 'Medium';
    else risk = 'High';

    // MUST steps based on risk
    const mustSteps: string[] = [];
    if (mstScore >= 1) {
      mustSteps.push('Step 2: Calculate BMI — current BMI: ' + bmi.toFixed(1));
      if (bmi < 18.5) {
        mustSteps.push('BMI < 18.5: Score +2 (High risk)');
        risk = 'High';
      } else if (bmi < 20) {
        mustSteps.push('BMI 18.5-20: Score +1 (Medium risk)');
        if (risk === 'Low') risk = 'Medium';
      } else {
        mustSteps.push('BMI >= 20: Score +0');
      }
    }

    const recommendations: string[] = [];
    if (risk === 'High') {
      recommendations.push('Urgent dietitian referral within 24 hours');
      recommendations.push('Initiate nutritional support (oral supplements or enteral feeding)');
      recommendations.push('Set nutritional goals: 25-30 kcal/kg/day, 1.2-1.5 g protein/kg/day');
      recommendations.push('Monitor weight, intake, and biochemistry weekly');
      recommendations.push('Consider micronutrient supplementation (thiamine, zinc, vitamin C)');
    } else if (risk === 'Medium') {
      recommendations.push('Dietitian referral within 72 hours');
      recommendations.push('Start oral nutritional supplements between meals');
      recommendations.push('Monitor food intake chart for 3 days');
      recommendations.push('Encourage fortified foods and snacks');
    } else {
      recommendations.push('Continue routine nutritional monitoring');
      recommendations.push('Reassess if clinical condition changes');
      recommendations.push('Provide healthy eating advice');
    }

    return NextResponse.json({
      success: true,
      data: {
        mstScore,
        risk,
        mustSteps,
        recommendations,
        bmi: Number(bmi.toFixed(1)),
        weightLossPercent: weightLoss,
        reassessmentInterval: risk === 'High' ? 'Weekly' : risk === 'Medium' ? 'Every 2 weeks' : 'Monthly',
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}