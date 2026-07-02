'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Heart, AlertTriangle, ShieldCheck } from 'lucide-react';

const ECG_FINDINGS: Record<string, { label: string; criteria: string; urgency: 'critical' | 'urgent' | 'routine'; action: string }> = {
  'stemi-anterior': { label: 'STEMI — Anterior', criteria: 'ST elevation ≥1mm in 2 contiguous precordial leads (V1-V4), new LBBB', urgency: 'critical', action: 'Immediate cath lab activation. Door-to-balloon <90 min.' },
  'stemi-inferior': { label: 'STEMI — Inferior', criteria: 'ST elevation ≥1mm in II, III, aVF. Check for RV involvement (V4R).', urgency: 'critical', action: 'Immediate cath lab. Avoid NTG if RV infarct.' },
  'stemi-lateral': { label: 'STEMI — Lateral', criteria: 'ST elevation in I, aVL, V5-V6. May indicate LCx occlusion.', urgency: 'critical', action: 'Immediate cath lab activation.' },
  'lvh-sokolow': { label: 'LVH — Sokolow-Lyon', criteria: 'SV1 + RV5 > 35mm (or RaVL + SV3 > 28mm women, >20mm if >40y)', urgency: 'routine', action: 'Assess for target organ damage. Consider echo. Antihypertensive optimization.' },
  'lvh-cornell': { label: 'LVH — Cornell', criteria: 'RaVL + SV3 > 28mm (men) or > 20mm (women)', urgency: 'routine', action: 'Assess for LVH etiology and complications.' },
  'rbbb': { label: 'RBBB', criteria: 'QRS >120ms, rSR\' in V1-V2, wide S in I, aVL, V5-V6', urgency: 'routine', action: 'If new, evaluate for PE, pulmonary HTN, MI. If chronic, no acute action.' },
  'lbbb': { label: 'LBBB', criteria: 'QRS >120ms, broad/notched R in I, aVL, V5-V6, absent R in V1', urgency: 'urgent', action: 'New LBBB = STEMI equivalent. Activate cath lab. If old, treat underlying cause.' },
  'afib': { label: 'Atrial Fibrillation', criteria: 'Irregular R-R intervals, absent P waves, fibrillatory baseline', urgency: 'urgent', action: 'Rate control (beta-blocker, diltiazem). Anticoagulation (CHA2DS2-VASc). If unstable: cardioversion.' },
  'peaks-t': { label: 'Hyperkalemia (Peaked T waves)', criteria: 'Tall, peaked, symmetric T waves in precordial leads', urgency: 'critical', action: 'STAT K+ level. If >6.5: Ca gluconate, insulin+glucose, albuterol, kayexalate. Cardiac monitoring.' },
  'pericarditis': { label: 'Pericarditis', criteria: 'Diffuse ST elevation + PR depression (reciprocal). May have PR elevation in aVR.', urgency: 'urgent', action: 'NSAIDs (ibuprofen 600mg TID). Colchicine. Echo for effusion. Rule out MI.' },
};

export function ECGCriteriaChecker() {
  const [findings, setFindings] = useState<Set<string>>(new Set());

  const toggleFinding = (id: string) => setFindings(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const diagnoses = useMemo(() => {
    return Array.from(findings).map(id => ECG_FINDINGS[id]).filter(Boolean).sort((a, b) => {
      const order = { critical: 0, urgent: 1, routine: 2 };
      return order[a.urgency] - order[b.urgency];
    });
  }, [findings]);

  const hasCritical = diagnoses.some(d => d.urgency === 'critical');
  const hasUrgent = diagnoses.some(d => d.urgency === 'urgent');

  const gate = useMemo(() => {
    if (hasCritical) return 'BLOCK';
    if (hasUrgent) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [hasCritical, hasUrgent]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /> ECG Diagnostic Criteria</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {Object.entries(ECG_FINDINGS).map(([id, f]) => (
            <label key={id} className={cn('flex items-center gap-3 p-2.5 rounded-lg cursor-pointer text-xs transition-all', findings.has(id) ? (f.urgency === 'critical' ? 'bg-rose-500/10 border border-rose-500/30' : f.urgency === 'urgent' ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-primary/10 border border-primary/30') : 'hover:bg-muted/20 border border-transparent')}>
              <Checkbox checked={findings.has(id)} onCheckedChange={() => toggleFinding(id)} />
              <div className="flex-1">
                <div className="font-semibold">{f.label}</div>
                <div className="text-[10px] text-muted-foreground">{f.criteria}</div>
              </div>
              <Badge variant="outline" className={cn('text-[9px]', f.urgency === 'critical' ? 'border-rose-500/40 text-rose-400' : f.urgency === 'urgent' ? 'border-amber-500/40 text-amber-400' : 'border-muted-foreground/30')}>{f.urgency}</Badge>
            </label>
          ))}
        </CardContent>
      </Card>

      {diagnoses.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Detected Abnormalities ({diagnoses.length})</h4>
          {diagnoses.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn('ecg-diagnosis rounded-xl border', d.urgency === 'critical' ? 'ecg-diagnosis-critical' : d.urgency === 'urgent' ? 'ecg-diagnosis-urgent' : 'border-muted/30')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="text-xs font-bold">{d.label}</h5>
                    <Badge variant="outline" className={cn('text-[9px]', d.urgency === 'critical' ? 'border-rose-500/40 text-rose-400' : d.urgency === 'urgent' ? 'border-amber-500/40 text-amber-400' : 'text-muted-foreground')}>{d.urgency.toUpperCase()}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{d.criteria}</p>
                  <div className="mt-2 p-2 rounded-lg bg-muted/20 text-[10px] font-medium">→ {d.action}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {diagnoses.length === 0 && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <AlertTitle className="text-xs flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-400" /> No abnormalities selected</AlertTitle>
        </Alert>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}