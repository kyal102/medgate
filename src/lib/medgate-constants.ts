import {
  Pill, Scale, ShieldAlert, FlaskConical, ClipboardCheck, Scan, Clock,
  Baby, Heart, Activity, Microscope, Droplets, Monitor, Brain,
  type LucideIcon
} from 'lucide-react';

export type Decision = 'ALLOW' | 'BLOCK' | 'NEEDS_REVIEW' | 'EVIDENCE_REQUIRED';

export interface GateInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconComponent: LucideIcon;
  lane: string;
  checks: string[];
}

export interface GateVerificationResult {
  gate: string;
  decision: Decision;
  risk_label: string;
  reason: string;
  evidence: string[];
  missing_evidence: string[];
  latency_ms: number;
}

export interface VerificationResult {
  claim: string;
  lane: string;
  verifications: GateVerificationResult[];
  overall_decision: Decision;
  evidence_hash: string;
  total_latency_ms: number;
  timestamp: string;
}

export interface PatientContext {
  age: number;
  weight_kg: number;
  sex: 'male' | 'female' | 'other';
  allergies: string[];
  current_medications: string[];
  diagnoses: string[];
  egfr?: number;
  pregnancy?: boolean;
  trimester?: 1 | 2 | 3;
  blood_type?: string;
  hepatic_function?: 'normal' | 'mild' | 'moderate' | 'severe';
}

export interface BenchmarkCase {
  case_id: string;
  claim_type: string;
  input: string;
  expected_decision: Decision;
  gate: string;
  risk_label: string;
}

export interface GateStats {
  processed: number;
  blocked: number;
  allowed: number;
  needsReview: number;
  avgLatencyMs: number;
}

export interface ClaimHistoryEntry {
  id: string;
  claim: string;
  lane: string;
  overall_decision: Decision;
  risk_label: string;
  timestamp: string;
  evidence_hash: string;
  gate_results: GateVerificationResult[];
}

export interface DrugInteraction {
  drugA: string;
  drugB: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'FATAL';
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

export interface LabValue {
  analyte: string;
  value: number;
  unit: string;
}

export interface VitalSignData {
  parameter: string;
  value: number;
  unit: string;
}

export interface SepsisCriteria {
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolicBP?: number;
  wbc?: number;
  lactate?: number;
  consciousness?: string;
  sirs_suspected_infection: boolean;
}

export interface MedNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  read: boolean;
}

export interface LicenseTier {
  id: string;
  name: string;
  target: string;
  price: string;
  gates: number;
  features: string[];
}

export const ICON_MAP: Record<string, LucideIcon> = {
  Pill, Scale, ShieldAlert, FlaskConical, ClipboardCheck, Scan, Clock,
  Baby, Heart, Activity, Microscope, Droplets, Monitor, Brain,
};

