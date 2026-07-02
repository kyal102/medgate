'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Users, AlertTriangle, ShieldCheck, Info, Heart, Activity, Clock } from 'lucide-react';

const CFS_LEVELS = [
  { level: 1, label: 'Very Fit', color: 'bg-emerald-500', desc: 'Robust, active, energetic, well-motivated and fit. Exercises regularly, may participate in strenuous activities.' },
  { level: 2, label: 'Well', color: 'bg-emerald-400', desc: 'Well, without active disease. May exercise regularly but less than very fit.' },
  { level: 3, label: 'Managing Well', color: 'bg-lime-400', desc: 'Managing well with medical comorbidities but not regularly active beyond routine walking.' },
  { level: 4, label: 'Vulnerable', color: 'bg-yellow-400', desc: 'Not dependent on others for daily help. Often symptoms limit activities. Comorbidities present.' },
  { level: 5, label: 'Mildly Frail', color: 'bg-amber-400', desc: 'Mildly frail, dependent on others for IADLs (shopping, cooking, medications) and some ADLs.' },
  { level: 6, label: 'Moderately Frail', color: 'bg-orange-400', desc: 'Moderately frail, needs help with all outside activities and most ADLs. Needs assistance with bathing.' },
  { level: 7, label: 'Severely Frail', color: 'bg-orange-500', desc: 'Severely frail, completely dependent for personal care. Requires long-term nursing care.' },
  { level: 8, label: 'Very Severely Frail', color: 'bg-rose-400', desc: 'Very severely frail, completely dependent, approaching end of life. Cannot recover from even minor illness.' },
  { level: 9, label: 'Terminally Ill', color: 'bg-rose-500', desc: 'Terminally ill, approaching end of life. Life expectancy <6 months. Focus on comfort care.' },
];

const FRAIL_QUESTIONS = [
  { id: 'fatigue', label: 'Are you tired all the time?', weight: 1 },
  { id: 'walking', label: 'Do you have difficulty walking up 10 stairs?', weight: 1 },
  { id: 'illness', label: 'Have you had ≥5 illnesses in the past year?', weight: 1 },
  { id: 'weight', label: 'Have you lost >5% body weight in the past 3 months?', weight: 1 },
  { id: 'grip', label: 'Do you have difficulty gripping objects?', weight: 1 },
];

const RISK_BY_LEVEL: Record<number, { surgical: string; mortality: string; los: string; discharge: string }> = {
  1: { surgical: '~2%', mortality: '~1%', los: 'Expected', discharge: 'Home (95%)' },
  2: { surgical: '~4%', mortality: '~2%', los: 'Expected', discharge: 'Home (90%)' },
  3: { surgical: '~8%', mortality: '~4%', los: '+1-2 days', discharge: 'Home (85%)' },
  4: { surgical: '~15%', mortality: '~8%', los: '+3-5 days', discharge: 'Home/Rehab (75%)' },
  5: { surgical: '~25%', mortality: '~15%', los: '+5-7 days', discharge: 'Rehab/SNF (60%)' },
  6: { surgical: '~40%', mortality: '~25%', los: '+7-14 days', discharge: 'SNF/LTC (50%)' },
  7: { surgical: '~55%', mortality: '~40%', los: '+14-21 days', discharge: 'LTC (40%)' },
  8: { surgical: '~70%', mortality: '~55%', los: '+21 days', discharge: 'LTC/Death (30%)' },
  9: { surgical: 'N/A', mortality: '~80%', los: 'Variable', discharge: 'Comfort care' },
};

