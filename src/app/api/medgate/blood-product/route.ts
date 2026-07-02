import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { BLOOD_COMPATIBILITY } from '@/lib/medgate-constants';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface BloodProductInput {
  productType: string;
  units: number;
  indication: string;
  urgency: string;
  specialRequirements?: string[];
  patientBloodType: string;
  preTransfusionChecklist?: Record<string, boolean>;
}

const PRODUCT_TYPES: Record<string, { label: string; storage: string; specialNotes: string[] }> = {
  'prbc': { label: 'Packed Red Blood Cells', storage: '1-6°C (35 days for CPDA-1, 42 days for AS-1/AS-3)', specialNotes: ['Transfuse within 4 hours of spiking', 'Standard filter (170-260 μm) required', 'Typical infusion: 2-3 mL/kg/h'] },
  'ffp': { label: 'Fresh Frozen Plasma', storage: '-18°C or colder (12 months)', specialNotes: ['Must be ABO compatible', 'Thaw before use (30-37°C water bath)', 'Transfuse within 24 hours of thawing', 'Contains all coagulation factors'] },
  'platelets': { label: 'Platelet Concentrate', storage: '20-24°C with agitation (5-7 days)', specialNotes: ['ABO/Rh compatible preferred but not mandatory', 'Transfuse within 4 hours of pooling', 'Monitor for bacterial contamination', 'Single donor preferred if available (reduced alloimmunization)'] },
  'cryoprecipitate': { label: 'Cryoprecipitate', storage: '-18°C (12 months)', specialNotes: ['Contains Fibrinogen, FVIII, vWF, FXIII', 'Thaw at 37°C before use', 'Transfuse within 4 hours of thawing', 'Dose: 1 pool per 10kg for fibrinogen replacement'] },
  'whole-blood': { label: 'Whole Blood', storage: '1-6°C (21-35 days)', specialNotes: ['Rarely used in modern practice', 'Contains all components', 'Use only when component therapy unavailable'] },
  'fp24': { label: 'Plasma Frozen Within 24 Hours', storage: '-18°C', specialNotes: ['Reduced factor V and VIII vs FFP', 'Acceptable alternative to FFP for most indications', 'ABO compatible'] },
};

const VALID_INDICATIONS: Record<string, string[]> = {
  'prbc': ['anemia-symptomatic', 'acute-hemorrhage', 'surgical-blood-loss', 'hemoglobin-threshold', 'chronic-anemia', 'sepsis', 'acute-myocardial-infarction'],
  'ffp': ['massive-transfusion', 'warfarin-reversal', 'liver-disease-coagulopathy', 'dic', 'tdp', 'plasma-exchange', 'vitamin-k-deficiency'],
  'platelets': ['thrombocytopenia-bleeding', 'prophylactic-chemo', 'dic', 'massive-transfusion', 'surgical-bleeding', 'ttp-hus', 'cardiac-surgery'],
  'cryoprecipitate': ['hypofibrinogenemia', 'dic', 'massive-transfusion', 'factor-xiii-deficiency', 'von-willebrand-disease', 'uremic-bleeding'],
  'whole-blood': ['massive-hemorrhage', 'mtp-activation', 'military-casualty'],
};

const SPECIAL_REQUIREMENT_CHECKS: Record<string, string> = {
  'cmv-negative': 'CMV-negative product — required for immunocompromised, pregnant patients, and neonates. Verify CMV seronegative status.',
  'irradiated': 'Irradiated product — required for: directed donations, HLA-matched, intrauterine, neonatal, immunocompromised. Prevents TA-GVHD.',
  'leukoreduced': 'Leukoreduced product — standard for all transfusions in many institutions. Reduces febrile reactions, HLA alloimmunization, CMV transmission.',
  'washed': 'Washed product — for IgA deficiency with anti-IgA antibodies, severe allergic reactions. Reduces plasma proteins.',
  'hla-matched': 'HLA-matched platelets — for refractory thrombocytopenia. Requires HLA typing and compatible donor identification.',
  'pediatric-unit': 'Pediatric unit — reduced volume, typically 10-15 mL/kg. Verify appropriate dosing for pediatric patient.',
};

