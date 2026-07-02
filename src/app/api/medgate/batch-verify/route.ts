import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { claims } = await req.json() as { claims: string[] };
    const results = [];
    for (const claim of claims) {
      const res = await fetch(new URL('/api/medgate/verify-claim', req.url).origin + '/api/medgate/verify-claim', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, lane: 'PHARM' }),
      });
      if (res.ok) results.push(await res.json());
      else results.push({ claim, error: 'Failed to verify' });
    }
    return NextResponse.json({ results, total: claims.length });
  } catch (error) { return NextResponse.json({ error: 'Batch verification failed' }, { status: 500 }); }
}
