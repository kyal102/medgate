'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Syringe, Zap, AlertTriangle, XCircle, Info, CheckCircle2, ShieldAlert, Calculator,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DrugInfo {
  id: string;
  name: string;
  drugClass: string;
  concentrationRange: string;
  typicalDosing: string;
  unit: string;
  rateUnits: string[];
  minRate: { value: number; unit: string };
  maxRate: { value: number; unit: string };
  hardLimit: { value: number; unit: string };
  weightBased: boolean;
  monitoring: string[];
  presets: { label: string; rate: number; unit: string }[];
  renalAdj: Record<string, number>;
}

const DRUGS: DrugInfo[] = [
  {
    id: 'insulin', name: 'Insulin (Regular)', drugClass: 'Antidiabetic', concentrationRange: '100 units/mL',
    typicalDosing: '1-10 units/hr', unit: 'units/mL', rateUnits: ['units/hr', 'ml/hr'],
    minRate: { value: 0.5, unit: 'units/hr' }, maxRate: { value: 15, unit: 'units/hr' },
    hardLimit: { value: 20, unit: 'units/hr' }, weightBased: false,
    monitoring: ['Blood glucose q1h', 'Hypoglycemia protocol', 'Dextrose at bedside', 'Potassium monitoring'],
    presets: [
      { label: 'Typical', rate: 4, unit: 'units/hr' },
      { label: 'Max', rate: 15, unit: 'units/hr' },
      { label: 'High-Alert', rate: 18, unit: 'units/hr' },
    ],
    renalAdj: { mild: 1, moderate: 0.85, severe: 0.7 },
  },
  {
    id: 'heparin', name: 'Heparin', drugClass: 'Anticoagulant', concentrationRange: '1000-25000 units/mL',
    typicalDosing: 'Per protocol (aPTT-driven)', unit: 'units/mL', rateUnits: ['units/hr', 'units/kg/hr'],
    minRate: { value: 500, unit: 'units/hr' }, maxRate: { value: 30000, unit: 'units/hr' },
    hardLimit: { value: 40000, unit: 'units/hr' }, weightBased: true,
    monitoring: ['aPTT q6h', 'Platelet count q2-3d', 'HIT monitoring', 'CBC daily'],
    presets: [
      { label: 'Typical (70kg)', rate: 18, unit: 'units/kg/hr' },
      { label: 'Max', rate: 30, unit: 'units/kg/hr' },
      { label: 'High-Alert', rate: 35, unit: 'units/kg/hr' },
    ],
    renalAdj: { mild: 1, moderate: 0.9, severe: 0.8 },
  },
  {
    id: 'dopamine', name: 'Dopamine', drugClass: 'Inotrope / Vasopressor', concentrationRange: '400-800 mg/250mL (1600-3200 mcg/mL)',
    typicalDosing: '2-20 mcg/kg/min', unit: 'mcg/mL', rateUnits: ['mcg/kg/min', 'ml/hr'],
    minRate: { value: 1, unit: 'mcg/kg/min' }, maxRate: { value: 20, unit: 'mcg/kg/min' },
    hardLimit: { value: 50, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Continuous BP monitoring', 'HR monitoring', 'UOP hourly', 'CVP if available', 'Peripheral IV site q2h'],
    presets: [
      { label: 'Renal dose', rate: 3, unit: 'mcg/kg/min' },
      { label: 'Typical pressor', rate: 10, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 20, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 1, moderate: 0.75, severe: 0.5 },
  },
  {
    id: 'norepinephrine', name: 'Norepinephrine (Levophed)', drugClass: 'Vasopressor', concentrationRange: '4-8 mg/250mL (16-32 mcg/mL)',
    typicalDosing: '0.01-3 mcg/kg/min', unit: 'mcg/mL', rateUnits: ['mcg/kg/min', 'ml/hr'],
    minRate: { value: 0.01, unit: 'mcg/kg/min' }, maxRate: { value: 3, unit: 'mcg/kg/min' },
    hardLimit: { value: 5, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Arterial line preferred', 'Continuous BP', 'UOP hourly', 'Peripheral IV site q1h', 'Lactate'],
    presets: [
      { label: 'Low', rate: 0.05, unit: 'mcg/kg/min' },
      { label: 'Typical', rate: 0.3, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 3, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 1, moderate: 1, severe: 0.8 },
  },
  {
    id: 'epinephrine', name: 'Epinephrine (Adrenaline)', drugClass: 'Vasopressor / Inotrope', concentrationRange: '4 mg/250mL (16 mcg/mL)',
    typicalDosing: '0.01-0.5 mcg/kg/min', unit: 'mcg/mL', rateUnits: ['mcg/kg/min', 'mcg/min', 'ml/hr'],
    minRate: { value: 0.01, unit: 'mcg/kg/min' }, maxRate: { value: 0.5, unit: 'mcg/kg/min' },
    hardLimit: { value: 1, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Arterial line required', 'Continuous ECG', 'HR/BP continuous', 'Glucose monitoring', 'Serum potassium'],
    presets: [
      { label: 'Low', rate: 0.02, unit: 'mcg/kg/min' },
      { label: 'Typical', rate: 0.1, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 0.5, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 1, moderate: 1, severe: 0.75 },
  },
  {
    id: 'kcl', name: 'Potassium Chloride (KCl)', drugClass: 'Electrolyte', concentrationRange: '20-40 mEq/100mL',
    typicalDosing: '10-20 mEq/hr', unit: 'mEq/mL', rateUnits: ['mEq/hr', 'ml/hr'],
    minRate: { value: 5, unit: 'mEq/hr' }, maxRate: { value: 20, unit: 'mEq/hr' },
    hardLimit: { value: 40, unit: 'mEq/hr' }, weightBased: false,
    monitoring: ['Serum K+ q2-4h', 'Continuous ECG', 'UOP', 'IV site check q1h'],
    presets: [
      { label: 'Typical', rate: 10, unit: 'mEq/hr' },
      { label: 'Max', rate: 20, unit: 'mEq/hr' },
      { label: 'High-Alert', rate: 35, unit: 'mEq/hr' },
    ],
    renalAdj: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    id: 'mgso4', name: 'Magnesium Sulfate', drugClass: 'Electrolyte / Tocolytic', concentrationRange: '8-20 g/250mL',
    typicalDosing: '1-2 g/hr', unit: 'mg/mL', rateUnits: ['g/hr', 'ml/hr'],
    minRate: { value: 1, unit: 'g/hr' }, maxRate: { value: 2, unit: 'g/hr' },
    hardLimit: { value: 4, unit: 'g/hr' }, weightBased: false,
    monitoring: ['DTRs q4h', 'UOP hourly', 'Respiratory rate', 'Serum Mg2+ q4-6h', 'Fetal HR if obstetric'],
    presets: [
      { label: 'Typical', rate: 1, unit: 'g/hr' },
      { label: 'Max', rate: 2, unit: 'g/hr' },
      { label: 'High-Alert', rate: 3, unit: 'g/hr' },
    ],
    renalAdj: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    id: 'amiodarone', name: 'Amiodarone', drugClass: 'Antiarrhythmic (Class III)', concentrationRange: '360 mg/200mL (1.8 mg/mL)',
    typicalDosing: '1 mg/min x 6h, then 0.5 mg/min', unit: 'mg/mL', rateUnits: ['mg/min', 'mg/hr', 'ml/hr'],
    minRate: { value: 0.5, unit: 'mg/min' }, maxRate: { value: 1, unit: 'mg/min' },
    hardLimit: { value: 1.5, unit: 'mg/min' }, weightBased: false,
    monitoring: ['Continuous ECG (QTc)', 'BP q15min', 'HR', 'Liver function', 'Thyroid function'],
    presets: [
      { label: 'Maintenance', rate: 0.5, unit: 'mg/min' },
      { label: 'Loading', rate: 1, unit: 'mg/min' },
      { label: 'High-Alert', rate: 1.3, unit: 'mg/min' },
    ],
    renalAdj: { mild: 1, moderate: 0.9, severe: 0.75 },
  },
  {
    id: 'nitroglycerin', name: 'Nitroglycerin (Tridil)', drugClass: 'Vasodilator / Antianginal', concentrationRange: '5-50 mg/250mL (20-200 mcg/mL)',
    typicalDosing: '5-200 mcg/min', unit: 'mcg/mL', rateUnits: ['mcg/min', 'ml/hr'],
    minRate: { value: 5, unit: 'mcg/min' }, maxRate: { value: 200, unit: 'mcg/min' },
    hardLimit: { value: 400, unit: 'mcg/min' }, weightBased: false,
    monitoring: ['Continuous BP', 'HR', 'Headache assessment', 'Methemoglobin if high dose'],
    presets: [
      { label: 'Low', rate: 10, unit: 'mcg/min' },
      { label: 'Typical', rate: 50, unit: 'mcg/min' },
      { label: 'Max', rate: 200, unit: 'mcg/min' },
    ],
    renalAdj: { mild: 1, moderate: 1, severe: 1 },
  },
  {
    id: 'nitroprusside', name: 'Sodium Nitroprusside', drugClass: 'Vasodilator', concentrationRange: '50 mg/250mL (200 mcg/mL)',
    typicalDosing: '0.25-10 mcg/kg/min', unit: 'mcg/mL', rateUnits: ['mcg/kg/min', 'ml/hr'],
    minRate: { value: 0.25, unit: 'mcg/kg/min' }, maxRate: { value: 10, unit: 'mcg/kg/min' },
    hardLimit: { value: 10, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Arterial line required', 'Continuous BP (intra-arterial)', 'Thiocyanate levels after 48h', 'Lactic acid', 'Cyanide level if prolonged'],
    presets: [
      { label: 'Low', rate: 0.5, unit: 'mcg/kg/min' },
      { label: 'Typical', rate: 3, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 10, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    id: 'morphine', name: 'Morphine', drugClass: 'Opioid Analgesic', concentrationRange: '1-5 mg/mL',
    typicalDosing: '1-10 mg/hr', unit: 'mg/mL', rateUnits: ['mg/hr', 'ml/hr'],
    minRate: { value: 1, unit: 'mg/hr' }, maxRate: { value: 10, unit: 'mg/hr' },
    hardLimit: { value: 15, unit: 'mg/hr' }, weightBased: false,
    monitoring: ['Sedation scale q1h', 'Respiratory rate q1h', 'SpO2 continuous', 'Pain score q4h', 'Naloxone at bedside'],
    presets: [
      { label: 'Low', rate: 2, unit: 'mg/hr' },
      { label: 'Typical', rate: 5, unit: 'mg/hr' },
      { label: 'Max', rate: 10, unit: 'mg/hr' },
    ],
    renalAdj: { mild: 0.75, moderate: 0.5, severe: 0.25 },
  },
  {
    id: 'midazolam', name: 'Midazolam (Versed)', drugClass: 'Benzodiazepine / Sedative', concentrationRange: '1-5 mg/mL',
    typicalDosing: '1-5 mg/hr', unit: 'mg/mL', rateUnits: ['mg/hr', 'mcg/kg/hr', 'ml/hr'],
    minRate: { value: 0.5, unit: 'mg/hr' }, maxRate: { value: 5, unit: 'mg/hr' },
    hardLimit: { value: 10, unit: 'mg/hr' }, weightBased: true,
    monitoring: ['Sedation scale q1h (RASS)', 'Respiratory rate', 'Flumazenil at bedside', 'BP'],
    presets: [
      { label: 'Low', rate: 1, unit: 'mg/hr' },
      { label: 'Typical', rate: 3, unit: 'mg/hr' },
      { label: 'Max', rate: 5, unit: 'mg/hr' },
    ],
    renalAdj: { mild: 0.9, moderate: 0.75, severe: 0.5 },
  },
  {
    id: 'propofol', name: 'Propofol (Diprivan)', drugClass: 'Sedative-Hypnotic', concentrationRange: '10 mg/mL',
    typicalDosing: '5-80 mcg/kg/min', unit: 'mg/mL', rateUnits: ['mcg/kg/min', 'mg/kg/hr', 'ml/hr'],
    minRate: { value: 5, unit: 'mcg/kg/min' }, maxRate: { value: 80, unit: 'mcg/kg/min' },
    hardLimit: { value: 100, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Sedation scale q1h', 'Triglycerides q48-72h', 'Respiratory rate', 'Infection surveillance (lipid line)', 'Propofol infusion syndrome awareness'],
    presets: [
      { label: 'Low', rate: 10, unit: 'mcg/kg/min' },
      { label: 'Typical', rate: 40, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 80, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 1, moderate: 1, severe: 1 },
  },
  {
    id: 'lidocaine', name: 'Lidocaine', drugClass: 'Antiarrhythmic (Class IB) / Local', concentrationRange: '2-4 mg/mL (cardiac)',
    typicalDosing: '1-4 mg/min', unit: 'mg/mL', rateUnits: ['mg/min', 'mg/hr', 'ml/hr'],
    minRate: { value: 1, unit: 'mg/min' }, maxRate: { value: 4, unit: 'mg/min' },
    hardLimit: { value: 5, unit: 'mg/min' }, weightBased: false,
    monitoring: ['Continuous ECG', 'CNS toxicity signs', 'Serum lidocaine level', 'BP'],
    presets: [
      { label: 'Low', rate: 1, unit: 'mg/min' },
      { label: 'Typical', rate: 2, unit: 'mg/min' },
      { label: 'Max', rate: 4, unit: 'mg/min' },
    ],
    renalAdj: { mild: 0.9, moderate: 0.75, severe: 0.5 },
  },
  {
    id: 'phenylephrine', name: 'Phenylephrine (Neo-Synephrine)', drugClass: 'Vasopressor (Pure α-agonist)', concentrationRange: '10 mg/250mL (40 mcg/mL)',
    typicalDosing: '0.1-5 mcg/kg/min', unit: 'mcg/mL', rateUnits: ['mcg/kg/min', 'mcg/min', 'ml/hr'],
    minRate: { value: 0.1, unit: 'mcg/kg/min' }, maxRate: { value: 5, unit: 'mcg/kg/min' },
    hardLimit: { value: 8, unit: 'mcg/kg/min' }, weightBased: true,
    monitoring: ['Continuous BP', 'HR (reflex bradycardia)', 'Peripheral perfusion', 'ECG'],
    presets: [
      { label: 'Low', rate: 0.2, unit: 'mcg/kg/min' },
      { label: 'Typical', rate: 1, unit: 'mcg/kg/min' },
      { label: 'Max', rate: 5, unit: 'mcg/kg/min' },
    ],
    renalAdj: { mild: 1, moderate: 1, severe: 1 },
  },
];

const RENAL_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'mild', label: 'Mild Impairment' },
  { value: 'moderate', label: 'Moderate Impairment' },
  { value: 'severe', label: 'Severe Impairment' },
];

interface ValidationResult {
  status: 'safe' | 'caution' | 'block';
  alerts: { level: 'block' | 'warning' | 'info'; message: string }[];
  currentPercentOfMax: number;
  effectiveMaxRate: number;
  effectiveHardLimit: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export function SmartIVPumpValidator() {
  const [drugId, setDrugId] = useState('');
  const [concentration, setConcentration] = useState('');
  const [rate, setRate] = useState('');
  const [rateUnit, setRateUnit] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [renal, setRenal] = useState('normal');
  const [calcDesired, setCalcDesired] = useState('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [gateDecision, setGateDecision] = useState<{ status: string; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const drug = DRUGS.find((d) => d.id === drugId);

  const effectiveMax = useMemo(() => {
    if (!drug) return 0;
    const factor = drug.renalAdj[renal] ?? 1;
    return drug.maxRate.value * factor;
  }, [drug, renal]);

  const effectiveHardLimit = useMemo(() => {
    if (!drug) return 0;
    const factor = drug.renalAdj[renal] ?? 1;
    return drug.hardLimit.value * factor;
  }, [drug, renal]);

  const doseCalcResult = useMemo(() => {
    if (!drug || !weight || !concentration || !calcDesired) return null;
    const w = parseFloat(weight);
    const c = parseFloat(concentration);
    const d = parseFloat(calcDesired);
    if (isNaN(w) || isNaN(c) || isNaN(d) || c === 0) return null;

    if (drug.weightBased) {
      // mcg/kg/min → mL/hr
      // dose = mcg/kg/min, concentration in mcg/mL
      const mLperHr = (d * w * 60) / c;
      return { mlPerHr: mLperHr, unit: 'mL/hr' };
    }
    // mg/hr → mL/hr
    const mLperHr = d / c;
    return { mlPerHr: mLperHr, unit: 'mL/hr' };
  }, [drug, weight, concentration, calcDesired]);

  const validate = async () => {
    if (!drug || !rate) return;
    const rateVal = parseFloat(rate);
    if (isNaN(rateVal)) return;

    setLoading(true);
    const alerts: ValidationResult['alerts'] = [];
    let status: 'safe' | 'caution' | 'block' = 'safe';

    const pctOfMax = effectiveMax > 0 ? (rateVal / effectiveMax) * 100 : 0;

    if (rateVal > effectiveHardLimit) {
      status = 'block';
      alerts.push({ level: 'block', message: `RATE EXCEEDS HARD LIMIT: ${rateVal} ${rateUnit} > ${effectiveHardLimit.toFixed(1)} ${drug.hardLimit.unit}. INFUSION BLOCKED.` });
    } else if (pctOfMax >= 80) {
      status = 'caution';
      alerts.push({ level: 'warning', message: `Rate at ${pctOfMax.toFixed(0)}% of maximum (${effectiveMax.toFixed(1)} ${drug.maxRate.unit}). Verify order and monitor closely.` });
    }

    if (renal !== 'normal' && drug.renalAdj[renal] !== 1) {
      const origMax = drug.maxRate.value;
      if (status !== 'block') status = 'caution';
      alerts.push({ level: 'warning', message: `Renal ${RENAL_OPTIONS.find(r => r.value === renal)?.label}: Max rate adjusted from ${origMax} to ${effectiveMax.toFixed(1)} ${drug.maxRate.unit} (factor: ${drug.renalAdj[renal] ?? 1}x).` });
    }

    if (drug.weightBased && (!weight || parseFloat(weight) <= 0)) {
      alerts.push({ level: 'warning', message: 'Weight-based dosing selected but no weight provided. Cannot verify dose accuracy.' });
    }

    drug.monitoring.forEach((m) => {
      alerts.push({ level: 'info', message: m });
    });

    const validation: ValidationResult = {
      status,
      alerts,
      currentPercentOfMax: pctOfMax,
      effectiveMaxRate: effectiveMax,
      effectiveHardLimit: effectiveHardLimit,
    };

    setResult(validation);

    try {
      const res = await fetch('/api/medgate/iv-pump', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drugId, concentration, rate: rateVal, rateUnit, weight, age, renal,
          validation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGateDecision({
          status: data.status || (status === 'block' ? 'BLOCK' : 'PASS'),
          message: data.message || '',
        });
      } else {
        setGateDecision({
          status: status === 'block' ? 'BLOCK' : status === 'caution' ? 'REVIEW' : 'PASS',
          message: status === 'block'
            ? `${drug.name}: INFUSION BLOCKED — Rate ${rateVal} ${rateUnit} exceeds safe limits.`
            : status === 'caution'
              ? `${drug.name}: CAUTION — Review rate and monitoring requirements before proceeding.`
              : `${drug.name}: Rate ${rateVal} ${rateUnit} within safe parameters. Program pump and begin infusion.`,
        });
      }
    } catch {
      setGateDecision({
        status: status === 'block' ? 'BLOCK' : status === 'caution' ? 'REVIEW' : 'PASS',
        message: `${drug.name}: ${status === 'block' ? 'BLOCKED' : status === 'caution' ? 'REVIEW REQUIRED' : 'APPROVED'} — Rate ${rateVal} ${rateUnit}.`,
      });
    }

    toast[status === 'block' ? 'error' : status === 'caution' ? 'warning' : 'success'](
      `${drug.name}: ${status.toUpperCase()}`,
      { description: `${rateVal} ${rateUnit} — ${alerts[0]?.message.slice(0, 80)}...` }
    );
    setLoading(false);
  };

  const applyPreset = (preset: { rate: number; unit: string }) => {
    setRate(String(preset.rate));
    setRateUnit(preset.unit);
    setResult(null);
    setGateDecision(null);
  };

  const gaugePercent = result ? Math.min(result.currentPercentOfMax, 120) : 0;
  const gaugeClampPercent = Math.min(gaugePercent, 100);

  return (
    <section id="iv-pump" className="py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <SectionHeader
          icon={Syringe}
          title="Smart IV Pump Validator"
          subtitle="High-Alert Medication Infusion Safety — 15 Critical Drugs"
          badge="Safety Gate"
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Drug selection + input form */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-card rounded-xl p-6">
              <CardContent className="space-y-5">
                {/* Drug selector */}
                <div className="space-y-2">
                  <Label className="text-sm text-slate-400">High-Alert IV Medication</Label>
                  <Select value={drugId} onValueChange={(v) => { setDrugId(v); setResult(null); setGateDecision(null); setRateUnit(''); }}>
                    <SelectTrigger className="glass-input w-full">
                      <SelectValue placeholder="Select medication" />
                    </SelectTrigger>
                    <SelectContent>
                      {DRUGS.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          <span className="flex items-center gap-2">
                            <Syringe className="w-3 h-3 text-cyan-400" />
                            <span className="font-medium">{d.name}</span>
                            <span className="text-slate-500 text-xs">({d.drugClass})</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drug info card */}
                <AnimatePresence>
                  {drug && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="bg-slate-800/50 border-slate-700/50 p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <p className="text-slate-500">Drug Class</p>
                            <p className="text-cyan-400 font-medium">{drug.drugClass}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Concentration Range</p>
                            <p className="text-white">{drug.concentrationRange}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Typical Dosing</p>
                            <p className="text-emerald-400">{drug.typicalDosing}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Min Rate</p>
                            <p className="text-white">{drug.minRate.value} {drug.minRate.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Max Rate</p>
                            <p className="text-amber-400 font-medium">{drug.maxRate.value} {drug.maxRate.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Hard Limit</p>
                            <p className="text-rose-400 font-bold">{drug.hardLimit.value} {drug.hardLimit.unit}</p>
                          </div>
                        </div>

                        {/* Quick presets */}
                        <div className="mt-3 pt-3 border-t border-slate-700/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-3 h-3 text-amber-400" />
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Drug Presets</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {drug.presets.map((preset) => (
                              <button
                                key={preset.label}
                                onClick={() => applyPreset(preset)}
                                className="px-2.5 py-1 text-[10px] font-medium rounded-md border border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                              >
                                {preset.label}: {preset.rate} {preset.unit}
                              </button>
                            ))}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input fields */}
                {drug && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Concentration ({drug.unit})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={`e.g. ${drug.concentrationRange.split('-')[0]?.trim()}`}
                        value={concentration}
                        onChange={(e) => setConcentration(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Rate</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        value={rate}
                        onChange={(e) => { setRate(e.target.value); setResult(null); setGateDecision(null); }}
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Rate Unit</Label>
                      <Select value={rateUnit} onValueChange={(v) => { setRateUnit(v); setResult(null); setGateDecision(null); }}>
                        <SelectTrigger className="glass-input w-full">
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {drug.rateUnits.map((u) => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {drug.weightBased && (
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-400">Patient Weight (kg) <span className="text-rose-400">*</span></Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="e.g. 70"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="glass-input"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Patient Age</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 65"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Renal Function</Label>
                      <Select value={renal} onValueChange={(v) => { setRenal(v); setResult(null); setGateDecision(null); }}>
                        <SelectTrigger className="glass-input w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RENAL_OPTIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={validate}
                  disabled={loading || !drug || !rate || !rateUnit}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow"
                >
                  {loading ? 'Validating...' : 'Validate Infusion'}
                </Button>
              </CardContent>
            </Card>

            {/* Dose Calculator */}
            {drug && (
              <Card className="glass-card rounded-xl p-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-sm">Dose Calculation Helper</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">
                        Desired dose ({drug.weightBased ? 'mcg/kg/min' : drug.rateUnits[0]})
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter desired dose"
                        value={calcDesired}
                        onChange={(e) => setCalcDesired(e.target.value)}
                        className="glass-input"
                      />
                    </div>
                    {drug.weightBased && (
                      <div className="space-y-2">
                        <Label className="text-sm text-slate-400">Weight (kg)</Label>
                        <Input type="number" step="0.1" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} className="glass-input" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm text-slate-400">Concentration ({drug.unit})</Label>
                      <Input type="number" step="0.01" placeholder="Enter concentration" value={concentration} onChange={(e) => setConcentration(e.target.value)} className="glass-input" />
                    </div>
                  </div>
                  {doseCalcResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
                    >
                      <p className="text-sm text-slate-400">Required pump setting:</p>
                      <p className="text-2xl font-bold text-cyan-400 font-mono">
                        <AnimatedCounter target={doseCalcResult.mlPerHr} decimals={1} />
                        <span className="text-sm text-cyan-300 ml-2">{doseCalcResult.unit}</span>
                      </p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pump Settings Summary */}
            {result && drug && rate && (
              <Card className="glass-card rounded-xl p-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">Pump Settings Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Drug</p>
                      <p className="text-sm text-white font-medium">{drug.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Rate</p>
                      <p className="text-sm text-cyan-400 font-mono font-bold">{rate} {rateUnit}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Concentration</p>
                      <p className="text-sm text-white font-mono">{concentration || '—'} {drug.unit}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">Status</p>
                      <Badge variant="outline" className={cn('text-xs',
                        result.status === 'safe' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                        result.status === 'caution' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      )}>
                        {result.status === 'safe' ? 'SAFE TO PROGRAM' : result.status === 'caution' ? 'REVIEW NEEDED' : 'DO NOT PROGRAM'}
                      </Badge>
                    </div>
                  </div>
                  {drug.monitoring.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                      <p className="text-xs text-slate-400 mb-2">Required Monitoring:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {drug.monitoring.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-slate-800/50 text-cyan-300 border-slate-700">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Safety gauge + alerts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Safety gauge */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Safety Gauge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result ? (
                  <>
                    {/* Vertical-style horizontal gauge */}
                    <div className="space-y-2">
                      <div className="relative h-12 rounded-xl overflow-hidden border border-slate-700/50">
                        <div className="absolute inset-0 flex">
                          <div className="h-full" style={{ width: '60%', backgroundColor: '#10b981', opacity: 0.3 }} />
                          <div className="h-full" style={{ width: '20%', backgroundColor: '#f59e0b', opacity: 0.3 }} />
                          <div className="h-full flex-1" style={{ backgroundColor: '#f43f5e', opacity: 0.3 }} />
                        </div>
                        {/* Needle */}
                        <motion.div
                          className="absolute top-0 h-full w-1.5 z-10"
                          style={{ backgroundColor: result.status === 'block' ? '#f43f5e' : result.status === 'caution' ? '#f59e0b' : '#10b981' }}
                          animate={{ left: `${Math.max(1, Math.min(gaugeClampPercent, 99))}%` }}
                          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                        >
                          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full shadow-lg" style={{ backgroundColor: result.status === 'block' ? '#f43f5e' : result.status === 'caution' ? '#f59e0b' : '#10b981' }} />
                        </motion.div>
                        {/* Zone labels */}
                        <div className="absolute inset-0 flex items-center justify-around text-xs font-bold text-white/60 pointer-events-none px-6">
                          <span>SAFE</span>
                          <span>CAUTION</span>
                          <span>DANGER</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0%</span>
                        <span>60%</span>
                        <span>80%</span>
                        <span>100%+</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider">% of Max Rate</p>
                        <p className={cn('text-4xl font-bold font-mono',
                          result.status === 'safe' ? 'text-emerald-400' :
                          result.status === 'caution' ? 'text-amber-400' : 'text-rose-400'
                        )}>
                          <AnimatedCounter target={Math.round(result.currentPercentOfMax)} suffix="%" />
                        </p>
                      </div>
                    </div>

                    {/* Renal adjustment info */}
                    {renal !== 'normal' && drug && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                        <p className="font-semibold text-amber-400">Renal Adjustment Applied</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <p className="text-slate-500">Original Max</p>
                            <p className="text-white font-mono">{drug.maxRate.value} {drug.maxRate.unit}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Adjusted Max</p>
                            <p className="text-amber-400 font-mono font-bold">{effectiveMax.toFixed(1)} {drug.maxRate.unit}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                    Select a drug and enter rate to see safety gauge
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alerts panel */}
            {result && (
              <Card className="glass-card rounded-xl p-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">
                    <ShieldAlert className="w-4 h-4 inline mr-2 text-cyan-400" />
                    Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                    {result.alerts.map((alert, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        className={cn(
                          'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-sm',
                          alert.level === 'block' ? 'bg-rose-500/10 border-rose-500/30' :
                          alert.level === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                          'bg-sky-500/10 border-sky-500/30'
                        )}
                      >
                        {alert.level === 'block' ? <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" /> :
                         alert.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" /> :
                         <Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />}
                        <p className={cn(
                          alert.level === 'block' ? 'text-rose-300' :
                          alert.level === 'warning' ? 'text-amber-300' : 'text-sky-300'
                        )}>
                          <span className="font-bold uppercase text-[10px] tracking-wider mr-1.5">
                            [{alert.level}]
                          </span>
                          {alert.message}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Gate decision */}
        <AnimatePresence>
          {gateDecision && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <Alert className={cn(
                'border',
                gateDecision.status === 'BLOCK'
                  ? 'bg-rose-500/10 border-rose-500/40'
                  : gateDecision.status === 'REVIEW'
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-emerald-500/10 border-emerald-500/40'
              )}>
                {gateDecision.status === 'BLOCK'
                  ? <XCircle className="w-4 h-4 text-rose-400" />
                  : gateDecision.status === 'REVIEW'
                    ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                    : <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                }
                <AlertTitle className={cn('font-bold',
                  gateDecision.status === 'BLOCK' ? 'text-rose-400' :
                  gateDecision.status === 'REVIEW' ? 'text-amber-400' : 'text-emerald-400'
                )}>
                  Gate Decision: {gateDecision.status}
                </AlertTitle>
                <AlertDescription className="text-slate-300">{gateDecision.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}