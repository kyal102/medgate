import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { agent, inr, indication, weight, creatinine, bleeding, perioperative, drugInteractions } = await request.json();

    const agentLower = (agent || '').toLowerCase();
    const ind = indication || 'vte';
    const w = weight || 70;
    const cr = creatinine || 1.0;
    const isBleeding = bleeding === true || bleeding === 'yes' || bleeding === 'active';
    const isPeriop = perioperative === true || perioperative === 'yes';
    const interactions = drugInteractions || [];

    let doseAdjustment: string = 'Standard dosing';
    let reversalAgent: string = 'Not indicated';
    let holdDuration: string = 'Not applicable';
    const monitoringSchedule: string[] = [];
    const decision: string[] = [];

    // Agent-specific logic
    if (agentLower.includes('warfarin')) {
      monitoringSchedule.push('INR: Check in 2-3 days after initiation/dose change, then weekly until stable, then monthly');

      if (ind === 'vte' || ind === 'dvt' || ind === 'pe') {
        doseAdjustment = 'Target INR 2.0-3.0';
        if (isBleeding) {
          decision.push('🔴 Active bleeding on warfarin — HOLD warfarin immediately');
          reversalAgent = 'Vitamin K 2.5-5mg IV (slow) + 4-factor PCC (Kcentra) if major bleed';
          holdDuration = 'Hold until bleeding controlled and INR <1.5';
        }
      } else if (ind === 'mechanical-valve') {
        doseAdjustment = 'Target INR 2.5-3.5';
      } else if (ind === 'af') {
        doseAdjustment = 'Target INR 2.0-3.0 (2.0-2.5 if age >75 with high bleed risk)';
      }

      if (isPeriop) {
        if (inr > 1.5) {
          holdDuration = 'Hold warfarin 5 days pre-op; bridge with LMWH if high risk';
          reversalAgent = 'If INR >1.5 pre-op: Vitamin K 1-2mg PO/IV 1-2 days before';
        } else {
          holdDuration = 'Hold warfarin 3-5 days pre-op';
        }
      }

      if (inr > 5.0) {
        decision.push('⚠️ INR >5.0 — high bleeding risk');
        if (inr > 10 || isBleeding) {
          reversalAgent = '4-Factor PCC (Kcentra) + Vitamin K 5-10mg IV';
          decision.push('Urgent reversal needed');
        } else {
          reversalAgent = 'Vitamin K 2.5mg PO; recheck INR in 24h';
          decision.push('Hold warfarin, give Vitamin K, recheck INR');
        }
      }
    } else if (agentLower.includes('heparin') || agentLower.includes('lmwh')) {
      const isLMWH = agentLower.includes('enoxaparin') || agentLower.includes('dalteparin') || agentLower.includes('lmwh');

      if (isLMWH) {
        doseAdjustment = `Enoxaparin ${ind === 'vte-treatment' ? '1 mg/kg BID' : '40 mg daily'} (adjust for renal function)`;
        monitoringSchedule.push('Anti-Xa level: consider 4h post-dose for renal impairment or obesity');

        if (cr > 2.0) {
          doseAdjustment = 'Reduce dose to 1 mg/kg/day (treatment) or hold (prophylaxis). Consider UFH instead.';
          decision.push('⚠️ Cr >2.0: LMWH accumulation risk — consider UFH');
        }
        if (cr > 3.0) {
          doseAdjustment = 'CONTRAINDICATED — use UFH instead';
          decision.push('🔴 LMWH contraindicated with Cr >3.0 — switch to UFH');
        }
      } else {
        doseAdjustment = 'UFH: weight-based protocol';
        monitoringSchedule.push('aPTT: Q6h until therapeutic (1.5-2.5x control), then daily');
        reversalAgent = 'Protamine sulfate: 1mg per 100 units UFH given in last 2-3 hours';
      }

      if (isBleeding) {
        holdDuration = 'Hold immediately';
        if (isLMWH) {
          reversalAgent = 'Protamine (partial reversal only — 60% effective for LMWH)';
        } else {
          reversalAgent = 'Protamine sulfate IV — titrate to aPTT normalization';
        }
      }

      if (isPeriop) {
        holdDuration = isLMWH ? 'Hold 24h before surgery (prophylactic dose) or 24h (treatment dose)' : 'Stop UFH 4-6h pre-op';
      }
    } else if (agentLower.includes('dabigatran') || agentLower.includes('rivaroxaban') || agentLower.includes('apixaban') || agentLower.includes('edoxaban') || agentLower.includes('doac')) {
      monitoringSchedule.push('Routine monitoring not required for DOACs');
      monitoringSchedule.push('Check renal function, CBC, LFTs periodically');
      monitoringSchedule.push('Anti-Xa level may be useful in emergency/perioperative settings');

      if (isBleeding) {
        holdDuration = 'Hold immediately';
        const isDabigatran = agentLower.includes('dabigatran');
        reversalAgent = isDabigatran
          ? 'Idarucizumab (Praxbind) 5g IV — complete reversal of dabigatran'
          : 'Andexanet alfa (Andexxa) for Factor Xa inhibitors — or PCC/aPCC as alternative';
        decision.push('DOAC reversal agent should be administered for life-threatening bleeding');
      }

      if (isPeriop) {
        const isDabigatran = agentLower.includes('dabigatran');
        if (cr >= 1.5) {
          holdDuration = isDabigatran ? 'Hold 48-72h before surgery' : 'Hold 48h before surgery (high bleeding risk procedure)';
        } else {
          holdDuration = isDabigatran ? 'Hold 24-48h before surgery' : 'Hold 24h before surgery';
        }
        monitoringSchedule.push('Check anti-Xa or thrombin time if available to confirm clearance');
      }

      if (cr > 2.5) {
        decision.push('⚠️ Reduced renal function — DOAC dose reduction likely needed');
        if (cr > 3.5) decision.push('Consider alternative anticoagulation (UFH/LMWH)');
      }
    }

    // Drug interactions check
    if (interactions.length > 0) {
      decision.push(`⚠️ Drug interactions detected: ${interactions.join(', ')}`);
      decision.push('Review for potential increased bleeding risk or altered anticoagulant levels');
    }

    return NextResponse.json({
      success: true,
      data: {
        doseAdjustment,
        reversalAgent,
        holdDuration,
        monitoringSchedule,
        decision,
        currentINR: inr || null,
        kidneyFunction: { creatinine: cr, egfr: cr > 0 ? Math.round((186 * Math.pow(cr, -1.154)) * 0.742) : null },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}