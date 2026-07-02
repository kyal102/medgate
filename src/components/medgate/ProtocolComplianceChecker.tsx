'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CONDITIONS = ['CAP', 'HFrEF', 'Sepsis', 'ACS', 'VTE'];

const PROTOCOLS: Record<string, { guideline: string; checks: { item: string; keywords: string[] }[] }> = {
  CAP: {
    guideline: 'ATS/IDSA 2019 Community-Acquired Pneumonia Guidelines',
    checks: [
      { item: 'Empiric antibiotic covers typical + atypical pathogens (CURB-65 ≥ 2)', keywords: ['azithromycin', 'doxycycline', 'macrolide', 'atypical'] },
      { item: 'Beta-lactam included (amoxicillin, ceftriaxone, cefotaxime)', keywords: ['amoxicillin', 'ceftriaxone', 'cefotaxime', 'beta-lactam', 'amox-clav'] },
      { item: 'Duration appropriate (5 days for stable, 7 days if bacteremic)', keywords: ['5 day', '7 day', '5-day', '7-day', 'duration'] },
      { item: 'CURB-65 or PSI severity assessed', keywords: ['curb', 'psi', 'severity', 'score'] },
    ],
  },
  HFrEF: {
    guideline: 'AHA/ACC/HFSA 2022 Heart Failure Guideline',
    checks: [
      { item: 'ARNI (sacubitril/valsartan) or ACE-I/ARB initiated', keywords: ['arni', 'sacubitril', 'valsartan', 'entresto', 'ace', 'lisinopril', 'ramipril'] },
      { item: 'Beta-blocker (carvedilol, metoprolol succinate, bisoprolol)', keywords: ['carvedilol', 'metoprolol', 'bisoprolol', 'beta-blocker'] },
      { item: 'MRA (spironolactone, eplerenone) if LVEF ≤ 35%', keywords: ['spironolactone', 'eplerenone', 'mra', 'aldosterone'] },
      { item: 'SGLT2 inhibitor (dapagliflozin, empagliflozin)', keywords: ['dapagliflozin', 'empagliflozin', 'sglt2', 'forxiga', 'jardiance'] },
      { item: 'Loop diuretic for volume overload', keywords: ['furosemide', 'bumetanide', 'torsemide', 'diuretic'] },
    ],
  },
  Sepsis: {
    guideline: 'Surviving Sepsis Campaign 2021',
    checks: [
      { item: 'Lactate measured within 1 hour', keywords: ['lactate'] },
      { item: 'Blood cultures obtained before antibiotics', keywords: ['blood culture', 'cultures'] },
      { item: 'Broad-spectrum antibiotics within 1 hour', keywords: ['antibiotic', 'ceftriaxone', 'meropenem', 'vancomycin', 'piperacillin'] },
      { item: '30 mL/kg crystalloid for hypotension/lactate ≥4', keywords: ['crystalloid', 'fluid', '30 ml', 'resuscitation'] },
      { item: 'Vasopressors if MAP < 65 after fluids', keywords: ['vasopressor', 'norepinephrine', 'map'] },
    ],
  },
  ACS: {
    guideline: 'AHA/ACC 2023 STEMI/NSTE-ACS Guidelines',
    checks: [
      { item: 'Aspirin 162-325 mg loading dose', keywords: ['aspirin'] },
      { item: 'P2Y12 inhibitor (ticagrelor, clopidogrel, prasugrel)', keywords: ['ticagrelor', 'clopidogrel', 'prasugrel', 'p2y12', 'brilinta', 'plavix'] },
      { item: 'Anticoagulant (heparin, enoxaparin, bivalirudin)', keywords: ['heparin', 'enoxaparin', 'bivalirudin', 'anticoagulant'] },
      { item: 'High-intensity statin (atorvastatin 80mg or rosuvastatin 40mg)', keywords: ['atorvastatin', 'rosuvastatin', 'statin'] },
      { item: 'Door-to-balloon < 90 min (STEMI) or Door-to-needle < 60 min', keywords: ['balloon', 'cath', 'pci', 'tpa', 'alteplase', 'door'] },
    ],
  },
  VTE: {
    guideline: 'CHEST 2021 Antithrombotic Therapy for VTE',
    checks: [
      { item: 'Anticoagulation initiated (DOAC or LMWH)', keywords: ['apixaban', 'rivaroxaban', 'dabigatran', 'enoxaparin', 'heparin', 'lmwh', 'doac', 'warfarin'] },
      { item: 'DOAC preferred over warfarin (no active cancer)', keywords: ['apixaban', 'rivaroxaban', 'dabigatran', 'doac'] },
      { item: 'Duration appropriate (3 months minimum)', keywords: ['3 month', '6 month', '3-month', 'duration', 'extended'] },
      { item: 'Cancer-associated VTE: LMWH preferred', keywords: ['cancer', 'enoxaparin', 'lmwh', 'dalteparin'] },
    ],
  },
};

