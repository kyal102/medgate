'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Heart, AlertTriangle, ShieldCheck, TrendingDown } from 'lucide-react';

const PPS_LEVELS = [
  { pct: 100, label: 'Fully Active', domains: { ambulation: 'Full', activity: 'Normal work/study', selfCare: 'Full', intake: 'Normal', conscious: 'Full' }, prognosis: 'Months to years', goals: 'Curative/life-prolonging treatment' },
  { pct: 90, label: 'Fully Active (some restriction)', domains: { ambulation: 'Full', activity: 'Normal with restrictions', selfCare: 'Full', intake: 'Normal', conscious: 'Full' }, prognosis: 'Months to years', goals: 'Active treatment' },
  { pct: 80, label: 'Reduced Activity', domains: { ambulation: 'Full', activity: 'Unable to work, able to do hobbies', selfCare: 'Full', intake: 'Normal', conscious: 'Full' }, prognosis: 'Months', goals: 'Disease-modifying treatment' },
  { pct: 70, label: 'Limited Self-Care', domains: { ambulation: 'Reduced', activity: 'Unable to do hobbies', selfCare: 'Independent in most care', intake: 'Normal/minimal assist', conscious: 'Full' }, prognosis: 'Weeks to months', goals: 'Palliative + symptom management' },
  { pct: 60, label: 'Limited Self-Care', domains: { ambulation: 'Limited, needs assistance', activity: 'Unable to do most activities', selfCare: 'Needs some assistance', intake: 'Normal/reduced', conscious: 'Full' }, prognosis: 'Weeks', goals: 'Symptom-focused care' },
  { pct: 50, label: 'Reduced Intake', domains: { ambulation: 'Mainly bedbound/sitting', activity: 'Unable to do any work', selfCare: 'Needs considerable assistance', intake: 'Reduced', conscious: 'Full/confused' }, prognosis: 'Weeks', goals: 'Comfort-focused care' },
  { pct: 40, label: 'Primarily Bedbound', domains: { ambulation: 'Totally bedbound', activity: 'None', selfCare: 'Needs total assistance', intake: 'Reduced to minimal', conscious: 'Full/drowsy' }, prognosis: 'Days to weeks', goals: 'Comfort care, family support' },
  { pct: 30, label: 'Totally Bedbound', domains: { ambulation: 'Totally bedbound', activity: 'None', selfCare: 'Total care required', intake: 'Minimal to sips', conscious: 'Drowsy/confused' }, prognosis: 'Days', goals: 'End-of-life care, hospice' },
  { pct: 20, label: 'Totally Bedbound', domains: { ambulation: 'Totally bedbound', activity: 'None', selfCare: 'Total care', intake: 'Mouth care only', conscious: 'Drowsy/confused/semi-conscious' }, prognosis: 'Days', goals: 'Comfort measures only' },
  { pct: 10, label: 'Totally Bedbound', domains: { ambulation: 'Totally bedbound', activity: 'None', selfCare: 'Total care', intake: 'NPO', conscious: 'Semi-comatose/comatose' }, prognosis: 'Hours to days', goals: 'Death imminent, family support' },
  { pct: 0, label: 'Death', domains: { ambulation: 'N/A', activity: 'N/A', selfCare: 'N/A', intake: 'N/A', conscious: 'N/A' }, prognosis: '—', goals: 'Post-death care' },
];

