import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const total = await db.gateVerification.count();
    const blocked = await db.gateVerification.count({ where: { decision: 'BLOCK' } });
    const allowed = await db.gateVerification.count({ where: { decision: 'ALLOW' } });
    const reviewed = await db.gateVerification.count({ where: { decision: 'NEEDS_REVIEW' } });
    const recent = await db.gateVerification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    const byGate: Record<string, number> = {};
    for (const v of recent) { byGate[v.gateId] = (byGate[v.gateId] || 0) + 1; }
    const byLane: Record<string, number> = {};
    for (const v of recent) { byLane[v.lane] = (byLane[v.lane] || 0) + 1; }
    // Daily trend (last 7 days)
    const now = new Date(); const trend: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
      const next = new Date(day); next.setDate(next.getDate() + 1);
      const count = await db.gateVerification.count({ where: { createdAt: { gte: day, lt: next } } });
      trend.push({ date: day.toISOString().split('T')[0], count });
    }
    return NextResponse.json({ total, byDecision: { BLOCK: blocked, ALLOW: allowed, NEEDS_REVIEW: reviewed, total }, byGate, byLane, dailyTrend: trend });
  } catch (error) { return NextResponse.json({ error: 'Analytics failed' }, { status: 500 }); }
}