interface ComplianceResult {
  condition: string;
  guideline: string;
  passed: number;
  total: number;
  gaps: { item: string; found: boolean }[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export function ProtocolComplianceChecker() {
  const [condition, setCondition] = useState('');
  const [treatment, setTreatment] = useState('');
  const [score, setScore] = useState('');
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [loading, setLoading] = useState(false);

  const pct = result ? Math.round((result.passed / result.total) * 100) : 0;

  const scoreColor = pct === 100 ? 'text-emerald-400' : pct >= 50 ? 'text-amber-400' : 'text-rose-400';
  const scoreGradient = pct === 100 ? 'gradient-text-emerald' : pct >= 50 ? 'gradient-text-amber' : 'gradient-text-rose';

  const ringStroke = useMemo(() => {
    if (!result) return 'stroke-slate-700';
    if (pct === 100) return 'stroke-emerald-500';
    if (pct >= 50) return 'stroke-amber-500';
    return 'stroke-rose-500';
  }, [result, pct]);

  const ringColor = pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#f43f5e';

  const check = async () => {
    if (!condition || !treatment) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/protocol-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition, treatment, score: score ? parseInt(score) : undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        const p = Math.round((data.passed / data.total) * 100);
        if (p === 100) {
          toast.success(`Full compliance: ${data.passed}/${data.total}`, { description: data.guideline });
        } else if (p >= 50) {
          toast.warning(`Partial compliance: ${data.passed}/${data.total} (${p}%)`, { description: 'Some guideline items missing.' });
        } else {
          toast.error(`Non-compliant: ${data.passed}/${data.total} (${p}%)`, { description: 'Major guideline gaps identified.' });
        }
      } else { setResult(localCheck(condition, treatment)); }
    } catch { setResult(localCheck(condition, treatment)); }
    setLoading(false);
  };

  return (
    <section className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Condition</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Severity Score (optional)</label>
              <Input type="number" placeholder="e.g. CURB-65, PSI" value={score} onChange={(e) => setScore(e.target.value)} className="glass-input" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Treatment Plan</label>
            <Textarea placeholder="Describe the treatment plan..." value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={3} className="glass-input" />
          </div>
          <Button onClick={check} disabled={loading || !condition || !treatment} className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
            {loading ? 'Checking...' : 'Check Compliance'}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            key={`${condition}-${result.passed}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-4"
          >
            <Card className="glass-card-hover">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Progress Ring */}
                  <div className="relative w-28 h-28 shrink-0">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" className="stroke-slate-800" strokeWidth="8" />
                      <motion.circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 50}
                        initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - pct / 100) }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className="drop-shadow-lg"
                        style={{ filter: `drop-shadow(0 0 6px ${ringColor}40)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <AnimatedCounter target={pct} suffix="%" className={cn('text-2xl font-bold', scoreGradient)} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Compliance</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <CardTitle className="text-white">
                        <AnimatedCounter target={result.passed} className="gradient-text-cyan text-lg" /> / <AnimatedCounter target={result.total} className="text-lg text-slate-300" /> Items
                      </CardTitle>
                      <Badge variant="outline" className={cn(
                        result.passed === result.total ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                        result.passed >= result.total / 2 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                        'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      )}>
                        {result.passed === result.total ? 'FULLY COMPLIANT' :
                         result.passed >= result.total / 2 ? 'PARTIAL COMPLIANCE' : 'NON-COMPLIANT'}
                      </Badge>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full',
                          result.passed === result.total ? 'bg-emerald-500' :
                          result.passed >= result.total / 2 ? 'bg-amber-500' : 'bg-rose-500'
                        )}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Reference: {result.guideline}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm">Guideline Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {result.gaps.map((g, i) => (
                    <motion.div
                      key={i}
                      variants={itemVariants}
                      className={cn(
                        'flex items-start gap-3 rounded-lg px-3 py-2.5 border transition-colors',
                        g.found
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-rose-500/10 border-rose-500/20'
                      )}
                    >
                      {g.found
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        : <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      }
                      <p className={cn('text-sm', g.found ? 'text-emerald-300' : 'text-rose-300')}>{g.item}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function localCheck(condition: string, treatment: string): ComplianceResult {
  const protocol = PROTOCOLS[condition];
  if (!protocol) return { condition, guideline: 'Unknown', passed: 0, total: 0, gaps: [] };
  const lower = treatment.toLowerCase();
  const gaps = protocol.checks.map((c) => ({
    item: c.item,
    found: c.keywords.some((k) => lower.includes(k)),
  }));
  return {
    condition,
    guideline: protocol.guideline,
    passed: gaps.filter((g) => g.found).length,
    total: gaps.length,
    gaps,
  };
}