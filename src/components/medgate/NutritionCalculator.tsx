'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Calculator, Info } from 'lucide-react';

const EQUATIONS = ['harris-benedict', 'mifflin-st-jeor', 'ireton-jones'];
const ACTIVITY_FACTORS = [{ label: 'Bedbound', value: 1.0 }, { label: 'Minimal', value: 1.2 }, { label: 'Moderate', value: 1.4 }, { label: 'Active', value: 1.6 }];
const STRESS_FACTORS = [{ label: 'None', value: 1.0 }, { label: 'Surgery (minor)', value: 1.1 }, { label: 'Surgery (major)', value: 1.3 }, { label: 'Trauma', value: 1.4 }, { label: 'Sepsis', value: 1.5 }, { label: 'Burns (10-20%)', value: 1.5 }, { label: 'Burns (20-40%)', value: 1.7 }, { label: 'Burns (>40%)', value: 2.0 }];

export function NutritionCalculator() {
  const [age, setAge] = useState(60);
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [activity, setActivity] = useState(1.2);
  const [stress, setStress] = useState(1.0);
  const [equation, setEquation] = useState('mifflin-st-jeor');

  const ibw = useMemo(() => {
    if (sex === 'male') return 50 + 2.3 * ((height / 2.54) - 60);
    return 45.5 + 2.3 * ((height / 2.54) - 60);
  }, [sex, height]);

  const abw = useMemo(() => {
    if (weight <= ibw) return weight;
    return ibw + 0.4 * (weight - ibw);
  }, [weight, ibw]);

  const bmi = useMemo(() => height > 0 ? weight / ((height / 100) ** 2) : 0, [weight, height]);

  const results = useMemo(() => {
    let bmr = 0;
    if (equation === 'harris-benedict') {
      if (sex === 'male') bmr = 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
      else bmr = 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
    } else if (equation === 'mifflin-st-jeor') {
      if (sex === 'male') bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      else bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    } else {
      if (sex === 'male') bmr = 629 - 11 * age + 25 * weight + 604;
      else bmr = 354 - 6 * age + 10 * weight + 925;
    }
    const tdee = bmr * activity * stress;
    const proteinLow = weight * 1.2;
    const proteinHigh = weight * 2.5;
    const fluids = weight * 30;
    return { bmr: Math.round(bmr), tdee: Math.round(tdee), proteinLow: Math.round(proteinLow), proteinHigh: Math.round(proteinHigh), fluids: Math.round(fluids) };
  }, [age, sex, weight, height, activity, stress, equation]);

  const carbCals = Math.round(results.tdee * 0.5);
  const fatCals = Math.round(results.tdee * 0.25);
  const protCals = Math.round(results.tdee * 0.25);
  const carbG = Math.round(carbCals / 4);
  const fatG = Math.round(fatCals / 9);
  const protG = Math.round(protCals / 4);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Calculator className="w-4 h-4 text-emerald-400" /> Nutritional Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Age</Label><Input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Sex</Label>
              <Select value={sex} onValueChange={v => setSex(v as 'male' | 'female')}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Equation</Label>
              <Select value={equation} onValueChange={setEquation}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="harris-benedict">Harris-Benedict</SelectItem><SelectItem value="mifflin-st-jeor">Mifflin-St Jeor</SelectItem><SelectItem value="ireton-jones">Ireton-Jones</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Activity Factor</Label>
              <Select value={String(activity)} onValueChange={v => setActivity(parseFloat(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIVITY_FACTORS.map(f => <SelectItem key={f.value} value={String(f.value)}>{f.label} ({f.value}x)</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Stress Factor</Label>
              <Select value={String(stress)} onValueChange={v => setStress(parseFloat(v))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{STRESS_FACTORS.map(f => <SelectItem key={f.value} value={String(f.value)}>{f.label} ({f.value}x)</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'BMR', value: `${results.bmr}`, unit: 'kcal/day', color: 'text-primary' },
          { label: 'TDEE', value: `${results.tdee}`, unit: 'kcal/day', color: 'text-emerald-400' },
          { label: 'Protein', value: `${results.proteinLow}-${results.proteinHigh}`, unit: 'g/day', color: 'text-amber-400' },
          { label: 'Fluids', value: `${results.fluids}`, unit: 'mL/day', color: 'text-cyan-400' },
        ].map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="glass-card"><CardContent className="p-4 text-center">
              <div className="text-[10px] text-muted-foreground">{r.label}</div>
              <div className={cn('text-2xl font-bold', r.color)}>{r.value}</div>
              <div className="text-[10px] text-muted-foreground">{r.unit}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      {/* Macros */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold">Macronutrient Distribution</h4>
          <div className="flex h-6 rounded-full overflow-hidden">
            <div className="macro-bar macro-dextrose" style={{ width: '50%' }} />
            <div className="macro-bar macro-lipid" style={{ width: '25%' }} />
            <div className="macro-bar macro-protein" style={{ width: '25%' }} />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-amber-400">Carbs {carbG}g ({carbCals}kcal)</span>
            <span className="text-emerald-400">Fat {fatG}g ({fatCals}kcal)</span>
            <span className="text-primary">Protein {protG}g ({protCals}kcal)</span>
          </div>
        </CardContent>
      </Card>

      {/* Body Composition */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold mb-3">Body Composition</h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2 rounded-lg bg-muted/20">
              <div className="text-[10px] text-muted-foreground">BMI</div>
              <div className={cn('text-lg font-bold', bmi < 18.5 ? 'text-amber-400' : bmi < 25 ? 'text-emerald-400' : bmi < 30 ? 'text-orange-400' : 'text-rose-400')}>{bmi.toFixed(1)}</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20">
              <div className="text-[10px] text-muted-foreground">IBW</div>
              <div className="text-lg font-bold text-primary">{ibw.toFixed(1)} kg</div>
            </div>
            <div className="p-2 rounded-lg bg-muted/20">
              <div className="text-[10px] text-muted-foreground">Adj BW</div>
              <div className="text-lg font-bold text-cyan-400">{abw.toFixed(1)} kg</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}