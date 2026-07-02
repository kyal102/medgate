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
import { AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

const PARAMS = [
  { id: 'rr', label: 'Respiratory Rate', unit: '/min', scores: [
    { min: 12, max: 20, score: 0 }, { min: 9, max: 11, score: 1 }, { min: 21, max: 24, score: 2 },
    { min: 0, max: 8, score: 3 }, { min: 25, max: Infinity, score: 3 },
  ]},
  { id: 'spo2', label: 'SpO2', unit: '%', scores: [
    { min: 96, max: 100, score: 0 }, { min: 94, max: 95, score: 1 }, { min: 92, max: 93, score: 2 },
    { min: 0, max: 91, score: 3 },
  ]},
  { id: 'supplemental', label: 'Supplemental O2', unit: '', scores: [
    { min: 0, max: 0, score: 0 }, { min: 1, max: 1, score: 1 }, { min: 2, max: 2, score: 2 }, { min: 3, max: 3, score: 3 },
  ]},
  { id: 'sbp', label: 'Systolic BP', unit: 'mmHg', scores: [
    { min: 111, max: 219, score: 0 }, { min: 101, max: 110, score: 1 }, { min: 91, max: 100, score: 2 },
    { min: 0, max: 90, score: 3 }, { min: 220, max: Infinity, score: 3 },
  ]},
  { id: 'pulse', label: 'Pulse', unit: '/min', scores: [
    { min: 51, max: 90, score: 0 }, { min: 41, max: 50, score: 1 }, { min: 91, max: 110, score: 1 },
    { min: 111, max: 130, score: 2 }, { min: 0, max: 40, score: 3 }, { min: 131, max: Infinity, score: 3 },
  ]},
  { id: 'consciousness', label: 'Consciousness', unit: '', scores: [
    { min: 0, max: 0, score: 0 }, { min: 1, max: 1, score: 1 }, { min: 2, max: 2, score: 2 }, { min: 3, max: 3, score: 3 },
  ]},
  { id: 'temperature', label: 'Temperature', unit: '°C', scores: [
    { min: 36.1, max: 38.0, score: 0 }, { min: 35.1, max: 36.0, score: 1 }, { min: 38.1, max: 39.0, score: 1 },
    { min: 0, max: 35.0, score: 3 }, { min: 39.1, max: Infinity, score: 3 },
  ]},
];

const getScore = (id: string, value: number) => {
  const param = PARAMS.find(p => p.id === id);
  if (!param) return 0;
  for (const range of param.scores) {
    if (value >= range.min && value <= range.max) return range.score;
  }
  return 0;
};

const ESCALATION = [
  { min: 0, max: 4, level: 'Low', color: 'emerald', response: 'Routine monitoring', time: 'Minimum 12 hourly' },
  { min: 3, max: 3, level: 'Low-Medium', color: 'amber', response: 'Urgent ward-based review', time: 'Within 1 hour (single parameter = 3)' },
  { min: 5, max: 6, level: 'Medium', color: 'amber', response: 'Urgent review by clinician/acute team', time: 'Within 30 minutes' },
  { min: 7, max: Infinity, level: 'High', color: 'rose', response: 'Emergency assessment — consider ICU/HDU transfer', time: 'IMMEDIATE' },
];

export function EarlyWarningEscalation() {
  const [values, setValues] = useState<Record<string, number>>({ rr: 16, spo2: 98, supplemental: 0, sbp: 120, pulse: 72, consciousness: 0, temperature: 37.0 });

  const scores = useMemo(() => {
    const result: Record<string, number> = {};
    Object.entries(values).forEach(([k, v]) => { result[k] = getScore(k, v); });
    return result;
  }, [values]);

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxSingle = Math.max(...Object.values(scores));
  const hasSingle3 = maxSingle === 3;

  const escalation = hasSingle3 && total <= 4 ? ESCALATION[1] : ESCALATION.find(e => total >= e.min && total <= e.max) || ESCALATION[0];

  const gate = useMemo(() => {
    if (total >= 7) return 'BLOCK';
    if (total >= 5 || hasSingle3) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [total, hasSingle3]);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> NEWS2 Scoring</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2">
            {PARAMS.map(param => {
              const score = scores[param.id] ?? 0;
              if (param.id === 'consciousness') {
                return (
                  <div key={param.id} className={cn('news2-parameter rounded-lg p-3', score === 0 ? 'news2-score-0' : score === 1 ? 'news2-score-1' : score === 2 ? 'news2-score-2' : 'news2-score-3')}>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold">{param.label}</Label>
                      <Badge variant="outline" className={cn('text-[10px] w-6 justify-center', score >= 3 ? 'border-rose-500/40 text-rose-400' : score >= 2 ? 'border-orange-500/40 text-orange-400' : score >= 1 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>{score}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {['Alert', 'Voice', 'Pain', 'Unresponsive'].map((opt, i) => (
                        <button key={opt} onClick={() => setValues(prev => ({ ...prev, consciousness: i }))}
                          className={cn('flex-1 text-[9px] p-1.5 rounded border transition-all', values.consciousness === i ? (i === 0 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : i <= 2 ? 'border-amber-500/40 bg-amber-500/10' : 'border-rose-500/40 bg-rose-500/10 text-rose-400') : 'border-muted/30')}>{opt}</button>
                      ))}
                    </div>
                  </div>
                );
              }
              if (param.id === 'supplemental') {
                return (
                  <div key={param.id} className={cn('news2-parameter rounded-lg p-3', score === 0 ? 'news2-score-0' : score === 1 ? 'news2-score-1' : score === 2 ? 'news2-score-2' : 'news2-score-3')}>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs font-semibold">{param.label}</Label>
                      <Badge variant="outline" className={cn('text-[10px] w-6 justify-center', score >= 3 ? 'border-rose-500/40 text-rose-400' : score >= 2 ? 'border-orange-500/40 text-orange-400' : score >= 1 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>{score}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {['Air', 'O2 ≤28%', 'O2 28-35%', 'O2 35%+'].map((opt, i) => (
                        <button key={opt} onClick={() => setValues(prev => ({ ...prev, supplemental: i }))}
                          className={cn('flex-1 text-[9px] p-1.5 rounded border transition-all', values.supplemental === i ? (i === 0 ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/10') : 'border-muted/30')}>{opt}</button>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={param.id} className={cn('news2-parameter rounded-lg p-3', score === 0 ? 'news2-score-0' : score === 1 ? 'news2-score-1' : score === 2 ? 'news2-score-2' : 'news2-score-3')}>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-semibold">{param.label}</Label>
                    <Badge variant="outline" className={cn('text-[10px] w-6 justify-center', score >= 3 ? 'border-rose-500/40 text-rose-400' : score >= 2 ? 'border-orange-500/40 text-orange-400' : score >= 1 ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>{score}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.1" value={values[param.id]} onChange={e => setValues(prev => ({ ...prev, [param.id]: parseFloat(e.target.value) || 0 }))} className="h-8 text-sm flex-1" />
                    <span className="text-[10px] text-muted-foreground w-12">{param.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Total Score */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">NEWS2 Score</h4>
            <div className="flex items-center gap-2">
              <span className={cn('text-3xl font-bold', escalation.color === 'rose' ? 'text-rose-400' : escalation.color === 'amber' ? 'text-amber-400' : 'text-emerald-400')}>{total}</span>
              <Badge variant="outline" className={cn('text-xs', escalation.color === 'rose' ? 'border-rose-500/40 text-rose-400' : escalation.color === 'amber' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>{escalation.level} Risk</Badge>
            </div>
          </div>
          {hasSingle3 && total <= 4 && <div className="text-[10px] text-amber-400">⚠ Single parameter score of 3 triggers Low-Medium escalation regardless of total</div>}
        </CardContent>
      </Card>

      <Alert className={cn(escalation.color === 'rose' ? 'border-rose-500/40 bg-rose-500/10' : escalation.color === 'amber' ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
        <AlertTitle className="flex items-center gap-2 text-xs">
          {escalation.color === 'rose' ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          {escalation.response}
        </AlertTitle>
        <AlertDescription className="text-[10px] mt-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Response time: {escalation.time}</AlertDescription>
      </Alert>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}