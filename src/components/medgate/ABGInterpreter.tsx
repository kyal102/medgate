'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Wind,
  Droplets,
  Thermometer,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Beaker,
  Target,
  BookOpen,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ABGValues {
  pH: number;
  PaCO2: number;
  PaO2: number;
  HCO3: number;
  SaO2: number;
  BaseExcess: number;
  Lactate: number;
  FiO2: number;
  Na: number;
  Cl: number;
}

interface ABGResult {
  primary: 'Normal' | 'Respiratory Acidosis' | 'Respiratory Alkalosis' | 'Metabolic Acidosis' | 'Metabolic Alkalosis' | 'Mixed Disorder';
  severity: 'Normal' | 'Mild' | 'Moderate' | 'Severe';
  compensation: 'Uncompensated' | 'Partially Compensated' | 'Fully Compensated';
  acidBaseStatus: 'Normal' | 'Acidemia' | 'Alkalemia';
  anionGap: number;
  anionGapStatus: 'Normal' | 'High AG';
  aaGradient: number;
  pfrRatio: number;
  ardsSeverity: 'Normal' | 'Mild ARDS' | 'Moderate ARDS' | 'Severe ARDS';
  expectedCompensation: string;
  actualVsExpected: string;
  details: string[];
  color: string;
}

const DEFAULT_ABG: ABGValues = {
  pH: 7.40, PaCO2: 40, PaO2: 95, HCO3: 24, SaO2: 98, BaseExcess: 0, Lactate: 1.0, FiO2: 21, Na: 140, Cl: 104,
};

const PRESETS: { label: string; icon: string; values: ABGValues }[] = [
  {
    label: 'Normal ABG',
    icon: '✅',
    values: { pH: 7.40, PaCO2: 40, PaO2: 95, HCO3: 24, SaO2: 98, BaseExcess: 0, Lactate: 1.0, FiO2: 21, Na: 140, Cl: 104 },
  },
  {
    label: 'Severe Metabolic Acidosis (DKA)',
    icon: '🔥',
    values: { pH: 7.10, PaCO2: 20, PaO2: 110, HCO3: 8, SaO2: 98, BaseExcess: -18, Lactate: 2.5, FiO2: 21, Na: 132, Cl: 94 },
  },
  {
    label: 'Acute Respiratory Failure (COPD)',
    icon: '🫁',
    values: { pH: 7.25, PaCO2: 70, PaO2: 52, HCO3: 28, SaO2: 82, BaseExcess: 2, Lactate: 1.5, FiO2: 28, Na: 138, Cl: 100 },
  },
  {
    label: 'ARDS',
    icon: '⚠️',
    values: { pH: 7.30, PaCO2: 50, PaO2: 65, HCO3: 24, SaO2: 88, BaseExcess: -2, Lactate: 3.8, FiO2: 100, Na: 140, Cl: 104 },
  },
];

/* ------------------------------------------------------------------ */
/*  Interpretation Algorithm                                           */
/* ------------------------------------------------------------------ */

