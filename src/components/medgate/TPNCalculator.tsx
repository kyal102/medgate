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
import { FlaskConical, AlertTriangle, ShieldCheck } from 'lucide-react';

export function TPNCalculator() {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [stress, setStress] = useState(1.0);
  const [fluidRestrict, setFluidRestrict] = useState(false);

  const ibw = weight <= height / 100 * (height / 100) * 24 ? weight : 22 * Math.pow((height / 2.54 - 60) * 0.454 + 50, 1);
  const actualWt = Math.min(weight, ibw * 1.2);

  const calories = Math.round(25 * actualWt * stress);
  const protein = Math.round(1.5 * actualWt * stress);
  const fluids = fluidRestrict ? Math.round(20 * actualWt) : Math.round(30 * actualWt);
  const dextroseCal = Math.round(calories * 0.6);
  const lipidCal = Math.round(calories * 0.25);
  const proteinCal = Math.round(calories * 0.15);
  const dextroseG = Math.round(dextroseCal / 3.4);
  const lipidG = Math.round(lipidCal / 9);
  const na = Math.round(1.5 * actualWt);
  const k = Math.round(1.0 * actualWt);
  const refeedRisk = stress >= 1.5;

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-[10px]">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Stress Factor</Label>
              <Select value={String(stress)} onValueChange={v => setStress(parseFloat(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1.0 (Normal)</SelectItem>
                  <SelectItem value="1.2">1.2 (Surgery minor)</SelectItem>
                  <SelectItem value="1.3">1.3 (Surgery major)</SelectItem>
                  <SelectItem value="1.5">1.5 (Sepsis)</SelectItem>
                  <SelectItem value="1.7">1.7 (Burns 20-40%)</SelectItem>
                  <SelectItem value="2">2.0 (Burns >40%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><label className="flex items-center gap-2 text-xs cursor-pointer pb-2"><input type="checkbox" checked={fluidRestrict} onChange={e => setFluidRestrict(e.target.checked)} /> Fluid restricted</label></div>
          </div>
        </CardContent>
      </Card>

      {refeedRisk && (
        <Alert className="border-rose-500/40 bg-rose-500/10 p-2">
          <AlertTitle className="text-xs"><AlertTriangle className="w-3 h-3 text-rose-400 inline mr-1" />Refeeding Syndrome Risk</AlertTitle>
          <AlertDescription className="text-[10px]">If NPO >5 days, start at 25% of goal calories and advance over 3-4 days. Monitor phosphate, K+, Mg2+ closely.</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="glass-card"><CardContent className="p-4 text-center">
          <div className="text-[10px] text-muted-foreground">Calories (kcal/day)</div>
          <div className="text-2xl font-bold text-emerald-400">{calories}</div>
          <div className="text-[9px] text-muted-foreground">25 kcal/kg × stress</div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 text-center">
          <div className="text-[10px] text-muted-foreground">Protein (g/day)</div>
          <div className="text-2xl font-bold text-primary">{protein}</div>
          <div className="text-[9px] text-muted-foreground">1.5 g/kg × stress</div>
        </CardContent></Card>
        <Card className="glass-card"><CardContent className="p-4 text-center">
          <div className="text-[10px] text-muted-foreground">Fluid Volume (mL/day)</div>
          <div className="text-2xl font-bold text-cyan-400">{fluids}</div>
          <div className="text-[9px] text-muted-foreground">{fluidRestrict ? '20' : '30'} mL/kg</div>
        </CardContent></Card>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold">Macronutrient Distribution</h4>
          <div className="tpn-macro-bar h-6 rounded-full overflow-hidden flex">
            <div className="tpn-macro-segment macro-dextrose" style={{ width: '60%' }} />
            <div className="tpn-macro-segment macro-lipid" style={{ width: '25%' }} />
            <div className="tpn-macro-segment macro-protein" style={{ width: '15%' }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-amber-400">Dextrose: {dextroseG}g ({dextroseCal}kcal)</span>
            <span className="text-emerald-400">Lipid: {lipidG}g ({lipidCal}kcal)</span>
            <span className="text-primary">AA: {protein}g ({proteinCal}kcal)</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Electrolytes (daily)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Na⁺</div><div className="font-bold">{na} mEq</div></div>
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">K⁺</div><div className="font-bold">{k} mEq</div></div>
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Ca²⁺</div><div className="font-bold">10-15 mEq</div></div>
            <div className="p-2 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Mg²⁺</div><div className="font-bold">8-16 mEq</div></div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">Add MVI (multivitamin), trace elements (Zn, Cu, Mn, Cr, Se), and Vitamin K weekly.</div>
        </CardContent>
      </Card>
    </div>
  );
}