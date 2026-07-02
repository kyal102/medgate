import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bundleType, items, deviceDays, infections } = await request.json();

    if (!bundleType || !items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Bundle type and items array required' }, { status: 400 });
    }

    const totalItems = items.length;
    const completedItems = items.filter(i => i.completed).length;
    const compliance = totalItems > 0 ? Number(((completedItems / totalItems) * 100).toFixed(1)) : 0;

    const missingItems = items.filter(i => !i.completed).map(i => i.name);

    // Infection rate calculation (per 1000 device days)
    const dd = deviceDays || 0;
    const inf = infections || 0;
    const infectionRate = dd > 0 ? Number(((inf / dd) * 1000).toFixed(2)) : 0;

    // Benchmarks by bundle type
    const benchmarks: Record<string, { target: string; rate: string }> = {
      'clabsi': { target: '≤0.8 per 1000 catheter days', rate: 'National: 0.8-1.2' },
      'cauti': { target: '≤1.5 per 1000 catheter days', rate: 'National: 1.2-2.0' },
      'vAP': { target: '≤1.0 per 1000 vent days', rate: 'National: 0.8-2.0' },
      'ssi': { target: '≤2.0%', rate: 'National: 1.5-3.0%' },
      'cdiff': { target: '≤8 per 10000 patient days', rate: 'National: 6-12' },
      'mrsa': { target: '≤0.5 per 1000 patient days', rate: 'National: 0.3-1.0' },
      'catheter': { target: '≤1.5 per 1000 catheter days', rate: 'National: 1.2-2.0' },
    };

    const benchmark = benchmarks[bundleType.toLowerCase()] || { target: 'Target per facility policy', rate: 'Consult infection control' };

    const recommendations: string[] = [];
    const bundleLower = bundleType.toLowerCase();

    if (compliance < 80) {
      recommendations.push(`⚠️ Bundle compliance at ${compliance}% — below 80% target`);
    }

    if (missingItems.length > 0) {
      recommendations.push(`Missing items: ${missingItems.join(', ')}`);
    }

    if (bundleLower.includes('clabsi') || bundleLower.includes('catheter')) {
      recommendations.push('Ensure daily line necessity review — remove if not essential');
      recommendations.push('Chlorhexidine skin prep at insertion, daily CHG bathing');
      recommendations.push('Use antiseptic-impregnated dressings');
      recommendations.push('Cap, mask, sterile gown, gloves, large drape for insertion');
    } else if (bundleLower.includes('cauti') || bundleLower.includes('foley')) {
      recommendations.push('Daily catheter necessity assessment — remove ASAP');
      recommendations.push('Maintain closed drainage system');
      recommendations.push('Ensure proper catheter securement');
    } else if (bundleLower.includes('vap') || bundleLower.includes('ventilator')) {
      recommendations.push('HOB elevation 30-45°');
      recommendations.push('Daily sedation vacation and SBT assessment');
      recommendations.push('Oral care with CHG Q4h');
      recommendations.push('DVT prophylaxis and stress ulcer prophylaxis');
    } else if (bundleLower.includes('ssi')) {
      recommendations.push('Appropriate surgical antibiotic prophylaxis within 60 min of incision');
      recommendations.push('Maintain normothermia, glycemic control');
      recommendations.push('Gentle tissue handling, appropriate wound closure');
    }

    // Infection rate assessment
    if (dd > 0 && infections > 0) {
      const targetNum = parseFloat(benchmark.target) || 1.5;
      if (infectionRate > targetNum * 2) {
        recommendations.push(`🔴 INFECTION RATE ${infectionRate} is significantly above benchmark — immediate action required`);
        recommendations.push('Conduct root cause analysis for each infection');
      } else if (infectionRate > targetNum) {
        recommendations.push(`⚠️ Infection rate ${infectionRate} above target — review bundle compliance`);
      }
    }

    if (compliance >= 95) {
      recommendations.push('✅ Excellent bundle compliance. Continue current practices.');
    }

    return NextResponse.json({
      success: true,
      data: {
        compliance,
        infectionRate,
        benchmark,
        missingItems,
        recommendations,
        summary: {
          bundleType,
          itemsCompleted: completedItems,
          itemsTotal: totalItems,
          deviceDays: dd,
          infections: inf,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}