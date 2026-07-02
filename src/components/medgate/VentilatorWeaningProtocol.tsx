'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Wind, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const SBT_CRITERIA = [
  { id: 'alert', label: 'Alert and cooperative', checked: false },
  { id: 'hemodynamic', label: 'Hemodynamically stable (no/low-dose vasopressors)', checked: false },
  { id: 'no-vaso', label: 'No new vasopressors in past 12h', checked: false },
  { id: 'fio2', label: 'FiO2 ≤ 50%', checked: false },
  { id: 'peep', label: 'PEEP ≤ 8 cmH2O', checked: false },
  { id: 'cough', label: 'Effective cough', checked: false },
  { id: 'secretions', label: 'Minimal/managed secretions', checked: false },
  { id: 'metabolic', label: 'Stable metabolic status (no active ischemia, arrhythmia)', checked: false },
];

export function VentilatorWeaningProtocol() {
  const [rr, setRr] = useState(25);
  const [vt, setVt] = useState(300);
  const [sbtPassed, setSbtPassed] = useState<boolean | null>(null);
  const [cuffLeak, setCuffLeak] = useState<boolean | null>(null);
  const [mip, setMip] = useState<number | null>(null);
  const [sbtCriteria, setSbtCriteria] = useState(SBT_CRITERIA);

  const rsbi = vt > 0 ? (rr / vt) * 1000 : 0;
  const rsbiLevel = rsbi < 80 ? 'excellent' : rsbi < 105 ? 'ready' : rsbi < 130 ? 'borderline' : 'not-ready';

  const criteriaMet = sbtCriteria.filter(c => c.checked).length;
  const allCriteria = criteriaMet === sbtCriteria.length;

  const weaningReady = allCriteria && rsbiLevel !== 'not-ready' && rsbiLevel !== 'borderline' && sbtPassed === true;

  const gate = useMemo(() => {
    if (weaningReady) return 'ALLOW';
    if (allCriteria && (rsbiLevel === 'borderline' || sbtPassed === null)) return 'NEEDS_REVIEW';
    return 'BLOCK';
  }, [weaningReady, allCriteria, rsbiLevel, sbtPassed]);

  const toggleCriteria = (id: string) => setSbtCriteria(prev => prev.map(c => c.id === id ? { ...c, checked: !c.checked } : c));

  return (
    <div className="space-y-4">
      {/* RSBI Calculator */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Wind className="w-4 h-4 text-primary" /> Rapid Shallow Breathing Index</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Respiratory Rate (breaths/min)</Label><Input type="number" value={rr} onChange={e => setRr(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Tidal Volume (mL)</Label><Input type="number" value={vt} onChange={e => setVt(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/20">
            <div className="text-[10px] text-muted-foreground">f/Vt Ratio</div>
            <div className={cn('text-4xl font-bold', rsbiLevel === 'excellent' || rsbiLevel === 'ready' ? 'text-emerald-400' : rsbiLevel === 'borderline' ? 'text-amber-400' : 'text-rose-400')}>
              {rsbi.toFixed(0)} <span className="text-lg text-muted-foreground">breaths/L/min</span>
            </div>
            <div className="mt-2 flex justify-center gap-1">
              <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400">&lt;80 Excellent</span>
              <span className={cn('px-2 py-0.5 rounded text-[9px]', rsbi < 105 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>80-105 Ready</span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400">105-130 Borderline</span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-400">&gt;130 Not Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SBT Criteria */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">SBT Readiness Criteria ({criteriaMet}/{sbtCriteria.length})</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {sbtCriteria.map(c => (
            <label key={c.id} className={cn('flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors', c.checked ? 'bg-emerald-500/10' : 'hover:bg-muted/20')} onClick={() => toggleCriteria(c.id)}>
              <div className={cn('w-4 h-4 rounded border flex items-center justify-center text-[9px]', c.checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30')}>{c.checked ? '✓' : ''}</div>
              {c.label}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Additional Predictors */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold">Additional Weaning Predictors</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">SBT Result</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant={sbtPassed === true ? 'default' : 'outline'} onClick={() => setSbtPassed(true)} className={cn('flex-1 text-xs', sbtPassed === true && 'bg-emerald-500/20 text-emerald-400')}><CheckCircle2 className="w-3 h-3 mr-1" /> Passed</Button>
                <Button size="sm" variant={sbtPassed === false ? 'destructive' : 'outline'} onClick={() => setSbtPassed(false)} className="flex-1 text-xs"><XCircle className="w-3 h-3 mr-1" /> Failed</Button>
              </div>
            </div>
            <div>
              <Label className="text-xs">MIP (cmH2O)</Label>
              <Input type="number" value={mip ?? ''} onChange={e => setMip(e.target.value ? parseInt(e.target.value) : null)} className="h-8 text-sm" placeholder="e.g. -25" />
              {mip !== null && <div className="text-[10px] mt-1">{mip <= -20 ? <span className="text-emerald-400">✓ Adequate respiratory muscle strength</span> : <span className="text-rose-400">✗ Weak — may predict weaning failure</span>}</div>}
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Cuff Leak Test</Label>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant={cuffLeak === true ? 'default' : 'outline'} onClick={() => setCuffLeak(true)} className={cn('flex-1 text-xs', cuffLeak === true && 'bg-emerald-500/20 text-emerald-400')}>Positive (Present)</Button>
                <Button size="sm" variant={cuffLeak === false ? 'destructive' : 'outline'} onClick={() => setCuffLeak(false)} className="flex-1 text-xs">Absent/Reduced</Button>
              </div>
              {cuffLeak === false && <div className="text-[10px] mt-1 text-amber-400">⚠ Consider airway edema — may need extubation over bronchoscope or ETT downsize</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert className={cn(gate === 'ALLOW' ? 'border-emerald-500/40 bg-emerald-500/10' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 bg-amber-500/10' : 'border-rose-500/40 bg-rose-500/10')}>
        <AlertTitle className="flex items-center gap-2 text-xs">
          {gate === 'ALLOW' ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3" />}
          {weaningReady ? 'Ready for Extubation' : gate === 'NEEDS_REVIEW' ? 'Proceed with SBT' : 'Not Ready for Weaning'}
        </AlertTitle>
        <AlertDescription className="text-[11px] mt-1">
          {weaningReady ? 'All criteria met, RSBI favorable, SBT passed. Consider extubation with appropriate airway management plan.' : 'Address unmet criteria before attempting weaning. Continue ventilatory support and reassess daily.'}
        </AlertDescription>
      </Alert>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'ALLOW' ? 'border-emerald-500/40 text-emerald-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-rose-500/40 text-rose-400')}>Gate: {gate}</Badge>
    </div>
  );
}