const CHECKLIST_ITEMS = [
  'patient-identification-verified',
  'blood-type-crossmatch-confirmed',
  'informed-consent-obtained',
  'vital-signs-documented',
  'iv-access-assessed',
  'transfusion-ordered-by-licensed-prescriber',
  'allergy-history-reviewed',
  'pregnancy-status-checked',
];

function verifyBloodProduct(input: BloodProductInput) {
  const { productType, units, indication, urgency, specialRequirements, patientBloodType, preTransfusionChecklist } = input;
  const verification: { compatible: boolean; messages: string[]; warnings: string[] } = { compatible: true, messages: [], warnings: [] };
  let mtpCalculation: { pRBC: number; ffp: number; platelets: number; totalUnits: number } | null = null;
  const specialRequirementAlerts: string[] = [];
  let gateDecision: GateDecision = 'ALLOW';
  let riskLabel = 'LOW';

  const pt = (patientBloodType || '').toUpperCase().replace(/\s+/g, '');
  const prodKey = productType?.toLowerCase() || '';

  // 1. Blood type compatibility check
  const productInfo = PRODUCT_TYPES[prodKey];

  if (prodKey === 'prbc' || prodKey === 'whole-blood') {
    // For RBC products, check if patient type is valid
    if (!BLOOD_COMPATIBILITY[pt]) {
      verification.compatible = false;
      verification.messages.push(`Unknown patient blood type: ${patientBloodType}`);
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    } else {
      verification.messages.push(`Patient blood type: ${pt}. Compatible donor types: ${BLOOD_COMPATIBILITY[pt].join(', ')}`);
      verification.messages.push('Ensure crossmatched unit matches patient type');
    }
  } else if (prodKey === 'ffp' || prodKey === 'fp24') {
    // FFP: ABO compatibility needed (reciprocal of RBC)
    const ffpCompatibility: Record<string, string> = {
      'O-': 'O', 'O+': 'O', 'A-': 'A', 'A+': 'A', 'B-': 'B', 'B+': 'B', 'AB-': 'AB', 'AB+': 'AB',
    };
    const requiredFFPType = ffpCompatibility[pt];
    if (requiredFFPType) {
      verification.messages.push(`FFP should be type ${requiredFFPType} or AB (universal donor plasma) for patient ${pt}`);
    }
  } else if (prodKey === 'platelets') {
    verification.messages.push(`Platelets: ABO/Rh compatible preferred but not mandatory for patient ${pt}`);
    if (pt.includes('-') && pt.startsWith('O')) {
      verification.warnings.push('Rh-negative patient — use Rh-negative platelets in females of childbearing age');
    }
  }

  // 2. Product type info
  if (productInfo) {
    verification.messages.push(`${productInfo.label} — Storage: ${productInfo.storage}`);
    productInfo.specialNotes.forEach(n => verification.messages.push(n));
  } else if (prodKey) {
    verification.warnings.push(`Unknown product type: ${productType} — using standard protocols`);
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // 3. Indication appropriateness
  const validInds = VALID_INDICATIONS[prodKey];
  if (validInds) {
    const indMatch = validInds.some(v => indication?.toLowerCase().includes(v.replace(/-/g, ' ')));
    if (!indMatch) {
      verification.warnings.push(`Indication "${indication}" not in standard list for ${productInfo?.label || prodKey}. Verify clinical appropriateness.`);
      if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    } else {
      verification.messages.push(`Indication "${indication}" is appropriate for ${productInfo?.label || prodKey}`);
    }
  }

  // 4. Unit count validation
  if (units !== undefined) {
    if (units <= 0) {
      verification.compatible = false;
      verification.messages.push('Invalid unit count — must be positive');
      gateDecision = 'BLOCK';
    } else if (units > 10 && prodKey !== 'prbc') {
      verification.warnings.push(`Large volume (${units} units) — verify clinical justification and monitor for TACO/TRALI`);
      if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    }
    if (prodKey === 'prbc' && units >= 10) {
      verification.warnings.push(`≥10 units pRBC — consider Massive Transfusion Protocol (MTP) activation`);
      riskLabel = 'MODERATE';
    }
  }

  // 5. Urgency
  const urgLower = (urgency || '').toLowerCase();
  if (urgLower === 'stat' || urgLower === 'emergency' || urgLower === 'mtp') {
    verification.messages.push('STAT/Emergency order — type-specific or O-negative blood may be used before full crossmatch');
    riskLabel = 'MODERATE';
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // 6. MTP calculation (1:1:1 ratio)
  if (urgLower.includes('mtp') || indication?.toLowerCase().includes('massive') || units >= 10) {
    const pRBC = units;
    const ffp = pRBC; // 1:1
    const platelets = Math.ceil(pRBC / 6); // ~1 pheresis per 6 pRBC
    mtpCalculation = { pRBC, ffp, platelets, totalUnits: pRBC + ffp + platelets };
    verification.messages.push(
      `MTP CALCULATION (1:1:1 ratio): ${pRBC} pRBC, ${ffp} FFP, ${platelets} platelet (pheresis) units = ${mtpCalculation.totalUnits} total`,
      'Include 1 unit cryoprecipitate per 10 units pRBC if fibrinogen <150 mg/dL',
    );
    riskLabel = 'HIGH';
    if (gateDecision !== 'BLOCK') gateDecision = 'BLOCK';
  }

  // 7. Special requirements
  if (specialRequirements && specialRequirements.length > 0) {
    for (const req of specialRequirements) {
      const reqKey = req.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const alert = SPECIAL_REQUIREMENT_CHECKS[req] ||
        Object.entries(SPECIAL_REQUIREMENT_CHECKS).find(([k]) => reqKey.includes(k))?.[1];

      if (alert) {
        specialRequirementAlerts.push(alert);
      } else {
        specialRequirementAlerts.push(`Special requirement: ${req} — verify product availability`);
      }
    }
  }

  // 8. Pre-transfusion checklist
  let checklistCompliance = 'complete';
  if (preTransfusionChecklist) {
    const missing: string[] = [];
    for (const item of CHECKLIST_ITEMS) {
      if (!preTransfusionChecklist[item]) {
        missing.push(item.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      }
    }

    if (missing.length === 0) {
      verification.messages.push('Pre-transfusion checklist: ALL ITEMS COMPLETE');
    } else if (missing.length <= 2) {
      checklistCompliance = 'partial';
      verification.warnings.push(`Pre-transfusion checklist incomplete: ${missing.join(', ')}`);
      if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    } else {
      checklistCompliance = 'incomplete';
      verification.warnings.push(`Pre-transfusion checklist significantly incomplete: ${missing.join(', ')}`);
      gateDecision = 'BLOCK';
      riskLabel = 'HIGH';
    }
  } else {
    checklistCompliance = 'not-submitted';
    verification.warnings.push('No pre-transfusion checklist submitted — all items should be verified before transfusion');
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
  }

  // 9. BLOCK if type mismatch
  if (!verification.compatible) {
    gateDecision = 'BLOCK';
    riskLabel = 'HIGH';
  }

  return { verification, mtpCalculation, specialRequirementAlerts, checklistCompliance, gateDecision, riskLabel };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as BloodProductInput;
    const { productType, units, patientBloodType } = body;

    if (!productType) {
      return NextResponse.json({ error: 'productType is required' }, { status: 400 });
    }
    if (units === undefined || units <= 0) {
      return NextResponse.json({ error: 'units must be a positive number' }, { status: 400 });
    }
    if (!patientBloodType) {
      return NextResponse.json({ error: 'patientBloodType is required' }, { status: 400 });
    }

    const result = verifyBloodProduct(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    const riskScoreMap: Record<string, number> = { LOW: 0, MODERATE: 1, HIGH: 2 };
    const rawScore = riskScoreMap[result.riskLabel] ?? 0;

    await db.clinicalScore.create({
      data: {
        scoreType: 'blood-product-verification',
        rawScore,
        totalPossible: 2,
        riskLevel: result.riskLabel,
        components: JSON.stringify(body),
        recommendation: [...result.verification.messages, ...result.verification.warnings].join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      verification: result.verification,
      mtpCalculation: result.mtpCalculation,
      specialRequirementAlerts: result.specialRequirementAlerts,
      checklistCompliance: result.checklistCompliance,
      gateDecision: result.gateDecision,
      riskLabel: result.riskLabel,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Blood product verification failed', details: String(error) }, { status: 500 });
  }
}