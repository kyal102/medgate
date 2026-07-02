'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Pill,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Send,
  History,
  RotateCcw,
  FileText,
  Activity,
  ClipboardCheck,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NaranjoAnswer = 'yes' | 'no' | 'unknown';
type CausalityCategory = 'doubtful' | 'possible' | 'probable' | 'definite';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface NaranjoQuestion {
  id: string;
  question: string;
  yesWeight: number;
  noWeight: number;
}

interface ADRFormData {
  drugName: string;
  reaction: string;
  onsetDate: string;
  outcome: string;
  actionTaken: string;
  notes: string;
  reporterName: string;
}

interface ADRHistoryEntry {
  id: string;
  drugName: string;
  reaction: string;
  causality: CausalityCategory;
  naranjoScore: number;
  timestamp: number;
  reportId: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COMMON_DRUGS = [
  'amoxicillin', 'metformin', 'lisinopril', 'atorvastatin', 'omeprazole',
  'warfarin', 'aspirin', 'metoprolol', 'amlodipine', 'prednisone',
  'azithromycin', 'gabapentin', 'sertraline', 'losartan', 'levothyroxine',
  'ibuprofen', 'acetaminophen', 'ciprofloxacin', 'metronidazole', 'vancomycin',
  'gentamicin', 'furosemide', 'potassium chloride', 'heparin', 'enoxaparin',
  'clopidogrel', 'digoxin', 'phenytoin', 'carbamazepine', 'lithium',
  'methotrexate', 'allopurinol', 'insulin', 'glipizide', 'tramadol',
];

const NARANJO_QUESTIONS: NaranjoQuestion[] = [
  { id: 'q1', question: 'Are there previous conclusive reports on this reaction?', yesWeight: 1, noWeight: 0 },
  { id: 'q2', question: 'Did the adverse event appear after the suspected drug was administered?', yesWeight: 2, noWeight: -1 },
  { id: 'q3', question: 'Did the reaction improve when the drug was discontinued or a specific antagonist was administered?', yesWeight: 1, noWeight: 0 },
  { id: 'q4', question: 'Did the reaction reappear when the drug was readministered?', yesWeight: 2, noWeight: -1 },
  { id: 'q5', question: 'Are there alternative causes (other drugs, disease) that could have caused the reaction?', yesWeight: -1, noWeight: 2 },
  { id: 'q6', question: 'Did the reaction appear when a placebo was given?', yesWeight: -1, noWeight: 1 },
  { id: 'q7', question: 'Was the drug detected in blood (or other fluid) at concentrations known to be toxic?', yesWeight: 1, noWeight: 0 },
  { id: 'q8', question: 'Was the reaction more severe when the dose was increased, or less severe when the dose was decreased?', yesWeight: 1, noWeight: 0 },
  { id: 'q9', question: 'Did the patient have a similar reaction to the same or similar drug in the past?', yesWeight: 1, noWeight: 0 },
  { id: 'q10', question: 'Was the adverse event confirmed by objective evidence?', yesWeight: 1, noWeight: 0 },
];

const OUTCOME_OPTIONS = [
  { value: 'recovered', label: 'Recovered / Resolved' },
  { value: 'recovering', label: 'Recovering / Resolving' },
  { value: 'not_recovered', label: 'Not Recovered / Not Resolved' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'unknown', label: 'Unknown' },
];

const ACTION_OPTIONS = [
  { value: 'withdrawn', label: 'Drug Withdrawn' },
  { value: 'dose_reduced', label: 'Dose Reduced' },
  { value: 'continued', label: 'Drug Continued' },
  { value: 'not_specified', label: 'Not Specified' },
];

const HISTORY_KEY = 'medgate-adr-history';

function loadHistory(): ADRHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ADRHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getCausality(score: number): CausalityCategory {
  if (score >= 9) return 'definite';
  if (score >= 5) return 'probable';
  if (score >= 1) return 'possible';
  return 'doubtful';
}

function causalityColor(cat: CausalityCategory): string {
  if (cat === 'doubtful') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (cat === 'possible') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (cat === 'probable') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse';
}

function causalityTextColor(cat: CausalityCategory): string {
  if (cat === 'doubtful') return 'text-amber-400';
  if (cat === 'possible') return 'text-amber-400';
  if (cat === 'probable') return 'text-rose-400';
  return 'text-rose-400 animate-pulse';
}

function gateColor(gate: GateDecision): string {
  if (gate === 'ALLOW') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (gate === 'NEEDS_REVIEW') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
}

function naranjoBarColor(score: number): string {
  if (score >= 9) return 'bg-rose-500';
  if (score >= 5) return 'bg-rose-400';
  if (score >= 1) return 'bg-amber-500';
  return 'bg-slate-600';
}

const INITIAL_FORM: ADRFormData = {
  drugName: '', reaction: '', onsetDate: '', outcome: '', actionTaken: '',
  notes: '', reporterName: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AdverseDrugReactionReporter() {
  const [form, setForm] = useState<ADRFormData>(INITIAL_FORM);
  const [naranjoAnswers, setNaranjoAnswers] = useState<Record<string, NaranjoAnswer>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ gate: GateDecision; reportId: string } | null>(null);
  const [history, setHistory] = useState<ADRHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return loadHistory(); } catch { return []; }
  });

  const updateForm = (key: keyof ADRFormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setResult(null);
  };

  const setAnswer = (qId: string, answer: NaranjoAnswer) => {
    setNaranjoAnswers(prev => ({ ...prev, [qId]: answer }));
    setResult(null);
  };

  const naranjoScore = useMemo(() => {
    let score = 0;
    for (const q of NARANJO_QUESTIONS) {
      const ans = naranjoAnswers[q.id];
      if (ans === 'yes') score += q.yesWeight;
      else if (ans === 'no') score += q.noWeight;
    }
    return Math.max(0, score);
  }, [naranjoAnswers]);

  const causality = getCausality(naranjoScore);
  const answeredCount = Object.keys(naranjoAnswers).length;
  const naranjoProgress = (answeredCount / NARANJO_QUESTIONS.length) * 100;
  const maxPossible = 13; // theoretical max Naranjo
  const scorePct = Math.min((naranjoScore / maxPossible) * 100, 100);

  const gateDecision: GateDecision = useMemo(() => {
    if (causality === 'definite') return 'BLOCK';
    if (causality === 'probable') return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [causality]);

  const submitReport = async () => {
    if (!form.drugName || !form.reaction) {
      toast.error('Missing required fields', { description: 'Drug name and reaction description are required.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/adr-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          naranjoScore,
          causality,
          answers: naranjoAnswers,
        }),
      });
      let reportId = `ADR-${Date.now()}`;
      let gate = gateDecision;
      if (res.ok) {
        const data = await res.json();
        reportId = data.reportId || reportId;
        gate = data.gateDecision || gate;
      }
      setResult({ gate, reportId });

      // Save to history
      const entry: ADRHistoryEntry = {
        id: Date.now().toString(),
        drugName: form.drugName,
        reaction: form.reaction.slice(0, 60),
        causality,
        naranjoScore,
        timestamp: Date.now(),
        reportId,
      };
      const updated = [entry, ...history].slice(0, 5);
      setHistory(updated);
      saveHistory(updated);

      toast.success('ADR Report Submitted', {
        description: `Causality: ${causality.toUpperCase()} · Score: ${naranjoScore} · ${reportId}`,
      });
    } catch {
      const reportId = `ADR-${Date.now()}`;
      setResult({ gate: gateDecision, reportId });
      toast.error('Submission failed', { description: 'Report saved locally. Server unavailable.' });
    }
    setLoading(false);
  };

  const rerunEntry = (entry: ADRHistoryEntry) => {
    setForm(prev => ({ ...prev, drugName: entry.drugName, reaction: entry.reaction }));
    setResult({ gate: entry.causality === 'definite' || entry.causality === 'probable' ? 'NEEDS_REVIEW' : 'ALLOW', reportId: entry.reportId });
  };

  const filteredDrugs = useMemo(() => {
    if (!form.drugName || form.drugName.length < 1) return [];
    return COMMON_DRUGS.filter(d =>
      d.toLowerCase().includes(form.drugName.toLowerCase())
    ).slice(0, 5);
  }, [form.drugName]);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Pill}
        title="Adverse Drug Reaction Reporter"
        subtitle="Naranjo Algorithm Causality Assessment"
        badge="Naranjo"
        badgeColor="bg-rose-500/20 text-rose-400 border-rose-500/30"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Form + Naranjo */}
        <div className="lg:col-span-3 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* ADR Details */}
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  ADR Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drug Name with autocomplete */}
                <div className="space-y-2 relative">
                  <Label className="text-sm text-slate-300">Drug Name *</Label>
                  <Input
                    value={form.drugName}
                    onChange={e => updateForm('drugName', e.target.value)}
                    placeholder="e.g. amoxicillin, vancomycin..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  {filteredDrugs.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-md shadow-xl overflow-hidden">
                      {filteredDrugs.map(d => (
                        <button
                          key={d}
                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors capitalize"
                          onClick={() => updateForm('drugName', d)}
                        >
                          <Pill className="w-3 h-3 inline mr-2 opacity-50" />
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Reaction Description *</Label>
                  <Textarea
                    value={form.reaction}
                    onChange={e => updateForm('reaction', e.target.value)}
                    placeholder="Describe the adverse reaction in detail..."
                    rows={3}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Onset Date</Label>
                    <Input
                      type="date"
                      value={form.onsetDate}
                      onChange={e => updateForm('onsetDate', e.target.value)}
                      className="bg-slate-800/50 border-slate-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm text-slate-300">Outcome</Label>
                    <Select value={form.outcome} onValueChange={v => updateForm('outcome', v)}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                        <SelectValue placeholder="Select outcome..." />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTCOME_OPTIONS.map(o => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Action Taken</Label>
                  <Select value={form.actionTaken} onValueChange={v => updateForm('actionTaken', v)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                      <SelectValue placeholder="Select action..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Additional Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => updateForm('notes', e.target.value)}
                    placeholder="Any additional information..."
                    rows={2}
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-slate-300">Reporter Name (Optional)</Label>
                  <Input
                    value={form.reporterName}
                    onChange={e => updateForm('reporterName', e.target.value)}
                    placeholder="Your name..."
                    className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Naranjo Algorithm */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="glass-card border-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-amber-400" />
                    Naranjo Algorithm
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{answeredCount}/{NARANJO_QUESTIONS.length}</span>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                      Causality Assessment
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar with color segments */}
                <div className="space-y-2">
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full transition-colors', naranjoBarColor(naranjoScore))}
                      initial={{ width: 0 }}
                      animate={{ width: `${naranjoProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600">
                    <span>0</span>
                    <span className="text-amber-500">Doubtful (0)</span>
                    <span className="text-amber-400">Possible (1–4)</span>
                    <span className="text-rose-400">Probable (5–8)</span>
                    <span className="text-rose-500">Definite (≥9)</span>
                    <span>13</span>
                  </div>
                </div>

                <Separator className="bg-slate-700/50" />

                {/* Questions */}
                <div className="space-y-3">
                  {NARANJO_QUESTIONS.map((q, idx) => (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      className={cn(
                        'rounded-lg border px-4 py-3 transition-colors',
                        naranjoAnswers[q.id]
                          ? 'bg-slate-800/40 border-slate-700/50'
                          : 'bg-slate-800/20 border-slate-700/30'
                      )}
                    >
                      <p className="text-sm text-slate-300 mb-2.5">{idx + 1}. {q.question}</p>
                      <RadioGroup
                        value={naranjoAnswers[q.id] || ''}
                        onValueChange={v => setAnswer(q.id, v as NaranjoAnswer)}
                        className="flex gap-4"
                      >
                        {(['yes', 'no', 'unknown'] as const).map(opt => (
                          <div key={opt} className="flex items-center gap-1.5">
                            <RadioGroupItem
                              value={opt}
                              id={`${q.id}-${opt}`}
                              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                            <Label
                              htmlFor={`${q.id}-${opt}`}
                              className={cn(
                                'text-xs capitalize cursor-pointer',
                                naranjoAnswers[q.id] === opt ? 'text-cyan-400' : 'text-slate-500'
                              )}
                            >
                              {opt}
                              <span className="ml-1 text-[10px] text-slate-600">
                                ({opt === 'yes' ? `+${q.yesWeight}` : opt === 'no' ? `${q.noWeight >= 0 ? '+' : ''}${q.noWeight}` : '+0'})
                              </span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit Button */}
          <Button
            onClick={submitReport}
            disabled={loading || !form.drugName || !form.reaction}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-12"
          >
            {loading ? 'Submitting...' : 'Submit ADR Report'}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Right: Score Visualization */}
        <div className="lg:col-span-2 space-y-4">
          {/* Naranjo Score Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center space-y-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Naranjo Score</p>
                <div className={cn('text-6xl font-bold', causalityTextColor(causality))}>
                  <AnimatedCounter target={naranjoScore} duration={800} />
                  <span className="text-2xl text-slate-500">/13</span>
                </div>

                <Badge variant="outline" className={cn('text-sm px-4 py-1.5', causalityColor(causality))}>
                  {causality.toUpperCase()}
                </Badge>

                {/* Visual bar showing segments */}
                <div className="mt-4 space-y-3">
                  <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                    <motion.div
                      className="h-full bg-amber-500"
                      animate={{ width: `${Math.min(naranjoScore / maxPossible * 100, (4 / maxPossible) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    <motion.div
                      className="h-full bg-rose-400"
                      animate={{
                        width: naranjoScore > 4
                          ? `${Math.min((naranjoScore - 4) / maxPossible * 100, (4 / maxPossible) * 100)}%`
                          : '0%'
                      }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                    <motion.div
                      className="h-full bg-rose-500"
                      animate={{
                        width: naranjoScore > 8
                          ? `${Math.min((naranjoScore - 8) / maxPossible * 100, (5 / maxPossible) * 100)}%`
                          : '0%'
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px] text-center">
                    <span className="text-slate-600">0–0</span>
                    <span className="text-amber-500/70">1–4</span>
                    <span className="text-rose-400/70">5–8</span>
                    <span className="text-rose-500/70">9–13</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[9px] text-center text-slate-500">
                    <span>Doubtful</span>
                    <span>Possible</span>
                    <span>Probable</span>
                    <span>Definite</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Causality Interpretation */}
          <Card className="glass-card border-0">
            <CardContent className="p-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3 font-semibold">Causality Interpretation</p>
              {[
                { cat: 'doubtful' as CausalityCategory, range: '0', desc: 'Reaction unlikely related to the drug', color: 'text-amber-400' },
                { cat: 'possible' as CausalityCategory, range: '1–4', desc: 'Temporal relationship but other causes possible', color: 'text-amber-400' },
                { cat: 'probable' as CausalityCategory, range: '5–8', desc: 'Reasonable temporal relationship, not explained by disease', color: 'text-rose-400' },
                { cat: 'definite' as CausalityCategory, range: '≥ 9', desc: 'Definitive evidence; rechallenge positive', color: 'text-rose-500' },
              ].map(item => (
                <div
                  key={item.cat}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2 rounded-md mb-1.5 text-sm',
                    causality === item.cat ? 'bg-slate-700/30' : 'bg-transparent'
                  )}
                >
                  <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                    item.cat === 'doubtful' || item.cat === 'possible' ? 'bg-amber-500' : 'bg-rose-500'
                  )} />
                  <div>
                    <p className={cn('text-xs font-semibold', item.color)}>
                      {item.cat.toUpperCase()} <span className="text-slate-600">({item.range})</span>
                    </p>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Gate Decision Result */}
          {(result || causality !== 'doubtful') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Alert className={cn('border', gateColor(result?.gate || gateDecision))}>
                {result?.gate === 'ALLOW' || gateDecision === 'ALLOW'
                  ? <CheckCircle2 className="w-4 h-4" />
                  : gateDecision === 'NEEDS_REVIEW' || result?.gate === 'NEEDS_REVIEW'
                    ? <Info className="w-4 h-4" />
                    : <XCircle className="w-4 h-4" />
                }
                <AlertTitle className="text-sm font-bold">
                  Gate Decision: {result?.gate || gateDecision}
                </AlertTitle>
                <AlertDescription className="text-xs text-slate-400">
                  {result?.reportId && <>Report ID: {result.reportId}<br /></>}
                  Naranjo Score: {naranjoScore} — {causality.toUpperCase()} causality
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* History */}
          {history.length > 0 && (
            <Card className="glass-card border-0">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-3.5 h-3.5" />
                  Recent ADR Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-1.5">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => rerunEntry(entry)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <RotateCcw className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                        <div className="text-left min-w-0">
                          <span className="text-xs text-slate-300 block truncate">
                            <span className="font-medium text-white capitalize">{entry.drugName}</span>
                          </span>
                          <span className="text-[10px] text-slate-600 block truncate">{entry.reaction}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0', causalityColor(entry.causality))}>
                          {entry.naranjoScore}
                        </Badge>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}