'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Beaker, AlertTriangle, ShieldCheck } from 'lucide-react';

export function FluidBalanceCalculator() {
  const [iv, setIv] = useState(125); // mL/hr
  const [po, setPo] = useState(500);
  const [ng, setNg] = useState(0);
  const [urine, setUrine] = useState(1800);
  const [drains, setDrains] = useState(100);
  const [insensible, setInsensible] = useState(800);
  const [weight, setWeight] = useState(70);
  const [burnTbsa, setBurnTbsa] = useState(0);
  const [showBurns, setShowBurns] = useState(false);

  const totalInput = (iv * 24) + po;
  const totalOutput = ng + urine + drains + insensible;
  const balance = totalInput - totalOutput;
  const balancePerKg = weight > 0 ? (balance / weight).toFixed(1) : 0;

  // Holliday-Segar (4-2-1 rule)
  const maintenanceRate = useMemo(() => {
    if (weight <= 10) return weight * 4;
    if (weight <= 20) return 40 + (weight - 10) * 2;
    return 60 + (weight - 20) * 1;
  }, [weight]);

  // Parkland formula
  const parkland = useMemo(() => {
    if (burnTbsa <= 0 || weight <= 0) return null;
    const total = 4 * weight * burnTbsa;
    return { total: Math.round(total), first8h: Math.round(total / 2), second16h: Math.round(total / 2), rate8h: Math.round(total / 2 / 8), rate16h: Math.round(total / 2 / 16) };
  }, [burnTbsa, weight]);

  const deficit = useMemo(() => {
    if (weight <= 0) return 0;
    const pctLoss = Math.abs(balance) / (weight * 1000) * 100;
    return pctLoss;
  }, [balance, weight]);

  const gate = useMemo(() => {
    if (balance > 2000 || balance < -1500) return 'BLOCK';
    if (balance > 1000 || balance < -1000) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [balance]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Beaker className="w-4 h-4 text-cyan-400" /> 24-Hour Fluid Balance</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div><Label className="text-xs">IV Rate (mL/hr)</Label><Input type="number" value={iv} onChange={e => setIv(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">PO Intake (mL/24h)</Label><Input type="number" value={po} onChange={e => setPo(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">NG/Emesis (mL/24h)</Label><Input type="number" value={ng} onChange={e => setNg(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Urine Output (mL/24h)</Label><Input type="number" value={urine} onChange={e => setUrine(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Drain Output (mL/24h)</Label><Input type="number" value={drains} onChange={e => setDrains(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Insensible (mL/24h)</Label><Input type="number" value={insensible} onChange={e => setInsensible(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
          <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm w-1/3" /></div>
        </CardContent>
      </Card>

      {/* Balance Display */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Input', value: totalInput, unit: 'mL', color: 'text-primary' },
          { label: 'Total Output', value: totalOutput, unit: 'mL', color: 'text-rose-400' },
          { label: 'Balance', value: balance, unit: 'mL', color: balance > 2000 || balance < -1000 ? 'text-rose-400' : balance > 1000 ? 'text-amber-400' : 'text-emerald-400' },
        ].map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <div className="text-[10px] text-muted-foreground">{r.label}</div>
              <div className={cn('text-2xl font-bold', r.color)}>{r.value.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">{r.unit} ({r.label === 'Balance' ? `${balancePerKg} mL/kg` : '')}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Visual bar */}
      <div className="space-y-1">
        <div className="flex h-6 rounded-full overflow-hidden">
          <div className="fluid-bar-input" style={{ width: `${Math.min(100, (totalInput / (totalInput + totalOutput || 1)) * 100)}%` }} />
          <div className="fluid-bar-output" style={{ width: `${Math.min(100, (totalOutput / (totalInput + totalOutput || 1)) * 100)}%` }} />
        </div>
        <div className="flex justify-between text-[9px] text-muted-foreground"><span className="text-primary">Input: {totalInput.toLocaleString()} mL</span><span className="text-rose-400">Output: {totalOutput.toLocaleString()} mL</span></div>
      </div>

      {(balance > 2000 || balance < -1500) && (
        <Alert className={cn(balance > 2000 ? 'border-amber-500/40 bg-amber-500/10' : 'border-rose-500/40 bg-rose-500/10')}>
          <AlertTitle className="flex items-center gap-2 text-xs"><AlertTriangle className="w-3 h-3" /> {balance > 2000 ? 'Significant Positive Balance — Fluid Overload Risk' : 'Significant Negative Balance — Dehydration Risk'}</AlertTitle>
          <AlertDescription className="text-[10px] mt-1">{balance > 2000 ? 'Consider diuretics, reduce IV rate, assess for pulmonary edema, crackles, JVP.' : 'Increase fluid rate, assess for tachycardia, hypotension, poor skin turgor.'}</AlertDescription>
        </Alert>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>

      {/* Maintenance Fluids */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Maintenance Fluid Rate (Holliday-Segar)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">4-2-1 Rate</div><div className="text-lg font-bold text-primary">{maintenanceRate} mL/hr</div></div>
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Daily Volume</div><div className="text-lg font-bold">{(maintenanceRate * 24).toLocaleString()} mL</div></div>
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Per kg</div><div className="text-lg font-bold">{weight > 0 ? (maintenanceRate * 24 / weight).toFixed(0) : 0} mL/kg/day</div></div>
          </div>
          <div className="text-[10px] text-muted-foreground">Rule: 4 mL/kg/hr for first 10kg + 2 mL/kg/hr for next 10kg + 1 mL/kg/hr for each kg >20kg</div>
        </CardContent>
      </Card>

      {/* Burn Resuscitation */}
      <div className="flex gap-2">
        <Button onClick={() => setShowBurns(!showBurns)} variant="outline" size="sm" className="text-xs">Parkland Burn Formula</Button>
      </div>
      {showBurns && (
        <Card className="glass-card border-orange-500/30">
          <CardContent className="p-4 space-y-3">
            <div><Label className="text-xs">%TBSA Burn</Label><Input type="number" value={burnTbsa} onChange={e => setBurnTbsa(parseInt(e.target.value) || 0)} className="h-8 text-sm w-1/3" /></div>
            {parkland && (
              <div className="space-y-2">
                <div className="text-xs font-semibold">Parkland Formula: 4 × {weight}kg × {burnTbsa}% = <span className="text-orange-400 font-bold">{parkland.total} mL</span></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-orange-500/10"><div className="text-[10px]">First 8 hours</div><div className="font-bold">{parkland.first8h} mL ({parkland.rate8h} mL/hr)</div></div>
                  <div className="p-2 rounded-lg bg-orange-500/10"><div className="text-[10px]">Next 16 hours</div><div className="font-bold">{parkland.second16h} mL ({parkland.rate16h} mL/hr)</div></div>
                </div>
                <div className="text-[10px] text-muted-foreground">Use LR (Lactated Ringer&apos;s). Give half in first 8h from time of burn (not from arrival). Adjust to maintain UO 0.5-1.0 mL/kg/hr.</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}