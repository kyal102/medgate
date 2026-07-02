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
import { AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Info } from 'lucide-react';

const RISK_FACTORS = [
  { id: 'sepsis', label: 'Sepsis / SIRS' },
  { id: 'contrast', label: 'Iodinated Contrast' },
  { id: 'nephrotoxins', label: 'Nephrotoxic Drugs (NSAIDs, Aminoglycosides)' },
  { id: 'hypovolemia', label: 'Hypovolemia / Dehydration' },
  { id: 'chf', label: 'Congestive Heart Failure' },
  { id: 'cirrhosis', label: 'Cirrhosis / Hepatic Failure' },
  { id: 'age', label: 'Age > 65' },
  { id: 'dm', label: 'Diabetes Mellitus' },
  { id: 'htn', label: 'Hypertension' },
  { id: 'ckd', label: 'Pre-existing CKD' },
  { id: 'surgery', label: 'Major Surgery / Cardiac Surgery' },
  { id: 'rhabdo', label: 'Rhabdomyolysis Risk' },
];

const INTERVENTIONS = [
  'Discontinue nephrotoxic agents',
  'Optimize volume status (crystalloid resuscitation)',
  'Avoid hypotension (MAP > 65 mmHg)',
  'Monitor strict I&O and daily weights',
  'Check creatinine and electrolytes q6-12h',
  'Avoid contrast if possible (use alternative imaging)',
  'Consider N-acetylcysteine pre-contrast (if unavoidable)',
  'Monitor urine output hourly',
  'Assess for bladder obstruction',
  'Review medication list for renally-cleared drugs',
];

