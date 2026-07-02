'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Baby, AlertTriangle, ShieldCheck } from 'lucide-react';

const MILESTONES = [
  { week: 6, label: 'NT Scan', desc: 'Nuchal translucency + first trimester screen' },
  { week: 8, label: 'First Prenatal Visit', desc: 'Confirm dating, baseline labs, prenatal vitamins' },
  { week: 12, label: 'End of First Trimester', desc: 'Organogenesis complete' },
  { week: 16, label: 'Quad Screen', desc: 'Optional maternal serum screening' },
  { week: 20, label: 'Anatomy Scan', desc: 'Detailed fetal anatomy ultrasound' },
  { week: 24, label: 'Glucose Challenge', desc: 'Gestational diabetes screening (50g 1hr)' },
  { week: 28, label: 'Start Kick Counts', desc: 'Daily fetal movement monitoring' },
  { week: 28, label: 'RhoGAM if Rh-', desc: 'Anti-D immunoglobulin 300mcg IM' },
  { week: 32, label: 'GDM Management', desc: 'If positive: diet, glucose monitoring' },
  { week: 35, label: 'GBS Swab', desc: 'Group B Strep vaginal/rectal culture' },
  { week: 36, label: 'BPP/AFI', desc: 'Biophysical profile if indicated' },
  { week: 37, label: 'Term', desc: 'Full term — safe for delivery' },
  { week: 39, label: 'Early Term', desc: 'Optimal delivery timing' },
  { week: 41, label: 'Post-term', desc: 'Induction of labor consideration' },
];

export function PregnancyWheelCalculator() {
  const [lmp, setLmp] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 120); return d.toISOString().split('T')[0]; });

  const edd = useMemo(() => {
    const lmpDate = new Date(lmp);
    lmpDate.setDate(lmpDate.getDate() + 280);
    return lmpDate;
  }, [lmp]);

  const ga = useMemo(() => {
    const lmpDate = new Date(lmp);
    const diff = Date.now() - lmpDate.getTime();
    const weeks = Math.floor(diff / (7 * 86400000));
    const days = Math.floor((diff % (7 * 86400000)) / 86400000);
    return { weeks, days, totalDays: weeks * 7 + days, trimester: weeks < 13 ? 1 : weeks < 27 ? 2 : 3 };
  }, [lmp]);

  const trimesterLabel = ga.trimester === 1 ? 'First Trimester' : ga.trimester === 2 ? 'Second Trimester' : 'Third Trimester';
  const trimesterColor = ga.trimester === 1 ? 'text-rose-400' : ga.trimester === 2 ? 'text-amber-400' : 'text-primary';

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div><Label className="text-xs">Last Menstrual Period (LMP)</Label><Input type="date" value={lmp} onChange={e => setLmp(e.target.value)} className="h-8 text-sm w-1/2" /></div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Gestational Age</div><div className={cn('text-lg font-bold', trimesterColor)}>{ga.weeks}w {ga.days}d</div></div>
            <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Estimated Due Date</div><div className="text-lg font-bold text-primary">{edd.toLocaleDateString()}</div></div>
            <div className="p-3 rounded-lg bg-muted/20"><div className="text-[10px] text-muted-foreground">Trimester</div><div className={cn('text-lg font-bold', trimesterColor)}>{trimesterLabel}</div></div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Pregnancy Timeline</CardTitle></CardHeader>
        <CardContent>
          <div className="relative">
            <div className="gestation-timeline w-full">
              <div className="gestation-timeline-fill" style={{ width: `${Math.min(100, (ga.totalDays / 280) * 100)}%` }} />
            </div>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {MILESTONES.map(m => {
                const passed = ga.totalDays >= m.week * 7;
                const upcoming = !passed && ga.totalDays >= (m.week * 7) - 14;
                return (
                  <div key={m.week} className={cn('flex items-center gap-3 text-xs p-2 rounded-lg', passed ? 'bg-muted/10' : upcoming ? 'bg-primary/10 border border-primary/20' : 'opacity-50')}>
                    <div className={cn('w-3 h-3 rounded-full flex-shrink-0', passed ? 'bg-emerald-500' : upcoming ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30')} />
                    <div className="flex-1"><span className="font-semibold">{m.week}w — {m.label}</span><div className="text-[10px] text-muted-foreground">{m.desc}</div></div>
                    {passed && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400">Done</Badge>}
                    {upcoming && <Badge className="text-[9px] bg-primary/20 text-primary">Due</Badge>}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}