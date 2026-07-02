import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface Discrepancy {
  type: 'omission' | 'addition' | 'dose_change' | 'frequency_change' | 'duplicate' | 'drug_interaction';
  medication: string;
  details: string;
  severity: 'critical' | 'moderate' | 'low';
  resolution: string;
}

const CRITICAL_MED_CLASSES: Record<string, string[]> = {
  anticoagulants: ['warfarin', 'heparin', 'enoxaparin', 'rivaroxaban', 'apixaban', 'dabigatran', 'fondaparinux', 'edoxaban', 'betrixaban', 'argatroban', 'bivalirudin'],
  antiarrhythmics: ['amiodarone', 'sotalol', 'flecainide', 'propafenone', 'dofetilide', 'dronedarone', 'procainamide', 'disopyramide', 'quinidine', 'lidocaine'],
  anticonvulsants: ['phenytoin', 'carbamazepine', 'valproic acid', 'divalproex', 'levetiracetam', 'lamotrigine', 'topiramate', 'gabapentin', 'pregabalin', 'lacosamide', 'oxcarbazepine', 'phenobarbital', 'primidone', 'ethosuximide', 'zonisamide', 'clonazepam', 'clobazam'],
  immunosuppressants: ['prednisone', 'prednisolone', 'methylprednisolone', 'tacrolimus', 'cyclosporine', 'mycophenolate', 'azathioprine', 'sirolimus', 'methotrexate', 'cyclophosphamide'],
  opioids: ['morphine', 'fentanyl', 'hydromorphone', 'oxycodone', 'hydrocodone', 'methadone', 'codeine', 'tramadol', 'buprenorphine', 'oxymorphone', 'tapentadol', 'meperidine'],
  insulin: ['insulin', 'insulin glargine', 'insulin lispro', 'insulin aspart', 'insulin detemir', 'insulin degludec', 'insulin regular', 'insulin nph', 'insulin 70/30', 'humalog', 'novolog', 'lantus', 'levemir', 'tresiba', 'basaglar'],
};

function fuzzyMatch(a: string, b: string): boolean {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return true;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return true;
  // Check if significant word overlap (>60%)
  const aWords = aLower.split(/[\s\-/]+/).filter(Boolean);
  const bWords = bLower.split(/[\s\-/]+/).filter(Boolean);
  if (aWords.length === 0 || bWords.length === 0) return false;
  const overlap = aWords.filter(w => bWords.some(bw => bw.includes(w) || w.includes(bw)));
  const ratio = overlap.length / Math.max(aWords.length, bWords.length);
  return ratio > 0.6;
}

function isInCriticalClass(med: string): { isCritical: boolean; className: string } {
  const medLower = med.toLowerCase();
  for (const [cls, drugs] of Object.entries(CRITICAL_MED_CLASSES)) {
    if (drugs.some(d => medLower.includes(d) || d.includes(medLower))) {
      return { isCritical: true, className: cls };
    }
  }
  return { isCritical: false, className: '' };
}

