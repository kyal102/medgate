'use client';

import { useState, useMemo } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Skull, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const DRUGS = [
  'Acetaminophen', 'Ibuprofen', 'Amoxicillin', 'Ceftriaxone',
  'Gentamicin', 'Vancomycin', 'Digoxin', 'Methotrexate',
  'Metformin', 'Warfarin',
];

const UNITS = ['mg', 'mg/kg', 'g', 'mcg', 'mcg/kg', 'IU', 'mL'];

const FREQUENCIES = [
  { value: '1', label: 'QD (once daily)', multiplier: 1 },
  { value: '2', label: 'BID (twice daily)', multiplier: 2 },
  { value: '3', label: 'TID (3x daily)', multiplier: 3 },
  { value: '4', label: 'QID (4x daily)', multiplier: 4 },
  { value: '4-q6h', label: 'Q6H (every 6h)', multiplier: 4 },
  { value: '3-q8h', label: 'Q8H (every 8h)', multiplier: 3 },
  { value: '2-q12h', label: 'Q12H (every 12h)', multiplier: 2 },
];

// Drug-specific maximum daily doses (FDA/clinical guidelines)
// All values in mg unless noted
const DRUG_MAX_DAILY: Record<string, {
  max: number;
  unit: string;
  narrowTI: boolean;           // Narrow therapeutic index — lower lethality threshold
  lethalPct: number;            // Percentage of maxDaily considered lethal
  renalAdj?: { threshold: number; action: string; factor?: number };
  geriatricAdj?: { threshold: number; factor: number };
  notes: string;
}> = {
  'Acetaminophen': {
    max: 4000,
    unit: 'mg',
    narrowTI: false,
    lethalPct: 200,
    notes: 'FDA max 4000mg/day. Reduce to 2000-3000mg in hepatic impairment, chronic alcohol use, or malnutrition. Pediatric max: 75 mg/kg/day.',
  },
  'Ibuprofen': {
    max: 1200,
    unit: 'mg',
    narrowTI: false,
    lethalPct: 300,
    notes: 'OTC max: 1200mg/day. Rx max: 2400mg/day (3200mg absolute max). Avoid in renal impairment, pregnancy (3rd trimester), and NSAID allergy.',
  },
  'Amoxicillin': {
    max: 3000,
    unit: 'mg',
    narrowTI: false,
    lethalPct: 400,
    notes: 'Adult typical: 500mg-1g TID (1500-3000mg/day). Pediatric: 25-45 mg/kg/day in divided doses. No significant renal adjustment needed unless severe.',
  },
  'Ceftriaxone': {
    max: 4000,
    unit: 'mg',
    narrowTI: false,
    lethalPct: 300,
    notes: 'Adult: 1-2g once daily (max 4g/day for severe). Pediatric: 50-75 mg/kg/day. Do NOT use in neonates with hyperbilirubinemia (displaces bilirubin).',
  },
  'Gentamicin': {
    max: 500,
    unit: 'mg',
    narrowTI: true,
    lethalPct: 120,
    renalAdj: { threshold: 60, action: 'Extended-interval dosing required; monitor trough levels. Reduce dose and/or extend interval based on eGFR-based nomogram.' },
    notes: 'Narrow TI — ototoxicity and nephrotoxicity. Target trough <1 mcg/mL (traditional) or <0.5 mcg/mL (extended-interval). TDM mandatory.',
  },
  'Vancomycin': {
    max: 2000,
    unit: 'mg',
    narrowTI: true,
    lethalPct: 130,
    renalAdj: { threshold: 50, action: 'Reduce dose and extend interval. Target AUC/MIC 400-600. Monitor trough levels (target 15-20 mcg/mL for serious MRSA).' },
    notes: 'Narrow TI — nephrotoxicity (especially with other nephrotoxins). Red Man Syndrome with rapid infusion. TDM mandatory. Infuse over ≥1h.',
  },
  'Digoxin': {
    max: 0.25,
    unit: 'mg',
    narrowTI: true,
    lethalPct: 115,
    renalAdj: { threshold: 50, action: 'Reduce initial dose. Target lower serum level (0.5-0.9 ng/mL for HF; 0.8-2.0 ng/mL for AF). Monitor levels closely.' },
    geriatricAdj: { threshold: 75, factor: 0.5 },
    notes: 'Narrow TI — cardiac arrhythmias, nausea, visual changes (yellow halos). Toxicity risk increases with hypokalemia. Target level 0.8-2.0 ng/mL.',
  },
  'Methotrexate': {
    max: 25,
    unit: 'mg',
    narrowTI: true,
    lethalPct: 120,
    notes: '25mg/week for RA (NOT daily). High-dose MTX (oncology): 1-12 g/m² with leucovorin rescue. FATAL if daily dosing used for RA. Monitor CBC, LFTs, creatinine.',
  },
  'Metformin': {
    max: 2550,
    unit: 'mg',
    narrowTI: false,
    lethalPct: 200,
    notes: 'eGFR <30: CONTRAINDICATED (lactic acidosis risk). eGFR 30-45: reduce to max 1000mg/day. Hold before iodinated contrast; recheck eGFR 48h post-procedure.',
  },
  'Warfarin': {
    max: 10,
    unit: 'mg',
    narrowTI: true,
    lethalPct: 115,
    notes: 'Narrow TI — bleeding risk. Target INR 2.0-3.0 (most indications), 2.5-3.5 (mechanical valve). Many drug-drug and drug-food interactions (vitamin K). Genetic variability (CYP2C9, VKORC1).',
  },
};

