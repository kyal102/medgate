import { NextRequest, NextResponse } from 'next/server';
import { BLOOD_COMPATIBILITY } from '@/lib/medgate-constants';

export async function POST(req: NextRequest) {
  try {
    const { recipientType, donorType } = await req.json();
    const recip = (recipientType || '').toUpperCase().replace(' ', '');
    const donor = (donorType || '').toUpperCase().replace(' ', '');
    const compatible = BLOOD_COMPATIBILITY[recip];
    if (!compatible) return NextResponse.json({ compatible: false, reason: `Unknown recipient type: ${recipientType}`, warnings: [] });
    const isCompatible = compatible.includes(donor);
    const warnings: string[] = [];
    const recipRh = recip.includes('+'); const donorRh = donor.includes('+');
    if (!recipRh && donorRh) warnings.push('Rh incompatibility: Rh-negative recipient receiving Rh-positive blood. Risk of alloimmunization.');
    if (isCompatible && warnings.length > 0) {
      return NextResponse.json({ compatible: true, reason: `ABO compatible. ${donor} can be given to ${recipientType} recipient.`, warnings, riskLevel: 'MODERATE' });
    }
    return NextResponse.json({ compatible: isCompatible, reason: isCompatible ? `${donor} is compatible with ${recipientType} recipient` : `${donor} is INCOMPATIBLE with ${recipientType} recipient — ABO mismatch risk`, warnings, riskLevel: isCompatible ? 'SAFE' : 'DANGER' });
  } catch (error) { return NextResponse.json({ error: 'Blood compatibility check failed' }, { status: 500 }); }
}
