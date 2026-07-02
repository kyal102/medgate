'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Zap, CheckCircle2, XCircle, ChevronDown, ChevronUp, Activity,
  User, Scissors, Pill, AlertTriangle, Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RiskFactor {
  id: string;
  label: string;
  points: number;
  category: 'demographics' | 'surgical' | 'medical';
}

const DEMOGRAPHIC_FACTORS: RiskFactor[] = [
  { id: 'age_40_59', label: 'Age 40–59', points: 1, category: 'demographics' },
  { id: 'age_60_74', label: 'Age 60–74', points: 2, category: 'demographics' },
  { id: 'age_75', label: 'Age ≥75', points: 3, category: 'demographics' },
  { id: 'bmi_overweight', label: 'BMI 25–29.9 (Overweight)', points: 1, category: 'demographics' },
  { id: 'bmi_obese', label: 'BMI 30–39.9 (Obese)', points: 2, category: 'demographics' },
  { id: 'bmi_morbid', label: 'BMI ≥40 (Morbidly Obese)', points: 3, category: 'demographics' },
];

const SURGICAL_FACTORS: RiskFactor[] = [
  { id: 'surg_minor', label: 'Minor surgery', points: 1, category: 'surgical' },
  { id: 'surg_major', label: 'Major surgery', points: 2, category: 'surgical' },
  { id: 'surg_ortho', label: 'Orthopedic surgery (hip/knee)', points: 3, category: 'surgical' },
  { id: 'surg_cancer', label: 'Cancer surgery', points: 5, category: 'surgical' },
  { id: 'surg_lap', label: 'Laparoscopic procedure', points: 1, category: 'surgical' },
  { id: 'surg_anesthesia', label: 'Anesthesia >30 minutes', points: 1, category: 'surgical' },
  { id: 'surg_emergency', label: 'Emergency surgery', points: 2, category: 'surgical' },
  { id: 'surg_prev_major', label: 'Previous major surgery', points: 1, category: 'surgical' },
];

const MEDICAL_FACTORS: RiskFactor[] = [
  { id: 'active_cancer', label: 'Active cancer', points: 2, category: 'medical' },
  { id: 'prior_vte', label: 'Prior VTE', points: 3, category: 'medical' },
  { id: 'varicose', label: 'Varicose veins', points: 1, category: 'medical' },
  { id: 'cva', label: 'Central venous access', points: 2, category: 'medical' },
  { id: 'immob_72', label: 'Immobilization >72 hours', points: 2, category: 'medical' },
  { id: 'paralysis', label: 'Paralysis (paraplegia/hemiplegia)', points: 2, category: 'medical' },
  { id: 'pregnancy', label: 'Pregnancy', points: 1, category: 'medical' },
  { id: 'postpartum', label: 'Postpartum (<1 month)', points: 1, category: 'medical' },
  { id: 'ocp', label: 'Oral contraceptives / HRT', points: 1, category: 'medical' },
  { id: 'sepsis', label: 'Sepsis (<1 month)', points: 2, category: 'medical' },
  { id: 'pneumonia', label: 'Pneumonia (<1 month)', points: 2, category: 'medical' },
  { id: 'mi', label: 'MI (<1 month)', points: 2, category: 'medical' },
  { id: 'chf', label: 'CHF (<1 month)', points: 1, category: 'medical' },
  { id: 'ibd', label: 'Inflammatory bowel disease', points: 1, category: 'medical' },
  { id: 'nephrotic', label: 'Nephrotic syndrome', points: 1, category: 'medical' },
  { id: 'myeloprolif', label: 'Myeloproliferative disorder', points: 1, category: 'medical' },
  { id: 'platelets', label: 'Platelets >350,000/μL', points: 1, category: 'medical' },
  { id: 'ddimer', label: 'Elevated D-dimer', points: 1, category: 'medical' },
  { id: 'family_vte', label: 'Family history of VTE', points: 1, category: 'medical' },
  { id: 'thrombophilia', label: 'Known thrombophilia', points: 3, category: 'medical' },
];

