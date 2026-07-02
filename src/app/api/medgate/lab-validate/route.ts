import { NextRequest, NextResponse } from 'next/server';
import { LAB_REFERENCES } from '@/lib/medgate-constants';

export async function POST(req: NextRequest) {
  try {
    const { analyte, value, unit } = await req.json();
    const aLower = (analyte || '').toLowerCase();
    const ref = LAB_REFERENCES[aLower];
    if (!ref) return NextResponse.json({ analyte, value, unit, status: 'UNKNOWN', message: 'Analyte not found in reference database', isCritical: false, isPhysiologicallyImpossible: false });
    let status = 'normal'; let message = `${analyte} ${value} ${ref.unit}: Normal (${ref.refLow}-${ref.refHigh})`;
    let isCritical = false; let isPhysiologicallyImpossible = false;
    if (value > ref.physiologicalMax) { status = 'physiologically_impossible'; message = `${analyte} ${value}: EXCEEDS physiological maximum (${ref.physiologicalMax}). Likely sample/entry error.`; isPhysiologicallyImpossible = true; }
    else if (value < ref.physiologicalMin && ref.physiologicalMin > 0) { status = 'physiologically_impossible'; message = `${analyte} ${value}: BELOW physiological minimum (${ref.physiologicalMin})`; isPhysiologicallyImpossible = true; }
    else if (value >= ref.critHigh) { status = 'critical_high'; message = `${analyte} ${value}: CRITICAL HIGH (threshold: ${ref.critHigh}). Immediate action required.`; isCritical = true; }
    else if (value <= ref.critLow && ref.critLow > 0) { status = 'critical_low'; message = `${analyte} ${value}: CRITICAL LOW (threshold: ${ref.critLow}). Immediate action required.`; isCritical = true; }
    else if (value > ref.refHigh) { status = 'abnormal_high'; message = `${analyte} ${value}: Abnormally high (ref: ${ref.refLow}-${ref.refHigh})`; }
    else if (value < ref.refLow) { status = 'abnormal_low'; message = `${analyte} ${value}: Abnormally low (ref: ${ref.refLow}-${ref.refHigh})`; }
    return NextResponse.json({ analyte, value, unit: ref.unit, status, message, isCritical, isPhysiologicallyImpossible, referenceRange: { low: ref.refLow, high: ref.refHigh }, criticalRange: { low: ref.critLow, high: ref.critHigh } });
  } catch (error) { return NextResponse.json({ error: 'Lab validation failed' }, { status: 500 }); }
}
