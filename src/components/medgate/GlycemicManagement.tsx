'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Droplets, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export function GlycemicManagement() {
  const [bg, setBg] = useState(180);
  const [weight, setWeight] = useState(70);
  const [isf, setIsf] = useState(50);
  const [target, setTarget] = useState(150);
  const [carbs, setCarbs] = useState(0);
  const [scenario, setScenario] = useState('icu');

  const correctionDose = bg > target ? Math.ceil((bg - target) / isf) : 0;
  const bgZone = bg < 54 ? 'severe-hypo' : bg < 70 ? 'hypo' : bg < 100 ? 'low' : bg <= 180 ? (scenario === 'icu' ? 'target-icu' : bg <= 140 ? 'target' : 'moderate-high') : bg <= 250 ? 'high' : bg <= 400 ? 'very-high' : 'critical';
  const carbDose = carbs > 0 ? Math.round(carbs / 10) : 0;

  const DKA_CRITERIA = { ph: '<7.3', hco3: '<18', ag: '>12', glucose: '>250', ketones: 'Positive' };
  const HHS_CRITERIA = { glucose: '>600', osmolality: '>320', ph: '>7.3', ketones: 'Small/Negative' };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-3 overflow-x-auto">
          <TabsTrigger value="calculator" className="text-xs shrink-0">Insulin Calculator</TabsTrigger>
          <TabsTrigger value="dka" className="text-xs shrink-0">DKA Protocol</TabsTrigger>
          <TabsTrigger value="hhs" className="text-xs shrink-0">HHS Protocol</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div><Label className="text-xs">Blood Glucose (mg/dL)</Label><Input type="number" value={bg} onChange={e => setBg(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">ISF (mg/dL per unit)</Label>
                  <div className="flex gap-1 mt-1">
                    {[1500, 1800, 2000].map(rule => (
                      <button key={rule} onClick={() => setIsf(Math.round(1800 / (weight * 0.6)))} className="flex-1 text-[9px] p-1 rounded border border-muted/30 hover:bg-muted/20">{rule} Rule</button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-xs">Target Glucose</Label><Input type="number" value={target} onChange={e => setTarget(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Carb Intake (g)</Label><Input type="number" value={carbs} onChange={e => setCarbs(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Setting</Label>
                  <div className="flex gap-1 mt-1">
                    {['icu', 'ward', 'periop'].map(s => (
                      <button key={s} onClick={() => { setScenario(s); setTarget(s === 'icu' ? 150 : s === 'periop' ? 170 : 120); }} className={cn('flex-1 text-[9px] p-1 rounded border transition-all capitalize', scenario === s ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30')}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BG Zone Display */}
          <div className={cn('rounded-xl p-6 text-center', bgZone === 'severe-hypo' || bgZone === 'hypo' ? 'glucose-zone-hypoglycemia' : bgZone === 'low' ? 'glucose-zone-low' : bgZone === 'target' || bgZone === 'target-icu' ? 'glucose-zone-target' : bgZone === 'moderate-high' || bgZone === 'high' ? 'glucose-zone-high' : 'glucose-zone-critical')}>
            <div className="text-4xl font-bold">{bg} <span className="text-lg text-muted-foreground">mg/dL</span></div>
            <div className="text-xs mt-1">{bgZone === 'severe-hypo' ? '🔴 SEVERE HYPOGLYCEMIA — Immediate treatment' : bgZone === 'hypo' ? '🟡 Hypoglycemia — Treat now' : bgZone === 'low' ? 'Below target' : bgZone.startsWith('target') ? '✅ Within target range' : bgZone === 'high' ? '🟠 High — Correction needed' : bgZone === 'very-high' ? '🔴 Very high — Insulin protocol' : '🔴 CRITICAL — Insulin drip'}</div>
          </div>

          {/* Results */}
          {correctionDose > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="glass-card"><CardContent className="p-4 text-center">
                <div className="text-[10px] text-muted-foreground">Correction Dose</div>
                <div className="text-2xl font-bold text-amber-400">{correctionDose} U</div>
                <div className="text-[10px] text-muted-foreground">Regular insulin sub-Q</div>
              </CardContent></Card>
              {carbDose > 0 && <Card className="glass-card"><CardContent className="p-4 text-center">
                <div className="text-[10px] text-muted-foreground">Carb Coverage</div>
                <div className="text-2xl font-bold text-primary">{carbDose} U</div>
                <div className="text-[10px] text-muted-foreground">1:10 ratio</div>
              </CardContent></Card>}
            </div>
          )}

          {bgZone === 'severe-hypo' && (
            <Alert className="border-rose-500/40 bg-rose-500/10">
              <AlertTitle className="text-xs">🚨 Severe Hypoglycemia Protocol</AlertTitle>
              <AlertDescription className="text-[10px] space-y-1 mt-1">
                <div>• If conscious: 15-20g fast-acting carbs (4oz juice, glucose tablets)</div>
                <div>• If unconscious: Glucagon 1mg IM or D50 25mL IV push</div>
                <div>• Recheck BG in 15 minutes, repeat if BG &lt;70</div>
                <div>• Once BG >100, give complex carb snack</div>
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="dka" className="space-y-3 mt-3">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">DKA Diagnostic Criteria</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-center text-xs">
                {Object.entries(DKA_CRITERIA).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground uppercase">{k}</div><div className="font-bold">{v}</div></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2 text-xs">
              <h4 className="text-sm font-semibold">DKA Treatment Protocol</h4>
              <div className="space-y-1.5">
                <div className="p-2 rounded-lg bg-muted/20"><strong>1. Fluids:</strong> NS 1L/hr × 1-2h, then 250-500 mL/hr. Switch to 0.45% NS when corrected Na+ normal.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>2. Insulin:</strong> Regular insulin 0.1 U/kg IV bolus, then 0.1 U/kg/hr infusion. Target: BG drop 50-75 mg/dL/hr.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>3. Potassium:</strong> If K+ &lt;3.3: Hold insulin, give K+ first. If K+ 3.3-5.2: Add 20-30 mEq/L to IV fluids. If K+ &gt;5.2: No K+ yet.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>4. Bicarbonate:</strong> Only if pH &lt;6.9: 100 mEq NaHCO3 in 400 mL sterile water over 2h.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>5. Transition:</strong> When BG reaches 200-250, add D5 to IV fluids. When gap closes and pH >7.3, start sub-Q insulin.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hhs" className="space-y-3 mt-3">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">HHS Diagnostic Criteria</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                {Object.entries(HHS_CRITERIA).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground uppercase">{k}</div><div className="font-bold">{v}</div></div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2 text-xs">
              <h4 className="text-sm font-semibold">HHS Treatment Protocol</h4>
              <div className="space-y-1.5">
                <div className="p-2 rounded-lg bg-muted/20"><strong>Fluids (PRIMARY):</strong> Aggressive: NS 1-1.5L first hour, then 250-500 mL/hr. Total deficit often 8-12L. Replace over 24-48h.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>Insulin:</strong> Lower dose than DKA: 0.05-0.1 U/kg/hr. NO bolus. Target: BG decrease 50-70 mg/dL/hr.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>Potassium:</strong> Same protocol as DKA. Monitor K+ every 1-2h initially.</div>
                <div className="p-2 rounded-lg bg-muted/20"><strong>Caution:</strong> HHS patients are MUCH more volume-depleted than DKA. Thrombosis risk — consider DVT prophylaxis.</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}