export function FrailtyAssessment() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [frailAnswers, setFrailAnswers] = useState<Record<string, boolean>>({});

  const frailScore = Object.values(frailAnswers).filter(Boolean).length;
  const frailRisk = frailScore >= 3 ? 'high' : frailScore >= 1 ? 'moderate' : 'low';

  const gate = useMemo(() => {
    if (selectedLevel === null) return 'PENDING';
    if (selectedLevel >= 7) return 'BLOCK';
    if (selectedLevel >= 5) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [selectedLevel]);

  const toggleFrail = (id: string) => setFrailAnswers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Visual CFS Scale */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-amber-400" /> Clinical Frailty Scale (CFS)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-1.5 flex-wrap">
            {CFS_LEVELS.map(lvl => (
              <motion.button key={lvl.level} onClick={() => setSelectedLevel(lvl.level)} whileTap={{ scale: 0.95 }}
                className={cn('frailty-segment rounded-xl p-2 text-center min-w-[60px] border transition-all', selectedLevel === lvl.level ? 'ring-2 ring-primary/60 scale-105 bg-primary/10' : 'border-muted/30 hover:bg-muted/20')}>
                <div className={cn('w-4 h-4 rounded-full mx-auto mb-1', lvl.color)} />
                <div className="text-[10px] font-bold">{lvl.level}</div>
                <div className="text-[9px] text-muted-foreground leading-tight">{lvl.label}</div>
              </motion.button>
            ))}
          </div>
          {selectedLevel && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 p-3 rounded-lg bg-muted/20 text-xs">
              <strong className="text-sm">CFS {selectedLevel} — {CFS_LEVELS[selectedLevel - 1].label}:</strong> {CFS_LEVELS[selectedLevel - 1].desc}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Risk Dashboard */}
      {selectedLevel && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Surgical Complications', value: RISK_BY_LEVEL[selectedLevel].surgical, icon: Activity },
              { label: '30-Day Mortality', value: RISK_BY_LEVEL[selectedLevel].mortality, icon: Heart },
              { label: 'LOS Impact', value: RISK_BY_LEVEL[selectedLevel].los, icon: Clock },
              { label: 'Discharge', value: RISK_BY_LEVEL[selectedLevel].discharge, icon: Info },
            ].map((r, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-3 text-center">
                  <r.icon className={cn('w-4 h-4 mx-auto mb-1', selectedLevel >= 5 ? 'text-amber-400' : 'text-emerald-400')} />
                  <div className="text-[10px] text-muted-foreground">{r.label}</div>
                  <div className={cn('text-sm font-bold', selectedLevel >= 7 ? 'text-rose-400' : selectedLevel >= 5 ? 'text-amber-400' : 'text-emerald-400')}>{r.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <Separator />

      {/* FRAIL Questionnaire */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">FRAIL Screening (5 Questions)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {FRAIL_QUESTIONS.map(q => (
            <label key={q.id} className={cn('flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors text-xs', frailAnswers[q.id] ? 'bg-amber-500/10' : 'hover:bg-muted/20')}>
              <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center transition-colors', frailAnswers[q.id] ? 'bg-amber-500 border-amber-500' : 'border-muted-foreground/30')} onClick={() => toggleFrail(q.id)}>
                {frailAnswers[q.id] && <span className="text-white text-xs">✓</span>}
              </div>
              {q.label}
            </label>
          ))}
          <div className="mt-2 p-2 rounded-lg bg-muted/20 text-xs">
            FRAIL Score: <strong>{frailScore}/5</strong> — {frailRisk === 'high' ? 'Frail (≥3)' : frailRisk === 'moderate' ? 'Pre-frail (1-2)' : 'Robust (0)'}
          </div>
        </CardContent>
      </Card>

      <Alert className={cn(selectedLevel !== null && selectedLevel >= 7 ? 'border-rose-500/40 bg-rose-500/10' : selectedLevel !== null && selectedLevel >= 5 ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
        <AlertTitle className="flex items-center gap-2 text-xs">
          {selectedLevel !== null && selectedLevel >= 7 ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          Gate: {gate} — {selectedLevel !== null && selectedLevel >= 7 ? 'Consider palliative approach, high operative risk' : selectedLevel !== null && selectedLevel >= 5 ? 'Frailty-adjusted surgical planning required' : 'Suitable for standard surgical pathways'}
        </AlertTitle>
      </Alert>
    </div>
  );
}