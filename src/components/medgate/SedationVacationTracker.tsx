'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Sun, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export function SedationVacationTracker() {
  const [days, setDays] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('sat-days') || '[]'); } catch { return []; }
  });
  const [showProtocol, setShowProtocol] = useState(false);

  const today = new Date().toDateString();
  const todayEntry = days.find(d => d.date === today);
  const last7 = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const entry = days.find(d => d.date === dateStr);
      result.push({ date: dateStr, label: date.toLocaleDateString('en', { weekday: 'short' }), day: date.getDate(), entry });
    }
    return result;
  }, [days]);

  const consecutiveMissed = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const entry = days.find(d => d.date === dateStr);
      if (!entry || !entry.performed) count++;
      else break;
    }
    return count;
  }, [days]);

  const compliance = last7.filter(d => d.entry?.performed).length;
  const compliancePct = Math.round((compliance / 7) * 100);

  const gate = useMemo(() => {
    if (consecutiveMissed > 3) return 'BLOCK';
    if (consecutiveMissed > 1) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [consecutiveMissed]);

  const markToday = (performed: boolean, rassEnd: number) => {
    const newDays = [...days.filter(d => d.date !== today), { date: today, performed, rassEnd, time: new Date().toISOString() }];
    setDays(newDays);
    if (typeof window !== 'undefined') localStorage.setItem('sat-days', JSON.stringify(newDays));
  };

  const protocol = [
    { step: 1, title: 'Assess Readiness', desc: 'No NMB, hemodynamically stable, FiO2 <60%, PEEP ≤10, no active seizures, no open abdomen' },
    { step: 2, title: 'Pause Sedation', desc: 'Stop all sedative infusions. Leave analgesic infusions running unless naloxone/flumazenil needed.' },
    { step: 3, title: 'Monitor (30-120 min)', desc: 'Observe for agitation, pain, respiratory distress. Assess RASS at regular intervals.' },
    { step: 4, title: 'Assess RASS', desc: 'Document RASS score at end of SAT. Note level of consciousness and orientation.' },
    { step: 5, title: 'Re-assess Sedation', desc: 'If SAT successful: reduce target RASS or resume at lower rate. If failed: resume previous sedation.' },
    { step: 6, title: 'Document', desc: 'Record: Start time, duration, RASS scores, outcome (tolerated/reduced/off), any adverse events.' },
  ];

  return (
    <div className="space-y-4">
      {/* 7-Day Calendar */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Sun className="w-4 h-4 text-indigo-400" /> Daily SAT Compliance</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-center gap-2">
            {last7.map((d, i) => (
              <div key={i} className={cn('vacation-day', d.entry?.performed ? 'vacation-day-compliant' : d.date === today ? 'vacation-day-today vacation-day-missed' : 'vacation-day-missed')}>
                <div className="text-[9px]">{d.label}</div>
                <div className="font-bold">{d.day}</div>
                {d.entry?.performed && <CheckCircle2 className="w-3 h-3 text-emerald-400 mx-auto" />}
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <span className={cn('text-2xl font-bold', compliancePct >= 85 ? 'text-emerald-400' : compliancePct >= 50 ? 'text-amber-400' : 'text-rose-400')}>{compliancePct}%</span>
            <span className="text-xs text-muted-foreground ml-2">({compliance}/7 days)</span>
          </div>
        </CardContent>
      </Card>

      {/* Today's SAT */}
      {!todayEntry?.performed && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-semibold">Today&apos;s Sedation Vacation</h4>
            <div className="text-xs text-muted-foreground mb-2">Select the outcome of today&apos;s SAT:</div>
            <div className="flex gap-2">
              {[-2, -1, 0, 1, 2].map(rass => (
                <button key={rass} onClick={() => markToday(true, rass)} className={cn('flex-1 p-3 rounded-lg border text-xs transition-all hover:bg-primary/10', rass === 0 ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-muted/30')}>
                  <div className="font-bold">{rass > 0 ? `+${rass}` : rass}</div>
                  <div className="text-[9px] text-muted-foreground">RASS</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {todayEntry?.performed && (
        <Alert className="border-emerald-500/40 bg-emerald-500/10">
          <AlertTitle className="text-xs flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> SAT Completed Today — RASS: {todayEntry.rassEnd}</AlertTitle>
        </Alert>
      )}

      <div className="flex gap-2">
        <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
        <Button onClick={() => setShowProtocol(!showProtocol)} variant="outline" size="sm" className="text-xs ml-auto">Protocol</Button>
      </div>

      {consecutiveMissed > 1 && (
        <Alert className="border-rose-500/40 bg-rose-500/10">
          <AlertTitle className="text-xs flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-rose-400" /> {consecutiveMissed} consecutive days missed</AlertTitle>
          <AlertDescription className="text-[10px] mt-1">Daily SAT reduces ventilator days, ICU LOS, and mortality. Address barriers immediately.</AlertDescription>
        </Alert>
      )}

      {showProtocol && (
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">SAT Protocol</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {protocol.map(p => (
              <div key={p.step} className="p-2 rounded-lg bg-muted/20 text-xs">
                <span className="font-semibold">Step {p.step} — {p.title}:</span> {p.desc}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}