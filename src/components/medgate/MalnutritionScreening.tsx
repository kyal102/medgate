'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Apple, AlertTriangle, ShieldCheck, Info, Activity } from 'lucide-react';

export function MalnutritionScreening() {
  const [weightLoss, setWeightLoss] = useState(0);
  const [appetiteDecreased, setAppetiteDecreased] = useState(false);
  const [bmi, setBmi] = useState<number | null>(null);
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [showMUST, setShowMUST] = useState(false);

  const calculatedBmi = bmi ?? (height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) as unknown as number : null);

  const mstScore = useMemo(() => {
    let score = 0;
    if (weightLoss > 0) score += 1;
    if (appetiteDecreased) score += 1;
    return score;
  }, [weightLoss, appetiteDecreased]);

  const mstRisk = mstScore >= 2 ? 'At Risk' : 'Low Risk';
  const bmiZone = calculatedBmi ? (calculatedBmi < 18.5 ? 'Underweight' : calculatedBmi < 25 ? 'Normal' : calculatedBmi < 30 ? 'Overweight' : 'Obese') : null;

  const overallRisk = useMemo(() => {
    if (mstScore >= 2 || (calculatedBmi && calculatedBmi < 18.5)) return 'high';
    if (mstScore === 1 || (calculatedBmi && calculatedBmi < 20)) return 'moderate';
    return 'low';
  }, [mstScore, calculatedBmi]);

  const recommendations = useMemo(() => {
    if (overallRisk === 'high') return ['Urgent dietitian referral', 'Initiate nutritional supplements', 'Monitor intake/output', 'Consider enteral nutrition if NPO >3 days', 'Reassess in 72 hours', 'Address underlying causes'];
    if (overallRisk === 'moderate') return ['Dietitian consultation', 'Increase caloric intake', 'Oral nutritional supplements', 'Monitor weight twice weekly', 'Address barriers to eating'];
    return ['Routine nutritional monitoring', 'Encourage balanced diet', 'Reassess if clinical change'];
  }, [overallRisk]);

  const psgaQuickScore = useMemo(() => {
    let score = 0;
    if (weightLoss > 5) score += 2; else if (weightLoss > 2) score += 1;
    if (appetiteDecreased) score += 1;
    if (calculatedBmi && calculatedBmi < 18.5) score += 2;
    else if (calculatedBmi && calculatedBmi < 20) score += 1;
    if (score >= 4) return { score, rating: 'Severely Malnourished' };
    if (score >= 2) return { score, rating: 'Moderately Malnourished' };
    return { score, rating: 'Well Nourished' };
  }, [weightLoss, appetiteDecreased, calculatedBmi]);

  return (
    <div className="space-y-4">
      {/* MST Screening */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Apple className="w-4 h-4 text-emerald-400" /> Malnutrition Screening Tool (MST)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Unplanned weight loss in past 6 months</Label>
            <div className="flex items-center gap-3">
              <input type="range" min="0" max="20" step="0.5" value={weightLoss} onChange={e => setWeightLoss(parseFloat(e.target.value))} className="flex-1" />
              <span className="text-sm font-mono font-bold w-16 text-right">{weightLoss} kg</span>
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>0 kg</span><span>5 kg</span><span>10 kg</span><span>20 kg</span></div>
          </div>
          <div className="flex items-center gap-3">
            <Button size="sm" variant={appetiteDecreased ? 'destructive' : 'outline'} onClick={() => setAppetiteDecreased(!appetiteDecreased)} className="text-xs">
              Appetite Decreased: {appetiteDecreased ? 'YES' : 'NO'}
            </Button>
            <Badge variant="outline" className={cn('ml-auto text-xs', mstRisk === 'At Risk' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>MST: {mstScore}/2 — {mstRisk}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* BMI */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> BMI Assessment</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Height (cm)</Label><Input type="number" value={height} onChange={e => setHeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
          <div className={cn('rounded-xl p-4 text-center', bmiZone === 'Underweight' ? 'nutrition-zone-underweight' : bmiZone === 'Normal' ? 'nutrition-zone-normal' : bmiZone === 'Overweight' ? 'nutrition-zone-overweight' : 'nutrition-zone-obese')}>
            <div className="text-3xl font-bold">{calculatedBmi ? calculatedBmi.toFixed(1) : '--'}</div>
            <div className="text-xs text-muted-foreground mt-1">BMI — {bmiZone || 'Enter values'}</div>
          </div>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 flex-1" /><div className="bg-emerald-500 flex-[3]" /><div className="bg-orange-500 flex-1" /><div className="bg-rose-500 flex-1" />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>&lt;18.5</span><span>18.5-24.9</span><span>25-29.9</span><span>≥30</span></div>
        </CardContent>
      </Card>

      {/* Result */}
      <Alert className={cn(overallRisk === 'high' ? 'border-amber-500/40 bg-amber-500/10' : overallRisk === 'moderate' ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/40 bg-emerald-500/10')}>
        <AlertTitle className="flex items-center gap-2">
          {overallRisk === 'high' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          Risk: {overallRisk === 'high' ? 'High — Malnutrition Risk' : overallRisk === 'moderate' ? 'Moderate' : 'Low'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="text-xs space-y-1">{recommendations.map((r, i) => <div key={i}>• {r}</div>)}</div>
        </AlertDescription>
      </Alert>

      {/* PG-SGA */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">PG-SGA Quick Score</h4>
            <Badge variant="outline" className={cn('text-xs', psgaQuickScore.score >= 4 ? 'border-rose-500/40 text-rose-400' : psgaQuickScore.score >= 2 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>
              {psgaQuickScore.score} — {psgaQuickScore.rating}
            </Badge>
          </div>
          <Progress value={(psgaQuickScore.score / 6) * 100} className="h-2" />
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => setShowMUST(!showMUST)} variant="outline" size="sm" className="text-xs"><Info className="w-3 h-3 mr-1" /> MUST Steps</Button>
      </div>
      {showMUST && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">MUST — Malnutrition Universal Screening Steps</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-muted/20"><span className="font-semibold">Step 1 (BMI):</span> BMI &lt;18.5 = Score 2</div>
              <div className="p-3 rounded-lg bg-muted/20"><span className="font-semibold">Step 2 (Weight loss):</span> 5-10% in 3-6mo = Score 1, &gt;10% = Score 2</div>
              <div className="p-3 rounded-lg bg-muted/20"><span className="font-semibold">Step 3 (Acute effect):</span> Poor intake &gt;5 days = Score 2</div>
              <Separator />
              <div className="font-semibold">Overall MUST Score: {mstScore >= 2 ? '≥2 = High Risk' : '0 = Low Risk'}</div>
              <div className="font-semibold">Low Risk: {mstScore === 0 ? '✓' : '✗'} | Medium Risk: {mstScore === 1 ? '✓' : '✗'} | High Risk: {mstScore >= 2 ? '✓' : '✗'}</div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}