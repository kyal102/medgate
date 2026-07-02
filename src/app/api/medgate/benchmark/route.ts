import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MOCK_BENCHMARK_CASES } from '@/lib/medgate-constants';

export async function POST(req: NextRequest) {
  try {
    const start = Date.now();
    let passed = 0, blocked = 0, needsReview = 0, evidenceReq = 0, failed = 0;
    const gateResults: Record<string, { total: number; correct: number }> = {};
    for (const tc of MOCK_BENCHMARK_CASES) {
      try {
        const res = await fetch(new URL('/api/medgate/verify-claim', req.url).origin + '/api/medgate/verify-claim', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claim: tc.input, lane: 'PHARM' }),
        });
        const data = await res.json();
        const decision = data.overall_decision || 'UNKNOWN';
        if (decision === tc.expected_decision) { if (decision === 'ALLOW') passed++; else if (decision === 'BLOCK') blocked++; else if (decision === 'NEEDS_REVIEW') needsReview++; else evidenceReq++; }
        else failed++;
        if (!gateResults[tc.gate]) gateResults[tc.gate] = { total: 0, correct: 0 };
        gateResults[tc.gate].total++;
        if (decision === tc.expected_decision) gateResults[tc.gate].correct++;
      } catch { failed++; }
    }
    const durationMs = Date.now() - start;
    await db.benchmarkRun.create({ data: { totalCases: MOCK_BENCHMARK_CASES.length, passed, blocked, needsReview, evidenceReq, failed, durationMs, gateResults: JSON.stringify(gateResults) } });
    return NextResponse.json({ totalCases: MOCK_BENCHMARK_CASES.length, passed, blocked, needsReview, evidenceReq, failed, durationMs, gateResults, timestamp: new Date().toISOString(), accuracy: Math.round(((passed + blocked + needsReview) / MOCK_BENCHMARK_CASES.length) * 100) });
  } catch (error) { return NextResponse.json({ error: 'Benchmark failed', details: String(error) }, { status: 500 }); }
}