function detectDiscrepancies(homeMeds: string[], currentOrders: string[]): Discrepancy[] {
  const discrepancies: Discrepancy[] = [];
  const matchedHome = new Set<number>();
  const matchedOrder = new Set<number>();

  // Find omissions (home med not in orders)
  for (let i = 0; i < homeMeds.length; i++) {
    const home = homeMeds[i];
    let found = false;
    for (let j = 0; j < currentOrders.length; j++) {
      if (fuzzyMatch(home, currentOrders[j])) {
        matchedHome.add(i);
        matchedOrder.add(j);
        found = true;

        // Check for dose/frequency changes
        const homeNorm = home.toLowerCase();
        const orderNorm = currentOrders[j].toLowerCase();
        if (homeNorm !== orderNorm && !homeNorm.includes(orderNorm) && !orderNorm.includes(homeNorm)) {
          const hasDoseChange = /\d+\s*(mg|mcg|g|ml|units|%)/i.test(home) && /\d+\s*(mg|mcg|g|ml|units|%)/i.test(currentOrders[j]);
          const hasFreqChange = /\b(bid|tid|qid|qd|qday|daily|twice|thrice|q8h|q12h|q24h|q6h|prn|once|weekly)\b/i.test(home) && /\b(bid|tid|qid|qd|qday|daily|twice|thrice|q8h|q12h|q24h|q6h|prn|once|weekly)\b/i.test(currentOrders[j]);

          const crit = isInCriticalClass(home);
          if (hasDoseChange) {
            discrepancies.push({
              type: 'dose_change',
              medication: home,
              details: `Dose may have changed: Home="${home}" → Order="${currentOrders[j]}"`,
              severity: crit.isCritical ? 'critical' : 'moderate',
              resolution: crit.isCritical
                ? `CRITICAL: Verify dose change for ${crit.className} medication — contact prescribing physician immediately`
                : 'Verify dose change with prescribing physician',
            });
          } else if (hasFreqChange) {
            discrepancies.push({
              type: 'frequency_change',
              medication: home,
              details: `Frequency may have changed: Home="${home}" → Order="${currentOrders[j]}"`,
              severity: crit.isCritical ? 'critical' : 'moderate',
              resolution: crit.isCritical
                ? `CRITICAL: Verify frequency change for ${crit.className} medication — contact prescribing physician immediately`
                : 'Verify frequency change with prescribing physician',
            });
          }
        }
        break;
      }
    }

    if (!found) {
      const crit = isInCriticalClass(home);
      discrepancies.push({
        type: 'omission',
        medication: home,
        details: `Home medication not found in current orders`,
        severity: crit.isCritical ? 'critical' : 'moderate',
        resolution: crit.isCritical
          ? `CRITICAL OMISSION: ${crit.className} medication (${home}) not in current orders — must be addressed before proceeding`
          : `Evaluate if intentional discontinuation or inadvertent omission`,
      });
    }
  }

  // Find additions (order not in home meds) and duplicates in orders
  const seenOrders = new Set<string>();
  for (let j = 0; j < currentOrders.length; j++) {
    if (matchedOrder.has(j)) continue;
    const order = currentOrders[j];
    const orderNorm = order.toLowerCase().trim();

    // Check for duplicates within orders
    for (let k = j + 1; k < currentOrders.length; k++) {
      if (fuzzyMatch(order, currentOrders[k])) {
        if (!seenOrders.has(orderNorm)) {
          discrepancies.push({
            type: 'duplicate',
            medication: order,
            details: `Potential duplicate order: "${order}" and "${currentOrders[k]}"`,
            severity: 'moderate',
            resolution: 'Review with pharmacy to confirm if duplicate is intentional',
          });
          seenOrders.add(orderNorm);
          seenOrders.add(currentOrders[k].toLowerCase().trim());
        }
      }
    }

    if (seenOrders.has(orderNorm)) continue;

    // New addition
    const crit = isInCriticalClass(order);
    discrepancies.push({
      type: 'addition',
      medication: order,
      details: `New medication not in home medication list`,
      severity: 'low',
      resolution: 'Confirm intentional new therapy — document indication',
    });
  }

  return discrepancies;
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = await req.json();
    const { phase, homeMedications, currentOrders, patientId } = body as {
      phase: 'admission' | 'transfer' | 'discharge';
      homeMedications: string[];
      currentOrders: string[];
      patientId?: string;
    };

    if (!phase || !homeMedications || !currentOrders) {
      return NextResponse.json({ error: 'Missing required fields: phase, homeMedications, currentOrders' }, { status: 400 });
    }
    if (!['admission', 'transfer', 'discharge'].includes(phase)) {
      return NextResponse.json({ error: 'phase must be admission, transfer, or discharge' }, { status: 400 });
    }

    const discrepancies = detectDiscrepancies(homeMedications, currentOrders);

    const criticalFindings = discrepancies.filter(d => d.severity === 'critical');
    const hasCriticalOmission = criticalFindings.some(d => d.type === 'omission');

    let gateDecision: GateDecision = 'ALLOW';
    if (hasCriticalOmission) {
      gateDecision = 'BLOCK';
    } else if (discrepancies.some(d => d.severity === 'critical' || d.severity === 'moderate')) {
      gateDecision = 'NEEDS_REVIEW';
    }

    const resolutionStatus = discrepancies.length === 0
      ? 'NO_DISCREPANCIES'
      : criticalFindings.length > 0
        ? 'CRITICAL_DISCREPANCIES_PENDING'
        : 'DISCREPANCIES_NOTED';

    await db.medReconciliation.create({
      data: {
        patientId: patientId || null,
        phase,
        homeMedications: JSON.stringify(homeMedications),
        currentOrders: JSON.stringify(currentOrders),
        discrepancies: JSON.stringify(discrepancies),
        resolutionStatus,
        pharmacistReview: false,
        physicianApproved: false,
        gateDecision,
      },
    });

    const latencyMs = Math.round((performance.now() - start) * 100) / 100;
    const riskLabel = gateDecision === 'BLOCK' ? 'CRITICAL_MEDICATION_RISK' : gateDecision === 'NEEDS_REVIEW' ? 'DISCREPANCY_REVIEW_NEEDED' : 'RECONCILIATION_COMPLETE';

    return NextResponse.json({
      discrepancies,
      resolutionStatus,
      gateDecision,
      riskLabel,
      criticalFindings: criticalFindings.map(d => ({
        type: d.type,
        medication: d.medication,
        details: d.details,
        resolution: d.resolution,
      })),
      totalDiscrepancies: discrepancies.length,
      criticalCount: criticalFindings.length,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Medication reconciliation failed', details: String(error) }, { status: 500 });
  }
}