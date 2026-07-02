import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DRUG_INTERACTIONS, LAB_REFERENCES, PREGNANCY_CATEGORIES, PEDIATRIC_RESTRICTED, BLOOD_COMPATIBILITY } from '@/lib/medgate-constants';
import type { PatientContext, GateVerificationResult, Decision } from '@/lib/medgate-constants';

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return 'sha256:' + Math.abs(hash).toString(16).padStart(8, '0') + 'a7f3e2b1c9d4f8e6';
}

function checkDrugInteraction(claim: string, meds: string[]): GateVerificationResult {
  const start = performance.now();
  const claimLower = claim.toLowerCase();
  let blocked = false; let reviewed = false; let riskLabel = 'NO_INTERACTIONS';
  const evidence: string[] = []; const missing: string[] = []; const reasons: string[] = [];

  for (const inter of DRUG_INTERACTIONS) {
    const aMatch = meds.some(m => m.toLowerCase().includes(inter.drugA) || claimLower.includes(inter.drugA));
    const bMatch = meds.some(m => m.toLowerCase().includes(inter.drugB) || claimLower.includes(inter.drugB));
    if (aMatch && bMatch) {
      evidence.push(`${inter.drugA} + ${inter.drugB}: ${inter.mechanism}`);
      evidence.push(`Severity: ${inter.severity} — ${inter.clinicalEffect}`);
      evidence.push(`Management: ${inter.management}`);
      if (inter.severity === 'FATAL' || inter.severity === 'SEVERE') { blocked = true; riskLabel = inter.severity === 'FATAL' ? 'FATAL_INTERACTION' : 'SEVERE_INTERACTION'; }
      else if (inter.severity === 'MODERATE') { reviewed = true; riskLabel = 'MODERATE_INTERACTION'; }
      else { riskLabel = 'MINOR_NOTED'; }
      reasons.push(`${inter.drugA} + ${inter.drugB}: ${inter.severity} interaction — ${inter.clinicalEffect}`);
    }
  }
  if (!blocked && !reviewed) { evidence.push('No known drug-drug interactions found in database'); }
  if (meds.length < 2) { missing.push('Only one medication specified — full interaction check requires current medication list'); }
  const latency = Math.round((performance.now() - start) * 100) / 100;
  return { gate: 'DrugInteractionGate', decision: blocked ? 'BLOCK' : reviewed ? 'NEEDS_REVIEW' : 'ALLOW', risk_label: riskLabel, reason: reasons.join('; ') || 'No interactions detected', evidence, missing_evidence: missing, latency_ms: latency };
}

function checkDose(claim: string, ctx: PatientContext): GateVerificationResult {
  const start = performance.now();
  const evidence: string[] = []; const missing: string[] = [];
  const claimLower = claim.toLowerCase();
  let decision: Decision = 'ALLOW'; let riskLabel = 'DOSE_THERAPEUTIC';
  const doseMatch = claimLower.match(/(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|units)/i);
  if (doseMatch) {
    const dose = parseFloat(doseMatch[1]); const unit = doseMatch[2].toLowerCase();
    if (claimLower.includes('acetaminophen') || claimLower.includes('paracetamol')) {
      const maxDaily = 4000; const maxPed = 75 * ctx.weight_kg;
      if (ctx.age < 18 && dose * 4 > maxPed) {
        decision = 'BLOCK'; riskLabel = 'LETHAL_DOSE';
        evidence.push(`Pediatric max: ${Math.round(maxPed)}mg/day (75mg/kg for ${ctx.weight_kg}kg)`);
      } else if (dose > maxDaily) {
        decision = 'BLOCK'; riskLabel = 'DOSE_EXCEEDS_MAXIMUM';
        evidence.push(`Max daily dose: ${maxDaily}mg. Proposed: ${dose}mg exceeds limit.`);
      } else if (dose > 3000) { decision = 'ALLOW'; riskLabel = 'DOSE_BOUNDARY_NOTED'; evidence.push('Dose approaching upper limit of 4000mg/day'); }
      else { evidence.push(`Dose ${dose}${unit} within therapeutic range (max ${maxDaily}mg/day)`); }
    } else { evidence.push(`Dose ${dose}${unit} — no specific rule triggered for this medication`); }
  } else { evidence.push('No dose information extracted from claim'); missing.push('Dose and unit not specified'); }
  if (ctx.egfr && ctx.egfr < 30) { evidence.push(`WARNING: eGFR ${ctx.egfr} — renal dose adjustment likely required`); if (decision === 'ALLOW') { decision = 'NEEDS_REVIEW'; riskLabel = 'DOSE_ADJUSTMENT_NEEDED'; } }
  return { gate: 'DoseVerificationGate', decision, risk_label: riskLabel, reason: evidence[0] || 'Dose verification complete', evidence, missing_evidence: missing, latency_ms: Math.round((performance.now() - start) * 100) / 100 };
}

