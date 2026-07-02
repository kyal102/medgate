'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Brain, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export function PADISBundleTracker() {
  const [cpot, setCpot] = useState<Record<string, number>>({ facial: 0, movement: 0, compliance: 0, tension: 0 });
  const [rass, setRass] = useState<number | null>(null);
  const [camPositive, setCamPositive] = useState<boolean | null>(null);

  const cpotTotal = Object.values(cpot).reduce((a, b) => a + b, 0);
  const painLevel = cpotTotal <= 2 ? 'no' : cpotTotal <= 4 ? 'mild' : cpotTotal <= 6 ? 'moderate' : 'severe';

  const agitationLevel = rass === null ? 'unknown' : rass >= 2 ? 'severe' : rass >= 1 ? 'moderate' : rass === 0 ? 'calm' : rass >= -2 ? 'sedated' : 'deeply-sedated';
  const rassInTarget = rass !== null && rass >= -2 && rass <= 0;

  const compliance = useMemo(() => {
    let score = 0;
    let total = 4;
    if (cpotTotal <= 4) score++; // Pain controlled
    if (rassInTarget) score++; // Agitation in target
    if (camPositive === false) score++; // No delirium
    if (rass !== null) score++; // RASS assessed
    return { score, total, pct: Math.round((score / total) * 100) };
  }, [cpotTotal, rassInTarget, camPositive, rass]);

  const gate = useMemo(() => {
    if (painLevel === 'severe' || agitationLevel === 'severe' || camPositive === true) return 'BLOCK';
    if (painLevel === 'moderate' || !rassInTarget || camPositive === null) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [painLevel, agitationLevel, rassInTarget, camPositive]);

  const CPOT_ITEMS = [
    { id: 'facial', label: 'Facial Expression', options: [{ v: 0, l: 'Relaxed, neutral' }, { v: 1, l: 'Wince, frown' }, { v: 2, l: 'Grimacing, clenching' }] },
    { id: 'movement', label: 'Body Movements', options: [{ v: 0, l: 'None/normal' }, { v: 1, l: 'Protection, restless' }, { v: 2, l: 'Pulling tube, thrashing' }] },
    { id: 'compliance', label: 'Ventilator Compliance', options: [{ v: 0, l: 'Tolerating' }, { v: 1, l: 'Coughing, fighting' }, { v: 2, l: 'Asynchrony, alarm' }] },
    { id: 'tension', label: 'Muscle Tension', options: [{ v: 0, l: 'Relaxed' }, { v: 1, l: 'Tense, rigid' }, { v: 2, l: 'Very rigid, severe' }] },
  ];

  return (
    <div className="space-y-4">
      {/* Dashboard Overview */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: 'Pain (CPOT)', value: `${cpotTotal}/8`, level: painLevel, color: painLevel === 'no' ? 'emerald' : painLevel === 'mild' ? 'amber' : painLevel === 'moderate' ? 'orange' : 'rose' },
          { label: 'Agitation (RASS)', value: rass !== null ? (rass > 0 ? `+${rass}` : String(rass)) : '—', level: agitationLevel, color: agitationLevel === 'calm' ? 'emerald' : agitationLevel === 'sedated' ? 'primary' : agitationLevel === 'moderate' ? 'amber' : 'rose' },
          { label: 'Delirium (CAM-ICU)', value: camPositive === null ? '?' : camPositive ? 'Positive' : 'Negative', level: camPositive === null ? 'unknown' : camPositive ? 'high' : 'low', color: camPositive === null ? 'muted' : camPositive ? 'rose' : 'emerald' },
        ].map((d, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={cn('glass-card', `padis-domain`, (d.level === 'severe' || d.level === 'high' || d.level === 'moderate') && 'padis-domain-alert')}>
              <CardContent className="p-4 text-center">
                <div className="text-[10px] text-muted-foreground">{d.label}</div>
                <div className={cn('text-2xl font-bold', d.color === 'emerald' ? 'text-emerald-400' : d.color === 'amber' ? 'text-amber-400' : d.color === 'orange' ? 'text-orange-400' : d.color === 'rose' ? 'text-rose-400' : d.color === 'primary' ? 'text-primary' : 'text-muted-foreground')}>{d.value}</div>
                <Badge variant="outline" className={cn('text-[9px] mt-1', d.color === 'emerald' ? 'border-emerald-500/30 text-emerald-400' : d.color === 'rose' ? 'border-rose-500/30 text-rose-400' : 'border-muted-foreground/30')}>{d.level}</Badge>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Compliance Score */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">PADIS Bundle Compliance</h4>
            <span className={cn('text-sm font-bold', compliance.pct >= 75 ? 'text-emerald-400' : compliance.pct >= 50 ? 'text-amber-400' : 'text-rose-400')}>{compliance.pct}% ({compliance.score}/{compliance.total})</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden"><div className={cn('h-full rounded-full transition-all duration-500', compliance.pct >= 75 ? 'bg-emerald-500' : compliance.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500')} style={{ width: `${compliance.pct}%` }} /></div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="pain">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pain" className="text-xs">Pain (CPOT)</TabsTrigger>
          <TabsTrigger value="agitation" className="text-xs">Agitation (RASS)</TabsTrigger>
          <TabsTrigger value="delirium" className="text-xs">Delirium</TabsTrigger>
        </TabsList>
        <TabsContent value="pain" className="space-y-3 mt-3">
          {CPOT_ITEMS.map(item => (
            <Card key={item.id} className="glass-card">
              <CardContent className="p-3">
                <div className="text-xs font-semibold mb-2">{item.label}</div>
                <div className="flex gap-2">
                  {item.options.map(opt => (
                    <button key={opt.v} onClick={() => setCpot(prev => ({ ...prev, [item.id]: opt.v }))}
                      className={cn('flex-1 text-[10px] p-2 rounded-lg border transition-all', cpot[item.id] === opt.v ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30 hover:bg-muted/20 text-muted-foreground')}>
                      <div className="font-bold">{opt.v}</div><div>{opt.l}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="agitation" className="mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2">
              <div className="text-xs font-semibold">RASS Assessment</div>
              <div className="flex gap-1 flex-wrap">
                {[4, 3, 2, 1, 0, -1, -2, -3, -4, -5].map(s => (
                  <button key={s} onClick={() => setRass(s)}
                    className={cn('w-12 h-10 rounded-lg text-xs font-bold border transition-all', rass === s ? 'border-primary/40 bg-primary/10 text-primary ring-2 ring-primary/30' : 'border-muted/30 hover:bg-muted/20 text-muted-foreground')}>
                    {s > 0 ? `+${s}` : s}
                  </button>
                ))}
              </div>
              {rass !== null && <div className="p-2 rounded-lg bg-muted/20 text-xs">{rass >= 1 ? 'Agitated — consider sedation' : rass === 0 ? 'Alert and calm — target' : rass >= -2 ? 'Lightly sedated — within target' : rass >= -3 ? 'Moderately sedated — consider lightening' : 'Deeply sedated — assess for sedation vacation'}</div>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delirium" className="mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="text-xs font-semibold">CAM-ICU Quick Screen</div>
              <div className="flex gap-2">
                <button onClick={() => setCamPositive(true)} className={cn('flex-1 p-3 rounded-lg border text-xs transition-all', camPositive === true ? 'border-rose-500/40 bg-rose-500/10 text-rose-400' : 'border-muted/30 hover:bg-muted/20')}>Positive</button>
                <button onClick={() => setCamPositive(false)} className={cn('flex-1 p-3 rounded-lg border text-xs transition-all', camPositive === false ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-muted/30 hover:bg-muted/20')}>Negative</button>
              </div>
              {camPositive === true && <Alert className="border-rose-500/30 bg-rose-500/5 p-2"><AlertDescription className="text-[10px] text-rose-400">Delirium detected. Assess for reversible causes. Consider non-pharmacologic interventions first.</AlertDescription></Alert>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
      </div>
    </div>
  );
}