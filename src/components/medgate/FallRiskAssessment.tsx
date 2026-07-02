'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, XCircle, Zap, History, Printer, CheckCircle2,
  User, Stethoscope, Accessibility, Droplets, Footprints, Brain,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MorseItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  options: { label: string; value: string; points: number }[];
}

const MORSE_ITEMS: MorseItem[] = [
  {
    id: 'history',
    label: 'History of falling (within 3 months)',
    icon: <History className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'No', value: 'no', points: 0 },
      { label: 'Yes', value: 'yes', points: 25 },
    ],
  },
  {
    id: 'diagnosis',
    label: 'Secondary diagnosis (≥2 medical diagnoses)',
    icon: <Stethoscope className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'No', value: 'no', points: 0 },
      { label: 'Yes', value: 'yes', points: 15 },
    ],
  },
  {
    id: 'ambulatory',
    label: 'Ambulatory aid',
    icon: <Accessibility className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'None / Bed rest / Nurse assist', value: 'none', points: 0 },
      { label: 'Crutches / Cane / Walker', value: 'crutches', points: 15 },
      { label: 'Furniture', value: 'furniture', points: 30 },
    ],
  },
  {
    id: 'iv',
    label: 'IV therapy / Heparin lock',
    icon: <Droplets className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'No', value: 'no', points: 0 },
      { label: 'Yes', value: 'yes', points: 20 },
    ],
  },
  {
    id: 'gait',
    label: 'Gait',
    icon: <Footprints className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'Normal / Bed rest / Wheelchair', value: 'normal', points: 0 },
      { label: 'Weak', value: 'weak', points: 10 },
      { label: 'Impaired', value: 'impaired', points: 20 },
    ],
  },
  {
    id: 'mental',
    label: 'Mental status',
    icon: <Brain className="w-4 h-4 text-cyan-400" />,
    options: [
      { label: 'Oriented to own ability', value: 'oriented', points: 0 },
      { label: 'Overestimates / Forgets limitations', value: 'overestimates', points: 15 },
    ],
  },
];

interface FormState {
  [key: string]: string;
}

const PRESETS: { label: string; values: FormState; description: string }[] = [
  {
    label: 'Elderly with walker',
    description: 'High risk scenario',
    values: { history: 'yes', diagnosis: 'yes', ambulatory: 'crutches', iv: 'yes', gait: 'impaired', mental: 'overestimates' },
  },
  {
    label: 'Post-op patient',
    description: 'Moderate risk scenario',
    values: { history: 'no', diagnosis: 'yes', ambulatory: 'none', iv: 'yes', gait: 'weak', mental: 'oriented' },
  },
  {
    label: 'Young healthy',
    description: 'Low risk scenario',
    values: { history: 'no', diagnosis: 'no', ambulatory: 'none', iv: 'no', gait: 'normal', mental: 'oriented' },
  },
];

const LOW_INTERVENTIONS = [
  'Standard fall precautions posted at bedside',
  'Keep call light within reach',
  'Non-slip footwear',
  'Maintain bed in low position when not providing care',
  'Adequate lighting in room and hallway',
];

const MODERATE_INTERVENTIONS = [
  'Bed alarm activated',
  'Non-slip socks applied',
  'Assistive device at bedside',
  'Fall risk sign on door',
  'Hourly rounding protocol',
  'Toileting schedule initiated',
  'Occupational therapy consult',
];

const HIGH_INTERVENTIONS = [
  '1:1 sitter assigned',
  'Bed in lowest position with brakes locked',
  'Side rails up (per policy)',
  'Strict toileting schedule (every 2 hours)',
  'Physical therapy consult — gait assessment',
  'Bed alarm activated',
  'Fall risk sign on door + at bedside',
  'Non-slip socks + gripped footwear',
  'Medication review (sedatives, antihypertensives)',
  'Injury prevention mat beside bed',
];

const HISTORY_KEY = 'medgate-fall-risk-history';

interface HistoryEntry {
  score: number;
  risk: string;
  timestamp: string;
  answers: FormState;
}

