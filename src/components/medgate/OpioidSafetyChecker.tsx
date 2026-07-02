'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pill, Calculator, ShieldAlert, ShieldCheck, AlertTriangle, CheckCircle2,
  XCircle, Info, Activity, Heart, Gauge, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

// --- Types ---
interface OpioidDef {
  id: string;
  name: string;
  className: string;
  routes: string[];
  // Morphine equivalent in mg (oral morphine = 30mg baseline)
  oralMME: number;
  ivMME: number;
  notes?: string;
}

interface ConversionResult {
  targetDrug: OpioidDef;
  equivalentDose: number;
  ratio: string;
}

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

// --- Opioid Data ---
const OPIOIDS: OpioidDef[] = [
  { id: 'morphine', name: 'Morphine', className: 'Phenanthrene', routes: ['oral', 'IV', 'IM'], oralMME: 30, ivMME: 10 },
  { id: 'fentanyl', name: 'Fentanyl', className: 'Phenylpiperidine', routes: ['IV', 'transdermal', 'intranasal'], oralMME: 0, ivMME: 0.1 },
  { id: 'oxycodone', name: 'Oxycodone', className: 'Phenanthrene', routes: ['oral'], oralMME: 20, ivMME: 0 },
  { id: 'hydromorphone', name: 'Hydromorphone', className: 'Phenanthrene', routes: ['oral', 'IV', 'IM'], oralMME: 7.5, ivMME: 1.5 },
  { id: 'methadone', name: 'Methadone', className: 'Phenylheptylamine', routes: ['oral'], oralMME: 4, ivMME: 0, notes: 'Variable ratio: 4:1 ≤20mg, 8:1 21-40mg, 12:1 >40mg' },
  { id: 'codeine', name: 'Codeine', className: 'Phenanthrene', routes: ['oral'], oralMME: 130, ivMME: 0 },
  { id: 'tramadol', name: 'Tramadol', className: 'Aminocyclohexanol', routes: ['oral'], oralMME: 100, ivMME: 0 },
  { id: 'tapentadol', name: 'Tapentadol', className: 'Aminocyclohexanol', routes: ['oral'], oralMME: 50, ivMME: 0 },
  { id: 'buprenorphine', name: 'Buprenorphine', className: 'Phenanthrene (partial)', routes: ['oral', 'transdermal'], oralMME: 0, ivMME: 0, notes: 'Partial agonist — conversion unreliable' },
  { id: 'oxymorphone', name: 'Oxymorphone', className: 'Phenanthrene', routes: ['oral', 'IV'], oralMME: 10, ivMME: 1 },
  { id: 'meperidine', name: 'Meperidine (Pethidine)', className: 'Phenylpiperidine', routes: ['oral', 'IV', 'IM'], oralMME: 300, ivMME: 75 },
  { id: 'heroin', name: 'Heroin (Diacetylmorphine)', className: 'Phenanthrene (semi-synthetic)', routes: ['IV', 'intranasal'], oralMME: 0, ivMME: 3 },
];

const FENTANYL_PATCH_MME: Record<number, number> = {
  12: 33, 25: 67, 50: 134, 75: 201, 100: 267,
};