interface DoseResult {
  status: 'therapeutic' | 'boundary' | 'excessive' | 'lethal' | 'contraindicated';
  calculatedDose: number;
  dailyDose: number;
  unit: string;
  maxDaily: number;
  recommendation: string;
  percentage: number;
  bsa?: number;
  bsaDose?: number;
  renalNote?: string;
  geriatricNote?: string;
  drugNotes: string;
}

const STATUS_CONFIG = {
  therapeutic: { label: 'Therapeutic', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', bar: 'bg-emerald-500', icon: CheckCircle },
  boundary: { label: 'Boundary', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', bar: 'bg-amber-500', icon: AlertTriangle },
  excessive: { label: 'Excessive', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', bar: 'bg-rose-500', icon: XCircle },
  lethal: { label: 'LETHAL', color: 'bg-red-500/20 text-red-400 border-red-500/40', bar: 'bg-red-600', icon: Skull },
  contraindicated: { label: 'CONTRAINDICATED', color: 'bg-red-600/20 text-red-300 border-red-500/60', bar: 'bg-red-700', icon: XCircle },
};

export function DoseCalculator() {
  const [drug, setDrug] = useState('');
  const [dose, setDose] = useState('');
  const [unit, setUnit] = useState('mg');
  const [frequency, setFrequency] = useState('1');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [egfr, setEgfr] = useState('');
  const [result, setResult] = useState<DoseResult | null>(null);
  const [loading, setLoading] = useState(false);

  const bsa = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      return Math.sqrt((h * w) / 3600);
    }
    return null;
  }, [weight, height]);

  const freqMultiplier = FREQUENCIES.find(f => f.value === frequency)?.multiplier || 1;

  const verify = async () => {
    if (!drug || !dose || !weight) return;
    setLoading(true);
    try {
      const singleDose = parseFloat(dose);
      const dailyDose = singleDose * freqMultiplier;
      const res = await fetch('/api/medgate/dose-calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drug, dose: dailyDose, unit,
          weight_kg: parseFloat(weight),
          height_cm: height ? parseFloat(height) : undefined,
          age: age ? parseInt(age) : undefined,
          eGFR: egfr ? parseFloat(egfr) : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        setResult(mockCalc(
          drug, singleDose, dailyDose, unit,
          parseFloat(weight), height ? parseFloat(height) : 0,
          age ? parseInt(age) : 0,
          egfr ? parseFloat(egfr) : 120,
          bsa,
        ));
      }
    } catch {
      setResult(mockCalc(
        drug, parseFloat(dose), parseFloat(dose) * freqMultiplier, unit,
        parseFloat(weight), height ? parseFloat(height) : 0,
        age ? parseInt(age) : 0,
        egfr ? parseFloat(egfr) : 120,
        bsa,
      ));
    }
    setLoading(false);
  };

  return (
    <section className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Drug</label>
              <Select value={drug} onValueChange={setDrug}>
                <SelectTrigger className="w-full glass-input">
                  <SelectValue placeholder="Select drug" />
                </SelectTrigger>
                <SelectContent>
                  {DRUGS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Single Dose</label>
              <Input type="number" placeholder="e.g. 500" value={dose} onChange={(e) => setDose(e.target.value)} className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Unit</label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="w-full glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Frequency</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="w-full glass-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Weight (kg)</label>
              <Input type="number" placeholder="e.g. 70" value={weight} onChange={(e) => setWeight(e.target.value)} className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Height (cm) — for BSA</label>
              <Input type="number" placeholder="e.g. 175" value={height} onChange={(e) => setHeight(e.target.value)} className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Age (years)</label>
              <Input type="number" placeholder="e.g. 45" value={age} onChange={(e) => setAge(e.target.value)} className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">eGFR (mL/min/1.73m²)</label>
              <Input type="number" placeholder="e.g. 90" value={egfr} onChange={(e) => setEgfr(e.target.value)} className="glass-input" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <Button onClick={verify} disabled={loading || !drug || !dose || !weight} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Calculator className="mr-2 h-4 w-4" />
              {loading ? 'Verifying...' : 'Verify Dose'}
            </Button>
            {bsa && (
              <span className="text-sm text-muted-foreground">
                BSA (Mosteller): <span className="font-semibold text-foreground">{bsa.toFixed(2)} m²</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground">Dose Verification Result</CardTitle>
              <Badge variant="outline" className={STATUS_CONFIG[result.status].color}>
                {result.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Dose Level</span>
                <span className={cn('font-semibold', result.status === 'lethal' || result.status === 'contraindicated' ? 'text-red-400' : result.status === 'excessive' ? 'text-rose-400' : result.status === 'boundary' ? 'text-amber-400' : 'text-emerald-400')}>
                  {Math.min(result.percentage, 999).toFixed(1)}% of max
                </span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', STATUS_CONFIG[result.status].bar)}
                  style={{ width: `${Math.min(result.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground/60 mt-1">
                <span>0%</span>
                <span className="text-emerald-500">Therapeutic</span>
                <span className="text-amber-500">Boundary</span>
                <span className="text-rose-500">Excessive</span>
                <span className="text-red-500">Lethal</span>
                <span>100%+</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Single Dose</p>
                <p className="text-lg font-semibold text-foreground">{result.calculatedDose} {result.unit}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Daily Dose (×{freqMultiplier})</p>
                <p className="text-lg font-semibold text-foreground">{result.dailyDose} {result.unit}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Max Daily</p>
                <p className="text-lg font-semibold text-foreground">{result.maxDaily} {result.unit}</p>
              </div>
            </div>
            {result.bsa && result.bsaDose !== undefined && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">
                  BSA-Based Reference (Mosteller: √(H×W/3600))
                </p>
                <p className="text-sm text-foreground">
                  BSA = <span className="font-semibold">{result.bsa.toFixed(2)} m²</span>
                  {result.bsaDose > 0 && (
                    <> — Max BSA-adjusted: <span className="font-semibold">{result.bsaDose.toFixed(1)} mg/m²</span></>
                  )}
                </p>
              </div>
            )}
            {result.renalNote && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-400 mb-1">⚠ Renal Adjustment Required</p>
                <p className="text-sm text-foreground">{result.renalNote}</p>
              </div>
            )}
            {result.geriatricNote && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-xs font-medium text-amber-400 mb-1">⚠ Geriatric Consideration</p>
                <p className="text-sm text-foreground">{result.geriatricNote}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Clinical Recommendation</p>
              <p className="text-sm text-foreground">{result.recommendation}</p>
            </div>
            <div className="text-xs text-muted-foreground/60 italic">
              <p className="font-medium mb-1">Drug Notes:</p>
              <p>{result.drugNotes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function mockCalc(
  drug: string, singleDose: number, dailyDose: number, unit: string,
  weight: number, height: number, age: number, eGFR: number,
  bsa: number | null,
): DoseResult {
  const drugInfo = DRUG_MAX_DAILY[drug];
  if (!drugInfo) {
    return {
      status: 'therapeutic', calculatedDose: singleDose, dailyDose, unit: 'mg',
      maxDaily: 4000, percentage: (dailyDose / 4000) * 100,
      recommendation: 'Drug not in database. Using default 4000mg max. Verify with clinical references.',
      drugNotes: 'No specific data available for this drug.',
    };
  }

  // Convert mg/kg to absolute dose
  const wDaily = unit === 'mg/kg' ? dailyDose * weight : dailyDose;
  const wSingle = unit === 'mg/kg' ? singleDose * weight : singleDose;
  let maxDaily = drugInfo.max;
  let renalNote: string | undefined;
  let geriatricNote: string | undefined;

  // Metformin: contraindicated at eGFR <30
  if (drug === 'Metformin' && eGFR < 30) {
    return {
      status: 'contraindicated',
      calculatedDose: wSingle,
      dailyDose: wDaily,
      unit: drugInfo.unit,
      maxDaily: 0,
      percentage: 999,
      recommendation: 'CONTRAINDICATED — DO NOT ADMINISTER. Metformin is contraindicated when eGFR <30 mL/min/1.73m² due to increased risk of lactic acidosis (FDA label). Consider alternative antidiabetic agent.',
      renalNote: 'eGFR <30: Absolute contraindication. Lactic acidosis risk is unacceptably high.',
      drugNotes: drugInfo.notes,
      bsa: bsa ?? undefined,
      bsaDose: bsa ? (drugInfo.max / 1.73) * bsa : undefined,
    };
  }

  // Metformin: 50% dose reduction at eGFR 30-45
  if (drug === 'Metformin' && eGFR >= 30 && eGFR < 45) {
    maxDaily = 1000;
    renalNote = 'eGFR 30-45: Reduce max daily dose to 1000mg. Monitor renal function every 3-6 months. Reassess if eGFR drops below 30.';
  }

  // Drug-specific renal adjustments (non-Metformin)
  if (drugInfo.renalAdj && drug !== 'Metformin') {
    if (eGFR < drugInfo.renalAdj.threshold) {
      renalNote = drugInfo.renalAdj.action;
    }
  }

  // Drug-specific geriatric adjustments
  if (drugInfo.geriatricAdj && age >= drugInfo.geriatricAdj.threshold) {
    maxDaily *= drugInfo.geriatricAdj.factor;
    geriatricNote = `Age ${age} ≥ ${drugInfo.geriatricAdj.threshold}: Dose reduced to ${Math.round(drugInfo.geriatricAdj.factor * 100)}% of standard maximum due to age-related pharmacokinetic changes.`;
  }

  const pct = (wDaily / maxDaily) * 100;
  let status: DoseResult['status'] = 'therapeutic';

  if (drugInfo.narrowTI) {
    // Narrow therapeutic index drugs have tighter thresholds
    if (pct >= drugInfo.lethalPct) status = 'lethal';
    else if (pct > 110) status = 'excessive';
    else if (pct > 85) status = 'boundary';
  } else {
    if (pct >= drugInfo.lethalPct) status = 'lethal';
    else if (pct > 110) status = 'excessive';
    else if (pct > 80) status = 'boundary';
  }

  const recommendation = status === 'lethal'
    ? `DO NOT ADMINISTER — ${drug} has a narrow therapeutic index. This dose (${wDaily.toFixed(1)}mg) significantly exceeds the safe maximum (${maxDaily}mg). Risk of serious toxicity. Immediate clinical review required.`
    : status === 'excessive'
    ? `Dose exceeds recommended maximum. ${drug}: ${wDaily.toFixed(1)}mg/day vs. max ${maxDaily}mg/day. Consider dose reduction and therapeutic drug monitoring.`
    : status === 'boundary'
    ? `Dose is at the upper therapeutic boundary for ${drug}. Monitor closely for adverse effects. Consider TDM if available.`
    : `Dose is within the therapeutic range for ${drug}. Continue monitoring as appropriate.${drugInfo.narrowTI ? ' Note: Narrow therapeutic index — monitor levels.' : ''}`;

  return {
    status,
    calculatedDose: wSingle,
    dailyDose: wDaily,
    unit: drugInfo.unit,
    maxDaily,
    percentage: pct,
    recommendation,
    renalNote,
    geriatricNote,
    drugNotes: drugInfo.notes,
    bsa: bsa ?? undefined,
    bsaDose: bsa ? (drugInfo.max / 1.73) * bsa : undefined,
  };
}