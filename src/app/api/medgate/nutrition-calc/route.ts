import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { age, sex, weight, height, activityFactor, stressFactor, equation } = await request.json();

    if (!age || !sex || !weight || !height) {
      return NextResponse.json({ success: false, error: 'Age, sex, weight, and height are required' }, { status: 400 });
    }

    const af = activityFactor || 1.2;
    const sf = stressFactor || 1.0;
    const eq = equation || 'mifflin';

    const heightCm = height;
    const weightKg = weight;
    const bmi = weightKg / ((heightCm / 100) ** 2);
    const ibw = sex === 'male'
      ? 50 + 2.3 * ((heightCm / 2.54) - 60)
      : 45.5 + 2.3 * ((heightCm / 2.54) - 60);
    const abw = bmi > 30 ? ibw + 0.4 * (weightKg - ibw) : weightKg;

    let bmr: number;

    if (eq === 'harris-benedict') {
      // Harris-Benedict (revised 1984)
      bmr = sex === 'male'
        ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
        : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
    } else if (eq === 'ireton-jones') {
      // Ireton-Jones (spontaneous breathing)
      if (sex === 'male') {
        bmr = 629 - 11 * age + 25 * weightKg - 609 * (age > 60 ? 1 : 0);
      } else {
        bmr = 335 - 5 * age + 11 * weightKg - 72 * (age > 60 ? 1 : 0);
      }
    } else {
      // Mifflin-St Jeor (default)
      bmr = sex === 'male'
        ? (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5
        : (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
    }

    const tdee = bmr * af * sf;
    const protein = 1.2 * weightKg; // g/day standard
    const fluid = 30 * weightKg; // mL/day standard

    const macros = {
      proteinCal: protein * 4,
      fatCal: tdee * 0.30,
      carbCal: tdee - (protein * 4) - (tdee * 0.30),
      proteinG: Number(protein.toFixed(0)),
      fatG: Number((tdee * 0.30 / 9).toFixed(0)),
      carbG: Number(((tdee - protein * 4 - tdee * 0.30) / 4).toFixed(0)),
    };

    return NextResponse.json({
      success: true,
      data: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        protein: Math.round(protein),
        fluid: Math.round(fluid),
        bmi: Number(bmi.toFixed(1)),
        ibw: Number(ibw.toFixed(1)),
        abw: Number(abw.toFixed(1)),
        macros,
        equationUsed: eq,
        activityFactor: af,
        stressFactor: sf,
        recommendations: [
          bmi < 18.5 ? 'Underweight: Consider higher caloric target (30-35 kcal/kg IBW)' : null,
          bmi > 30 ? 'Obese: Use ABW for calculations, consider 22-25 kcal/kg ABW' : null,
          age >= 65 ? 'Elderly: Ensure 1.2-1.5 g/kg/day protein to prevent sarcopenia' : null,
          `Aim for ${Math.round(fluid)} mL/day fluid (30 mL/kg) unless fluid restricted`,
        ].filter(Boolean),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}