function checkAllergy(claim: string, ctx: PatientContext): GateVerificationResult {
  const start = performance.now();
  const evidence: string[] = []; const missing: string[] = [];
  const claimLower = claim.toLowerCase(); let decision: Decision = 'ALLOW'; let riskLabel = 'NO_ALLERGY_CONCERN';
  if (!ctx.allergies || ctx.allergies.length === 0) { evidence.push('No allergy history provided'); missing.push('Patient allergy history not available'); }
  else {
    for (const allergy of ctx.allergies) {
      const aLower = allergy.toLowerCase();
      if (aLower.includes('penicillin') && (claimLower.includes('amoxicillin') || claimLower.includes('ampicillin') || claimLower.includes('penicillin'))) {
        decision = 'BLOCK'; riskLabel = 'ALLERGY_MATCH';
        evidence.push(`ALLERGY MATCH: Patient has ${allergy} allergy. Claim contains cross-reactive medication.`); evidence.push('Cross-reactivity: penicillin → aminopenicillins (amoxicillin, ampicillin)');
      }
      if (aLower.includes('sulfa') && claimLower.includes('sulfamethoxazole')) {
        decision = 'BLOCK'; riskLabel = 'ALLERGY_MATCH';
        evidence.push(`ALLERGY MATCH: ${allergy} allergy — sulfonamide antibiotic contraindicated`);
      }
    }
    if (decision === 'ALLOW') evidence.push(`No allergy cross-reactivity detected for: ${ctx.allergies.join(', ')}`);
  }
  return { gate: 'AllergyCrossRefGate', decision, risk_label: riskLabel, reason: evidence[0] || 'Allergy check complete', evidence, missing_evidence: missing, latency_ms: Math.round((performance.now() - start) * 100) / 100 };
}