export const MED_GATES: GateInfo[] = [
  {
    id: 'DrugInteractionGate', name: 'Drug Interaction Gate',
    description: 'Deterministically verifies drug-drug, drug-food, drug-disease, and drug-lab interactions against clinical databases.',
    icon: 'Pill', iconComponent: Pill, lane: 'PHARM',
    checks: ['Drug-drug interaction database lookup', 'Drug-food interaction check', 'Drug-disease contraindication', 'Drug-lab interaction', 'CYP450 enzyme inhibition/induction', 'Duplicate therapy detection'],
  },
  {
    id: 'DoseVerificationGate', name: 'Dose Verification Gate',
    description: 'Verifies dosage calculations against patient weight, age, renal/hepatic function, and BSA using clinical pharmacokinetic rules.',
    icon: 'Scale', iconComponent: Scale, lane: 'PHARM',
    checks: ['Weight-based dosing (mg/kg)', 'BSA calculation (Mosteller)', 'Renal dose adjustment (CKD-EPI)', 'Hepatic dose adjustment (Child-Pugh)', 'Age-based extremes', 'Maximum daily dose enforcement'],
  },
  {
    id: 'AllergyCrossRefGate', name: 'Allergy Cross-Ref Gate',
    description: 'Cross-references patient allergy history with proposed medications including cross-reactivity class matching.',
    icon: 'ShieldAlert', iconComponent: ShieldAlert, lane: 'PHARM',
    checks: ['Exact allergy match', 'Cross-reactivity class matching', 'Sulfonamide cross-reactivity', 'Latex allergy packaging check'],
  },
  {
    id: 'LabResultValidityGate', name: 'Lab Result Validity Gate',
    description: 'Validates lab results against physiological possibility thresholds, critical value limits, and pre-analytical error indicators.',
    icon: 'FlaskConical', iconComponent: FlaskConical, lane: 'LAB',
    checks: ['Physiological impossibility detection', 'Critical value flagging', 'Pre-analytical error detection', 'Age/sex-specific reference ranges', 'Temporal consistency', 'Units validation'],
  },
  {
    id: 'ProtocolComplianceGate', name: 'Protocol Compliance Gate',
    description: 'Verifies treatment plans against evidence-based clinical guidelines (CAP, AHA, Surviving Sepsis, NCEP).',
    icon: 'ClipboardCheck', iconComponent: ClipboardCheck, lane: 'PHARM',
    checks: ['CAP pneumonia guidelines', 'AHA heart failure guidelines', 'Surviving Sepsis Campaign', 'NCEP ATP III lipid guidelines', 'Antibiotic stewardship', 'Cancer staging protocols'],
  },
  {
    id: 'ContrastAgentGate', name: 'Contrast Agent Gate',
    description: 'Pre-contrast imaging safety: eGFR thresholds, metformin hold protocol, allergy history, pregnancy status.',
    icon: 'Scan', iconComponent: Scan, lane: 'RAD',
    checks: ['eGFR threshold check', 'Metformin hold protocol', 'Iodine allergy history', 'Prior contrast reaction history', 'Pregnancy status', 'NSF risk for gadolinium'],
  },
  {
    id: 'TimeCriticalGate', name: 'Time Critical Gate',
    description: 'Routes and verifies time-sensitive medical information against critical time windows (STEMI, stroke, sepsis).',
    icon: 'Clock', iconComponent: Clock, lane: 'EMERG',
    checks: ['STEMI door-to-balloon < 90 min', 'Stroke door-to-needle < 60 min', 'Sepsis 1-hour bundle', 'Anaphylaxis epinephrine timing', 'Trauma ABCDE survey timing'],
  },
  {
    id: 'PediatricSafetyGate', name: 'Pediatric Safety Gate',
    description: 'Age/weight-specific safety: weight-band dosing, age-restricted medications, developmental considerations.',
    icon: 'Baby', iconComponent: Baby, lane: 'PEDS',
    checks: ['Weight-band dosing verification', 'Age-restricted medications', 'Developmental stage considerations', 'Maximum dose by weight', 'Liquid formulation concentration', 'Neonatal gestational age adjustment'],
  },
  {
    id: 'PregnancySafetyGate', name: 'Pregnancy Safety Gate',
    description: 'FDA pregnancy category checks, trimester-specific teratogenicity windows, lactation safety.',
    icon: 'Heart', iconComponent: Heart, lane: 'OB',
    checks: ['FDA pregnancy category', 'Trimester-specific teratogenicity', 'Known teratogens screening', 'Lactation safety (L1-L5)', 'Vaccine safety in pregnancy'],
  },
  {
    id: 'VitalSignAnomalyGate', name: 'Vital Sign Anomaly Gate',
    description: 'Real-time vital sign threshold verification with NEWS2, qSOFA, and MEWS scoring systems.',
    icon: 'Activity', iconComponent: Activity, lane: 'EMERG',
    checks: ['NEWS2 scoring', 'qSOFA screening', 'MEWS calculation', 'Critical threshold detection', 'Trend analysis'],
  },
  {
    id: 'AntibioticStewardshipGate', name: 'Antibiotic Stewardship Gate',
    description: 'Verifies antibiotic selection, spectrum appropriateness, duration, and de-escalation opportunities.',
    icon: 'Microscope', iconComponent: Microscope, lane: 'PHARM',
    checks: ['Spectrum appropriateness', 'Duration compliance', 'Dose optimization (PK/PD)', 'De-escalation opportunity', 'Surgical prophylaxis rules', 'MRSA risk assessment'],
  },
  {
    id: 'BloodProductGate', name: 'Blood Product Gate',
    description: 'ABO/Rh compatibility verification, crossmatch validation, product age and storage checks.',
    icon: 'Droplets', iconComponent: Droplets, lane: 'SURG',
    checks: ['ABO compatibility matrix', 'Rh factor compatibility', 'Crossmatch verification', 'Product age/outdating', 'Storage temperature validation', 'Special product requirements'],
  },
  {
    id: 'MedicalDeviceGate', name: 'Medical Device Gate',
    description: 'Validates ventilator, infusion pump, PCA, defibrillator, and pacemaker settings against clinical protocols.',
    icon: 'Monitor', iconComponent: Monitor, lane: 'ICU',
    checks: ['Ventilator tidal volume (6-8 mL/kg IBW)', 'Infusion pump rate verification', 'PCA lockout interval', 'Defibrillator energy settings', 'Pacemaker parameters'],
  },
  {
    id: 'DiagnosticPlausibilityGate', name: 'Diagnostic Plausibility Gate',
    description: 'Verifies AI-generated diagnostic claims against presented symptoms, labs, and demographic data.',
    icon: 'Brain', iconComponent: Brain, lane: 'PATH',
    checks: ['Symptom-to-diagnosis correlation', 'Age/demographic plausibility', 'Lab value consistency', 'Imaging finding match', 'Red flag detection'],
  },
];

