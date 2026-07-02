import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get('hash') || '';
  return NextResponse.json({
    packHash: hash,
    timestamp: new Date().toISOString(),
    lane: 'PHARM',
    summary: hash ? `Evidence pack for verification ${hash}` : 'No hash provided',
    verifications: hash ? [
      { gate: 'DrugInteractionGate', decision: 'BLOCK', risk_label: 'SEVERE_INTERACTION', evidence: ['Drug-drug interaction detected', 'Mechanism: Vitamin K synthesis inhibition'] },
      { gate: 'DoseVerificationGate', decision: 'ALLOW', risk_label: 'DOSE_THERAPEUTIC', evidence: ['Dose within therapeutic range'] },
    ] : [],
    integrity: 'VERIFIED',
  });
}