const ALL_FACTORS = [...DEMOGRAPHIC_FACTORS, ...SURGICAL_FACTORS, ...MEDICAL_FACTORS];

const PROPHYLAXIS: Record<string, { label: string; items: string[] }> = {
  'very-low': {
    label: 'Very Low / Low Risk',
    items: ['Early and frequent ambulation', 'Adequate hydration', 'Compression stockings (optional)', 'No pharmacologic prophylaxis required'],
  },
  moderate: {
    label: 'Moderate Risk',
    items: ['Mechanical prophylaxis: TEDs / SCDs', 'Early ambulation protocol', 'Consider pharmacologic prophylaxis (LMWH or UFH)', 'Reassess risk at 24-48 hours', 'Hydration optimization'],
  },
  high: {
    label: 'High Risk',
    items: ['Pharmacologic prophylaxis: LMWH (enoxaparin) or fondaparinux', 'Mechanical prophylaxis: SCDs + TEDs (dual)', 'Early ambulation when safe', 'Daily risk reassessment', 'Bleeding risk assessment q12h', 'Consider IVC filter if contraindicated to anticoagulation', 'D-dimer monitoring if clinically indicated'],
  },
};

const PRESETS: { label: string; description: string; factors: string[] }[] = [
  {
    label: 'Total knee replacement',
    description: 'Very high risk',
    factors: ['age_60_74', 'bmi_obese', 'surg_ortho', 'surg_anesthesia', 'immob_72', 'ocp', 'ddimer'],
  },
  {
    label: 'General surgery >60',
    description: 'High risk',
    factors: ['age_60_74', 'surg_major', 'surg_anesthesia', 'active_cancer', 'sepsis'],
  },
  {
    label: 'Minor procedure',
    description: 'Low risk',
    factors: ['age_40_59', 'surg_minor'],
  },
];

const CATEGORIES = [
  { id: 'demographics', label: 'Demographics', icon: <User className="w-4 h-4 text-cyan-400" /> },
  { id: 'surgical', label: 'Surgical Factors', icon: <Scissors className="w-4 h-4 text-cyan-400" /> },
  { id: 'medical', label: 'Medical History', icon: <Pill className="w-4 h-4 text-cyan-400" /> },
];

const HISTORY_KEY = 'medgate-vte-risk-history';

interface HistoryEntry {
  score: number;
  risk: string;
  timestamp: string;
  selected: string[];
}