export function PalliativePerformanceScale() {
  const [selectedPct, setSelectedPct] = useState<number | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [history, setHistory] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('pps-history') || '[]'); } catch { return []; }
  });

  const current = selectedPct !== null ? PPS_LEVELS.find(l => l.pct === selectedPct) : null;

  const gate = useMemo(() => {
    if (selectedPct === null) return 'PENDING';
    if (selectedPct <= 20) return 'BLOCK';
    if (selectedPct <= 40) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [selectedPct]);

  const declineRate = useMemo(() => {
    if (history.length < 2) return null;
    const sorted = [...history].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    if (sorted.length < 2) return null;
    const recent = sorted[0].pps as number;
    const previous = sorted[1].pps as number;
    const days = Math.max(1, (new Date(sorted[0].time).getTime() - new Date(sorted[1].time).getTime()) / 86400000);
    return { ppsDrop: previous - recent, days, ratePerWeek: ((previous - recent) / days * 7).toFixed(1) };
  }, [history]);

  const save = () => {
    if (selectedPct === null) return;
    const entry = { id: Date.now(), time: new Date().toISOString(), pps: selectedPct, label: current?.label };
    const newH = [entry, ...history].slice(0, 20);
    setHistory(newH);
    if (typeof window !== 'undefined') localStorage.setItem('pps-history', JSON.stringify(newH));
  };

  return (
    <div className="space-y-4">
      {/* PPS Scale */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-rose-400" /> Palliative Performance Scale (PPS)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-0.5 rounded-lg overflow-hidden">
            {PPS_LEVELS.map(lvl => (
              <motion.button key={lvl.pct} onClick={() => setSelectedPct(lvl.pct)} whileTap={{ scale: 0.95 }}
                className={cn('flex-1 h-8 transition-all text-[9px] font-bold', lvl.pct > 80 ? 'pps-bar bg-emerald-500' : lvl.pct > 50 ? 'pps-bar bg-amber-500' : lvl.pct > 20 ? 'pps-bar bg-orange-500' : 'pps-bar bg-rose-500',
                  selectedPct === lvl.pct ? 'ring-2 ring-white/50 scale-y-150 origin-bottom relative z-10' : 'opacity-70 hover:opacity-100')}
                title={`${lvl.pct}% — ${lvl.label}`}>
                {lvl.pct}
              </motion.button>
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-muted-foreground mt-1"><span>100%</span><span>50%</span><span>0%</span></div>
        </CardContent>
      </Card>

      {/* Details */}
      {current && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid gap-3 md:grid-cols-2">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-bold">PPS {current.pct}% — {current.label}</h4>
              <div className="space-y-1.5 text-[10px]">
                {Object.entries(current.domains).map(([key, val]) => (
                  <div key={key} className="flex justify-between"><span className="capitalize text-muted-foreground">{key}:</span><span className="font-medium">{val}</span></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2">
              <h4 className="text-sm font-bold">Prognosis & Goals</h4>
              <div className="text-xs"><span className="text-muted-foreground">Expected:</span> <strong>{current.prognosis}</strong></div>
              <div className="text-xs"><span className="text-muted-foreground">Goals:</span> {current.goals}</div>
              {selectedPct! <= 30 && (
                <Alert className="border-rose-500/30 bg-rose-500/5 p-2 mt-2">
                  <AlertDescription className="text-[10px] text-rose-400">End-of-life care triggers active. Consider: Comfort care orders, family meeting, spiritual care, symptom management focus.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} className="text-xs">Save Score</Button>
        <Button size="sm" variant="outline" onClick={() => setShowDecline(!showDecline)} className="text-xs"><TrendingDown className="w-3 h-3 mr-1" /> Decline Trajectory</Button>
        <Badge variant="outline" className={cn('ml-auto text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : gate === 'ALLOW' ? 'border-emerald-500/40 text-emerald-400' : 'text-muted-foreground')}>Gate: {gate}</Badge>
      </div>

      {showDecline && declineRate && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold mb-2">Decline Analysis</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-muted/20"><div className="text-lg font-bold text-rose-400">{declineRate.ppsDrop}</div><div className="text-[10px] text-muted-foreground">PPS drop</div></div>
              <div className="p-2 rounded-lg bg-muted/20"><div className="text-lg font-bold">{declineRate.days}</div><div className="text-[10px] text-muted-foreground">Days</div></div>
              <div className="p-2 rounded-lg bg-muted/20"><div className="text-lg font-bold text-amber-400">{declineRate.ratePerWeek}</div><div className="text-[10px] text-muted-foreground">PPS/week</div></div>
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-3">
            <h4 className="text-xs font-semibold mb-2">History ({history.length})</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between text-[10px] p-1.5 rounded bg-muted/20">
                  <span>{new Date(h.time).toLocaleDateString()} {new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <Badge variant="outline" className={cn('text-[9px]', h.pps <= 30 ? 'text-rose-400' : h.pps <= 60 ? 'text-amber-400' : 'text-emerald-400')}>{h.pps}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}