export const DTL_LANES = [
  { id: 'PHARM', name: 'Pharmacology', color: '#06b6d4', gates: ['DrugInteractionGate', 'DoseVerificationGate', 'AllergyCrossRefGate', 'AntibioticStewardshipGate', 'ProtocolComplianceGate'] },
  { id: 'LAB', name: 'Laboratory', color: '#8b5cf6', gates: ['LabResultValidityGate'] },
  { id: 'PATH', name: 'Pathology', color: '#f43f5e', gates: ['DiagnosticPlausibilityGate'] },
  { id: 'CARD', name: 'Cardiology', color: '#ef4444', gates: ['TimeCriticalGate', 'VitalSignAnomalyGate'] },
  { id: 'ONC', name: 'Oncology', color: '#a855f7', gates: ['ContrastAgentGate', 'PregnancySafetyGate'] },
  { id: 'RAD', name: 'Radiology', color: '#3b82f6', gates: ['ContrastAgentGate'] },
  { id: 'PEDS', name: 'Pediatric', color: '#f59e0b', gates: ['PediatricSafetyGate'] },
  { id: 'OB', name: 'Obstetric', color: '#ec4899', gates: ['PregnancySafetyGate'] },
  { id: 'EMERG', name: 'Emergency', color: '#ef4444', gates: ['TimeCriticalGate', 'VitalSignAnomalyGate'] },
  { id: 'SURG', name: 'Surgical', color: '#6366f1', gates: ['ContrastAgentGate', 'BloodProductGate'] },
  { id: 'ICU', name: 'Critical Care', color: '#dc2626', gates: ['VitalSignAnomalyGate', 'MedicalDeviceGate'] },
  { id: 'PHARMACY', name: 'Pharmacy', color: '#14b8a6', gates: ['DrugInteractionGate', 'DoseVerificationGate', 'AllergyCrossRefGate', 'AntibioticStewardshipGate'] },
];

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gate-rules', label: 'Gate Rules' },
  { id: 'claim-checker', label: 'Claim Checker' },
  { id: 'batch-verify', label: 'Batch Verify' },
  { id: 'activity-feed', label: 'Activity' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'gate-performance', label: 'Gate Stats' },
  { id: 'life-saved', label: 'Lives Saved' },
  { id: 'drug-interactions', label: 'Drug Check' },
  { id: 'dose-calc', label: 'Dose Calc' },
  { id: 'lab-validator', label: 'Lab Check' },
  { id: 'vital-signs', label: 'Vitals' },
  { id: 'sepsis', label: 'Sepsis' },
  { id: 'blood-compat', label: 'Blood Type' },
  { id: 'antibiotics', label: 'Antibiotics' },
  { id: 'contrast-safety', label: 'Contrast' },
  { id: 'pregnancy', label: 'Pregnancy' },
  { id: 'pediatric', label: 'Pediatric' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'devices', label: 'Devices' },
  { id: 'diagnostics', label: 'Diagnostics' },
  { id: 'time-critical', label: 'Emergency' },
  { id: 'evidence-pack', label: 'Evidence Pack' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'boundaries', label: 'Boundaries' },
  { id: 'certificate', label: 'Certificate' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'claim-history', label: 'History' },
  { id: 'verification-timeline', label: 'Timeline', icon: 'Clock' },
  { id: 'drug-database', label: 'Drug DB', icon: 'Pill' },
  { id: 'limitations', label: 'Limitations' },
  { id: 'info-velocity', label: 'Info Speed' },
  { id: 'handoff-timeline', label: 'Handoff' },
  { id: 'alert-fatigue', label: 'Alert Fatigue' },
  { id: 'error-matrix', label: 'Error Matrix' },
  { id: 'speed-compare', label: 'Speed' },
  { id: 'dtl-lanes', label: 'DTL Lanes' },
  { id: 'cross-lane', label: 'Cross-Lane' },
  { id: 'patent-viz', label: 'Patents' },
  { id: 'substrate', label: 'Substrates' },
  { id: 'evidence-chain', label: 'Evid Chain' },
  { id: 'determinism', label: 'Determinism' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'licensing', label: 'Licensing' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'roi', label: 'ROI' },
  { id: 'patient-sim', label: 'Patient Sim' },
  { id: 'gate-simulation', label: 'Simulation', icon: 'Cpu' },
  { id: 'clinical-scores', label: 'Scoring' },
  { id: 'adr-reporter', label: 'ADR Report' },
  { id: 'med-reconciliation', label: 'Med Recon' },
  { id: 'surgical-safety', label: 'Surgery' },
  { id: 'fall-risk', label: 'Fall Risk' },
  { id: 'vte-risk', label: 'VTE Risk' },
  { id: 'opioid-safety', label: 'Opioids' },
  { id: 'iv-pump', label: 'IV Pump' },
  { id: 'near-miss', label: 'Near Miss' },
  { id: 'handover-audit', label: 'Handover' },
  { id: 'amr-tracker', label: 'AMR' },
  { id: 'incident-analyzer', label: 'Incidents' },
  { id: 'abg-interpret', label: 'ABG' },
  { id: 'pain-assessment', label: 'Pain' },
  { id: 'wound-care', label: 'Wounds' },
  { id: 'neonatal', label: 'Neonatal' },
  { id: 'mental-health', label: 'Mental Hx' },
  { id: 'blood-product', label: 'Transfuse' },
];

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  { drugA: 'warfarin', drugB: 'trimethoprim-sulfamethoxazole', severity: 'SEVERE', mechanism: 'Vitamin K synthesis inhibition', clinicalEffect: 'Life-threatening bleeding (INR elevation 2-4 points)', management: 'Avoid combination; if essential, reduce warfarin 30-50% and monitor INR q2-3 days' },
  { drugA: 'methotrexate', drugB: 'ibuprofen', severity: 'FATAL', mechanism: 'Reduced methotrexate renal clearance + displaced from albumin', clinicalEffect: 'Fatal methotrexate toxicity', management: 'ABSOLUTELY CONTRAINDICATED — use paracetamol instead' },
  { drugA: 'ssri', drugB: 'tramadol', severity: 'SEVERE', mechanism: 'Serotonin reuptake inhibition + serotonin release', clinicalEffect: 'Serotonin syndrome', management: 'Avoid combination; use alternative analgesic' },
  { drugA: 'clopidogrel', drugB: 'omeprazole', severity: 'MODERATE', mechanism: 'CYP2C19 inhibition reduces clopidogrel activation', clinicalEffect: 'Reduced antiplatelet effect', management: 'Use pantoprazole instead (less CYP2C19 inhibition)' },
  { drugA: 'amoxicillin', drugB: 'probenecid', severity: 'MINOR', mechanism: 'Renal tubular secretion inhibition', clinicalEffect: 'Increased amoxicillin levels (potentially beneficial)', management: 'No action needed — often used intentionally' },
  { drugA: 'metformin', drugB: 'contrast (iodinated)', severity: 'SEVERE', mechanism: 'Contrast nephropathy + metformin accumulation', clinicalEffect: 'Lactic acidosis', management: 'Hold metformin 48h pre/post if eGFR < 60' },
  { drugA: 'statins', drugB: 'clarithromycin', severity: 'SEVERE', mechanism: 'CYP3A4 inhibition', clinicalEffect: 'Rhabdomyolysis', management: 'Hold statin during macrolide course; use azithromycin if needed' },
  { drugA: 'ace inhibitors', drugB: 'potassium supplements', severity: 'SEVERE', mechanism: 'Reduced aldosterone → hyperkalemia', clinicalEffect: 'Cardiac arrhythmia from hyperkalemia', management: 'Monitor K+ closely; avoid K+ supplements' },
  { drugA: 'digoxin', drugB: 'amiodarone', severity: 'SEVERE', mechanism: 'P-glycoprotein inhibition + CYP3A4', clinicalEffect: 'Digoxin toxicity', management: 'Reduce digoxin dose by 50%; monitor levels' },
  { drugA: 'levodopa', drugB: 'maois', severity: 'FATAL', mechanism: 'MAO inhibition + catecholamine accumulation', clinicalEffect: 'Hypertensive crisis', management: 'ABSOLUTELY CONTRAINDICATED' },
];

