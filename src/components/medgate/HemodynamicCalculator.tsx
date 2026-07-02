'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { HeartPulse, AlertTriangle, ShieldCheck } from 'lucide-react';

const SHOCK_TYPES = [
  { id: 'distributive', label: 'Distributive (Septic)', color: 'border-rose-500/40 bg-rose-500/5', findings: { map: 'Low (<65)', svr: 'Low (<800)', co: 'High/Normal', cvp: 'Low/Normal', temp: 'High' }, firstLine: 'Fluid resuscitation + Norepinephrine', drugs: ['Norepinephrine: 0.1-2 mcg/kg/min', 'Vasopressin: 0.03 U/min (adjunct)', 'Epinephrine: 2nd line', 'Dobutamine: if low CO', 'Hydrocortisone 200mg/day if refractory'] },
  { id: 'cardiogenic', label: 'Cardiogenic', color: 'border-orange-500/40 bg-orange-500/5', findings: { map: 'Low', svr: 'High (>1200)', co: 'Low (<4)', cvp: 'High (>12)', temp: 'Normal' }, firstLine: 'Inotropes ± Vasopressors', drugs: ['Dobutamine: 2-20 mcg/kg/min', 'Milrinone: 0.375-0.75 mcg/kg/min', 'Norepinephrine: if MAP <65 on inotrope', 'Epinephrine: if refractory', 'Mechanical support: IABP, Impella'] },
  { id: 'hypovolemic', label: 'Hypovolemic', color: 'border-amber-500/40 bg-amber-500/5', findings: { map: 'Low', svr: 'High', co: 'Low', cvp: 'Low (<4)', temp: 'Normal/Low' }, firstLine: 'Volume resuscitation', drugs: ['Crystalloid (NS/LR): 30 mL/kg bolus', 'Blood products if hemorrhagic', 'Norepinephrine: transient while resuscitating', 'Vasopressin: 2nd line', 'Surgical source control if bleeding'] },
  { id: 'obstructive', label: 'Obstructive', color: 'border-purple-500/40 bg-purple-500/5', findings: { map: 'Low', svr: 'High', co: 'Low', cvp: 'High', temp: 'Normal' }, firstLine: 'Relieve obstruction', drugs: ['PE: Anticoagulation + Thrombolytics/Embolectomy', 'Tamponade: Pericardiocentesis', 'Tension PTX: Needle decompression + chest tube', 'PEEP: for massive PE (reduce RV afterload)', 'Norepinephrine: while definitive treatment'] },
];

export function HemodynamicCalculator() {
  const [map, setMap] = useState(70);
  const [cvp, setCvp] = useState(8);
  const [co, setCo] = useState(5);
  const [hr, setHr] = useState(80);
  const [svr, setSvr] = useState(1200);

  const sv = hr > 0 ? (co * 1000) / hr : 0;
  const ci = 1.8 > 0 ? co / 1.8 : 0; // BSA assumed 1.8

  const detectedShock = useMemo(() => {
    if (svr < 800 && map < 65) return 'distributive';
    if (svr > 1200 && co < 4 && cvp > 12) return 'cardiogenic';
    if (cvp < 4 && co < 4) return 'hypovolemic';
    if (cvp > 12 && co < 4 && svr > 1200) return 'obstructive';
    return null;
  }, [svr, map, co, cvp]);

  const gate = useMemo(() => {
    if (map < 60 || detectedShock) return 'BLOCK';
    if (map < 65) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [map, detectedShock]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><HeartPulse className="w-4 h-4 text-rose-400" /> Hemodynamic Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'MAP', value: map, set: setMap, unit: 'mmHg', normal: '65-90', key: 'map' },
              { label: 'CVP', value: cvp, set: setCvp, unit: 'mmHg', normal: '2-8', key: 'cvp' },
              { label: 'CO', value: co, set: setCo, unit: 'L/min', normal: '4-8', key: 'co' },
              { label: 'HR', value: hr, set: setHr, unit: '/min', normal: '60-100', key: 'hr' },
              { label: 'SVR', value: svr, set: setSvr, unit: 'dynes·s/cm⁵', normal: '800-1200', key: 'svr' },
            ].map(p => (
              <div key={p.key}>
                <Label className="text-[10px]">{p.label} ({p.unit}) <span className="text-muted-foreground">{p.normal}</span></Label>
                <Input type="number" step="0.1" value={p.value} onChange={e => p.set(parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Stroke Volume</div><div className="text-lg font-bold text-primary">{sv.toFixed(0)} mL</div><div className="text-[10px] text-muted-foreground">Normal: 60-100</div></div>
            <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Cardiac Index</div><div className="text-lg font-bold text-primary">{ci.toFixed(2)} L/min/m²</div><div className="text-[10px] text-muted-foreground">Normal: 2.5-4.0</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Shock Classification */}
      <div className="grid gap-2 md:grid-cols-2">
        {SHOCK_TYPES.map(shock => (
          <motion.div key={shock.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn('shock-card rounded-xl p-4 border', shock.color, detectedShock === shock.id && 'ring-2 ring-primary/60')}>
            <h4 className="text-sm font-semibold mb-2">{shock.label}</h4>
            <div className="space-y-1 text-[10px]">
              {Object.entries(shock.findings).map(([k, v]) => (
                <div key={k} className="flex justify-between"><span className="text-muted-foreground uppercase">{k}</span><span className="font-medium">{v}</span></div>
              ))}
            </div>
            {detectedShock === shock.id && <Badge className="mt-2 text-[10px]">DETECTED</Badge>}
          </motion.div>
        ))}
      </div>

      {detectedShock && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert className="border-rose-500/40 bg-rose-500/10">
            <AlertTitle className="text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-rose-400" /> {SHOCK_TYPES.find(s => s.id === detectedShock)?.label} Shock Detected</AlertTitle>
            <AlertDescription className="text-[10px] mt-1">
              <div className="font-semibold">First-line: {SHOCK_TYPES.find(s => s.id === detectedShock)?.firstLine}</div>
              <div className="mt-1 space-y-0.5">{SHOCK_TYPES.find(s => s.id === detectedShock)?.drugs.map((d, i) => <div key={i}>• {d}</div>)}</div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>

      {/* Fluid Responsiveness */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Fluid Responsiveness Predictors</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/20"><strong>PPV (Pulse Pressure Variation):</strong> >12% suggests fluid responsive (requires: MV, Vt 8 mL/kg, RR <15, regular rhythm)</div>
          <div className="p-2 rounded-lg bg-muted/20"><strong>SVV (Stroke Volume Variation):</strong> >13% suggests fluid responsive (same requirements as PPV)</div>
          <div className="p-2 rounded-lg bg-muted/20"><strong>PLR (Passive Leg Raise):</strong> ↑ CO ≥10% after PLR suggests fluid responsive (reliable regardless of MV status)</div>
          <div className="p-2 rounded-lg bg-muted/20"><strong>CVP:</strong> Poor predictor. <10 mmHg does NOT predict fluid responsiveness. Not recommended.</div>
        </CardContent>
      </Card>
    </div>
  );
}