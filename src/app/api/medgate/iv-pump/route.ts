import { NextRequest, NextResponse } from 'next/server';

type RateUnit = 'ml/hr' | 'units/hr' | 'mcg/kg/min' | 'mg/hr';

interface DrugSafetyLimit {
  name: string;
  aliases: string[];
  rateUnit: RateUnit;
  typicalMin: number;
  typicalMax: number;
  hardLimit: number;
  weightBased: boolean;
  notes: string;
  specialRules?: {
    route?: string;
    condition?: string;
    limitOverride?: number;
    label: string;
  }[];
  // Renal adjustment multipliers (fraction of normal limit)
  renalAdjustments: {
    mild: number;      // eGFR 30-60
    moderate: number;  // eGFR 15-30
    severe: number;    // eGFR < 15
  };
}

const DRUG_SAFETY_LIMITS: DrugSafetyLimit[] = [
  {
    name: 'insulin',
    aliases: ['insulin', 'regular insulin', 'humulin r', 'novolin r'],
    rateUnit: 'units/hr',
    typicalMin: 0.5,
    typicalMax: 2,
    hardLimit: 10,
    weightBased: false,
    notes: 'High-alert medication. Require independent double-check.',
    renalAdjustments: { mild: 0.8, moderate: 0.6, severe: 0.5 },
  },
  {
    name: 'heparin',
    aliases: ['heparin', 'unfractionated heparin', 'ufh'],
    rateUnit: 'units/hr',
    typicalMin: 500,
    typicalMax: 2000,
    hardLimit: 3000,
    weightBased: false,
    notes: 'Check per institutional protocol. Monitor aPTT q6h.',
    renalAdjustments: { mild: 1.0, moderate: 0.9, severe: 0.8 },
  },
  {
    name: 'dopamine',
    aliases: ['dopamine', 'intropin'],
    rateUnit: 'mcg/kg/min',
    typicalMin: 2,
    typicalMax: 20,
    hardLimit: 50,
    weightBased: true,
    notes: 'Dose-dependent receptor effects. Titrate to MAP.',
    renalAdjustments: { mild: 0.9, moderate: 0.8, severe: 0.7 },
  },
  {
    name: 'norepinephrine',
    aliases: ['norepinephrine', 'noradrenaline', 'levophed'],
    rateUnit: 'mcg/kg/min',
    typicalMin: 0.01,
    typicalMax: 3,
    hardLimit: 5,
    weightBased: true,
    notes: 'First-line vasopressor for septic shock. Central line preferred.',
    renalAdjustments: { mild: 1.0, moderate: 0.9, severe: 0.85 },
  },
  {
    name: 'epinephrine',
    aliases: ['epinephrine', 'adrenaline', 'epipen'],
    rateUnit: 'mcg/kg/min',
    typicalMin: 0.01,
    typicalMax: 0.5,
    hardLimit: 1.0,
    weightBased: true,
    notes: 'High-alert. Concentration confusion risk. Verify dilution.',
    renalAdjustments: { mild: 1.0, moderate: 0.9, severe: 0.85 },
  },
  {
    name: 'potassium chloride',
    aliases: ['kcl', 'potassium chloride', 'kcl infusion'],
    rateUnit: 'ml/hr',
    typicalMin: 10,
    typicalMax: 20,
    hardLimit: 40,
    weightBased: false,
    notes: 'High-alert medication. Never give IV push. Check K+ level first.',
    renalAdjustments: { mild: 0.8, moderate: 0.6, severe: 0.4 },
    specialRules: [
      { condition: 'peripheral', limitOverride: 20, label: 'Peripheral line: max 20 mEq/hr — risk of phlebitis and extravasation' },
      { condition: 'central', limitOverride: 40, label: 'Central line: max 40 mEq/hr with cardiac monitoring' },
    ],
  },
  {
    name: 'magnesium sulfate',
    aliases: ['magnesium sulfate', 'mgso4', 'magnesium'],
    rateUnit: 'mg/hr',
    typicalMin: 1000,
    typicalMax: 2000,
    hardLimit: 4000,
    weightBased: false,
    notes: 'Monitor deep tendon reflexes, respiratory rate, urine output.',
    renalAdjustments: { mild: 0.7, moderate: 0.5, severe: 0.3 },
  },
  {
    name: 'amiodarone',
    aliases: ['amiodarone', 'cordarone'],
    rateUnit: 'mg/hr',
    typicalMin: 0.5,
    typicalMax: 30,
    hardLimit: 50,
    weightBased: false,
    notes: 'Loading: 150mg over 10 min, then 1mg/min x 6h, then 0.5mg/min. Monitor QTc.',
    renalAdjustments: { mild: 1.0, moderate: 1.0, severe: 0.9 },
  },
  {
    name: 'nitroglycerin',
    aliases: ['nitroglycerin', 'gtn', 'glyceryl trinitrate', 'tridil'],
    rateUnit: 'mg/hr',
    typicalMin: 0.3,
    typicalMax: 12,
    hardLimit: 20,
    weightBased: false,
    notes: 'Contraindicated with PDE-5 inhibitors (sildenafil). Use non-PVC tubing.',
    renalAdjustments: { mild: 1.0, moderate: 1.0, severe: 1.0 },
  },
  {
    name: 'nitroprusside',
    aliases: ['nitroprusside', 'sodium nitroprusside', 'nipride'],
    rateUnit: 'mcg/kg/min',
    typicalMin: 0.25,
    typicalMax: 10,
    hardLimit: 10,
    weightBased: true,
    notes: 'CYANIDE RISK at doses >10 mcg/kg/min or >48h duration. Monitor thiocyanate levels.',
    renalAdjustments: { mild: 0.8, moderate: 0.6, severe: 0.5 },
  },
  {
    name: 'morphine',
    aliases: ['morphine', 'morphine sulfate', 'ms contin'],
    rateUnit: 'mg/hr',
    typicalMin: 2,
    typicalMax: 15,
    hardLimit: 30,
    weightBased: false,
    notes: 'Opioid — risk of respiratory depression. Have naloxone available.',
    renalAdjustments: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    name: 'midazolam',
    aliases: ['midazolam', 'versed'],
    rateUnit: 'mg/hr',
    typicalMin: 1,
    typicalMax: 7,
    hardLimit: 15,
    weightBased: false,
    notes: 'Sedative — titrate to Ramsay/SAS score. Accumulates in renal impairment.',
    renalAdjustments: { mild: 0.6, moderate: 0.4, severe: 0.2 },
  },
  {
    name: 'propofol',
    aliases: ['propofol', 'diprivan'],
    rateUnit: 'mg/hr',
    typicalMin: 30,
    typicalMax: 480,
    hardLimit: 600,
    weightBased: false,
    notes: 'Propofol infusion syndrome risk >80 mcg/kg/min or >48h. Monitor triglycerides and CK.',
    renalAdjustments: { mild: 1.0, moderate: 1.0, severe: 1.0 },
  },
  {
    name: 'lidocaine',
    aliases: ['lidocaine', 'lignocaine', 'xylocaine'],
    rateUnit: 'mg/hr',
    typicalMin: 60,
    typicalMax: 240,
    hardLimit: 300,
    weightBased: false,
    notes: 'Monitor ECG for QRS widening and arrhythmias. Check lidocaine levels.',
    renalAdjustments: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    name: 'phenylephrine',
    aliases: ['phenylephrine', 'neosynephrine'],
    rateUnit: 'mcg/kg/min',
    typicalMin: 0.1,
    typicalMax: 5,
    hardLimit: 10,
    weightBased: true,
    notes: 'Pure alpha-agonist. May decrease cardiac output. Monitor for reflex bradycardia.',
    renalAdjustments: { mild: 1.0, moderate: 1.0, severe: 0.9 },
  },
];