export const PREGNANCY_CATEGORIES: Record<string, { category: string; risk: string; trimesters?: number[] }> = {
  'isotretinoin': { category: 'X', risk: 'Teratogen — severe birth defects (craniofacial, cardiac, CNS)', trimesters: [1, 2, 3] },
  'methotrexate': { category: 'X', risk: 'Teratogen — abortifacient, limb defects', trimesters: [1, 2, 3] },
  'valproate': { category: 'D', risk: 'Neural tube defects, cognitive impairment', trimesters: [1] },
  'ace inhibitors': { category: 'D', risk: 'Renal dysgenesis, oligohydramnios (2nd/3rd trimester)', trimesters: [2, 3] },
  'warfarin': { category: 'X', risk: 'Warfarin embryopathy (6-12 weeks)', trimesters: [1, 2, 3] },
  'tetracycline': { category: 'D', risk: 'Discolored teeth, bone growth inhibition', trimesters: [2, 3] },
  'cephalexin': { category: 'B', risk: 'No known risk in pregnancy', trimesters: [1, 2, 3] },
  'amoxicillin': { category: 'B', risk: 'No known risk in pregnancy', trimesters: [1, 2, 3] },
  'paracetamol': { category: 'B', risk: 'Generally safe; avoid excessive use near term', trimesters: [1, 2, 3] },
  'azithromycin': { category: 'B', risk: 'Generally safe in pregnancy', trimesters: [1, 2, 3] },
  'lithium': { category: 'D', risk: 'Ebstein anomaly (1st trimester), thyroid/renal effects', trimesters: [1, 2, 3] },
  'carbamazepine': { category: 'D', risk: 'Neural tube defects, craniofacial anomalies', trimesters: [1] },
};