export function AKIRiskPredictor() {
  const [currentCr, setCurrentCr] = useState(1.2);
  const [baselineCr, setBaselineCr] = useState(1.0);
  const [urineOutput, setUrineOutput] = useState(60);
  const [urinePeriod, setUrinePeriod] = useState(6);
  const [patientWeight, setPatientWeight] = useState(70);
  const [riskFactors, setRiskFactors] = useState<Set<string>>(new Set());

  const toggleRisk = (id: string) => {
    setRiskFactors(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const kdigo = useMemo(() => {
    const ratio = baselineCr > 0 ? currentCr / baselineCr : 0;
    const increase = currentCr - baselineCr;
    const uoPerKg = patientWeight > 0 ? (urineOutput / urinePeriod) / (patientWeight) : 0;
    let stage = 0;
    let reason = 'No AKI';
    if (increase >= 0.3 || ratio >= 1.5) { stage = 1; reason = `Cr increase ≥0.3 mg/dL or ratio ≥1.5x (ratio: ${ratio.toFixed(2)})`; }
    if (ratio >= 2) { stage = 2; reason = `Cr ratio ≥2.0x (ratio: ${ratio.toFixed(2)})`; }
    if (ratio >= 3 || currentCr >= 4.0 || uoPerKg < 0.3 && urinePeriod >= 24) { stage = 3; reason = ratio >= 3 ? `Cr ratio ≥3.0x` : currentCr >= 4 ? 'Cr ≥4.0 mg/dL' : 'UO <0.3 mL/kg/hr × 24h'; }
    return { stage, ratio, increase, uoPerKg, reason };
  }, [currentCr, baselineCr, urineOutput, urinePeriod, patientWeight]);

  const riskLevel = useMemo(() => {
    const factorCount = riskFactors.size;
    if (kdigo.stage >= 3) return 'critical';
    if (kdigo.stage >= 2) return 'high';
    if (kdigo.stage >= 1 || factorCount >= 3) return 'moderate';
    if (factorCount >= 1) return 'low';
    return 'none';
  }, [kdigo.stage, riskFactors]);

  const gate = useMemo(() => {
    if (kdigo.stage >= 3) return 'BLOCK';
    if (kdigo.stage >= 2 || riskFactors.size >= 4) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [kdigo.stage, riskFactors]);

  return (
    <div className="space-y-4">
      {/* KDIGO Input */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> KDIGO AKI Staging</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Baseline Cr (mg/dL)</Label><Input type="number" step="0.1" value={baselineCr} onChange={e => setBaselineCr(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Current Cr (mg/dL)</Label><Input type="number" step="0.1" value={currentCr} onChange={e => setCurrentCr(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Urine Output (mL)</Label><Input type="number" value={urineOutput} onChange={e => setUrineOutput(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Over (hours)</Label><Input type="number" value={urinePeriod} onChange={e => setUrinePeriod(parseFloat(e.target.value) || 1)} className="h-8 text-sm" /></div>
          </div>
          <div className="w-1/3"><Label className="text-xs">Weight (kg)</Label><Input type="number" value={patientWeight} onChange={e => setPatientWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
        </CardContent>
      </Card>

      {/* KDIGO Staging Diagram */}
      <div className="grid gap-2">
        {[{ stage: 1, label: 'Stage 1', desc: 'Cr ↑≥0.3 or ×1.5', class: 'aki-stage-1' }, { stage: 2, label: 'Stage 2', desc: 'Cr ×2.0', class: 'aki-stage-2' }, { stage: 3, label: 'Stage 3', desc: 'Cr ×3.0 or ≥4.0 or UO <0.3 ×24h', class: 'aki-stage-3' }].map(s => (
          <motion.div key={s.stage} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: s.stage * 0.1 }}
            className={cn('rounded-xl p-3 flex items-center gap-3 border transition-all', s.class, kdigo.stage === s.stage ? 'ring-2 ring-offset-2 ring-offset-background' : 'opacity-50', kdigo.stage === s.stage && s.stage === 1 ? 'ring-amber-500/50' : kdigo.stage === s.stage && s.stage === 2 ? 'ring-orange-500/50' : kdigo.stage === s.stage && s.stage === 3 ? 'ring-rose-500/50' : '')}>
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold', kdigo.stage === s.stage ? (s.stage === 1 ? 'bg-amber-500 text-white' : s.stage === 2 ? 'bg-orange-500 text-white' : 'bg-rose-500 text-white') : 'bg-muted text-muted-foreground')}>{s.stage}</div>
            <div><div className="font-semibold text-sm">{s.label}</div><div className="text-xs text-muted-foreground">{s.desc}</div></div>
            {kdigo.stage === s.stage && <Badge className="ml-auto text-xs" variant="destructive">Current</Badge>}
          </motion.div>
        ))}
        {kdigo.stage === 0 && <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30"><ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" /><span className="text-sm font-medium text-emerald-400">No AKI — Normal Kidney Function</span></div>}
      </div>

      {/* Risk Factors */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Risk Factors ({riskFactors.size})</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {RISK_FACTORS.map(rf => (
              <label key={rf.id} className="flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg hover:bg-muted/20 transition-colors">
                <Checkbox checked={riskFactors.has(rf.id)} onCheckedChange={() => toggleRisk(rf.id)} />
                {rf.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Alert className={cn(kdigo.stage >= 2 ? 'border-rose-500/40 bg-rose-500/10' : kdigo.stage === 1 ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
        <AlertTitle className="flex items-center gap-2">
          {kdigo.stage >= 2 ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : kdigo.stage === 1 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          KDIGO Stage {kdigo.stage} — {riskLevel.toUpperCase()}
        </AlertTitle>
        <AlertDescription className="mt-1 text-xs">{kdigo.stage > 0 ? kdigo.reason : 'No acute kidney injury detected. Continue standard monitoring.'}</AlertDescription>
      </Alert>
      {kdigo.stage >= 2 && (
        <Card className="glass-card border-rose-500/30">
          <CardContent className="p-4 space-y-1.5">
            <h4 className="text-sm font-semibold text-rose-400">⚠️ Consider Renal Replacement Therapy (RRT) if:</h4>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>• Refractory fluid overload not responding to diuretics</div><div>• Severe metabolic acidosis (pH &lt;7.1)</div>
              <div>• Hyperkalemia refractory to medical management</div><div>• Uremic complications (encephalopathy, pericarditis)</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
      </div>

      {/* Interventions */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Preventive Interventions</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {INTERVENTIONS.map((int, i) => <div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />{int}</div>)}
        </CardContent>
      </Card>
    </div>
  );
}