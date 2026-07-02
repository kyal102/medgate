'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Timer, Siren, CheckCircle2, XCircle, ShieldCheck, AlertTriangle, RotateCcw, Play } from 'lucide-react';

const BUNDLE_ITEMS = [
  { id: 'lactate', label: 'Measure Lactate Level', detail: 'Serum lactate within 1 hour', icon: '🩸' },
  { id: 'cultures', label: 'Blood Cultures', detail: 'Before antibiotics (2 sets)', icon: '🧫' },
  { id: 'antibiotics', label: 'Broad-Spectrum Antibiotics', detail: 'Within 1 hour of recognition', icon: '💊' },
  { id: 'fluids', label: 'Crystalloid 30 mL/kg', detail: 'For hypotension or lactate ≥4', icon: '💧' },
  { id: 'vasopressors', label: 'Vasopressors if MAP <65', detail: 'Norepinephrine first line', icon: '💉' },
  { id: 'recheck', label: 'Recheck Lactate', detail: 'If initial lactate elevated', icon: '🔄' },
];

export function SepsisBundleTracker() {
  const [bundle, setBundle] = useState<Record<string, { completed: boolean; time: string; notes: string }>>(() => {
    const initial: Record<string, any> = {};
    BUNDLE_ITEMS.forEach(b => { initial[b.id] = { completed: false, time: '', notes: '' }; });
    return initial;
  });
  const [startTime, setStartTime] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const completedCount = useMemo(() => Object.values(bundle).filter(v => v.completed).length, [bundle]);
  const compliance = completedCount === 6 ? 'full' : completedCount >= 4 ? 'partial' : 'inadequate';
  const firstCompletionTime = useMemo(() => {
    const times = Object.values(bundle).filter(v => v.completed && v.time).map(v => new Date(v.time).getTime());
    return times.length > 0 ? new Date(Math.min(...times)) : null;
  }, [bundle]);

  const startTimer = useCallback(() => {
    const now = new Date();
    setStartTime(now.toISOString());
    setTimerRunning(true);
    setElapsed(0);
    const iv = setInterval(() => setElapsed(e => e + 1), 1000);
    setTimeout(() => clearInterval(iv), 600000);
  }, []);

  const toggleItem = (id: string) => {
    const now = new Date().toISOString();
    setBundle(prev => ({
      ...prev,
      [id]: { ...prev[id], completed: !prev[id].completed, time: !prev[id].completed ? now : '' }
    }));
    if (!startTime) startTimer();
    if (completedCount === 5) toast.success('5/6 complete! One more to go!');
    if (completedCount === 6) toast.success('🎉 Sepsis Bundle Complete! All 6 items delivered.');
  };

  const updateNotes = (id: string, notes: string) => {
    setBundle(prev => ({ ...prev, [id]: { ...prev[id], notes } }));
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const getElapsedMinutes = () => {
    if (!firstCompletionTime) return null;
    const start = startTime ? new Date(startTime) : firstCompletionTime;
    return (new Date(firstCompletionTime).getTime() - start.getTime()) / 60000;
  };

  const gate = useMemo(() => {
    if (completedCount === 6 && (getElapsedMinutes() ?? 0) <= 60) return 'ALLOW';
    if (completedCount >= 4) return 'NEEDS_REVIEW';
    return 'BLOCK';
  }, [completedCount, startTime, bundle]);

  const reset = () => {
    const initial: Record<string, any> = {};
    BUNDLE_ITEMS.forEach(b => { initial[b.id] = { completed: false, time: '', notes: '' }; });
    setBundle(initial);
    setStartTime(null);
    setElapsed(0);
    setTimerRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Timer + Progress */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className={cn('w-5 h-5', timerRunning && elapsed > 3600 ? 'text-rose-400 animate-pulse' : elapsed > 180 ? 'text-amber-400' : 'text-primary')} />
              <span className="text-2xl font-mono font-bold">{formatTime(elapsed)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-bold">{completedCount}/6</div>
                <div className="text-[10px] text-muted-foreground">Bundle Items</div>
              </div>
            </div>
          </div>
          <Progress value={(completedCount / 6) * 100} className="h-3" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span className="text-rose-400">0 (Inadequate)</span><span className="text-amber-400">3</span><span className="text-amber-400">5</span><span className="text-emerald-400">6 (Full)</span>
          </div>
          {!startTime && <Button onClick={startTimer} size="sm" className="text-xs w-full"><Play className="w-3 h-3 mr-1" /> Start Bundle Timer</Button>}
          {startTime && <div className="text-[10px] text-muted-foreground text-center">Started: {new Date(startTime).toLocaleTimeString()}</div>}
        </CardContent>
      </Card>

      {/* Bundle Items */}
      <div className="space-y-2">
        {BUNDLE_ITEMS.map((item, i) => {
          const state = bundle[item.id];
          const timeDiff = state.completed && startTime ? ((new Date(state.time).getTime() - new Date(startTime).getTime()) / 60000) : null;
          const withinHour = timeDiff !== null && timeDiff <= 60;
          const overdue = timeDiff !== null && timeDiff > 180;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn('glass-card transition-all duration-300', state.completed && withinHour && 'bundle-item-complete', state.completed && !withinHour && 'bundle-item-pending', !state.completed && overdue && 'bundle-item-overdue')}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox checked={state.completed} onCheckedChange={() => toggleItem(item.id)} />
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-sm font-medium', state.completed && 'line-through text-muted-foreground')}>{item.label}</div>
                    <div className="text-[10px] text-muted-foreground">{item.detail}</div>
                  </div>
                  {state.completed && (
                    <Badge variant="outline" className={cn('text-[10px]', withinHour ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400')}>
                      {timeDiff !== null ? `${Math.round(timeDiff)}min` : 'Done'}
                    </Badge>
                  )}
                  {state.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                  {!state.completed && <XCircle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Result */}
      <Alert className={cn(compliance === 'full' ? 'border-emerald-500/40 bg-emerald-500/10' : compliance === 'partial' ? 'border-amber-500/40 bg-amber-500/10' : 'border-rose-500/40 bg-rose-500/10')}>
        <AlertTitle className="flex items-center gap-2">
          {compliance === 'full' ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : compliance === 'partial' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> : <Siren className="w-4 h-4 text-rose-400" />}
          {compliance === 'full' ? 'Full Bundle Compliance' : compliance === 'partial' ? 'Partial Compliance — Complete Remaining' : 'Inadequate — Critical Gap'}
        </AlertTitle>
        <AlertDescription className="text-xs mt-1">
          {compliance === 'full' ? 'All 6 bundle items completed. Excellent sepsis care.' : compliance === 'partial' ? `${completedCount}/6 completed. Complete the remaining ${6 - completedCount} items as soon as possible.` : `Only ${completedCount}/6 completed. IMMEDIATE action required. Sepsis mortality increases with each hour of delayed treatment.`}
        </AlertDescription>
      </Alert>

      <div className="flex gap-2">
        <Button onClick={reset} variant="outline" size="sm" className="text-xs"><RotateCcw className="w-3 h-3 mr-1" /> Reset Bundle</Button>
        <Badge variant="outline" className={cn('ml-auto text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
      </div>
    </div>
  );
}