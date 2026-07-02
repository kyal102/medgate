'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UtensilsCrossed, AlertTriangle, ShieldCheck, CheckCircle2, XCircle, Stethoscope } from 'lucide-react';

const STAGES = [
  { id: 1, volume: '1 mL', desc: 'Single teaspoon from cup', pass: 'Swallows without difficulty', fail: 'Coughing, wet voice, delayed swallow' },
  { id: 2, volume: '3 mL', desc: 'Small sip from cup', pass: 'Smooth swallow, clear voice', fail: 'Coughing, throat clearing, wet voice' },
  { id: 3, volume: 'Half cup', desc: 'Drink freely from cup', pass: 'No coughing, normal voice, comfortable', fail: 'Coughing, stridor, respiratory distress' },
];

const SYMPTOMS = [
  { id: 'cough', label: 'Coughing during/after swallow' },
  { id: 'wet-voice', label: 'Wet/gurgly voice quality' },
  { id: 'throat-clear', label: 'Excessive throat clearing' },
  { id: 'waterfall', label: 'Waterfall sounds after swallow' },
  { id: 'respiratory', label: 'Respiratory change' },
  { id: 'facial-droop', label: 'Facial weakness/drooping' },
  { id: 'delayed', label: 'Delayed swallow initiation (>3 sec)' },
  { id: 'multiple-swallow', label: 'Multiple swallows per bolus' },
];

const DIET_RECS: Record<string, { label: string; desc: string; foods: string }> = {
  normal: { label: 'Regular Diet', desc: 'All textures safe', foods: 'Regular solid food, thin liquids' },
  modified: { label: 'Modified Diet', desc: 'Texture-modified foods and/or thickened liquids', foods: 'Moist, minced, or pureed solids; nectar-thick or honey-thick liquids' },
  npo: { label: 'NPO — Nothing by Mouth', desc: 'Immediate speech-language pathology referral required', foods: 'Nil oral intake. IV fluids if needed. SLP evaluation within 24 hours.' },
};

export function SwallowingScreening() {
  const [stageResults, setStageResults] = useState<Record<number, 'pass' | 'fail' | null>>({ 1: null, 2: null, 3: null });
  const [selectedSymptoms, setSelectedSymptoms] = useState<Set<string>>(new Set());
  const [preScreen, setPreScreen] = useState({ alert: false, sitting: false, oralHygiene: false, denturesOk: true });

  const toggleSymptom = (id: string) => setSelectedSymptoms(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const result = useMemo(() => {
    const f1 = stageResults[1];
    const f2 = stageResults[2];
    const f3 = stageResults[3];
    if (f1 === 'fail' || selectedSymptoms.has('cough') || selectedSymptoms.has('respiratory')) return { level: 'npo' as const, risk: 'high' as const };
    if (f1 === 'pass' && f2 === 'fail') return { level: 'modified' as const, risk: 'moderate' as const };
    if (f1 === 'pass' && f2 === 'pass' && (f3 === 'fail' || selectedSymptoms.size >= 2)) return { level: 'modified' as const, risk: 'moderate' as const };
    if (f1 === 'pass' && f2 === 'pass' && f3 === 'pass') return { level: 'normal' as const, risk: 'low' as const };
    return { level: 'pending' as const, risk: 'unknown' as const };
  }, [stageResults, selectedSymptoms]);

  const gate = useMemo(() => {
    if (result.level === 'npo') return 'BLOCK';
    if (result.level === 'modified') return 'NEEDS_REVIEW';
    if (result.level === 'normal') return 'ALLOW';
    return 'PENDING';
  }, [result]);

  const setStage = (stage: number, val: 'pass' | 'fail') => {
    const newResults = { ...stageResults, [stage]: val };
    if (val === 'fail') { for (let i = stage + 1; i <= 3; i++) newResults[i] = null; }
    else { if (stage < 3) newResults[stage + 1] = null; }
    setStageResults(newResults);
  };

  return (
    <div className="space-y-4">
      {/* Pre-screen */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Stethoscope className="w-4 h-4 text-primary" /> Pre-Screen Checklist</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            { id: 'alert', label: 'Patient alert and cooperative' },
            { id: 'sitting', label: 'Able to sit upright (≥60°)' },
            { id: 'oralHygiene', label: 'Oral cavity clear of debris' },
            { id: 'denturesOk', label: 'Dentures secure (or none)' },
          ].map(item => (
            <label key={item.id} className={cn('flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors', preScreen[item.id as keyof typeof preScreen] ? 'bg-emerald-500/10' : 'hover:bg-muted/20')}
              onClick={() => setPreScreen(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof prev] }))}>
              <div className={cn('w-4 h-4 rounded border flex items-center justify-center text-[10px]', preScreen[item.id as keyof typeof preScreen] ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/30')}>
                {preScreen[item.id as keyof typeof preScreen] ? '✓' : ''}
              </div>
              {item.label}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* Water Swallow Test */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><UtensilsCrossed className="w-4 h-4 text-orange-400" /> Water Swallow Test Protocol</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {STAGES.map(stage => {
            const disabled = stage.id > 1 && (stageResults[stage.id - 1] !== 'pass');
            return (
              <motion.div key={stage.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: stage.id * 0.1 }}
                className={cn('rounded-xl p-3 border transition-all', stageResults[stage.id] === 'pass' && 'swallow-stage-pass', stageResults[stage.id] === 'fail' && 'swallow-stage-fail', disabled && 'opacity-40 pointer-events-none')}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">{stage.id}</span>
                    <span className="text-sm font-semibold">{stage.volume}</span>
                    <span className="text-[10px] text-muted-foreground">— {stage.desc}</span>
                  </div>
                  {stageResults[stage.id] && <Badge variant="outline" className={cn('text-[10px]', stageResults[stage.id] === 'pass' ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400')}>{stageResults[stage.id]}</Badge>}
                </div>
                {!disabled && stageResults[stage.id] === null && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => setStage(stage.id, 'pass')}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Pass
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10" onClick={() => setStage(stage.id, 'fail')}>
                      <XCircle className="w-3 h-3 mr-1" /> Fail
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Symptoms */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Clinical Signs Observed</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-1.5">
            {SYMPTOMS.map(s => (
              <label key={s.id} className={cn('flex items-center gap-1.5 text-[10px] cursor-pointer p-1.5 rounded-lg transition-colors', selectedSymptoms.has(s.id) ? 'bg-rose-500/10' : 'hover:bg-muted/20')}
                onClick={() => toggleSymptom(s.id)}>
                <div className={cn('w-3.5 h-3.5 rounded border', selectedSymptoms.has(s.id) ? 'bg-rose-500 border-rose-500' : 'border-muted-foreground/30')} />
                {s.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result.level !== 'pending' && (
        <Alert className={cn(result.level === 'npo' ? 'border-rose-500/40 bg-rose-500/10' : result.level === 'modified' ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
          <AlertTitle className="flex items-center gap-2 text-xs">
            {result.level === 'normal' ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3" />}
            {DIET_RECS[result.level].label}
          </AlertTitle>
          <AlertDescription className="text-[11px] mt-1">{DIET_RECS[result.level].desc}</AlertDescription>
        </Alert>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : gate === 'ALLOW' ? 'border-emerald-500/40 text-emerald-400' : 'text-muted-foreground')}>Gate: {gate}</Badge>
    </div>
  );
}