'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LogOut, AlertTriangle, ShieldCheck, Home, FileCheck } from 'lucide-react';

const CHARLSON_CONDITIONS = [
  { id: 'mi', label: 'Myocardial Infarction', weight: 1 },
  { id: 'chf', label: 'Congestive Heart Failure', weight: 1 },
  { id: 'pvd', label: 'Peripheral Vascular Disease', weight: 1 },
  { id: 'dementia', label: 'Dementia', weight: 1 },
  { id: 'copd', label: 'COPD', weight: 1 },
  { id: 'rheumatic', label: 'Rheumatic Disease', weight: 1 },
  { id: 'peptic', label: 'Peptic Ulcer Disease', weight: 1 },
  { id: 'mildLiver', label: 'Mild Liver Disease', weight: 1 },
  { id: 'dm_nocomp', label: 'Diabetes (no complications)', weight: 1 },
  { id: 'hemiplegia', label: 'Hemiplegia / Paraplegia', weight: 2 },
  { id: 'renal', label: 'Renal Disease (moderate-severe)', weight: 2 },
  { id: 'dm_comp', label: 'Diabetes with complications', weight: 2 },
  { id: 'tumor', label: 'Solid Tumor (non-metastatic)', weight: 2 },
  { id: 'leukemia', label: 'Leukemia', weight: 2 },
  { id: 'lymphoma', label: 'Lymphoma', weight: 2 },
  { id: 'modLiver', label: 'Moderate-Severe Liver Disease', weight: 3 },
  { id: 'metastatic', label: 'Metastatic Tumor', weight: 6 },
  { id: 'hiv', label: 'AIDS / HIV', weight: 6 },
];

