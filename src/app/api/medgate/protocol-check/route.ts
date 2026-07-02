import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { condition, treatment, score } = await req.json();
    const cLower = (condition || '').toLowerCase(); const tLower = (treatment || '').toLowerCase();
    let compliant = true; let guideline = ''; const recommendations: string[] = []; const gaps: string[] = [];
    if (cLower.includes('cap') || cLower.includes('pneumonia')) {
      guideline = 'ATS/IDSA 2019 Community-Acquired Pneumonia Guidelines';
      const curb65 = score || 0;
      if (curb65 >= 3) {
        if (tLower.includes('ceftriaxone') || tLower.includes('azithromycin') || tLower.includes('levofloxacin')) recommendations.push('Appropriate: ICU-level CAP treatment');
        else { compliant = false; gaps.push('CURB-65 ≥ 3 requires ICU admission with ceftriaxone + azithromycin OR levofloxacin monotherapy'); }
      } else if (curb65 >= 2) {
        if (tLower.includes('ceftriaxone') || tLower.includes('azithromycin') || tLower.includes('levofloxacin') || tLower.includes('amoxicillin')) recommendations.push('Appropriate: Inpatient CAP treatment');
        else { compliant = false; gaps.push('CURB-65 ≥ 2 requires inpatient admission'); }
      } else {
        if (tLower.includes('amoxicillin') || tLower.includes('doxycycline') || tLower.includes('azithromycin')) recommendations.push('Appropriate: Outpatient CAP treatment');
        else { gaps.push('Consider amoxicillin, doxycycline, or azithromycin for outpatient CAP'); }
      }
    } else if (cLower.includes('hf') || cLower.includes('heart failure') || cLower.includes('hfrEF')) {
      guideline = 'AHA/ACC/HFSA 2022 Heart Failure Guidelines';
      if (tLower.includes('ace') || tLower.includes('arb') || tLower.includes('arni') || tLower.includes('entresto')) recommendations.push('Appropriate: RAAS inhibition for HFrEF');
      else { compliant = false; gaps.push('HFrEF requires ACE-I, ARB, or ARNI (sacubitril/valsartan)'); }
      if (tLower.includes('beta') || tLower.includes('metoprolol') || tLower.includes('bisoprolol') || tLower.includes('carvedilol')) recommendations.push('Appropriate: Beta-blocker for HFrEF');
      else { compliant = false; gaps.push('HFrEF requires evidence-based beta-blocker'); }
      if (tLower.includes('mra') || tLower.includes('spironolactone') || tLower.includes('eplerenone')) recommendations.push('Appropriate: MRA for HFrEF');
      else gaps.push('Consider MRA (spironolactone/eplerenone) for HFrEF');
    } else if (cLower.includes('sepsis')) {
      guideline = 'Surviving Sepsis Campaign 2021';
      if (tLower.includes('lactate') || tLower.includes('culture') || tLower.includes('antibiotic') || tLower.includes('fluid')) recommendations.push('Sepsis bundle elements identified');
      else { compliant = false; gaps.push('Sepsis 1-hour bundle: Lactate, cultures, broad-spectrum antibiotics, 30mL/kg crystalloid'); }
    } else {
      guideline = 'General clinical guidelines';
      recommendations.push('No specific guideline matched — review with clinical team');
    }
    return NextResponse.json({ condition, treatment, compliant, guideline, recommendations, gaps, score: score || null });
  } catch (error) { return NextResponse.json({ error: 'Protocol check failed' }, { status: 500 }); }
}