export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export const LAB_REFERENCES: Record<string, { unit: string; critLow: number; critHigh: number; refLow: number; refHigh: number; physMin: number; physMax: number }> = {
  'potassium': { unit: 'mEq/L', critLow: 2.5, critHigh: 6.5, refLow: 3.5, refHigh: 5.0, physMin: 2.0, physMax: 7.0 },
  'sodium': { unit: 'mEq/L', critLow: 120, critHigh: 160, refLow: 135, refHigh: 145, physMin: 100, physMax: 170 },
  'glucose': { unit: 'mg/dL', critLow: 40, critHigh: 500, refLow: 70, refHigh: 100, physMin: 20, physMax: 900 },
  'ph': { unit: '', critLow: 7.1, critHigh: 7.6, refLow: 7.35, refHigh: 7.45, physMin: 6.8, physMax: 7.8 },
  'creatinine': { unit: 'mg/dL', critLow: 0, critHigh: 10, refLow: 0.7, refHigh: 1.3, physMin: 0.2, physMax: 25 },
  'hemoglobin': { unit: 'g/dL', critLow: 7, critHigh: 20, refLow: 12, refHigh: 17.5, physMin: 3, physMax: 25 },
  'platelets': { unit: 'x10^9/L', critLow: 20, critHigh: 1000, refLow: 150, refHigh: 400, physMin: 0, physMax: 1500 },
  'inr': { unit: '', critLow: 0, critHigh: 5, refLow: 0.8, refHigh: 1.2, physMin: 0.5, physMax: 10 },
  'troponin': { unit: 'ng/mL', critLow: 0, critHigh: 0.4, refLow: 0, refHigh: 0.04, physMin: 0, physMax: 100 },
  'wbc': { unit: 'x10^9/L', critLow: 2, critHigh: 30, refLow: 4.5, refHigh: 11, physMin: 0, physMax: 100 },
  'lactate': { unit: 'mmol/L', critLow: 0, critHigh: 4, refLow: 0.5, refHigh: 2, physMin: 0.1, physMax: 20 },
  'bicarbonate': { unit: 'mEq/L', critLow: 15, critHigh: 40, refLow: 22, refHigh: 26, physMin: 5, physMax: 50 },
};