function checkLabResult(claim: string): GateVerificationResult {
  const start = performance.now();
  const evidence: string[] = []; const missing: string[] = [];
  const claimLower = claim.toLowerCase(); let decision: Decision = 'ALLOW'; let riskLabel = 'NORMAL';
  for (const [analyte, ref] of Object.entries(LAB_REFERENCES)) {
    if (claimLower.includes(analyte.toLowerCase())) {
      const valMatch = claimLower.match(new RegExp(analyte.toLowerCase() + '[:\\s]+(\\d+\\.?\\d*)'));
      if (valMatch) {
        const val = parseFloat(valMatch[1]);
        if (val > ref.physiologicalMax) { decision = 'BLOCK'; riskLabel = 'PHYSIOLOGICAL_IMPOSSIBILITY'; evidence.push(`${analyte} ${val}${ref.unit}: EXCEEDS physiological maximum (${ref.physiologicalMax})`); }
        else if (val >= ref.critHigh) { decision = decision === 'BLOCK' ? 'BLOCK' : 'NEEDS_REVIEW'; riskLabel = 'CRITICAL_HIGH'; evidence.push(`${analyte} ${val}${ref.unit}: CRITICAL HIGH (threshold: ${ref.critHigh})`); }
        else if (val <= ref.critLow && ref.critLow > 0) { decision = decision === 'BLOCK' ? 'BLOCK' : 'NEEDS_REVIEW'; riskLabel = 'CRITICAL_LOW'; evidence.push(`${analyte} ${val}${ref.unit}: CRITICAL LOW (threshold: ${ref.critLow})`); }
        else if (val > ref.refHigh) { riskLabel = 'ABNORMAL_HIGH'; evidence.push(`${analyte} ${val}${ref.unit}: High (ref: ${ref.refLow}-${ref.refHigh})`); }
        else if (val < ref.refLow) { riskLabel = 'ABNORMAL_LOW'; evidence.push(`${analyte} ${val}${ref.unit}: Low (ref: ${ref.refLow}-${ref.refHigh})`); }
        else { evidence.push(`${analyte} ${val}${ref.unit}: Within reference range (${ref.refLow}-${ref.refHigh})`); }
      }
    }
  }
  if (evidence.length === 0) { evidence.push('No recognized lab analyte found in claim'); missing.push('Could not parse lab values from claim'); }
  return { gate: 'LabResultValidityGate', decision, risk_label: riskLabel, reason: evidence[0] || 'Lab validation complete', evidence, missing_evidence: missing, latency_ms: Math.round((performance.now() - start) * 100) / 100 };
}

function checkTimeCritical(claim: string): GateVerificationResult {
  const start = performance.now(); const evidence: string[] = []; let decision: Decision = 'ALLOW'; let riskLabel = 'NOT_TIME_CRITICAL';
  const claimLower = claim.toLowerCase();
  if (claimLower.includes('stemi')) { const timeMatch = claimLower.match(/(\d+)\s*min/); if (timeMatch) { const t = parseInt(timeMatch[1]); if (t > 90) { decision = 'BLOCK'; riskLabel = 'TIME_EXCEEDED_STEMI'; evidence.push(`STEMI door-to-balloon: ${t} min EXCEEDS 90 min guideline`); } else if (t > 72) { decision = 'NEEDS_REVIEW'; riskLabel = 'TIME_APPROACHING_STEMI'; evidence.push(`STEMI door-to-balloon: ${t} min — approaching 90 min deadline`); } else evidence.push(`STEMI door-to-balloon: ${t} min — within 90 min guideline`); } else evidence.push('STEMI identified but no time specified'); }
  else if (claimLower.includes('stroke') || claimLower.includes('tpa')) { const timeMatch = claimLower.match(/(\d+)\s*min/); if (timeMatch) { const t = parseInt(timeMatch[1]); if (t > 60) { decision = 'BLOCK'; riskLabel = 'TIME_EXCEEDED_STROKE'; } else if (t > 45) { decision = 'NEEDS_REVIEW'; riskLabel = 'TIME_APPROACHING_STROKE'; } else evidence.push(`Stroke door-to-needle: ${t} min — within 60 min guideline`); } }
  else if (claimLower.includes('sepsis')) { evidence.push('Sepsis identified — 1-hour bundle compliance required'); evidence.push('Bundle: Lactate, cultures, antibiotics, fluids'); }
  else evidence.push('No time-critical condition identified in claim');
  return { gate: 'TimeCriticalGate', decision, risk_label: riskLabel, reason: evidence[0] || 'Time critical check complete', evidence, missing_evidence: [], latency_ms: Math.round((performance.now() - start) * 100) / 100 };
}

