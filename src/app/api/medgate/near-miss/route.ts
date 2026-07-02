import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const KNOWN_CATEGORIES = [
  'medication_error', 'fall', 'procedure_complication', 'equipment_failure',
  'diagnostic_error', 'infection', 'blood_product', 'documentation',
  'communication', 'environmental', 'violence', 'other',
] as const;

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

function getRiskLabel(severity: string, gateDecision: string): string {
  if (gateDecision === 'BLOCK') return 'CRITICAL_NEAR_MISS';
  if (gateDecision === 'NEEDS_REVIEW') return 'HIGH_RISK_PATTERN';
  if (severity === 'high') return 'SIGNIFICANT_NEAR_MISS';
  if (severity === 'medium') return 'MODERATE_NEAR_MISS';
  return 'LOW_RISK_NEAR_MISS';
}

function detectPattern(category: string, department: string, description: string): string | undefined {
  const desc = description.toLowerCase();
  const cat = category.toLowerCase();
  if (cat === 'medication_error' && (desc.includes('look-alike') || desc.includes('sound-alike'))) return 'LASA medication naming confusion';
  if (cat === 'medication_error' && desc.includes('wrong dose')) return 'Dose calculation error pattern';
  if (cat === 'fall' && desc.includes('bed rail')) return 'Fall prevention gap — bed rail issue';
  if (cat === 'equipment_failure' && desc.includes('alarm')) return 'Alarm fatigue pattern';
  if (cat === 'communication' && desc.includes('handover')) return 'Handover communication gap';
  if (department === 'ICU' && cat === 'medication_error') return 'High-acuity medication error — ICU';
  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventDate, department, category, severity, description,
      contributingFactors, preventiveActions, reporter,
    } = body;

    // Validate
    if (!eventDate || !department || !category || !severity || !description) {
      return NextResponse.json({ error: 'Missing required fields: eventDate, department, category, severity, description' }, { status: 400 });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ error: `Invalid severity: ${severity}. Must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 });
    }
    if (!KNOWN_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Unknown category: ${category}. Must be one of: ${KNOWN_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    const start = performance.now();

    // Gate decision
    let gateDecision: 'BLOCK' | 'NEEDS_REVIEW' | 'ALLOW' = 'ALLOW';
    if (severity === 'critical') gateDecision = 'BLOCK';
    else if (severity === 'high') gateDecision = 'NEEDS_REVIEW';

    const riskLabel = getRiskLabel(severity, gateDecision);
    const patternMatch = detectPattern(category, department, description);

    // Check for similar recent events
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const similarEvents = await db.nearMiss.count({
      where: {
        category,
        department,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Save to DB
    const record = await db.nearMiss.create({
      data: {
        eventDate,
        department,
        category,
        severity,
        description,
        contributingFactors: JSON.stringify(contributingFactors || []),
        preventiveActions: JSON.stringify(preventiveActions || []),
        reporter: reporter || null,
        gateDecision,
      },
    });

    const latency = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      id: record.id,
      gateDecision,
      riskLabel,
      patternMatch,
      similarEvents,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Near-miss submission failed', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const reports = await db.nearMiss.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Aggregate stats
    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const r of reports) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byDepartment[r.department] = (byDepartment[r.department] || 0) + 1;
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
      const month = r.eventDate ? r.eventDate.substring(0, 7) : r.createdAt.toISOString().substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + 1;
    }

    return NextResponse.json({
      reports,
      aggregates: {
        total: reports.length,
        byCategory,
        byDepartment,
        bySeverity,
        byMonth,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch near-miss reports', details: String(error) }, { status: 500 });
  }
}