export const PEDIATRIC_RESTRICTED: Record<string, { minAge: number; risk: string }> = {
  'tetracycline': { minAge: 8, risk: 'Permanent dental staining (discoloration of developing teeth)' },
  'aspirin': { minAge: 16, risk: "Reye's syndrome — potentially fatal hepatic encephalopathy" },
  'ciprofloxacin': { minAge: 18, risk: 'Cartilage damage affecting bone growth' },
  'fluoroquinolones': { minAge: 18, risk: 'Cartilage and tendon damage' },
  'chloramphenicol': { minAge: 1, risk: 'Gray baby syndrome (neonates only)' },
  'metronidazole': { minAge: 0.17, risk: 'Avoid in neonates < 2 months (relative contraindication)' },
};

export const MOCK_BENCHMARK_CASES: BenchmarkCase[] = [
  { case_id: 'DI-001', claim_type: 'drug_interaction', input: 'Prescribe warfarin and trimethoprim-sulfamethoxazole', expected_decision: 'BLOCK', gate: 'DrugInteractionGate', risk_label: 'SEVERE_INTERACTION' },
  { case_id: 'DI-002', claim_type: 'drug_interaction', input: 'Prescribe methotrexate and ibuprofen', expected_decision: 'BLOCK', gate: 'DrugInteractionGate', risk_label: 'FATAL_INTERACTION' },
  { case_id: 'DI-003', claim_type: 'drug_interaction', input: 'Prescribe amoxicillin and probenecid', expected_decision: 'ALLOW', gate: 'DrugInteractionGate', risk_label: 'MINOR_NOTED' },
  { case_id: 'DI-004', claim_type: 'drug_interaction', input: 'Prescribe SSRIs and tramadol', expected_decision: 'BLOCK', gate: 'DrugInteractionGate', risk_label: 'SEVERE_INTERACTION' },
  { case_id: 'DI-005', claim_type: 'drug_interaction', input: 'Prescribe clopidogrel and omeprazole', expected_decision: 'NEEDS_REVIEW', gate: 'DrugInteractionGate', risk_label: 'MODERATE_INTERACTION' },
  { case_id: 'DV-001', claim_type: 'dose_verification', input: 'Gentamicin 7mg/kg IV once daily for 70kg patient', expected_decision: 'ALLOW', gate: 'DoseVerificationGate', risk_label: 'DOSE_THERAPEUTIC' },
  { case_id: 'DV-002', claim_type: 'dose_verification', input: 'Acetaminophen 1000mg QID for 15kg 3-year-old', expected_decision: 'BLOCK', gate: 'DoseVerificationGate', risk_label: 'LETHAL_DOSE' },
  { case_id: 'DV-003', claim_type: 'dose_verification', input: 'Digoxin 0.5mg IV for 85-year-old, eGFR 20', expected_decision: 'BLOCK', gate: 'DoseVerificationGate', risk_label: 'DOSE_EXCEEDS_MAXIMUM' },
  { case_id: 'DV-004', claim_type: 'dose_verification', input: 'Vancomycin 2g IV q12h for 120kg patient, eGFR 15', expected_decision: 'BLOCK', gate: 'DoseVerificationGate', risk_label: 'DOSE_EXCEEDS_MAXIMUM' },
  { case_id: 'LV-001', claim_type: 'lab_validity', input: 'Potassium 7.8 mEq/L', expected_decision: 'BLOCK', gate: 'LabResultValidityGate', risk_label: 'CRITICAL_VALUE' },
  { case_id: 'LV-002', claim_type: 'lab_validity', input: 'pH 6.5 in living patient', expected_decision: 'BLOCK', gate: 'LabResultValidityGate', risk_label: 'PHYSIOLOGICAL_IMPOSSIBILITY' },
  { case_id: 'LV-003', claim_type: 'lab_validity', input: 'Sodium 120 mEq/L — SIADH', expected_decision: 'NEEDS_REVIEW', gate: 'LabResultValidityGate', risk_label: 'CRITICAL_LOW' },
  { case_id: 'AL-001', claim_type: 'allergy_check', input: 'Patient with penicillin allergy: prescribe amoxicillin', expected_decision: 'BLOCK', gate: 'AllergyCrossRefGate', risk_label: 'ALLERGY_MATCH' },
  { case_id: 'AL-002', claim_type: 'allergy_check', input: 'Patient with penicillin allergy: prescribe azithromycin', expected_decision: 'ALLOW', gate: 'AllergyCrossRefGate', risk_label: 'NO_ALLERGY_CONCERN' },
  { case_id: 'SP-001', claim_type: 'sepsis_screen', input: 'Patient: HR 120, RR 24, Temp 38.9, WBC 15.2, Lactate 4.2, SBP 85', expected_decision: 'BLOCK', gate: 'TimeCriticalGate', risk_label: 'SEPSIS_SUSPECTED' },
  { case_id: 'BC-001', claim_type: 'blood_compat', input: 'Type A+ patient: administer Type B- packed RBCs', expected_decision: 'BLOCK', gate: 'BloodProductGate', risk_label: 'ABO_INCOMPATIBLE' },
  { case_id: 'BC-002', claim_type: 'blood_compat', input: 'Type O- patient: administer Type O+ packed RBCs', expected_decision: 'NEEDS_REVIEW', gate: 'BloodProductGate', risk_label: 'RH_INCOMPATIBLE' },
  { case_id: 'PR-001', claim_type: 'pregnancy_safety', input: 'Prescribe isotretinoin to 28-year-old pregnant patient, first trimester', expected_decision: 'BLOCK', gate: 'PregnancySafetyGate', risk_label: 'TERATOGEN' },
  { case_id: 'PR-002', claim_type: 'pregnancy_safety', input: 'Prescribe cephalexin to pregnant patient with UTI, second trimester', expected_decision: 'ALLOW', gate: 'PregnancySafetyGate', risk_label: 'PREGNANCY_SAFE' },
  { case_id: 'TC-001', claim_type: 'time_critical', input: 'STEMI patient: door-to-balloon time at 95 minutes', expected_decision: 'NEEDS_REVIEW', gate: 'TimeCriticalGate', risk_label: 'TIME_EXCEEDED_STEMI' },
  { case_id: 'TC-002', claim_type: 'time_critical', input: 'Stroke patient: door-to-needle time at 45 minutes for tPA', expected_decision: 'NEEDS_REVIEW', gate: 'TimeCriticalGate', risk_label: 'TIME_APPROACHING_STROKE' },
  { case_id: 'PC-001', claim_type: 'protocol_compliance', input: 'CAP with CURB-65 score 3: prescribe ceftriaxone + azithromycin', expected_decision: 'ALLOW', gate: 'ProtocolComplianceGate', risk_label: 'GUIDELINE_COMPLIANT' },
  { case_id: 'CS-001', claim_type: 'contrast_safety', input: 'CT with contrast: patient on metformin, eGFR 35', expected_decision: 'BLOCK', gate: 'ContrastAgentGate', risk_label: 'LACTIC_ACIDOSIS_RISK' },
  { case_id: 'MD-001', claim_type: 'device_validation', input: 'ARDS patient: set tidal volume 12 mL/kg IBW on ventilator', expected_decision: 'BLOCK', gate: 'MedicalDeviceGate', risk_label: 'VENTILATOR_LUNG_INJURY' },
  { case_id: 'PD-001', claim_type: 'pediatric_safety', input: 'Prescribe tetracycline to 6-year-old child', expected_decision: 'BLOCK', gate: 'PediatricSafetyGate', risk_label: 'DENTAL_STAINING_RISK' },
];

