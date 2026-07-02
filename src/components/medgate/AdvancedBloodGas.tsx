'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { FlaskConical, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export function AdvancedBloodGas() {
  const [ph, setPh] = useState(7.40);
  const [paco2, setPaco2] = useState(40);
  const [pao2, setPao2] = useState(80);
  const [hco3, setHco3] = useState(24);
  const [baseExcess, setBaseExcess] = useState(0);
  const [lactate, setLactate] = useState(1.2);
  const [fio2, setFio2] = useState(21);

  const classification = useMemo(() => {
    if (ph < 7.35 && paco2 > 45) return { type: 'Respiratory Acidosis', color: 'abg-acid' };
    if (ph > 7.45 && paco2 < 35) return { type: 'Respiratory Alkalosis', color: 'abg-alkaline' };
    if (ph < 7.35 && hco3 < 22) return { type: 'Metabolic Acidosis', color: 'abg-acid' };
    if (ph > 7.45 && hco3 > 26) return { type: 'Metabolic Alkalosis', color: 'abg-alkaline' };
    if (ph < 7.35) return { type: 'Mixed Acidosis', color: 'abg-acid' };
    if (ph > 7.45) return { type: 'Mixed Alkalosis', color: 'abg-alkaline' };
    return { type: 'Normal', color: 'abg-normal' };
  }, [ph, paco2, hco3]);

  const compensation = useMemo(() => {
    if (paco2 > 45 && ph < 7.35) {
      const expectedHco3Acute = 24 + 0.1 * (paco2 - 40);
      const expectedHco3Chronic = 24 + 0.35 * (paco2 - 40);
      const hco3Range = `${expectedHco3Acute.toFixed(0)}-${expectedHco3Chronic.toFixed(0)}`;
      const isAppropriate = hco3 >= expectedHco3Acute - 2 && hco3 <= expectedHco3Chronic + 2;
      return { expected: `HCO3 expected: ${hco3Range}`, level: isAppropriate ? 'Appropriate' : hco3 < expectedHco3Acute ? 'Uncompensated' : 'Partial compensation' };
    }
    if (hco3 < 22 && ph < 7.35) {
      const expectedPaco2 = 1.5 * hco3 + 8;
      const isAppropriate = Math.abs(paco2 - expectedPaco2) <= 2;
      return { expected: `PaCO2 expected: ${expectedPaco2.toFixed(0)} ± 2`, level: isAppropriate ? 'Appropriate' : paco2 > expectedPaco2 + 2 ? 'Concurrent respiratory acidosis' : 'Concurrent respiratory alkalosis' };
    }
    if (paco2 < 35 && ph > 7.45) {
      const expectedHco3Acute = 24 - 0.2 * (40 - paco2);
      const expectedHco3Chronic = 24 - 0.5 * (40 - paco2);
      return { expected: `HCO3 expected: acute ${expectedHco3Acute.toFixed(0)}, chronic ${expectedHco3Chronic.toFixed(0)}`, level: 'See values' };
    }
    if (hco3 > 26 && ph > 7.45) {
      const expectedPaco2 = 0.7 * hco3 + 21;
      return { expected: `PaCO2 expected: ${expectedPaco2.toFixed(0)} ± 2`, level: Math.abs(paco2 - expectedPaco2) <= 4 ? 'Appropriate' : 'Concurrent disorder' };
    }
    return { expected: '—', level: '—' };
  }, [ph, paco2, hco3]);

  const aaGradient = useMemo(() => {
    const fio2Frac = fio2 / 100;
    const pao2Expected = fio2Frac * (760 - 47) - (paco2 / 0.8);
    return { pao2Expected: Math.round(pao2Expected), gradient: Math.round(pao2Expected - pao2) };
  }, [paco2, pao2, fio2]);

  const pfRatio = fio2 > 0 ? Math.round(pao2 / (fio2 / 100)) : 0;
  const ardsSeverity = pfRatio < 100 ? 'Severe ARDS' : pfRatio < 200 ? 'Moderate ARDS' : pfRatio < 300 ? 'Mild ARDS' : 'No ARDS';

  const gate = useMemo(() => {
    if (ph < 7.1 || ph > 7.6 || lactate > 4 || pfRatio < 100) return 'BLOCK';
    if (ph < 7.2 || ph > 7.55 || lactate > 2) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [ph, lactate, pfRatio]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="w-4 h-4 text-cyan-400" /> Extended ABG Interpreter</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'pH', value: ph, set: setPh, step: 0.01, normal: '7.35-7.45' },
              { label: 'PaCO2', value: paco2, set: setPaco2, step: 1, normal: '35-45 mmHg' },
              { label: 'PaO2', value: pao2, set: setPao2, step: 1, normal: '80-100 mmHg' },
              { label: 'HCO3', value: hco3, set: setHco3, step: 1, normal: '22-26 mEq/L' },
              { label: 'Base Excess', value: baseExcess, set: setBaseExcess, step: 1, normal: '-2 to +2' },
              { label: 'Lactate', value: lactate, set: setLactate, step: 0.1, normal: '<2.0 mmol/L' },
              { label: 'FiO2', value: fio2, set: setFio2, step: 1, normal: '%' },
            ].map(p => (
              <div key={p.label}><Label className="text-[10px]">{p.label} <span className="text-muted-foreground">{p.normal}</span></Label>
                <Input type="number" step={p.step} value={p.value} onChange={e => p.set(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] text-muted-foreground">Classification</div>
            <div className={cn('text-lg font-bold', classification.color === 'abg-acid' ? 'text-rose-400' : classification.color === 'abg-alkaline' ? 'text-primary' : 'text-emerald-400')}>{classification.type}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <div className="text-[10px] text-muted-foreground">Compensation</div>
            <div className="text-xs font-semibold">{compensation.level}</div>
            <div className="text-[10px] text-muted-foreground mt-1">{compensation.expected}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="glass-card"><CardContent className="p-3 text-center">
          <div className="text-[10px] text-muted-foreground">P/F Ratio</div>
          <div className={cn('text-xl font-bold', pfRatio < 100 ? 'text-rose-400' : pfRatio < 200 ? 'text-orange-400' : pfRatio < 300 ? 'text-amber-400' : 'text-emerald-400')}>{pfRatio}</div>
          <div className="text-[9px]">{ardsSeverity}</div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-3 text-center">
          <div className="text-[10px] text-muted-foreground">A-a Gradient</div>
          <div className="text-xl font-bold text-primary">{aaGradient.gradient}</div>
          <div className="text-[9px] text-muted-foreground">Normal: age/4 + 4</div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-3 text-center">
          <div className="text-[10px] text-muted-foreground">Lactate</div>
          <div className={cn('text-xl font-bold', lactate > 4 ? 'text-rose-400' : lactate > 2 ? 'text-amber-400' : 'text-emerald-400')}>{lactate}</div>
          <div className="text-[9px]">{lactate > 4 ? 'Tissue hypoperfusion' : lactate > 2 ? 'Elevated — monitor' : 'Normal'}</div>
        </CardContent></Card>
      </div>

      {pfRatio < 300 && (
        <Alert className="border-rose-500/40 bg-rose-500/10">
          <AlertTitle className="text-xs"><AlertTriangle className="w-3 h-3 text-rose-400 inline mr-1" />{ardsSeverity}</AlertTitle>
          <AlertDescription className="text-[10px] mt-1">
            Berlin criteria: P/F &lt;300 = Mild, &lt;200 = Moderate, &lt;100 = Severe ARDS.
            {pfRatio < 100 && ' Consider prone positioning, neuromuscular blockade, ECMO referral.'}
          </AlertDescription>
        </Alert>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}