function getRiskLevel(score: number): { label: string; color: string; bg: string; border: string; textColor: string } {
  if (score >= 45) return { label: 'HIGH RISK', color: 'rose', bg: 'bg-rose-500/20', border: 'border-rose-500/40', textColor: 'text-rose-400' };
  if (score >= 25) return { label: 'MODERATE RISK', color: 'amber', bg: 'bg-amber-500/20', border: 'border-amber-500/40', textColor: 'text-amber-400' };
  return { label: 'LOW RISK', color: 'emerald', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400' };
}

function getGaugeZones(): { label: string; start: number; end: number; color: string }[] {
  return [
    { label: 'Low', start: 0, end: 24, color: '#10b981' },
    { label: 'Moderate', start: 25, end: 44, color: '#f59e0b' },
    { label: 'High', start: 45, end: 125, color: '#f43f5e' },
  ];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export function FallRiskAssessment() {
  const [form, setForm] = useState<FormState>({});
  const [loading, setLoading] = useState(false);
  const [gateDecision, setGateDecision] = useState<{ status: string; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const answers = useMemo(() => {
    const a: FormState = {};
    MORSE_ITEMS.forEach((item) => {
      a[item.id] = form[item.id] || '';
    });
    return a;
  }, [form]);

  const score = useMemo(() => {
    let total = 0;
    MORSE_ITEMS.forEach((item) => {
      const selected = item.options.find((o) => o.value === answers[item.id]);
      if (selected) total += selected.points;
    });
    return total;
  }, [answers]);

  const breakdown = useMemo(() => {
    return MORSE_ITEMS.map((item) => {
      const selected = item.options.find((o) => o.value === answers[item.id]);
      return { ...item, selectedOption: selected || null, points: selected?.points || 0 };
    });
  }, [answers]);

  const risk = getRiskLevel(score);
  const allAnswered = MORSE_ITEMS.every((item) => answers[item.id] !== '');
  const interventions = score >= 45 ? HIGH_INTERVENTIONS : score >= 25 ? MODERATE_INTERVENTIONS : LOW_INTERVENTIONS;

  const set = (id: string, val: string) => {
    setForm((prev) => ({ ...prev, [id]: val }));
    setGateDecision(null);
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setForm(preset.values);
    setGateDecision(null);
  };

  const resetForm = () => {
    setForm({});
    setGateDecision(null);
  };

  const saveToHistory = () => {
    const entry: HistoryEntry = {
      score,
      risk: risk.label,
      timestamp: new Date().toISOString(),
      answers: { ...answers },
    };
    const updated = [entry, ...history].slice(0, 5);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const assess = async () => {
    if (!allAnswered) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/fall-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, score, risk: risk.label }),
      });
      if (res.ok) {
        const data = await res.json();
        setGateDecision({ status: data.status || (score >= 45 ? 'BLOCK' : 'PASS'), message: data.message || '' });
      } else {
        setGateDecision({
          status: score >= 45 ? 'BLOCK' : 'PASS',
          message: score >= 45
            ? `HIGH FALL RISK (Score: ${score}). Intensive fall prevention protocol required. 1:1 sitter recommended.`
            : `Fall risk assessed at ${risk.label} (Score: ${score}). Standard precautions in effect.`,
        });
      }
    } catch {
      setGateDecision({
        status: score >= 45 ? 'BLOCK' : 'PASS',
        message: score >= 45
          ? `HIGH FALL RISK (Score: ${score}). Intensive fall prevention protocol required. 1:1 sitter recommended.`
          : `Fall risk assessed at ${risk.label} (Score: ${score}). Standard precautions in effect.`,
      });
    }
    saveToHistory();
    toast.success('Assessment saved', { description: `Morse Fall Scale: ${score} — ${risk.label}` });
    setLoading(false);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setForm(entry.answers);
    setGateDecision(null);
  };

  const scorePercent = Math.min((score / 125) * 100, 100);

  return (
    <section id="fall-risk" className="py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <SectionHeader
          icon={ShieldCheck}
          title="Fall Risk Assessment"
          subtitle="Morse Fall Scale — Evidence-Based Fall Prevention"
          badge="Safety Gate"
        />

        {/* Quick presets */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 flex-wrap">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Presets</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
            >
              {preset.label}
              <span className="text-[10px] text-slate-500 ml-1">({preset.description})</span>
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Assessment form */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold text-lg">Morse Fall Scale Assessment</h3>
                  <p className="text-sm text-slate-400">Complete all 6 items for accurate scoring</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Score</p>
                  <AnimatedCounter
                    target={score}
                    className={cn('text-4xl font-bold font-mono', risk.textColor)}
                  />
                  <p className="text-xs text-slate-500">/ 125</p>
                </div>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
                {breakdown.map((item) => (
                  <motion.div key={item.id} variants={itemVariants}>
                    <div className="flex items-start gap-3 mb-2">
                      {item.icon}
                      <Label className="text-sm text-slate-300 font-medium">{item.label}</Label>
                      {item.points > 0 && (
                        <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-600 ml-auto">
                          +{item.points} pts
                        </Badge>
                      )}
                    </div>
                    <RadioGroup
                      value={answers[item.id] || ''}
                      onValueChange={(v) => set(item.id, v)}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7"
                    >
                      {item.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={cn(
                            'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                            answers[item.id] === opt.value
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                              : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                          )}
                        >
                          <RadioGroupItem value={opt.value} className="sr-only" />
                          <div className={cn(
                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                            answers[item.id] === opt.value
                              ? 'border-cyan-400'
                              : 'border-slate-600'
                          )}>
                            {answers[item.id] === opt.value && (
                              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 rounded-full bg-cyan-400" />
                            )}
                          </div>
                          <span className="flex-1">{opt.label}</span>
                          {opt.points > 0 && (
                            <span className="text-[10px] text-slate-500">({opt.points})</span>
                          )}
                        </label>
                      ))}
                    </RadioGroup>
                    <Separator className="mt-4 bg-slate-800" />
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={assess}
                  disabled={loading || !allAnswered}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow"
                >
                  {loading ? 'Assessing...' : 'Assess & Verify'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="border-slate-700 text-slate-400 hover:text-white">
                  Reset
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="border-slate-700 text-slate-400 hover:text-white ml-auto">
                  <Printer className="w-4 h-4 mr-2" />Print Badge
                </Button>
              </div>
            </Card>

            {/* Score breakdown table */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                        <th className="text-left py-2 pr-4">Item</th>
                        <th className="text-left py-2 pr-4">Selection</th>
                        <th className="text-right py-2">Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map((item, i) => (
                        <tr key={item.id} className="border-b border-slate-800/50">
                          <td className="py-2.5 pr-4 text-slate-300">{item.label}</td>
                          <td className="py-2.5 pr-4 text-slate-400">
                            {item.selectedOption ? item.selectedOption.label : <span className="text-slate-600 italic">Not assessed</span>}
                          </td>
                          <td className={cn('py-2.5 text-right font-mono font-semibold', item.points > 0 ? 'text-amber-400' : 'text-slate-500')}>
                            {item.points}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-slate-600">
                        <td className="py-3 pr-4 font-semibold text-white" colSpan={2}>Total Score</td>
                        <td className={cn('py-3 text-right font-mono font-bold text-lg', risk.textColor)}>{score}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Risk gauge + interventions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk gauge */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Risk Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Print-friendly badge */}
                <div className="flex justify-center print:block">
                  <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold', risk.bg, risk.border, risk.textColor)}>
                    <span className={cn('w-3 h-3 rounded-full', score >= 45 ? 'bg-rose-500' : score >= 25 ? 'bg-amber-500' : 'bg-emerald-500')} />
                    {risk.label}
                  </div>
                </div>

                {/* Horizontal gauge bar */}
                <div className="space-y-2">
                  <div className="relative h-12 rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
                    <div className="absolute inset-0 flex">
                      <div className="h-full flex-1" style={{ width: '19.2%', backgroundColor: '#10b981' }} />
                      <div className="h-full" style={{ width: '16%', backgroundColor: '#f59e0b' }} />
                      <div className="h-full flex-1" style={{ width: '64.8%', backgroundColor: '#f43f5e' }} />
                    </div>
                    {/* Needle indicator */}
                    <motion.div
                      className="absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/30 z-10"
                      style={{ left: `${Math.max(2, Math.min(scorePercent, 98))}%` }}
                      animate={{ left: `${Math.max(2, Math.min(scorePercent, 98))}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                    </motion.div>
                    {/* Zone labels */}
                    <div className="absolute inset-0 flex items-center justify-around text-[10px] font-bold text-white/80 pointer-events-none px-3">
                      <span>LOW</span>
                      <span>MODERATE</span>
                      <span>HIGH</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0</span>
                    <span>25</span>
                    <span>45</span>
                    <span>125</span>
                  </div>
                </div>

                {/* Score interpretation */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-400">Low (0-24): Standard precautions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-slate-400">Moderate (25-44): Enhanced precautions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="text-slate-400">High (≥45): Intensive protocol</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Intervention recommendations */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Prevention Interventions</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.ul variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                  {interventions.map((item, i) => (
                    <motion.li key={i} variants={itemVariants} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={cn('w-4 h-4 mt-0.5 shrink-0', risk.textColor)} />
                      <span className="text-slate-300">{item}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              </CardContent>
            </Card>
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
                  : 'bg-emerald-500/10 border-emerald-500/40'
              )}>
                {gateDecision.status === 'BLOCK'
                  ? <XCircle className="w-4 h-4 text-rose-400" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                }
                <AlertTitle className={cn('font-bold', gateDecision.status === 'BLOCK' ? 'text-rose-400' : 'text-emerald-400')}>
                  Gate Decision: {gateDecision.status}
                </AlertTitle>
                <AlertDescription className="text-slate-300">{gateDecision.message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assessment history */}
        {history.length > 0 && (
          <Card className="glass-card rounded-xl p-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Assessment History</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700">
                  Last {history.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map((entry, i) => {
                  const entryRisk = getRiskLevel(entry.score);
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => loadHistoryEntry(entry)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all text-left"
                    >
                      <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', entry.score >= 45 ? 'bg-rose-500' : entry.score >= 25 ? 'bg-amber-500' : 'bg-emerald-500')} />
                      <span className="text-sm font-mono font-bold text-white">{entry.score}</span>
                      <Badge variant="outline" className={cn('text-[10px]', entryRisk.bg, entryRisk.border, entryRisk.textColor)}>
                        {entryRisk.label}
                      </Badge>
                      <span className="text-xs text-slate-500 ml-auto">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}