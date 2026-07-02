'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Microscope, AlertTriangle, ShieldCheck } from 'lucide-react';

const DRUGS = [
  { name: 'Vancomycin', troughLow: 15, troughHigh: 20, toxicHigh: 30, peakTime: '1h post-infusion', halfLife: '6h', freq: 'Trough 30min before 4th dose' },
  { name: 'Gentamicin', troughLow: '<1', troughHigh: '<2', toxicHigh: 5, peakTime: '30min post-infusion', halfLife: '2-3h', freq: 'Peak 30min after dose, trough before next' },
  { name: 'Tobramycin', troughLow: '<1', troughHigh: '<2', toxicHigh: 5, peakTime: '30min post-infusion', halfLife: '2-3h', freq: 'Same as gentamicin' },
  { name: 'Phenytoin', troughLow: 10, troughHigh: 20, toxicHigh: 25, peakTime: '4-12h post-dose', halfLife: '22h', freq: 'Trough before next dose' },
  { name: 'Digoxin', troughLow: 0.8, troughHigh: 2.0, toxicHigh: 2.4, peakTime: '1-3h', halfLife: '36h', freq: 'Trough ≥6h after last dose' },
  { name: 'Lithium', troughLow: 0.6, troughHigh: 1.2, toxicHigh: 1.5, peakTime: '2-4h', halfLife: '20h', freq: 'Trough 12h post-dose' },
  { name: 'Theophylline', troughLow: 10, troughHigh: 20, toxicHigh: 25, peakTime: '1-2h', halfLife: '8h', freq: 'Trough or peak depending on formulation' },
  { name: 'Carbamazepine', troughLow: 4, troughHigh: 12, toxicHigh: 15, peakTime: '4-8h', halfLife: '12-17h', freq: 'Trough before next dose' },
  { name: 'Valproate', troughLow: 50, troughHigh: 100, toxicHigh: 150, peakTime: '1-4h', halfLife: '12-16h', freq: 'Trough before next dose' },
  { name: 'Cyclosporine', troughLow: 150, troughHigh: 300, toxicHigh: 400, peakTime: '2-4h', halfLife: '8-10h', freq: 'Trough (C0 or C2 monitoring)' },
];

export function DrugLevelInterpreter() {
  const [drugIdx, setDrugIdx] = useState(0);
  const [level, setLevel] = useState(15);

  const drug = DRUGS[drugIdx];
  const interpretation = level < drug.troughLow ? 'subtherapeutic' : level <= drug.troughHigh ? 'therapeutic' : level <= drug.toxicHigh ? 'supratherapeutic' : 'toxic';
  const doseAdj = interpretation === 'subtherapeutic' ? 'Increase dose 10-25%. Recheck level after 3-5 half-lives.' : interpretation === 'supratherapeutic' ? 'Decrease dose 10-25%. Hold 1 dose if significantly elevated.' : interpretation === 'toxic' ? 'HOLD dose immediately. Monitor for toxicity. Consider antidote if available.' : 'Continue current dose. Routine monitoring.';

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-1">
            {DRUGS.map((d, i) => (
              <button key={i} onClick={() => { setDrugIdx(i); setLevel(0); }} className={cn('text-[9px] px-2 py-1 rounded-full border transition-all', drugIdx === i ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30 hover:bg-muted/20')}>{d.name}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Level ({drug.name})</Label><Input type="number" step="0.1" value={level} onChange={e => setLevel(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div className="space-y-1 text-[10px] text-muted-foreground p-2">
              <div>Half-life: <strong>{drug.halfLife}</strong></div>
              <div>Timing: <strong>{drug.peakTime}</strong></div>
              <div>Monitoring: <strong>{drug.freq}</strong></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className={cn('rounded-xl p-6 text-center', interpretation === 'therapeutic' ? 'level-zone-therapeutic' : interpretation === 'toxic' ? 'level-zone-toxic' : interpretation === 'supratherapeutic' ? 'level-zone-subtherapeutic' : 'level-zone-subtherapeutic')}>
        <div className="text-4xl font-bold">{level || '—'}</div>
        <div className="text-xs mt-1">{drug.troughLow}-{drug.troughHigh} therapeutic | >{drug.toxicHigh} toxic</div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs', interpretation === 'therapeutic' ? 'border-emerald-500/40 text-emerald-400' : interpretation === 'toxic' ? 'border-rose-500/40 text-rose-400' : 'border-amber-500/40 text-amber-400')}>
          {interpretation.toUpperCase()}
        </Badge>
        <span className="text-xs text-muted-foreground">{doseAdj}</span>
      </div>
    </div>
  );
}