'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const PATTERNS = [
  { id: 'pt-only', label: 'Elevated PT/INR Only', desc: 'Factor VII or Vitamin K deficiency, Warfarin therapy', findings: { pt: '↑', inr: '↑', aptt: 'Normal', fibrinogen: 'Normal', platelets: 'Normal', ddimer: 'Normal' }, color: 'border-amber-500/40' },
  { id: 'aptt-only', label: 'Elevated aPTT Only', desc: 'Heparin, Factor VIII deficiency, vWD', findings: { pt: 'Normal', inr: 'Normal', aptt: '↑', fibrinogen: 'Normal', platelets: 'Normal', ddimer: 'Normal' }, color: 'border-primary/40' },
  { id: 'both-elevated', label: 'Both PT and aPTT Elevated', desc: 'DIC, Liver disease, Warfarin + Heparin, Vitamin K deficiency', findings: { pt: '↑', inr: '↑', aptt: '↑', fibrinogen: 'Variable', platelets: 'Variable', ddimer: 'Variable' }, color: 'border-rose-500/40' },
  { id: 'low-plt-ddimer', label: 'Low Platelets + Elevated D-dimer', desc: 'DIC, DVT/PE, HIT, TTP/HUS', findings: { pt: 'Variable', inr: 'Variable', aptt: 'Variable', fibrinogen: '↓ in DIC', platelets: '↓', ddimer: '↑' }, color: 'border-rose-500/40' },
  { id: 'high-fibrinogen', label: 'Elevated Fibrinogen Only', desc: 'Acute phase reactant (inflammation, infection, pregnancy)', findings: { pt: 'Normal', inr: 'Normal', aptt: 'Normal', fibrinogen: '↑', platelets: 'Normal', ddimer: 'Variable' }, color: 'border-emerald-500/40' },
  { id: 'dic', label: 'DIC Pattern', desc: 'PT ↑, aPTT ↑, Fibrinogen ↓, Platelets ↓, D-dimer ↑↑', findings: { pt: '↑', inr: '↑', aptt: '↑', fibrinogen: '↓', platelets: '↓', ddimer: '↑↑' }, color: 'border-rose-500/40' },
];

export function CoagulationInterpreter() {
  const [pt, setPt] = useState(12);
  const [inr, setInr] = useState(1.1);
  const [aptt, setAptt] = useState(30);
  const [fibrinogen, setFibrinogen] = useState(350);
  const [platelets, setPlatelets] = useState(250);
  const [ddimer, setDdimer] = useState(0.5);

  const detected = useMemo(() => {
    const results: string[] = [];
    const ptHigh = pt > 14;
    const apttHigh = aptt > 40;
    const fibLow = fibrinogen < 200;
    const pltLow = platelets < 150;
    const dHigh = ddimer > 1.0;
    const inrHigh = inr > 1.3;

    if (ptHigh && !apttHigh && !pltLow && !dHigh) results.push('pt-only');
    if (!ptHigh && apttHigh && !pltLow && !dHigh) results.push('aptt-only');
    if (ptHigh && apttHigh && fibLow && pltLow && dHigh) results.push('dic');
    if (pltLow && dHigh) results.push('low-plt-ddimer');
    if (fibrinogen > 450 && !ptHigh && !apttHigh && !pltLow) results.push('high-fibrinogen');
    if (ptHigh && apttHigh && !fibLow) results.push('both-elevated');
    return results;
  }, [pt, aptt, fibrinogen, platelets, ddimer, inr]);

  const gate = useMemo(() => {
    if (detected.includes('dic') || (inr > 5 && pt > 30)) return 'BLOCK';
    if (detected.length > 0 || inr > 4) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [detected, inr, pt]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2">🩸 Coagulation Panel Interpreter</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: 'PT (sec)', value: pt, set: setPt, normal: '11-14', key: 'pt' },
              { label: 'INR', value: inr, set: setInr, normal: '0.8-1.2', key: 'inr' },
              { label: 'aPTT (sec)', value: aptt, set: setAptt, normal: '25-35', key: 'aptt' },
              { label: 'Fibrinogen (mg/dL)', value: fibrinogen, set: setFibrinogen, normal: '200-400', key: 'fib' },
              { label: 'Platelets (×10⁹/L)', value: platelets, set: setPlatelets, normal: '150-400', key: 'plt' },
              { label: 'D-dimer (mcg/mL)', value: ddimer, set: setDdimer, normal: '<0.5', key: 'dd' },
            ].map(p => (
              <div key={p.key}>
                <Label className="text-[10px]">{p.label} <span className="text-muted-foreground">({p.normal})</span></Label>
                <Input type="number" step="0.1" value={p.value} onChange={e => p.set(parseFloat(e.target.value) || 0)} className={cn('h-8 text-sm', (p.key === 'pt' && pt > 14) || (p.key === 'inr' && inr > 1.3) || (p.key === 'aptt' && aptt > 40) || (p.key === 'fib' && fibrinogen < 200) || (p.key === 'plt' && platelets < 150) || (p.key === 'dd' && ddimer > 1) ? 'border-rose-500/40' : '')} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detected Patterns */}
      {detected.length > 0 ? (
        <div className="space-y-2">
          {detected.map(dId => {
            const p = PATTERNS.find(x => x.id === dId);
            if (!p) return null;
            return (
              <motion.div key={dId} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Card className={cn('glass-card border', p.color)}>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold">{p.label}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <AlertTitle className="text-xs flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-400" /> Normal Coagulation Panel</AlertTitle>
          <AlertDescription className="text-[10px] mt-1">All parameters within normal limits.</AlertDescription>
        </Alert>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>

      {/* Reference */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Anticoagulation Monitoring Targets</CardTitle></CardHeader>
        <CardContent className="space-y-1.5 text-xs">
          <div className="p-2 rounded-lg bg-muted/20"><strong>Warfarin:</strong> DVT/PE/AF: INR 2.0-3.0 | Mechanical valve: INR 2.5-3.5</div>
          <div className="p-2 rounded-lg bg-muted/20"><strong>Unfractionated Heparin:</strong> aPTT 1.5-2.5 × control (typically 60-80 sec)</div>
          <div className="p-2 rounded-lg bg-muted/20"><strong>LMWH (Enoxaparin):</strong> No routine monitoring. Anti-Xa level if renal impairment.</div>
        </CardContent>
      </Card>
    </div>
  );
}