export const LICENSE_TIERS: LicenseTier[] = [
  { id: 'clinic', name: 'MedGate Clinic', target: 'Small clinics, GP practices', price: '$2,400/yr', gates: 4, features: ['Drug Interaction Gate', 'Dose Verification Gate', 'Allergy Cross-Ref Gate', 'Lab Result Validity Gate', 'Up to 10 users', 'Email support'] },
  { id: 'hospital', name: 'MedGate Hospital', target: 'Regional hospitals', price: '$24,000/yr', gates: 10, features: ['All Clinic gates', 'Protocol Compliance Gate', 'Contrast Agent Gate', 'Time Critical Gate', 'Pediatric Safety Gate', 'Pregnancy Safety Gate', 'Vital Sign Anomaly Gate', 'HL7/FHIR Integration', 'Up to 100 users', '99.5% SLA'] },
  { id: 'health-system', name: 'MedGate Health System', target: 'Hospital networks, IDNs', price: '$96,000/yr', gates: 14, features: ['All 14 Verification Gates', 'HL7/FHIR Integration', 'Custom Gate Builder', 'White-Label Option', '99.9% SLA', 'Dedicated support', 'Unlimited users'] },
  { id: 'government', name: 'MedGate Government', target: 'National health systems, WHO, CDC', price: 'Custom', gates: 14, features: ['All gates + custom', 'Offline Mode', 'Custom Gate Builder', 'White-Label', '99.99% SLA', 'Dedicated engineering team', 'Regulatory documentation'] },
  { id: 'emergency', name: 'MedGate Emergency', target: 'Ambulance services, disaster response', price: '$6,000/yr', gates: 3, features: ['Time Critical Gate', 'Drug Interaction Gate', 'Dose Verification Gate', 'Offline Mode', 'Mobile-optimized', 'Up to 50 users'] },
  { id: 'research', name: 'MedGate Research', target: 'Universities, research institutions', price: 'Free (Academic)', gates: 14, features: ['All 14 Verification Gates', 'API access', 'Academic license', 'Best-effort SLA', 'Citation required'] },
  { id: 'developer', name: 'MedGate Developer', target: 'Health tech companies', price: '$1,200/yr + per-call', gates: 14, features: ['All gates via API', 'SDK access', 'Sandbox environment', '99.5% SLA', 'API documentation'] },
];