const ROUTES = ['oral', 'IV', 'IM', 'transdermal', 'intranasal'] as const;
const FREQUENCIES = ['once', 'q4h', 'q6h', 'q8h', 'q12h', 'q24h', 'continuous'] as const;

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; bar: string; gate: string; gateColor: string }> = {
  low: { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-500/10', bar: 'bg-emerald-500', gate: 'PASS', gateColor: 'text-emerald-400' },
  moderate: { label: 'MODERATE', color: 'text-amber-400', bg: 'bg-amber-500/10', bar: 'bg-amber-500', gate: 'REVIEW', gateColor: 'text-amber-400' },
  high: { label: 'HIGH', color: 'text-rose-400', bg: 'bg-rose-500/10', bar: 'bg-rose-500', gate: 'CAUTION', gateColor: 'text-rose-400' },
  critical: { label: 'CRITICAL', color: 'text-rose-300', bg: 'bg-rose-600/20', bar: 'bg-rose-600', gate: 'BLOCK', gateColor: 'text-rose-300' },
};

const CDC_THRESHOLDS = [
  { value: 30, label: '30', description: 'Low risk threshold' },
  { value: 50, label: '50', description: 'Naloxone recommended' },
  { value: 90, label: '90', description: 'CDC high-dose threshold' },
  { value: 200, label: '200', description: 'Critical threshold' },
];

const PRESETS: Record<string, { drugId: string; dose: number; route: string; frequency: string }> = {
  'Post-op Pain': { drugId: 'oxycodone', dose: 5, route: 'oral', frequency: 'q6h' },
  'Cancer Pain': { drugId: 'morphine', dose: 30, route: 'oral', frequency: 'q12h' },
  'Opioid-naive': { drugId: 'tramadol', dose: 50, route: 'oral', frequency: 'q6h' },
};

function getFreqMultiplier(freq: string): number {
  const map: Record<string, number> = { once: 1, 'q4h': 6, 'q6h': 4, 'q8h': 3, 'q12h': 2, 'q24h': 1, continuous: 1 };
  return map[freq] || 1;
}

function calcMME(drug: OpioidDef | null, dose: number, route: string, freq: string): number {
  if (!drug || !dose) return 0;

  // Fentanyl patch special case
  if (drug.id === 'fentanyl' && route === 'transdermal') {
    const patchMME = FENTANYL_PATCH_MME[Math.round(dose)] || (dose * 2.67);
    return patchMME;
  }

  // Buprenorphine: unreliable conversion
  if (drug.id === 'buprenorphine') return 0;

  let baseMME = 30; // base = 30mg oral morphine

  if (route === 'IV' || route === 'IM' || route === 'intranasal') {
    if (drug.ivMME > 0) {
      baseMME = 30 * (drug.ivMME / 10); // relative to morphine IV (10mg)
    } else if (drug.oralMME > 0) {
      // If only oral data available, approximate IV as half oral
      baseMME = 30 * (drug.oralMME / 30) * 0.5;
    }
  } else {
    if (drug.oralMME > 0) {
      baseMME = 30 * (drug.oralMME / 30);
    } else if (drug.ivMME > 0) {
      baseMME = 30 * (drug.ivMME / 10) * 2; // IV to oral approximate x2
    }
  }

  // Methadone dose-dependent ratio
  if (drug.id === 'methadone') {
    const methadoneDose = dose * getFreqMultiplier(freq);
    if (methadoneDose <= 20) baseMME = 30 * (4 / 30);
    else if (methadoneDose <= 40) baseMME = 30 * (8 / 30);
    else baseMME = 30 * (12 / 30);
  }

  const dailyDose = dose * getFreqMultiplier(freq);
  const equivalentMorphineDaily = (dailyDose / (drug.oralMME > 0 && route === 'oral' ? drug.oralMME : drug.ivMME > 0 ? drug.ivMME : 1)) * 30;

  return Math.round(Math.max(0, equivalentMorphineDaily));
}

function getRiskLevel(mme: number): RiskLevel {
  if (mme < 30) return 'low';
  if (mme <= 90) return 'moderate';
  if (mme <= 200) return 'high';
  return 'critical';
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export function OpioidSafetyChecker() {
  const [selectedDrugId, setSelectedDrugId] = useState('morphine');
  const [dose, setDose] = useState<number>(10);
  const [route, setRoute] = useState('oral');
  const [frequency, setFrequency] = useState('q12h');
  const [targetDrugId, setTargetDrugId] = useState('oxycodone');
  const [age, setAge] = useState<number | ''>('');
  const [renalFunction, setRenalFunction] = useState('normal');
  const [concomitantSedatives, setConcomitantSedatives] = useState<string[]>([]);
  const [isOpioidNaive, setIsOpioidNaive] = useState(true);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);

  const selectedDrug = OPIOIDS.find((d) => d.id === selectedDrugId) || OPIOIDS[0];
  const targetDrug = OPIOIDS.find((d) => d.id === targetDrugId) || OPIOIDS[2];

  const mme = useMemo(() => calcMME(selectedDrug, dose, route, frequency), [selectedDrug, dose, route, frequency]);
  const riskLevel = getRiskLevel(mme);
  const riskCfg = RISK_CONFIG[riskLevel];

  // Conversion
  const conversion: ConversionResult | null = useMemo(() => {
    if (mme <= 0 || !targetDrug.oralMME || selectedDrug.id === 'buprenorphine' || targetDrug.id === 'buprenorphine') return null;
    const eqDose = (mme / 30) * targetDrug.oralMME;
    const ratio = `${selectedDrug.oralMME}:${targetDrug.oralMME}`;
    return { targetDrug, equivalentDose: Math.round(eqDose * 10) / 10, ratio };
  }, [mme, selectedDrug, targetDrug]);

  // Safety recommendations
  const recommendations = useMemo(() => {
    const recs: { text: string; type: 'warning' | 'info' | 'danger' | 'success' }[] = [];

    if (mme >= 90) recs.push({ text: 'MME ≥ 90 mg/day — exceeds CDC high-dose threshold. Reassess risk/benefit.', type: 'danger' });
    if (mme >= 200) recs.push({ text: 'MME ≥ 200 mg/day — CRITICAL. Do not prescribe without specialist pain consultation.', type: 'danger' });
    if (mme > 50) recs.push({ text: 'Co-prescribe naloxone (Narcan) for overdose risk mitigation.', type: 'warning' });

    if (isOpioidNaive) recs.push({ text: 'Opioid-naive patient: "Start low, go slow." Consider 25-50% dose reduction.', type: 'warning' });

    if (concomitantSedatives.length > 0) {
      recs.push({ text: `Concomitant sedatives (${concomitantSedatives.join(', ')}) increase respiratory depression risk.`, type: 'danger' });
    }

    if (age && age >= 65) recs.push({ text: 'Age ≥ 65: Start at 25-50% of adult dose. Monitor closely.', type: 'warning' });

    if (renalFunction === 'impaired' || renalFunction === 'severe') {
      if (selectedDrug.id === 'morphine') recs.push({ text: 'Renal impairment: Avoid morphine (M6G accumulation → respiratory depression). Consider oxycodone or fentanyl.', type: 'warning' });
      if (selectedDrug.id === 'meperidine') recs.push({ text: 'Renal impairment: Avoid meperidine (normeperidine neurotoxicity).', type: 'danger' });
      if (selectedDrug.id === 'codeine') recs.push({ text: 'Renal impairment: Avoid codeine. Consider tramadol with dose reduction.', type: 'warning' });
      recs.push({ text: `${renalFunction === 'severe' ? 'Severe' : 'Moderate'} renal impairment: Reduce opioid dose by 25-50% and extend dosing interval.`, type: 'info' });
    }

    if (selectedDrug.id === 'methadone') recs.push({ text: 'Methadone: Variable conversion ratio. ECG monitoring for QTc prolongation recommended.', type: 'info' });
    if (selectedDrug.id === 'buprenorphine') recs.push({ text: 'Buprenorphine: Partial agonist. Conversion from full agonists requires careful tapering.', type: 'info' });

    if (recs.length === 0) recs.push({ text: 'No safety concerns identified at current dose.', type: 'success' });

    return recs;
  }, [mme, isOpioidNaive, concomitantSedatives, age, renalFunction, selectedDrug]);

  // Risk factors for display
  const riskFactors = useMemo(() => {
    const factors: { label: string; active: boolean }[] = [
      { label: 'MME ≥ 90', active: mme >= 90 },
      { label: 'Age ≥ 65', active: (age || 0) >= 65 },
      { label: 'Renal Impairment', active: renalFunction !== 'normal' },
      { label: 'Concomitant Sedatives', active: concomitantSedatives.length > 0 },
      { label: 'Opioid-Naive', active: isOpioidNaive },
      { label: 'MME ≥ 200', active: mme >= 200 },
    ];
    return factors;
  }, [mme, age, renalFunction, concomitantSedatives, isOpioidNaive]);

  const toggleSedative = (sed: string) => {
    setConcomitantSedatives((prev) => prev.includes(sed) ? prev.filter((s) => s !== sed) : [...prev, sed]);
  };

  const applyPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setSelectedDrugId(p.drugId);
    setDose(p.dose);
    setRoute(p.route);
    setFrequency(p.frequency);
  };

  const handleVerify = () => {
    const pass = riskLevel === 'low' || (riskLevel === 'moderate' && !concomitantSedatives.length);
    setVerifyResult(pass ? 'SAFETY CHECK PASSED — Prescribing within guidelines' : 'SAFETY CONCERNS IDENTIFIED — Review recommendations before prescribing');
  };

  // MME gauge position (0-250 mapped to 0-100%)
  const mmePercent = Math.min((mme / 250) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Opioid Selection Grid */}
      <motion.div
        className="glass-card rounded-xl p-4 sm:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-slate-300">Select Opioid</p>
          </div>
          <div className="flex gap-2">
            {Object.keys(PRESETS).map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                className="text-[10px] border-slate-600 text-slate-400 hover:text-primary hover:border-primary/50"
                onClick={() => applyPreset(preset)}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {OPIOIDS.map((op) => {
            const isSelected = op.id === selectedDrugId;
            return (
              <motion.button
                key={op.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedDrugId(op.id)}
                className={cn(
                  'p-2.5 rounded-lg border text-left transition-all cursor-pointer',
                  isSelected
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                )}
              >
                <p className={cn('text-xs font-medium truncate', isSelected ? 'text-primary' : 'text-slate-300')}>{op.name}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 truncate">{op.className}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Main: Calculator + Safety */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Calculator */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-4 sm:p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-4 h-4 text-primary" />
              <p className="text-sm font-medium text-slate-300">Conversion Calculator</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Selected Drug</Label>
                <div className="glass-input h-9 flex items-center px-3 rounded-md border border-primary/30 text-primary text-sm font-medium">
                  {selectedDrug.name}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Dose (mg)</Label>
                <Input type="number" value={dose} onChange={(e) => setDose(Number(e.target.value) || 0)} className="glass-input text-sm" min={0} step={0.1} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Route</Label>
                <Select value={route} onValueChange={setRoute}>
                  <SelectTrigger className="glass-input text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {selectedDrug.routes.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="glass-input text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (<SelectItem key={f} value={f}>{f}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* MME Display */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs text-slate-400">Total Morphine Milligram Equivalents (MME/day)</span>
                </div>
                <motion.div
                  key={riskLevel}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                >
                  <Badge variant="outline" className={cn('text-xs font-bold', riskCfg.bg, riskCfg.color, 'border-0')}>
                    <AnimatedCounter target={mme} /> mg MME/day
                  </Badge>
                </motion.div>
              </div>

              {/* MME Gauge */}
              <div className="relative h-6 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
                {/* Threshold markers */}
                {CDC_THRESHOLDS.map((t) => {
                  const pos = (t.value / 250) * 100;
                  return (
                    <div key={t.value} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${pos}%` }}>
                      <div className="w-px h-full bg-slate-500/40" />
                    </div>
                  );
                })}
                {/* Fill */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${mmePercent}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                  className={cn('absolute top-0 left-0 h-full rounded-full', riskCfg.bar)}
                  style={{ opacity: 0.8 }}
                />
              </div>
              {/* Threshold labels */}
              <div className="flex justify-between mt-1.5 px-1">
                <span className="text-[9px] text-slate-600">0</span>
                {CDC_THRESHOLDS.map((t) => (
                  <TooltipProvider key={t.value}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={cn(
                          'text-[9px] font-mono cursor-help',
                          mme >= t.value ? (t.value >= 90 ? 'text-rose-400' : 'text-amber-400') : 'text-slate-600'
                        )}>
                          {t.value}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">{t.description}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
                <span className="text-[9px] text-slate-600">250+</span>
              </div>
            </div>

            {/* Target Conversion */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Convert to</Label>
                <Select value={targetDrugId} onValueChange={setTargetDrugId}>
                  <SelectTrigger className="glass-input text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPIOIDS.filter((o) => o.id !== 'buprenorphine').map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Equivalent Daily Dose</Label>
                <div className="glass-input h-9 flex items-center px-3 rounded-md border border-slate-600 bg-slate-800/30 text-slate-300">
                  {conversion
                    ? `${conversion.equivalentDose} mg ${conversion.targetDrug.name} (ratio ${conversion.ratio})`
                    : 'N/A — conversion not available'}
                </div>
              </div>
            </div>

            {/* Patient Risk Factors */}
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase tracking-wider">Patient Risk Factors</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Age</Label>
                  <Input type="number" value={age} onChange={(e) => setAge(Number(e.target.value) || '')} placeholder="years" className="glass-input text-sm" min={0} max={120} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Renal Function</Label>
                  <Select value={renalFunction} onValueChange={setRenalFunction}>
                    <SelectTrigger className="glass-input text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal (eGFR &gt; 60)</SelectItem>
                      <SelectItem value="impaired">Impaired (eGFR 30-60)</SelectItem>
                      <SelectItem value="severe">Severe (eGFR &lt; 30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Opioid-Naive</Label>
                  <div className="h-9 flex items-center">
                    <Button
                      variant={isOpioidNaive ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'text-xs transition-colors',
                        isOpioidNaive
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                          : 'border-slate-600 text-slate-400 hover:text-slate-300'
                      )}
                      onClick={() => setIsOpioidNaive(!isOpioidNaive)}
                    >
                      {isOpioidNaive ? 'Yes — Caution' : 'No — Tolerant'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Concomitant Sedatives */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Concomitant Sedatives</Label>
                <div className="flex flex-wrap gap-2">
                  {['Benzodiazepines', 'Alcohol', 'Gabapentinoids', 'Sedating Antihistamines', 'Antidepressants (sedating)'].map((sed) => (
                    <Badge
                      key={sed}
                      variant="outline"
                      className={cn(
                        'text-[10px] cursor-pointer transition-colors',
                        concomitantSedatives.includes(sed)
                          ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                          : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                      )}
                      onClick={() => toggleSedative(sed)}
                    >
                      {concomitantSedatives.includes(sed) && <XCircle className="w-3 h-3 mr-1" />}
                      {sed}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Safety Dashboard */}
        <div className="space-y-4">
          {/* Risk Level Card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-5 text-center"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Respiratory Depression Risk</p>
            <motion.div
              key={riskLevel}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-3"
            >
              <Gauge className={cn('w-16 h-16 mx-auto', riskCfg.color)} />
            </motion.div>
            <p className={cn('text-3xl font-bold', riskCfg.color)}>{riskCfg.label}</p>
            <p className="text-xs text-slate-400 mt-1">
              {riskLevel === 'low' && '< 30 MME — Minimal risk'}
              {riskLevel === 'moderate' && '30–90 MME — Monitor closely'}
              {riskLevel === 'high' && '90–200 MME — High risk of respiratory depression'}
              {riskLevel === 'critical' && '> 200 MME — Extreme risk — Specialist required'}
            </p>

            {/* Gate Decision */}
            <motion.div
              key={riskCfg.gate}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={cn(
                'mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border',
                riskCfg.gate === 'PASS' ? 'bg-emerald-500/10 border-emerald-500/30'
                  : riskCfg.gate === 'REVIEW' ? 'bg-amber-500/10 border-amber-500/30'
                  : riskCfg.gate === 'CAUTION' ? 'bg-rose-500/10 border-rose-500/30'
                  : 'bg-rose-600/20 border-rose-500/50'
              )}>
              {riskCfg.gate === 'PASS' ? <ShieldCheck className={cn('w-4 h-4', riskCfg.gateColor)} /> : <ShieldAlert className={cn('w-4 h-4', riskCfg.gateColor)} />}
              <span className={cn('text-sm font-semibold', riskCfg.gateColor)}>{riskCfg.gate}</span>
            </motion.div>
          </motion.div>

          {/* Risk Factor Chips */}
          <Card className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
              Risk Factors ({riskFactors.filter((f) => f.active).length}/{riskFactors.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {riskFactors.map((f) => (
                <Badge
                  key={f.label}
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    f.active
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400'
                      : 'border-slate-700 text-slate-600'
                  )}
                >
                  {f.active && <XCircle className="w-3 h-3 mr-1" />}
                  {f.label}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Safety Recommendations */}
          <Card className="glass-card rounded-xl p-4 max-h-64 overflow-y-auto">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Safety Recommendations
            </p>
            <AnimatePresence>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      'flex items-start gap-2 p-2 rounded-lg text-xs',
                      rec.type === 'danger' ? 'bg-rose-500/5 border border-rose-500/15'
                        : rec.type === 'warning' ? 'bg-amber-500/5 border border-amber-500/15'
                        : rec.type === 'success' ? 'bg-emerald-500/5 border border-emerald-500/15'
                        : 'bg-slate-800/30 border border-slate-700/30'
                    )}
                  >
                    {rec.type === 'danger' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />}
                    {rec.type === 'warning' && <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                    {rec.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                    {rec.type === 'info' && <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />}
                    <span className={cn(
                      'text-slate-300',
                      rec.type === 'danger' && 'text-rose-300',
                      rec.type === 'warning' && 'text-amber-300'
                    )}>
                      {rec.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </Card>

          {/* Verify Button */}
          <Button
            onClick={handleVerify}
            className={cn(
              'w-full border',
              riskCfg.gate === 'PASS'
                ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border-rose-500/30'
            )}
          >
            {riskCfg.gate === 'PASS' ? <ShieldCheck className="w-4 h-4 mr-2" /> : <ShieldAlert className="w-4 h-4 mr-2" />}
            Verify Safety
          </Button>

          {verifyResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'text-xs text-center rounded-lg p-3',
                verifyResult.includes('PASSED')
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              )}
            >
              {verifyResult}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}