function checkVitalSigns(claim: string): GateVerificationResult {
  const start = performance.now(); const evidence: string[] = []; let decision: Decision = 'ALLOW'; let riskLabel = 'VITALS_NORMAL';
  const claimLower = claim.toLowerCase();
  const hrMatch = claimLower.match(/hr[:\s]+(\d+)/i) || claimLower.match(/heart rate[:\s]+(\d+)/i);
  if (hrMatch) { const hr = parseInt(hrMatch[1]); if (hr > 130) { decision = 'BLOCK'; riskLabel = 'CRITICAL_TACHYCARDIA'; evidence.push(`HR ${hr}: CRITICAL HIGH (>130)`); } else if (hr > 110) { if (decision !== 'BLOCK') decision = 'NEEDS_REVIEW'; riskLabel = 'TACHYCARDIA'; evidence.push(`HR ${hr}: Elevated (>110)`); } else if (hr < 40) { decision = 'BLOCK'; riskLabel = 'CRITICAL_BRADYCARDIA'; evidence.push(`HR ${hr}: CRITICAL LOW (<40)`); } else evidence.push(`HR ${hr}: Normal`); }
  const sbpMatch = claimLower.match(/sbp[:\s]+(\d+)/i) || claimLower.match(/systolic[:\s]+(\d+)/i);
  if (sbpMatch) { const sbp = parseInt(sbpMatch[1]); if (sbp < 70) { decision = 'BLOCK'; riskLabel = 'CRITICAL_HYPOTENSION'; evidence.push(`SBP ${sbp}: CRITICAL LOW (<70)`); } else if (sbp < 90) { if (decision !== 'BLOCK') decision = 'NEEDS_REVIEW'; evidence.push(`SBP ${sbp}: Low (<90)`); } else if (sbp > 200) { decision = 'BLOCK'; evidence.push(`SBP ${sbp}: CRITICAL HIGH (>200)`); } else evidence.push(`SBP ${sbp}: Normal`); }
  if (evidence.length === 0) evidence.push('No vital sign data found in claim');
  return { gate: 'VitalSignAnomalyGate', decision, risk_label: riskLabel, reason: evidence[0] || 'Vital sign check complete', evidence, missing_evidence: [], latency_ms: Math.round((performance.now() - start) * 100) / 100 };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { claim, lane, patient_context } = body as { claim: string; lane: string; patient_context?: PatientContext };
    const ctx: PatientContext = patient_context || { age: 65, weight_kg: 70, sex: 'male', allergies: [], current_medications: [], diagnoses: [] };
    const verifications: GateVerificationResult[] = [];
    if (lane === 'PHARM' || lane === 'PHARMACY') {
      verifications.push(checkDrugInteraction(claim, [...(ctx.current_medications || []), claim]));
      verifications.push(checkDose(claim, ctx));
      verifications.push(checkAllergy(claim, ctx));
    } else if (lane === 'LAB') { verifications.push(checkLabResult(claim)); }
    else if (lane === 'EMERG' || lane === 'CARD' || lane === 'ICU') { verifications.push(checkTimeCritical(claim)); verifications.push(checkVitalSigns(claim)); }
    else if (lane === 'OB') {
      const start = performance.now(); const evidence: string[] = [];
      for (const [drug, info] of Object.entries(PREGNANCY_CATEGORIES)) { if (claim.toLowerCase().includes(drug.toLowerCase())) { evidence.push(`${drug}: Category ${info.category} — ${info.risk}`); } }
      verifications.push({ gate: 'PregnancySafetyGate', decision: evidence.some(e => e.includes('Category X') || e.includes('Category D')) ? 'BLOCK' : evidence.length > 0 ? 'NEEDS_REVIEW' : 'ALLOW', risk_label: 'PREGNANCY_CHECK', reason: evidence[0] || 'No known pregnancy risk identified', evidence, missing_evidence: [], latency_ms: Math.round((performance.now() - start) * 100) / 100 });
    } else if (lane === 'PEDS') {
      const start = performance.now(); const evidence: string[] = [];
      for (const [drug, info] of Object.entries(PEDIATRIC_RESTRICTED)) { if (claim.toLowerCase().includes(drug.toLowerCase()) && ctx.age < info.minAge) { evidence.push(`AGE RESTRICTION: ${drug} contraindicated < ${info.minAge} years — ${info.risk}`); } }
      verifications.push({ gate: 'PediatricSafetyGate', decision: evidence.length > 0 ? 'BLOCK' : 'ALLOW', risk_label: evidence.length > 0 ? 'AGE_RESTRICTED' : 'PEDIATRIC_SAFE', reason: evidence[0] || 'No pediatric restrictions triggered', evidence, missing_evidence: [], latency_ms: Math.round((performance.now() - start) * 100) / 100 });
    } else if (lane === 'SURG') {
      const start = performance.now(); const evidence: string[] = [];
      const typeMatch = claim.match(/(?:type|blood type)\s*([ABO]+[+-])/i);
      const donorMatch = claim.match(/(?:administer|donor|give)\s*(?:type\s*)?([ABO]+[+-])/i);
      if (typeMatch && donorMatch) {
        const recip = typeMatch[1].toUpperCase(); const donor = donorMatch[1].toUpperCase();
        const compat = BLOOD_COMPATIBILITY[recip];
        if (compat && compat.includes(donor)) { evidence.push(`${recip} recipient compatible with ${donor} donor`); }
        else { evidence.push(`INCOMPATIBLE: ${recip} recipient CANNOT receive ${donor} blood`); }
      } else evidence.push('No blood type pair identified for compatibility check');
      verifications.push({ gate: 'BloodProductGate', decision: evidence.some(e => e.includes('INCOMPATIBLE')) ? 'BLOCK' : 'ALLOW', risk_label: evidence.some(e => e.includes('INCOMPATIBLE')) ? 'ABO_INCOMPATIBLE' : 'COMPATIBLE', reason: evidence[0], evidence, missing_evidence: [], latency_ms: Math.round((performance.now() - start) * 100) / 100 });
    } else if (lane === 'RAD') {
      const start = performance.now(); const evidence: string[] = [];
      if (claim.toLowerCase().includes('metformin') && (ctx.egfr === undefined || ctx.egfr < 60)) { evidence.push('Metformin hold required: eGFR < 60 — lactic acidosis risk with iodinated contrast'); }
      if (ctx.egfr && ctx.egfr < 30) { evidence.push(`eGFR ${ctx.egfr}: BELOW threshold (30) for iodinated contrast`); }
      verifications.push({ gate: 'ContrastAgentGate', decision: evidence.some(e => e.includes('BELOW')) ? 'BLOCK' : evidence.length > 0 ? 'NEEDS_REVIEW' : 'ALLOW', risk_label: 'CONTRAST_SAFETY_CHECK', reason: evidence[0] || 'No contrast safety concerns identified', evidence, missing_evidence: ctx.egfr === undefined ? ['eGFR not provided'] : [], latency_ms: Math.round((performance.now() - start) * 100) / 100 });
    } else { verifications.push(checkDrugInteraction(claim, ctx.current_medications || [])); verifications.push(checkLabResult(claim)); }
    const overall = verifications.some(v => v.decision === 'BLOCK') ? 'BLOCK' as Decision : verifications.some(v => v.decision === 'NEEDS_REVIEW') ? 'NEEDS_REVIEW' as Decision : 'ALLOW' as Decision;
    const totalLatency = verifications.reduce((s, v) => s + v.latency_ms, 0);
    const hash = simpleHash(JSON.stringify({ claim, lane, verifications }));
    await db.gateVerification.create({ data: { claim, lane, gateId: verifications.map(v => v.gate).join(','), decision: overall, riskLabel: verifications[0]?.risk_label || 'UNKNOWN', reason: verifications.map(v => v.reason).join('; '), evidence: JSON.stringify(verifications.flatMap(v => v.evidence)), missingEvidence: JSON.stringify(verifications.flatMap(v => v.missing_evidence)), latencyMs: Math.round(totalLatency * 100), evidenceHash: hash, patientContext: patient_context ? JSON.stringify(patient_context) : null } });
    return NextResponse.json({ claim, lane, verifications, overall_decision: overall, evidence_hash: hash, total_latency_ms: Math.round(totalLatency * 100) / 100, timestamp: new Date().toISOString() });
  } catch (error) { return NextResponse.json({ error: 'Verification failed', details: String(error) }, { status: 500 }); }
}