export const LIVES_SAVED_DATA = [
  { errorType: 'Fatal drug-drug interactions', annualIncidence: '7,000', fatalityRate: '100%', catchRate: '95%+', estSaved: 6650 },
  { errorType: 'Dosing errors (lethal)', annualIncidence: '5,000', fatalityRate: '100%', catchRate: '90%+', estSaved: 4500 },
  { errorType: 'Allergy-related deaths', annualIncidence: '1,500', fatalityRate: '100%', catchRate: '98%+', estSaved: 1470 },
  { errorType: 'Diagnostic delays (missed MI)', annualIncidence: '30,000', fatalityRate: '~20%', catchRate: '40%+', estSaved: 2400 },
  { errorType: 'Sepsis delays', annualIncidence: '50,000', fatalityRate: '~30%', catchRate: '25%+', estSaved: 3750 },
  { errorType: 'Lab result errors (critical)', annualIncidence: '10,000', fatalityRate: '100%', catchRate: '85%+', estSaved: 8500 },
  { errorType: 'Contrast agent reactions', annualIncidence: '500', fatalityRate: '100%', catchRate: '95%+', estSaved: 475 },
  { errorType: 'Transfusion errors', annualIncidence: '100', fatalityRate: '100%', catchRate: '99%+', estSaved: 99 },
];

export const SPEED_COMPARISON_DATA = [
  { task: 'Drug interaction check', humanTime: '2-5 min', medgateTime: '<1ms', improvement: '120,000-300,000x' },
  { task: 'Dose verification', humanTime: '5-15 min', medgateTime: '<1ms', improvement: '300,000-900,000x' },
  { task: 'Lab result validation', humanTime: '30-60 min', medgateTime: '<1ms', improvement: '1.8-3.6M x' },
  { task: 'Allergy cross-reference', humanTime: '3-10 min', medgateTime: '<1ms', improvement: '180,000-600,000x' },
  { task: 'Sepsis screening', humanTime: '10-60 min', medgateTime: '<1ms', improvement: '600,000-3.6M x' },
  { task: 'Blood type verification', humanTime: '15-45 min', medgateTime: '<1ms', improvement: '900,000-2.7M x' },
];
