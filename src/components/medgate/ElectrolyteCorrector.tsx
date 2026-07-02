'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

export function ElectrolyteCorrector() {
  const [electrolyte, setElectrolyte] = useState<'k' | 'na' | 'mg' | 'ca'>('k');
  const [current, setCurrent] = useState(3.0);
  const [target, setTarget] = useState(4.0);
  const [weight, setWeight] = useState(70);

  const kDeficit = useMemo(() => {
    if (electrolyte !== 'k') return null;
    return Math.round(0.4 * weight * (target - current));
  }, [electrolyte, target, current, weight]);

  const naDeficit = useMemo(() => {
    if (electrolyte !== 'na') return null;
    const tbw = weight * 0.6;
    const deficit = tbw * (target - current);
    return { deficit: Math.round(deficit), rate24h: Math.min(8, target - current) };
  }, [electrolyte, target, current, weight]);

  const correctedCa = useMemo(() => {
    if (electrolyte !== 'ca') return null;
    const albumin = 4.0; // assumed
    return current + 0.8 * (4 - albumin);
  }, [electrolyte, current]);

  const gate = useMemo(() => {
    if (electrolyte === 'k' && current < 2.5) return 'BLOCK';
    if (electrolyte === 'k' && current < 3.0) return 'NEEDS_REVIEW';
    if (electrolyte === 'na' && current < 120) return 'BLOCK';
    if (electrolyte === 'na' && current < 130) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [electrolyte, current]);

  return (
    <div className="space-y-4">
      <Tabs value={electrolyte} onValueChange={v => setElectrolyte(v as 'k' | 'na' | 'mg' | 'ca')}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 overflow-x-auto">
          <TabsTrigger value="k" className="text-xs shrink-0">K⁺ Potassium</TabsTrigger>
          <TabsTrigger value="na" className="text-xs shrink-0">Na⁺ Sodium</TabsTrigger>
          <TabsTrigger value="mg" className="text-xs shrink-0">Mg²⁺ Magnesium</TabsTrigger>
          <TabsTrigger value="ca" className="text-xs shrink-0">Ca²⁺ Calcium</TabsTrigger>
        </TabsList>

        <TabsContent value="k" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Current K⁺ (mEq/L)</Label><Input type="number" step="0.1" value={current} onChange={e => setCurrent(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Target K⁺ (mEq/L)</Label><Input type="number" step="0.1" value={target} onChange={e => setTarget(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-amber-500/10"><div className="text-[10px] text-muted-foreground">K⁺ Deficit</div><div className="text-2xl font-bold text-amber-400">{kDeficit} mEq</div></div>
                <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">PO KCl Equivalent</div><div className="text-2xl font-bold text-primary">{Math.round(kDeficit / 13.4 * 40)} mEq</div></div>
              </div>
              {current < 3.5 && (
                <Alert className={cn(current < 2.5 ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-500/40 bg-amber-500/10')}>
                  <AlertTitle className="text-xs">{current < 2.5 ? '🚨 CRITICAL HYPOKALEMIA' : '⚠️ Hypokalemia'}</AlertTitle>
                  <AlertDescription className="text-[10px] mt-1 space-y-1">
                    <div>• <strong>Peripheral IV:</strong> Max 10 mEq/hr (preferred 5-10 mEq/hr)</div>
                    <div>• <strong>Central line:</strong> Max 20-40 mEq/hr with cardiac monitoring</div>
                    <div>• <strong>Never IV push</strong> undiluted KCl</div>
                    <div>• <strong>Recheck K+ 1-2 hours</strong> after replacement</div>
                    {current < 2.5 && <div className="text-rose-400 font-bold">• Risk of arrhythmia — continuous cardiac monitoring MANDATORY</div>}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="na" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Current Na⁺ (mEq/L)</Label><Input type="number" step="1" value={current} onChange={e => setCurrent(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Target Na⁺ (mEq/L)</Label><Input type="number" step="1" value={target} onChange={e => setTarget(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
              </div>
              {naDeficit && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-primary/10"><div className="text-[10px] text-muted-foreground">Water Deficit</div><div className="text-2xl font-bold text-primary">{naDeficit.deficit} mL</div></div>
                    <div className="p-3 rounded-lg bg-amber-500/10"><div className="text-[10px] text-muted-foreground">Max Correction 24h</div><div className="text-2xl font-bold text-amber-400">{naDeficit.rate24h} mEq/L</div></div>
                  </div>
                  <Alert className="border-amber-500/40 bg-amber-500/10">
                    <AlertTitle className="text-xs">⚠️ Osmotic Demyelination Syndrome Risk</AlertTitle>
                    <AlertDescription className="text-[10px] mt-1 space-y-1">
                      <div>• <strong>Limit correction:</strong> ≤8 mEq/L in 24 hours</div>
                      <div>• <strong>Chronic hyponatremia:</strong> Do NOT correct faster than 10-12 mEq/L/24h</div>
                      <div>• <strong>3% Hypertonic saline:</strong> {(target - current) > 0 ? `Need ~${Math.round(naDeficit.deficit * 0.0513)} mL of 3% NaCl` : '—'}</div>
                      <div>• Check Na+ every 2-4 hours during correction</div>
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mg" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Current Mg²⁺ (mg/dL)</Label><Input type="number" step="0.1" value={current} onChange={e => setCurrent(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 space-y-2">
                <div className="font-semibold">Replacement Protocol</div>
                <div>• <strong>Asymptomatic (1.2-1.6):</strong> MgSO4 1-2g IV over 1h, then 1g q6-12h</div>
                <div>• <strong>Symptomatic/Torsades (&lt;1.2):</strong> MgSO4 2g IV over 2-5 min, then 1-2g/hr infusion</div>
                <div>• <strong>Severe (&lt;0.5):</strong> MgSO4 2g IV bolus, then 3-4g over 24h</div>
                <div className="text-muted-foreground">Normal: 1.7-2.2 mg/dL | Hypomagnesemia: &lt;1.7</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ca" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div><Label className="text-xs">Measured Ca²⁺ (mg/dL)</Label><Input type="number" step="0.1" value={current} onChange={e => setCurrent(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Albumin (g/dL)</Label><Input type="number" step="0.1" value={4.0} className="h-8 text-sm" readOnly /></div>
                <div className="flex items-end"><div className="p-2 rounded-lg bg-muted/20 text-center w-full"><div className="text-[10px]">Corrected Ca</div><div className="text-lg font-bold text-primary">{correctedCa?.toFixed(1)}</div></div></div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20 space-y-2">
                <div className="font-semibold">Hypocalcemia Treatment</div>
                <div>• <strong>Asymptomatic (7.0-8.4):</strong> Ca gluconate 1g (10mL of 10%) IV over 10-20 min</div>
                <div>• <strong>Symptomatic/Tetany (&lt;7.0):</strong> Ca gluconate 1-2g IV over 10 min, may repeat</div>
                <div>• <strong>Caution:</strong> Ca chloride = 3× more Ca²⁺ than gluconate but causes tissue necrosis if extravasation</div>
                <div>• Monitor K+ and Mg²⁺ concurrently (refractory hypocalcemia often due to hypomagnesemia)</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}