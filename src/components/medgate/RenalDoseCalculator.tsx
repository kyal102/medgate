'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Kidney, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

const DRUGS = [
  { name: 'Vancomycin', normal: '15-20 mg/kg q8-12h', adjustments: [{ minCr: 50, dose: '15 mg/kg q12h' }, { minCr: 30, dose: '15 mg/kg q24h' }, { minCr: 15, dose: '15 mg/kg q48h' }, { minCr: 0, dose: 'Avoid or TDM-guided' }], hd: 'Redose after HD', contraindicated: false },
  { name: 'Gentamicin', normal: '5-7 mg/kg q24h', adjustments: [{ minCr: 50, dose: '5 mg/kg q36-48h' }, { minCr: 30, dose: '5 mg/kg q48h' }, { minCr: 15, dose: 'Avoid' }, { minCr: 0, dose: 'Avoid' }], hd: 'Redose after HD', contraindicated: false },
  { name: 'Meropenem', normal: '1g q8h', adjustments: [{ minCr: 50, dose: '1g q12h' }, { minCr: 30, dose: '500mg q12h' }, { minCr: 15, dose: '500mg q24h' }, { minCr: 0, dose: '500mg q24h + HD' }], hd: '500mg post-HD', contraindicated: false },
  { name: 'Metformin', normal: '500-1000mg BID', adjustments: [{ minCr: 50, dose: 'Reduce dose 50%' }, { minCr: 30, dose: 'Avoid' }, { minCr: 15, dose: 'Avoid' }, { minCr: 0, dose: 'Avoid' }], hd: 'Avoid', contraindicated: true },
  { name: 'Gabapentin', normal: '300-600mg TID', adjustments: [{ minCr: 50, dose: '300-400mg BID' }, { minCr: 30, dose: '100-300mg daily' }, { minCr: 15, dose: '100-300mg q48h' }, { minCr: 0, dose: '100-300mg post-HD' }], hd: '100-300mg post-HD', contraindicated: false },
  { name: 'Enoxaparin (treatment)', normal: '1 mg/kg q12h', adjustments: [{ minCr: 50, dose: '1 mg/kg q12h' }, { minCr: 30, dose: '1 mg/kg q24h (monitor anti-Xa)' }, { minCr: 15, dose: 'Avoid — use UFH' }, { minCr: 0, dose: 'Avoid — use UFH' }], hd: 'Avoid', contraindicated: false },
  { name: 'Amoxicillin', normal: '500mg q8h', adjustments: [{ minCr: 50, dose: '500mg q8h' }, { minCr: 30, dose: '500mg q12h' }, { minCr: 15, dose: '250-500mg q24h' }, { minCr: 0, dose: '250mg post-HD' }], hd: '250mg post-HD', contraindicated: false },
  { name: 'Levofloxacin', normal: '750mg daily', adjustments: [{ minCr: 50, dose: '750mg q48h' }, { minCr: 30, dose: '500mg q48h' }, { minCr: 15, dose: '500mg q48h' }, { minCr: 0, dose: '500mg q48h' }], hd: 'Supplement post-HD', contraindicated: false },
  { name: 'Acyclovir (systemic)', normal: '5-10 mg/kg q8h', adjustments: [{ minCr: 50, dose: '5-10 mg/kg q12h' }, { minCr: 30, dose: '5-10 mg/kg q24h' }, { minCr: 15, dose: '2.5-5 mg/kg q24h' }, { minCr: 0, dose: '2.5 mg/kg q24h post-HD' }], hd: '2.5-5 mg/kg post-HD', contraindicated: false },
  { name: 'Nitrofurantoin', normal: '100mg BID', adjustments: [{ minCr: 50, dose: 'Avoid' }, { minCr: 30, dose: 'Avoid' }, { minCr: 15, dose: 'Avoid' }, { minCr: 0, dose: 'Avoid' }], hd: 'Avoid', contraindicated: true },
  { name: 'Lithium', normal: '300-600mg TID', adjustments: [{ minCr: 50, dose: 'Reduce 25-50%' }, { minCr: 30, dose: 'Reduce 50-75%' }, { minCr: 15, dose: 'Avoid' }, { minCr: 0, dose: 'Avoid' }], hd: 'Supplement post-HD', contraindicated: false },
  { name: 'Digoxin', normal: '0.125-0.25mg daily', adjustments: [{ minCr: 50, dose: '0.125mg q48h' }, { minCr: 30, dose: '0.125mg q72h or TDM' }, { minCr: 15, dose: 'TDM-guided only' }, { minCr: 0, dose: 'TDM-guided' }], hd: 'Supplement post-HD', contraindicated: false },
];