function getRiskInfo(score: number): { label: string; bg: string; border: string; textColor: string; gaugeColor: string; level: string } {
  if (score >= 5) return { label: 'HIGH RISK', bg: 'bg-rose-500/20', border: 'border-rose-500/40', textColor: 'text-rose-400', gaugeColor: '#f43f5e', level: 'high' };
  if (score >= 3) return { label: 'MODERATE RISK', bg: 'bg-amber-500/20', border: 'border-amber-500/40', textColor: 'text-amber-400', gaugeColor: '#f59e0b', level: 'moderate' };
  if (score >= 1) return { label: 'LOW RISK', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400', gaugeColor: '#10b981', level: 'very-low' };
  return { label: 'VERY LOW RISK', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', textColor: 'text-emerald-400', gaugeColor: '#10b981', level: 'very-low' };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export function VTERiskAssessment() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(['medical']));
  const [loading, setLoading] = useState(false);
  const [gateDecision, setGateDecision] = useState<{ status: string; message: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const score = useMemo(() => {
    let total = 0;
    selected.forEach((id) => {
      const factor = ALL_FACTORS.find((f) => f.id === id);
      if (factor) total += factor.points;
    });
    return total;
  }, [selected]);

  const riskInfo = getRiskInfo(score);
  const selectedFactors = useMemo(() => ALL_FACTORS.filter((f) => selected.has(f.id)), [selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setGateDecision(null);
  };

  const toggleCategory = (catId: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId); else next.add(catId);
      return next;
    });
  };

  const applyPreset = (factors: string[]) => {
    setSelected(new Set(factors));
    setGateDecision(null);
  };

  const resetForm = () => {
    setSelected(new Set());
    setGateDecision(null);
  };

  const saveToHistory = () => {
    const entry: HistoryEntry = {
      score,
      risk: riskInfo.label,
      timestamp: new Date().toISOString(),
      selected: Array.from(selected),
    };
    const updated = [entry, ...history].slice(0, 5);
    setHistory(updated);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  };

  const assess = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/vte-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, risk: riskInfo.label, factors: Array.from(selected) }),
      });
      if (res.ok) {
        const data = await res.json();
        setGateDecision({
          status: data.status || (score >= 5 ? 'BLOCK' : 'PASS'),
          message: data.message || '',
        });
      } else {
        setGateDecision({
          status: score >= 5 ? 'BLOCK' : 'PASS',
          message: score >= 5
            ? `HIGH VTE RISK (Caprini: ${score}). Pharmacologic + mechanical prophylaxis required. Block if no prophylaxis documented.`
            : `Caprini score: ${score} — ${riskInfo.label}. ${riskInfo.level === 'moderate' ? 'Mechanical prophylaxis recommended.' : 'Early ambulation recommended.'}`,
        });
      }
    } catch {
      setGateDecision({
        status: score >= 5 ? 'BLOCK' : 'PASS',
        message: `Caprini score: ${score} — ${riskInfo.label}. ${score >= 5 ? 'Pharmacologic + mechanical prophylaxis required.' : 'Standard precautions.'}`,
      });
    }
    saveToHistory();
    toast.success('Assessment saved', { description: `Caprini Score: ${score} — ${riskInfo.label}` });
    setLoading(false);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setSelected(new Set(entry.selected));
    setGateDecision(null);
  };

  const getFactorsForCategory = (catId: string) => {
    return ALL_FACTORS.filter((f) => f.category === catId);
  };

  const prophylaxisRec = PROPHYLAXIS[riskInfo.level] || PROPHYLAXIS['very-low'];

  const maxPossibleScore = 42;
  const scorePercent = Math.min((score / maxPossibleScore) * 100, 100);

  return (
    <section id="vte-risk" className="py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <SectionHeader
          icon={Activity}
          title="VTE Risk Assessment"
          subtitle="Caprini Score — Venous Thromboembolism Risk Stratification"
          badge="Safety Gate"
        />

        {/* Quick presets */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 flex-wrap">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-2">Quick Presets</span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset.factors)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700/50 bg-slate-800/60 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
            >
              {preset.label}
              <span className="text-[10px] text-slate-500 ml-1">({preset.description})</span>
            </button>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Risk factor form */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="glass-card rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-white font-semibold text-lg">Caprini Risk Factor Assessment</h3>
                  <p className="text-sm text-slate-400">Check all applicable risk factors</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Caprini Score</p>
                  <AnimatedCounter target={score} className={cn('text-4xl font-bold font-mono', riskInfo.textColor)} />
                  <p className="text-xs text-slate-500">/ {maxPossibleScore}</p>
                </div>
              </div>

              {/* Collapsible categories */}
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                {CATEGORIES.map((cat) => {
                  const factors = getFactorsForCategory(cat.id);
                  const isCollapsed = collapsed.has(cat.id);
                  const selectedInCat = factors.filter((f) => selected.has(f.id)).length;

                  return (
                    <motion.div key={cat.id} variants={itemVariants}>
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="w-full flex items-center justify-between py-2 group"
                      >
                        <div className="flex items-center gap-2">
                          {cat.icon}
                          <span className="text-sm font-semibold text-white">{cat.label}</span>
                          {selectedInCat > 0 && (
                            <Badge variant="outline" className="text-[10px] bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                              {selectedInCat} selected
                            </Badge>
                          )}
                        </div>
                        {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
                      </button>

                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6 mt-1 mb-2">
                              {factors.map((factor) => (
                                <label
                                  key={factor.id}
                                  className={cn(
                                    'flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                                    selected.has(factor.id)
                                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                                      : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                                  )}
                                >
                                  <Checkbox
                                    checked={selected.has(factor.id)}
                                    onCheckedChange={() => toggle(factor.id)}
                                    className="border-slate-600"
                                  />
                                  <span className="flex-1">{factor.label}</span>
                                  <Badge variant="outline" className={cn(
                                    'text-[10px] font-mono',
                                    factor.points >= 3 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                                    factor.points >= 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                    'bg-slate-800 text-slate-400 border-slate-600'
                                  )}>
                                    +{factor.points}
                                  </Badge>
                                </label>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <Separator className="bg-slate-800 mt-1" />
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button onClick={assess} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
                  {loading ? 'Assessing...' : 'Assess & Verify'}
                </Button>
                <Button variant="outline" onClick={resetForm} className="border-slate-700 text-slate-400 hover:text-white">
                  Reset
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Score display + recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Risk gauge */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Risk Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center">
                  <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold', riskInfo.bg, riskInfo.border, riskInfo.textColor)}>
                    <span className={cn('w-3 h-3 rounded-full', score >= 5 ? 'bg-rose-500' : score >= 3 ? 'bg-amber-500' : 'bg-emerald-500')} />
                    {riskInfo.label}
                  </div>
                </div>

                {/* Risk level scale */}
                <div className="space-y-1">
                  {[
                    { label: 'Very Low (0)', end: 0, color: '#10b981' },
                    { label: 'Low (1-2)', end: 12, color: '#10b981' },
                    { label: 'Moderate (3-4)', end: 24, color: '#f59e0b' },
                    { label: 'High (≥5)', end: 100, color: '#f43f5e' },
                  ].map((zone) => (
                    <div key={zone.label} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: zone.color }} />
                      <span className="text-slate-400 w-24">{zone.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(scorePercent * (zone.end / 100), 100)}%`, backgroundColor: zone.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Risk factor chips */}
                {selectedFactors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Selected Risk Factors</p>
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence>
                        {selectedFactors.map((f) => (
                          <motion.div
                            key={f.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          >
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] cursor-pointer',
                                f.points >= 3 ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30' :
                                f.points >= 2 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30' :
                                'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                              )}
                              onClick={() => toggle(f.id)}
                            >
                              {f.label} <span className="ml-1 opacity-60">+{f.points}</span>
                            </Badge>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prophylaxis recommendations */}
            <Card className="glass-card rounded-xl p-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Recommended Prophylaxis</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className={cn('text-xs mb-3', riskInfo.bg, riskInfo.border, riskInfo.textColor)}>
                  {prophylaxisRec.label}
                </Badge>
                <motion.ul variants={containerVariants} initial="hidden" animate="show" className="space-y-2 mt-3">
                  {prophylaxisRec.items.map((item, i) => (
                    <motion.li key={i} variants={itemVariants} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={cn('w-4 h-4 mt-0.5 shrink-0', riskInfo.textColor)} />
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
                {history.map((entry, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => loadHistoryEntry(entry)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/60 hover:border-slate-600 transition-all text-left"
                  >
                    <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', entry.score >= 5 ? 'bg-rose-500' : entry.score >= 3 ? 'bg-amber-500' : 'bg-emerald-500')} />
                    <span className="text-sm font-mono font-bold text-white">{entry.score}</span>
                    <Badge variant="outline" className={cn('text-[10px]', entry.score >= 5 ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : entry.score >= 3 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')}>
                      {entry.risk}
                    </Badge>
                    <span className="text-xs text-slate-500 ml-auto">
                      {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}