function findDrug(drugName: string): DrugSafetyLimit | undefined {
  const nameLower = drugName.toLowerCase().trim();
  return DRUG_SAFETY_LIMITS.find(
    d => d.name.toLowerCase() === nameLower || d.aliases.some(a => a.toLowerCase() === nameLower || nameLower.includes(a.toLowerCase()))
  );
}

function applyRenalAdjustment(baseLimit: number, renalFunction: string | undefined, drug: DrugSafetyLimit): number {
  if (!renalFunction || renalFunction === 'normal') return baseLimit;
  const mult = drug.renalAdjustments[renalFunction as keyof typeof drug.renalAdjustments];
  return mult ? baseLimit * mult : baseLimit;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      drugName, concentration, rate, rateUnit,
      patientWeight_kg, patientAge, renalFunction,
    } = body;

    if (!drugName || rate === undefined || !rateUnit) {
      return NextResponse.json({ error: 'Missing required fields: drugName, rate, rateUnit' }, { status: 400 });
    }

    const validUnits: RateUnit[] = ['ml/hr', 'units/hr', 'mcg/kg/min', 'mg/hr'];
    if (!validUnits.includes(rateUnit)) {
      return NextResponse.json({ error: `Invalid rateUnit. Must be one of: ${validUnits.join(', ')}` }, { status: 400 });
    }

    const start = performance.now();
    const drug = findDrug(drugName);
    const alerts: string[] = [];
    let doseAdjustment: Record<string, unknown> | undefined;

    if (!drug) {
      return NextResponse.json({
        drugName,
        currentRate: rate,
        rateUnit,
        status: 'UNKNOWN_DRUG',
        gateDecision: 'NEEDS_REVIEW',
        riskLabel: 'DRUG_NOT_IN_DATABASE',
        alerts: [`Drug "${drugName}" not found in high-alert medication database. Manual verification required.`],
        latency_ms: Math.round((performance.now() - start) * 100) / 100,
        timestamp: new Date().toISOString(),
      });
    }

    // Determine effective hard limit and typical max with renal adjustment
    let effectiveHardLimit = drug.hardLimit;
    let effectiveTypicalMax = drug.typicalMax;

    // Apply renal adjustments
    if (renalFunction && renalFunction !== 'normal') {
      const originalHard = effectiveHardLimit;
      const originalTypical = effectiveTypicalMax;
      effectiveHardLimit = applyRenalAdjustment(effectiveHardLimit, renalFunction, drug);
      effectiveTypicalMax = applyRenalAdjustment(effectiveTypicalMax, renalFunction, drug);

      doseAdjustment = {
        renalFunction,
        originalHardLimit: originalHard,
        adjustedHardLimit: Math.round(effectiveHardLimit * 1000) / 1000,
        originalTypicalMax: originalTypical,
        adjustedTypicalMax: Math.round(effectiveTypicalMax * 1000) / 1000,
        recommendation: `Renal ${renalFunction} impairment detected. Limits reduced. Monitor drug levels and clinical response closely.`,
      };
    }

    // Special rules (e.g., KCl route-based limits)
    if (drug.specialRules) {
      for (const rule of drug.specialRules) {
        alerts.push(rule.label);
        if (rule.limitOverride && rule.limitOverride < effectiveHardLimit) {
          effectiveHardLimit = rule.limitOverride;
        }
      }
    }

    // Weight-based drugs: if weight not provided, use 70kg default and warn
    let effectiveRate = rate;
    if (drug.weightBased) {
      if (!patientWeight_kg) {
        alerts.push(`WARNING: ${drug.name} is weight-based (${drug.rateUnit}) but no patient weight provided. Using 70 kg default for assessment.`);
        effectiveRate = rate; // already in mcg/kg/min
      }
      // No conversion needed if rate is already in weight-based units
    }

    // Gate decision logic
    let gateDecision: 'BLOCK' | 'NEEDS_REVIEW' | 'ALLOW' = 'ALLOW';
    let status: string;
    let riskLabel: string;

    if (effectiveRate > effectiveHardLimit) {
      gateDecision = 'BLOCK';
      status = 'EXCEEDS_HARD_LIMIT';
      riskLabel = 'DOSE_EXCEEDS_MAXIMUM';
      alerts.push(`BLOCK: Rate ${effectiveRate} ${rateUnit} EXCEEDS hard limit of ${Math.round(effectiveHardLimit * 1000) / 1000} ${drug.rateUnit}. DO NOT ADMINISTER.`);
    } else if (effectiveRate > effectiveTypicalMax) {
      gateDecision = 'NEEDS_REVIEW';
      status = 'EXCEEDS_TYPICAL_RANGE';
      riskLabel = 'DOSE_BOUNDARY_NOTED';
      alerts.push(`REVIEW: Rate ${effectiveRate} ${rateUnit} exceeds typical maximum of ${Math.round(effectiveTypicalMax * 1000) / 1000} ${drug.rateUnit} but within hard limit. Clinical justification required.`);
    } else if (effectiveRate < drug.typicalMin) {
      gateDecision = 'NEEDS_REVIEW';
      status = 'BELOW_TYPICAL_RANGE';
      riskLabel = 'SUBTHERAPEUTIC_RISK';
      alerts.push(`REVIEW: Rate ${effectiveRate} ${rateUnit} is below typical minimum of ${drug.typicalMin} ${drug.rateUnit}. May be subtherapeutic.`);
    } else {
      status = 'WITHIN_THERAPEUTIC_RANGE';
      riskLabel = 'RATE_SAFE';
      alerts.push(`SAFE: Rate ${effectiveRate} ${rateUnit} within therapeutic range (${drug.typicalMin}–${Math.round(effectiveTypicalMax * 1000) / 1000} ${drug.rateUnit}).`);
    }

    // Additional safety notes
    if (drug.name === 'nitroprusside' && effectiveRate >= 10) {
      alerts.push('CRITICAL: Cyanide toxicity risk at ≥10 mcg/kg/min. Consider alternative vasodilator. Monitor thiocyanate levels.');
    }
    if (drug.name === 'propofol' && patientAge !== undefined && patientAge < 16) {
      alerts.push('WARNING: Propofol infusion syndrome risk higher in pediatric patients. Strictly limit dose and duration.');
    }
    if (renalFunction === 'severe' && ['morphine', 'midazolam', 'lidocaine'].includes(drug.name)) {
      alerts.push(`CRITICAL: Severe renal impairment with ${drug.name} — high risk of drug accumulation and toxicity. Strongly consider alternative.`);
    }
    if (drug.notes) {
      alerts.push(`NOTE: ${drug.notes}`);
    }

    const latency = Math.round((performance.now() - start) * 100) / 100;

    return NextResponse.json({
      drugName: drug.name,
      currentRate: rate,
      maxSafeRate: Math.round(effectiveTypicalMax * 1000) / 1000,
      hardLimit: Math.round(effectiveHardLimit * 1000) / 1000,
      status,
      gateDecision,
      riskLabel,
      alerts,
      doseAdjustment,
      latency_ms: latency,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'IV pump validation failed', details: String(error) }, { status: 500 });
  }
}