export function DischargeReadmissionRisk() {
  const [los, setLos] = useState(5);
  const [acuteAdmission, setAcuteAdmission] = useState(true);
  const [edVisits, setEdVisits] = useState(0);
  const [charlson, setCharlson] = useState<Set<string>>(new Set());

  const toggleCharlson = (id: string) => setCharlson(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const charlsonScore = useMemo(() => {
    let score = 0;
    charlson.forEach(id => { const c = CHARLSON_CONDITIONS.find(x => x.id === id); if (c) score += c.weight; });
    return Math.min(score, 5);
  }, [charlson]);

  const laceScore = useMemo(() => {
    const L = Math.min(los > 13 ? 7 : los <= 0 ? 0 : Math.ceil(los / 2) + 2, 7);
    const A = acuteAdmission ? 3 : 0;
    const C = charlsonScore;
    const E = Math.min(edVisits >= 4 ? 4 : edVisits <= 0 ? 0 : edVisits, 4);
    return { L, A, C, E, total: L + A + C + E };
  }, [los, acuteAdmission, charlsonScore, edVisits]);

  const riskLevel = laceScore.total >= 10 ? 'very-high' : laceScore.total >= 6 ? 'high' : laceScore.total >= 4 ? 'medium' : 'low';
  const readmissionProb = laceScore.total >= 10 ? '~27%' : laceScore.total >= 6 ? '~18%' : laceScore.total >= 4 ? '~12%' : '~6%';

  const gate = useMemo(() => {
    if (laceScore.total >= 10) return 'BLOCK';
    if (laceScore.total >= 6) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [laceScore.total]);

  const dischargeChecklist = useMemo(() => {
    if (riskLevel === 'low') return ['Medication reconciliation complete', 'Follow-up appointment scheduled', 'Patient education provided', 'Discharge summary sent to PCP'];
    if (riskLevel === 'medium') return [...(riskLevel === 'low' ? [] : []), 'Medication reconciliation', 'Follow-up within 7 days', 'Teach-back patient education', 'PCP notification', 'Home health referral consideration'];
    return ['All medium items +', 'Transitional care nurse follow-up', 'Phone call within 48 hours', 'Consider SNF/rehab placement', 'Pharmacist medication review', 'Social work assessment', 'Remote monitoring if available'];
  }, [riskLevel]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><LogOut className="w-4 h-4 text-amber-400" /> LACE Index</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Length of Stay (days)</Label><Input type="number" value={los} onChange={e => setLos(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div>
              <Label className="text-xs">Admission Type</Label>
              <div className="flex gap-2 mt-1">
                <button onClick={() => setAcuteAdmission(true)} className={cn('flex-1 text-[10px] p-2 rounded-lg border transition-all', acuteAdmission ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30')}>Acute (A=3)</button>
                <button onClick={() => setAcuteAdmission(false)} className={cn('flex-1 text-[10px] p-2 rounded-lg border transition-all', !acuteAdmission ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30')}>Elective (A=0)</button>
              </div>
            </div>
            <div><Label className="text-xs">ED Visits (6mo)</Label><Input type="number" min="0" max="4" value={edVisits} onChange={e => setEdVisits(Math.min(4, Math.max(0, parseInt(e.target.value) || 0)))} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Charlson Score</Label><div className="h-8 flex items-center text-lg font-bold text-primary">{charlsonScore}/5 (capped)</div></div>
          </div>
        </CardContent>
      </Card>

      {/* LACE Components */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'L (LOS)', value: laceScore.L, max: 7, desc: 'Length of Stay' },
          { label: 'A (Acute)', value: laceScore.A, max: 3, desc: 'Acute Admission' },
          { label: 'C (Comorbidity)', value: laceScore.C, max: 5, desc: 'Charlson Index' },
          { label: 'E (ED)', value: laceScore.E, max: 4, desc: 'ED Visits' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card"><CardContent className="p-3 text-center">
              <div className="text-[9px] text-muted-foreground">{c.desc}</div>
              <div className={cn('text-2xl font-bold', c.value >= 3 ? 'text-rose-400' : c.value >= 2 ? 'text-amber-400' : 'text-emerald-400')}>{c.value}</div>
              <div className="text-[9px] text-muted-foreground">max {c.max}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">LACE Score</h4>
            <div className="flex items-center gap-3">
              <span className={cn('text-3xl font-bold', riskLevel === 'very-high' ? 'text-rose-400' : riskLevel === 'high' ? 'text-orange-400' : riskLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400')}>{laceScore.total}/19</span>
              <Badge variant="outline" className={cn('text-xs', riskLevel === 'very-high' ? 'border-rose-500/40 text-rose-400' : riskLevel === 'high' ? 'border-orange-500/40 text-orange-400' : riskLevel === 'medium' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>
                {riskLevel === 'very-high' ? 'Very High' : riskLevel === 'high' ? 'High' : riskLevel === 'medium' ? 'Medium' : 'Low'} — {readmissionProb}
              </Badge>
            </div>
          </div>
          <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
            <div className={cn('lace-meter h-full rounded-full', riskLevel === 'very-high' ? 'bg-rose-500' : riskLevel === 'high' ? 'bg-orange-500' : riskLevel === 'medium' ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${(laceScore.total / 19) * 100}%` }} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground"><span>0 (Low)</span><span>4</span><span>6</span><span>10</span><span>19</span></div>
        </CardContent>
      </Card>

      <Alert className={cn(riskLevel === 'very-high' || riskLevel === 'high' ? 'border-rose-500/40 bg-rose-500/10' : riskLevel === 'medium' ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
        <AlertTitle className="flex items-center gap-2 text-xs">
          {riskLevel === 'low' ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3" />}
          30-Day Readmission Risk: {readmissionProb}
        </AlertTitle>
      </Alert>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>

      {/* Charlson */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Charlson Comorbidity Index</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
            {CHARLSON_CONDITIONS.map(c => (
              <label key={c.id} className={cn('flex items-center gap-1.5 text-[10px] cursor-pointer p-1.5 rounded-lg transition-colors', charlson.has(c.id) ? 'bg-primary/10' : 'hover:bg-muted/20')}>
                <Checkbox checked={charlson.has(c.id)} onCheckedChange={() => toggleCharlson(c.id)} />
                <span className="flex-1">{c.label}</span>
                <Badge variant="outline" className="text-[8px] w-5 justify-center">+{c.weight}</Badge>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Discharge Checklist */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileCheck className="w-4 h-4 text-primary" /> Discharge Planning Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {dischargeChecklist.map((item, i) => <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/20"><Home className="w-3 h-3 text-primary flex-shrink-0" />{item}</div>)}
        </CardContent>
      </Card>
    </div>
  );
}