function interpretABG(v: ABGValues): ABGResult {
  const anionGap = v.Na - v.Cl - v.HCO3;
  const aaGradient = v.FiO2 / 100 * (760 - 47) - v.PaCO2 / 0.8 - v.PaO2;
  const pfrRatio = v.FiO2 > 0 ? v.PaO2 / (v.FiO2 / 100) : 0;

  const isAcidemic = v.pH < 7.35;
  const isAlkalemic = v.pH > 7.45;
  const isRespAcidosis = v.PaCO2 > 45;
  const isRespAlkalosis = v.PaCO2 < 35;
  const isMetAcidosis = v.HCO3 < 22;
  const isMetAlkalosis = v.HCO3 > 26;
  const isNormal = !isAcidemic && !isAlkalemic && !isRespAcidosis && !isRespAlkalosis && !isMetAcidosis && !isMetAlkalosis;

  let ardsSeverity: ABGResult['ardsSeverity'] = 'Normal';
  if (pfrRatio <= 100) ardsSeverity = 'Severe ARDS';
  else if (pfrRatio <= 200) ardsSeverity = 'Moderate ARDS';
  else if (pfrRatio <= 300) ardsSeverity = 'Mild ARDS';

  if (isNormal) {
    return {
      primary: 'Normal',
      severity: 'Normal',
      compensation: 'N/A',
      acidBaseStatus: 'Normal',
      anionGap,
      anionGapStatus: anionGap > 12 ? 'High AG' : 'Normal',
      aaGradient,
      pfrRatio,
      ardsSeverity,
      expectedCompensation: 'N/A',
      actualVsExpected: 'N/A',
      details: ['All values within normal range', `Anion Gap: ${anionGap.toFixed(1)} ${anionGap > 12 ? '(elevated — investigate)' : '(normal)'}`, `A-a Gradient: ${aaGradient.toFixed(1)} mmHg`, `P/F Ratio: ${pfrRatio.toFixed(0)}`],
      color: 'text-emerald-500',
    };
  }

  // Determine primary disorder
  let primary: ABGResult['primary'];
  let compensation: ABGResult['compensation'];
  let expectedCompensation = '';
  let actualVsExpected = '';
  let details: string[] = [];

  if (isAcidemic) {
    if (isRespAcidosis && isMetAcidosis) {
      primary = 'Mixed Disorder';
      compensation = 'Uncompensated';
      expectedCompensation = 'Mixed — cannot apply single compensation rules';
      actualVsExpected = 'Mixed respiratory + metabolic acidosis';
      details = ['Mixed respiratory and metabolic acidosis', `pH ${v.pH.toFixed(2)} with elevated PaCO2 and low HCO3`];
    } else if (isRespAcidosis) {
      primary = 'Respiratory Acidosis';
      // Expected HCO3 for acute: HCO3 increases 1 mEq/L per 10 mmHg rise in PaCO2 above 40
      const acuteExpectedHCO3 = 24 + ((v.PaCO2 - 40) / 10) * 1;
      const chronicExpectedHCO3 = 24 + ((v.PaCO2 - 40) / 10) * 3.5;

      if (v.HCO3 <= 26) {
        compensation = 'Uncompensated (Acute)';
        expectedCompensation = `Acute: expected HCO3 ${acuteExpectedHCO3.toFixed(1)}`;
        actualVsExpected = `Actual HCO3 ${v.HCO3} → Acute respiratory acidosis`;
        details = ['Acute respiratory acidosis — HCO3 has not had time to rise', 'Consider: airway obstruction, CNS depression, acute asthma'];
      } else if (v.HCO3 <= chronicExpectedHCO3 + 2 && v.HCO3 >= acuteExpectedHCO3 - 2) {
        compensation = 'Partially Compensated';
        expectedCompensation = `Acute: ${acuteExpectedHCO3.toFixed(1)}, Chronic: ${chronicExpectedHCO3.toFixed(1)}`;
        actualVsExpected = `Actual HCO3 ${v.HCO3} between acute and chronic ranges`;
        details = ['Partially compensated respiratory acidosis', 'HCO3 rising but pH still abnormal'];
      } else {
        compensation = 'Fully Compensated (Chronic)';
        expectedCompensation = `Chronic: expected HCO3 ${chronicExpectedHCO3.toFixed(1)}`;
        actualVsExpected = `Actual HCO3 ${v.HCO3} matches chronic compensation`;
        details = ['Chronic compensated respiratory acidosis — likely COPD', 'Kidneys have maximally compensated'];
      }
    } else if (isMetAcidosis) {
      primary = 'Metabolic Acidosis';
      // Winter's formula: expected PaCO2 = 1.5 * HCO3 + 8 ± 2
      const expectedPaCO2 = 1.5 * v.HCO3 + 8;
      const isHighAG = anionGap > 12;

      if (Math.abs(v.PaCO2 - expectedPaCO2) <= 2) {
        compensation = 'Fully Compensated';
        actualVsExpected = `PaCO2 ${v.PaCO2} matches expected ${expectedPaCO2.toFixed(1)} (±2)`;
      } else if (v.PaCO2 > expectedPaCO2 + 2) {
        compensation = 'Uncompensated';
        actualVsExpected = `PaCO2 ${v.PaCO2} > expected ${expectedPaCO2.toFixed(1)} — inadequate respiratory compensation`;
        details.push('WARNING: Concurrent respiratory acidosis — check airway/ventilation');
      } else {
        compensation = 'Overcompensated';
        actualVsExpected = `PaCO2 ${v.PaCO2} < expected ${expectedPaCO2.toFixed(1)} — superimposed respiratory alkalosis`;
      }
      expectedCompensation = `Winter's formula: PaCO2 = 1.5 × ${v.HCO3} + 8 = ${expectedPaCO2.toFixed(1)} ± 2`;
      details = [
        `${isHighAG ? 'High anion gap' : 'Normal anion gap'} metabolic acidosis`,
        `Anion gap: ${anionGap.toFixed(1)} (${isHighAG ? 'elevated' : 'normal'})`,
        isHighAG ? 'Consider: DKA, lactic acidosis, uremia, toxins' : 'Consider: diarrhea, RTA, ureteral diversion',
        ...details,
      ];
    } else {
      primary = 'Mixed Disorder';
      compensation = 'Uncompensated';
      details = ['Acidemia without clear single primary process', 'Evaluate for mixed disorder'];
    }
  } else if (isAlkalemic) {
    if (isRespAlkalosis && isMetAlkalosis) {
      primary = 'Mixed Disorder';
      compensation = 'Uncompensated';
      details = ['Mixed respiratory and metabolic alkalosis'];
    } else if (isRespAlkalosis) {
      primary = 'Respiratory Alkalosis';
      const expectedHCO3 = 24 - ((40 - v.PaCO2) / 10) * 2;
      const acuteLowHCO3 = 24 - ((40 - v.PaCO2) / 10) * 5;

      if (v.HCO3 >= 22) {
        compensation = 'Uncompensated (Acute)';
        expectedCompensation = `Acute: expected HCO3 ${expectedHCO3.toFixed(1)}`;
      } else {
        compensation = 'Partially Compensated';
        expectedCompensation = `Acute: ${expectedHCO3.toFixed(1)}, Chronic: ${acuteLowHCO3.toFixed(1)}`;
      }
      actualVsExpected = `Actual HCO3 ${v.HCO3}`;
      details = [
        'Respiratory alkalosis',
        'Consider: anxiety/hyperventilation, PE, sepsis early, CNS disorder, altitude',
      ];
    } else if (isMetAlkalosis) {
      primary = 'Metabolic Alkalosis';
      const expectedPaCO2 = 40 + 0.7 * (v.HCO3 - 24);

      if (Math.abs(v.PaCO2 - expectedPaCO2) <= 2) {
        compensation = 'Fully Compensated';
        actualVsExpected = `PaCO2 ${v.PaCO2} matches expected ${expectedPaCO2.toFixed(1)}`;
      } else {
        compensation = 'Partially Compensated';
        actualVsExpected = `Expected PaCO2 ${expectedPaCO2.toFixed(1)}, actual ${v.PaCO2}`;
      }
      expectedCompensation = `Expected PaCO2 = 40 + 0.7 × (${v.HCO3} - 24) = ${expectedPaCO2.toFixed(1)}`;
      details = [
        'Metabolic alkalosis',
        'Consider: vomiting, NG suction, diuretics, hyperaldosteronism',
        v.Cl < 98 ? 'Low chloride → likely chloride-responsive (volume depletion)' : 'Normal chloride → consider chloride-resistant causes',
      ];
    } else {
      primary = 'Mixed Disorder';
      compensation = 'Uncompensated';
      details = ['Alkalemia without clear single primary process'];
    }
  } else {
    primary = 'Mixed Disorder';
    compensation = 'Fully Compensated';
    details = ['Normal pH with abnormal PaCO2 and HCO3 — fully compensated mixed disorder'];
  }

  // Severity
  let severity: ABGResult['severity'];
  if (primary === 'Normal') severity = 'Normal';
  else if (v.pH < 7.20 || v.pH > 7.55) severity = 'Severe';
  else if (v.pH < 7.30 || v.pH > 7.50) severity = 'Moderate';
  else severity = 'Mild';

  // Color
  let color = 'text-amber-500';
  if (isAcidemic || isMetAcidosis || isRespAcidosis) color = 'text-rose-500';
  else if (isAlkalemic || isMetAlkalosis || isRespAlkalosis) color = 'text-amber-500';
  else color = 'text-emerald-500';
  if (primary === 'Normal') color = 'text-emerald-500';

  return {
    primary,
    severity,
    compensation,
    acidBaseStatus: isAcidemic ? 'Acidemia' : isAlkalemic ? 'Alkalemia' : 'Normal',
    anionGap,
    anionGapStatus: anionGap > 12 ? 'High AG' : 'Normal',
    aaGradient,
    pfrRatio,
    ardsSeverity,
    expectedCompensation,
    actualVsExpected,
    details,
    color,
  };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ABGInterpreter() {
  const [values, setValues] = useState<ABGValues>(DEFAULT_ABG);
  const [result, setResult] = useState<ABGResult | null>(null);

  const updateField = (field: keyof ABGValues, val: string) => {
    setValues(prev => ({ ...prev, [field]: parseFloat(val) || 0 }));
  };

  const interpret = () => {
    setResult(interpretABG(values));
    toast.success('ABG interpretation complete');
  };

  const loadPreset = (preset: (typeof PRESETS)[number]) => {
    setValues(preset.values);
    setResult(interpretABG(preset.values));
    toast.success(`Loaded: ${preset.label}`);
  };

  const severityBadge = (s: string) => {
    if (s === 'Normal') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (s === 'Mild') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    if (s === 'Moderate') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  const inputFields: { key: keyof ABGValues; label: string; min: number; max: number; step: number; unit: string; icon: typeof Wind }[] = [
    { key: 'pH', label: 'pH', min: 6.8, max: 8.0, step: 0.01, unit: '', icon: FlaskConical },
    { key: 'PaCO2', label: 'PaCO₂', min: 10, max: 150, step: 1, unit: 'mmHg', icon: Wind },
    { key: 'PaO2', label: 'PaO₂', min: 20, max: 600, step: 1, unit: 'mmHg', icon: Droplets },
    { key: 'HCO3', label: 'HCO₃⁻', min: 5, max: 50, step: 0.1, unit: 'mEq/L', icon: Beaker },
    { key: 'SaO2', label: 'SaO₂', min: 0, max: 100, step: 1, unit: '%', icon: Target },
    { key: 'BaseExcess', label: 'Base Excess', min: -20, max: 20, step: 0.1, unit: 'mEq/L', icon: Thermometer },
    { key: 'Lactate', label: 'Lactate', min: 0, max: 20, step: 0.1, unit: 'mmol/L', icon: Zap },
    { key: 'FiO2', label: 'FiO₂', min: 21, max: 100, step: 1, unit: '%', icon: Wind },
    { key: 'Na', label: 'Na⁺', min: 100, max: 180, step: 1, unit: 'mEq/L', icon: Activity },
    { key: 'Cl', label: 'Cl⁻', min: 60, max: 140, step: 1, unit: 'mEq/L', icon: Activity },
  ];

  const normalRanges: Record<string, [number, number]> = {
    pH: [7.35, 7.45],
    PaCO2: [35, 45],
    PaO2: [80, 100],
    HCO3: [22, 26],
    SaO2: [95, 100],
    BaseExcess: [-2, 2],
    Lactate: [0.5, 2.0],
    FiO2: [21, 21],
    Na: [136, 145],
    Cl: [98, 106],
  };

  return (
    <section className="space-y-6">
      <SectionHeader icon={Wind} title="ABG Interpreter" subtitle="Arterial Blood Gas Analysis — Auto-Interpretation with Compensation Assessment" />

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.label} variant="outline" size="sm" className="glass-card border-cyan-500/20 hover:border-cyan-500/40 text-xs" onClick={() => loadPreset(p)}>
            {p.icon} {p.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-primary font-semibold flex items-center gap-2"><FlaskConical className="w-5 h-5" /> ABG Values</h3>
          <div className="grid grid-cols-2 gap-4">
            {inputFields.map((f) => {
              const [lo, hi] = normalRanges[f.key] || [0, 999];
              const isNormal = values[f.key] >= lo && values[f.key] <= hi;
              const isLow = values[f.key] < lo;
              return (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <f.icon className="w-3 h-3" />
                    {f.label} {f.unit && <span className="opacity-60">({f.unit})</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min={f.min}
                      max={f.max}
                      step={f.step}
                      value={values[f.key]}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className={cn(
                        'text-sm',
                        !isNormal && 'border-rose-500/50 bg-rose-500/5',
                        isLow && 'text-cyan-400',
                        !isNormal && !isLow && 'text-amber-500'
                      )}
                    />
                    {f.unit && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{f.unit}</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{lo}–{hi}</p>
                </div>
              );
            })}
          </div>
          <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={interpret}>
            <Zap className="w-4 h-4 mr-2" /> Interpret
          </Button>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          {result ? (
            <>
              {/* Primary Diagnosis */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Diagnosis</h3>
                  <Badge variant="outline" className={cn('text-xs', severityBadge(result.severity))}>{result.severity}</Badge>
                </div>
                <p className={cn('text-2xl font-bold', result.color)}>{result.primary}</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Acid-Base Status</p>
                    <p className={cn('font-semibold', result.color)}>{result.acidBaseStatus}</p>
                  </div>
                  <div className="glass-card rounded-lg p-3">
                    <p className="text-muted-foreground text-xs">Compensation</p>
                    <p className="font-semibold text-foreground">{result.compensation}</p>
                  </div>
                </div>
              </div>

              {/* Calculated Values */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Calculator className="w-4 h-4" /> Calculated Values</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">Anion Gap</p>
                    <p className={cn('text-xl font-bold', result.anionGapStatus === 'High AG' ? 'text-rose-500' : 'text-emerald-500')}>
                      <AnimatedCounter target={result.anionGap} decimals={1} />
                    </p>
                    <Badge variant="outline" className={cn('text-[10px]', result.anionGapStatus === 'High AG' ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400')}>
                      {result.anionGapStatus}
                    </Badge>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">A-a Gradient</p>
                    <p className="text-xl font-bold text-amber-500">
                      <AnimatedCounter target={result.aaGradient} decimals={1} suffix=" mmHg" />
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground">P/F Ratio</p>
                    <p className={cn('text-xl font-bold', result.ardsSeverity === 'Normal' ? 'text-emerald-500' : result.ardsSeverity === 'Severe ARDS' ? 'text-rose-500' : 'text-amber-500')}>
                      <AnimatedCounter target={result.pfrRatio} decimals={0} />
                    </p>
                    <Badge variant="outline" className={cn('text-[10px]', result.ardsSeverity === 'Normal' ? 'bg-emerald-500/15 text-emerald-400' : result.ardsSeverity === 'Severe ARDS' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>
                      {result.ardsSeverity}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Compensation Table */}
              <div className="glass-card rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><BookOpen className="w-4 h-4" /> Compensation Assessment</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Expected Compensation</span><span>{result.expectedCompensation}</span></div>
                  <Separator />
                  <div className="flex justify-between"><span className="text-muted-foreground">Actual vs Expected</span><span>{result.actualVsExpected}</span></div>
                </div>
              </div>

              {/* Details */}
              <div className="glass-card rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Info className="w-4 h-4" /> Interpretation Details</h3>
                <ul className="space-y-2">
                  {result.details.map((d, i) => (
                    <motion.li key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex items-start gap-2 text-sm">
                      <span className={cn('mt-1 w-1.5 h-1.5 rounded-full shrink-0', result.primary === 'Normal' ? 'bg-emerald-500' : 'bg-cyan-500')} />
                      {d}
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* ARDS Severity Visual */}
              {result.ardsSeverity !== 'Normal' && (
                <Alert className="border-rose-500/30 bg-rose-500/5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <AlertTitle className="text-rose-400">ARDS Alert</AlertTitle>
                  <AlertDescription className="text-rose-300/80 text-sm">
                    P/F ratio {result.pfrRatio.toFixed(0)} indicates {result.ardsSeverity}. Consider lung-protective ventilation (6 mL/kg PBW), PEEP titration, and prone positioning for moderate-severe ARDS.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FlaskConical className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Enter ABG values and click &ldquo;Interpret&rdquo; to see analysis</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Reference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card rounded-xl p-6">
        <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Normal Ranges &amp; Formulas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="space-y-2">
            <p className="font-semibold text-foreground mb-2">Normal Ranges</p>
            {[
              ['pH', '7.35 – 7.45'], ['PaCO₂', '35 – 45 mmHg'], ['PaO₂', '80 – 100 mmHg'], ['HCO₃⁻', '22 – 26 mEq/L'], ['Base Excess', '-2 to +2 mEq/L'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span>{v}</span></div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground mb-2">Formulas</p>
            <p><span className="text-muted-foreground">Anion Gap:</span> Na - Cl - HCO₃</p>
            <p><span className="text-muted-foreground">A-a Gradient:</span> FiO₂(Patm-PH₂O) - PaCO₂/0.8 - PaO₂</p>
            <p><span className="text-muted-foreground">P/F Ratio:</span> PaO₂ / FiO₂</p>
            <p><span className="text-muted-foreground">Winter&apos;s:</span> 1.5×HCO₃ + 8 ± 2</p>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-foreground mb-2">ARDS Criteria</p>
            {[
              ['Normal', '>400', 'text-emerald-500'], ['Mild', '200–300', 'text-amber-500'], ['Moderate', '100–200', 'text-amber-500'], ['Severe', '<100', 'text-rose-500'],
            ].map(([s, r, c]) => (
              <div key={s} className="flex justify-between"><span className={c}>{s}</span><span className="text-muted-foreground">P/F {r}</span></div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}