export function RenalDoseCalculator() {
  const [egfr, setEgfr] = useState(60);
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(65);
  const [sex, setSex] = useState('male');
  const [creatinine, setCreatinine] = useState(1.2);
  const [search, setSearch] = useState('');
  const [onHD, setOnHD] = useState(false);

  const ckdStage = egfr >= 90 ? '1' : egfr >= 60 ? '2' : egfr >= 45 ? '3a' : egfr >= 30 ? '3b' : egfr >= 15 ? '4' : '5';
  const stageColor = parseInt(ckdStage) <= 2 ? 'text-emerald-400' : parseInt(ckdStage) === 3 ? 'text-amber-400' : parseInt(ckdStage) === 4 ? 'text-orange-400' : 'text-rose-400';

  const filteredDrugs = DRUGS.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  const getDose = (drug: typeof DRUGS[0]) => {
    if (onHD) return { dose: drug.hd, status: 'hd' as const };
    for (const adj of drug.adjustments) {
      if (egfr >= adj.minCr) return { dose: adj.dose, status: (adj.minCr <= 30 ? 'adjust' : 'safe') as const };
    }
    return { dose: drug.adjustments[drug.adjustments.length - 1].dose, status: 'avoid' as const };
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-[10px]">eGFR (mL/min/1.73m²)</Label><Input type="number" value={egfr} onChange={e => setEgfr(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Creatinine (mg/dL)</Label><Input type="number" step="0.1" value={creatinine} onChange={e => setCreatinine(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Age</Label><Input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Sex</Label>
              <div className="flex gap-1 mt-1">
                <button onClick={() => setSex('male')} className={cn('flex-1 text-[10px] p-1.5 rounded border', sex === 'male' ? 'border-primary/40 bg-primary/10' : 'border-muted/30')}>Male</button>
                <button onClick={() => setSex('female')} className={cn('flex-1 text-[10px] p-1.5 rounded border', sex === 'female' ? 'border-primary/40 bg-primary/10' : 'border-muted/30')}>Female</button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={onHD} onChange={e => setOnHD(e.target.checked)} /> On Hemodialysis</label>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground">CKD Stage:</span>
              <span className={cn('text-lg font-bold', stageColor)}>Stage {ckdStage}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CKD Stage Bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {[1, 2, 3, 4, 5].map(s => <div key={s} className={cn('flex-1 rounded-full', s <= 2 ? 'ckd-stage-1' : s === 3 ? 'ckd-stage-3a' : s === 4 ? 'ckd-stage-4' : 'ckd-stage-5', parseInt(ckdStage) === s && 'ring-2 ring-white/30')} />)}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground"><span>G1 ≥90</span><span>G2 60-89</span><span>G3 30-59</span><span>G4 15-29</span><span>G5 <15</span></div>

      {/* Drug Search */}
      <Input placeholder="Search drugs..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />

      {/* Drug List */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {filteredDrugs.map(drug => {
          const { dose, status } = getDose(drug);
          return (
            <motion.div key={drug.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('renal-drug-row rounded-lg p-3 border', status === 'safe' ? 'renal-drug-safe' : status === 'adjust' ? 'renal-drug-adjust' : 'renal-drug-avoid')}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold">{drug.name}</span>
                  {drug.contraindicated && <Badge className="ml-2 text-[9px] bg-rose-500/20 text-rose-400">Contraindicated</Badge>}
                  {onHD && <Badge className="ml-2 text-[9px] bg-primary/20 text-primary">HD</Badge>}
                </div>
                <Badge variant="outline" className={cn('text-[9px]', status === 'safe' ? 'border-emerald-500/30 text-emerald-400' : status === 'adjust' ? 'border-amber-500/30 text-amber-400' : 'border-rose-500/30 text-rose-400')}>
                  {status === 'safe' ? 'No change' : status === 'adjust' ? 'Adjust' : 'Avoid'}
                </Badge>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">Normal: {drug.normal}</div>
              <div className="mt-0.5 text-[10px] font-medium">{dose}</div>
            </motion.div>
          );
        })}
      </div>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', parseInt(ckdStage) >= 4 ? 'border-rose-500/40 text-rose-400' : parseInt(ckdStage) >= 3 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {parseInt(ckdStage) >= 4 ? 'BLOCK' : parseInt(ckdStage) >= 3 ? 'NEEDS_REVIEW' : 'ALLOW'}</Badge>
    </div>
  );
}