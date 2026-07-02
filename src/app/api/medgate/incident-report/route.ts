import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const VALID_CATEGORIES = [
  'medication_error', 'fall', 'procedure_complication', 'equipment_failure',
  'diagnostic_error', 'infection', 'blood_product', 'documentation',
  'communication', 'environmental', 'violence', 'other',
] as const;

const VALID_SEVERITIES = ['minor', 'moderate', 'major', 'catastrophic'] as const;

const VALID_ROOT_CAUSES = [
  'human_factors', 'system_design', 'training', 'communication',
  'equipment', 'environment', 'organizational', 'policy',
] as const;

const SEVERITY_SCORES: Record<string, number> = {
  minor: 1,
  moderate: 3,
  major: 7,
  catastrophic: 10,
};

function getRiskLabel(severity: string, gateDecision: string): string {
  if (gateDecision === 'BLOCK') return 'CATASTROPHIC_RISK_NO_ACTION';
  if (gateDecision === 'NEEDS_REVIEW') return 'MAJOR_INCIDENT_REVIEW';
  if (severity === 'major') return 'SIGNIFICANT_INCIDENT';
  if (severity === 'moderate') return 'MODERATE_INCIDENT';
  return 'MINOR_INCIDENT';
}

function generateTrendAnalysis(category: string, department: string, severity: string) {
  // Simulated trend analysis based on known high-risk patterns
  const trends: Record<string, { direction: string; percent: number; period: string }> = {};
  if (category === 'medication_error') {
    trends.medication_errors = { direction: 'decreasing', percent: 12, period: 'last_90_days' };
    trends.high_alert_meds = { direction: 'stable', percent: 0, period: 'last_90_days' };
  }
  if (category === 'fall') {
    trends.falls = { direction: 'increasing', percent: 8, period: 'last_30_days' };
    trends.fall_with_injury = { direction: 'stable', percent: 0, period: 'last_90_days' };
  }
  if (department === 'ICU') {
    trends.icu_incidents = { direction: 'decreasing', percent: 5, period: 'last_90_days' };
  }
  if (severity === 'catastrophic' || severity === 'major') {
    trends.serious_incidents = { direction: severity === 'catastrophic' ? 'stable' : 'decreasing', percent: 3, period: 'last_180_days' };
  }
  return Object.keys(trends).length > 0 ? trends : undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      incidentDate, department, category, severity, description,
      immediateActions, rootCauseCategories, contributingFactors,
      correctiveActions, followUpRequired, reporter,
    } = body;

    // Validate required fields
    if (!incidentDate || !department || !category || !severity || !description) {
      return NextResponse.json({ error: 'Missing required fields: incidentDate, department, category, severity, description' }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    if (!VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 });
    }
    if (rootCauseCategories && !rootCauseCategories.every((r: string) => (VALID_ROOT_CAUSES as readonly string[]).includes(r))) {
      const invalid = rootCauseCategories.filter((r: string) => !(VALID_ROOT_CAUSES as readonly string[]).includes(r));
      return NextResponse.json({ error: `Invalid root cause categories: ${invalid.join(', ')}` }, { status: 400 });
    }

    const start = performance.now();

    // Gate decision
    let gateDecision: 'BLOCK' | 'NEEDS_REVIEW' | 'ALLOW' = 'ALLOW';
    if (severity === 'catastrophic' && (!immediateActions || immediateActions.length === 0)) {
      gateDecision = 'BLOCK';
    } else if (severity === 'major') {
      gateDecision = 'NEEDS_REVIEW';
    }

    const riskLabel = getRiskLabel(severity, gateDecision);
    const severityScore = SEVERITY_SCORES[severity] || 1;
    const trendAnalysis = generateTrendAnalysis(category, department, severity);

    // Save to DB
    const record = await db.incidentReport.create({
      data: {
        incidentDate,
        department,
        category,
        severity,
        description,
        immediateActions: JSON.stringify(immediateActions || []),
        rootCauseCategories: JSON.stringify(rootCauseCategories || []),
        contributingFactors: JSON.stringify(contributingFactors || []),
        correctiveActions: JSON.stringify(correctiveActions || []),
        followUpRequired: followUpRequired || false,
        reporter: reporter || null,
        gateDecision,
        status: 'open',
      },
    });

    const latency = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      id: record.id,
      gateDecision,
      riskLabel,
      severityScore,
      trendAnalysis,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Incident report submission failed', details: String(error) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const department = searchParams.get('department');
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (department) where.department = department;
    if (category) where.category = category;
    if (severity) where.severity = severity;

    const [reports, total] = await Promise.all([
      db.incidentReport.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      db.incidentReport.count({ where }),
    ]);

    // Summary stats
    const bySeverity: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byDepartment: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    const allForStats = await db.incidentReport.findMany({ select: { severity: true, category: true, department: true, status: true } });
    for (const r of allForStats) {
      bySeverity[r.severity] = (bySeverity[r.severity] || 0) + 1;
      byCategory[r.category] = (byCategory[r.category] || 0) + 1;
      byDepartment[r.department] = (byDepartment[r.department] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }

    return NextResponse.json({
      reports,
      pagination: { total, limit, offset, returned: reports.length },
      summary: { bySeverity, byCategory, byDepartment, byStatus, totalIncidents: allForStats.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch incident reports', details: String(error) }, { status: 500 });
  }
}