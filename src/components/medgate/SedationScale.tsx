'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Moon, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

const RASS_LEVELS = [
  { score: 4, label: 'Combative', desc: 'Overtly combative, violent, immediate danger to staff', color: 'text-rose-400 bg-rose-500/15', border: 'border-rose-500/40' },
  { score: 3, label: 'Very Agitated', desc: 'Pulls or removes tubes/catheters, aggressive', color: 'text-rose-300 bg-rose-500/10', border: 'border-rose-500/30' },
  { score: 2, label: 'Agitated', desc: 'Frequent non-purposeful movement, fights ventilator', color: 'text-orange-400 bg-orange-500/10', border: 'border-orange-500/30' },
  { score: 1, label: 'Restless', desc: 'Anxious but movements not aggressive or vigorous', color: 'text-amber-400 bg-amber-500/10', border: 'border-amber-500/30' },
  { score: 0, label: 'Alert & Calm', desc: 'Spontaneously paying attention to caregiver', color: 'text-emerald-400 bg-emerald-500/10', border: 'border-emerald-500/30' },
  { score: -1, label: 'Drowsy', desc: 'Not fully alert, sustained (>10s) awakening to voice', color: 'text-primary bg-primary/10', border: 'border-primary/30' },
  { score: -2, label: 'Light Sedation', desc: 'Briefly (<10s) awakens to voice with eye contact', color: 'text-primary bg-primary/10', border: 'border-primary/30' },
  { score: -3, label: 'Moderate Sedation', desc: 'Movement or eye opening to voice (no eye contact)', color: 'text-sky-400 bg-sky-500/10', border: 'border-sky-500/30' },
  { score: -4, label: 'Deep Sedation', desc: 'No response to voice, movement or eye opening to physical stimulation', color: 'text-indigo-400 bg-indigo-500/10', border: 'border-indigo-500/30' },
  { score: -5, label: 'Unarousable', desc: 'No response to voice or physical stimulation', color: 'text-purple-400 bg-purple-500/10', border: 'border-purple-500/30' },
];

const ASSESSMENT_STEPS = [
  { step: 1, label: 'Observe', desc: 'Is patient alert and calm? Agitated? Restless?' },
  { step: 2, label: 'Call Patient by Name', desc: 'Ask to open eyes and look at speaker' },
  { step: 3, label: 'Physical Stimulation', desc: 'Shoulder shake or sternal rub if no response to voice' },
];

const SEDATIVE_AGENTS = [
  { rassRange: '+1 to +4', agent: 'Consider: Haloperidol, Quetiapine', type: 'Antipsychotic for agitation' },
  { rassRange: '-1 to 0', agent: 'Minimal or no sedation', type: 'Target for most ICU patients' },
  { rassRange: '-1 to -2', agent: 'Propofol 5-50 mcg/kg/min or Dexmedetomidine 0.2-1.5 mcg/kg/hr', type: 'Light sedation target' },
  { rassRange: '-2 to -3', agent: 'Propofol 10-80 mcg/kg/min or Midazolam 1-5 mg/hr', type: 'Moderate sedation' },
  { rassRange: '-3 to -5', agent: 'Consider NMB if RASS < -3 with no neurological exam planned', type: 'Deep sedation/paralysis' },
];

export function SedationScale() {
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [targetMin, setTargetMin] = useState(-2);
  const [targetMax, setTargetMax] = useState(0);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showAgents, setShowAgents] = useState(false);

  const inTarget = selectedScore !== null && selectedScore >= targetMin && selectedScore <= targetMax;
  const currentLevel = selectedScore !== null ? RASS_LEVELS.find(l => l.score === selectedScore) : null;

  const gate = useMemo(() => {
    if (selectedScore === null) return 'PENDING';
    if (selectedScore >= 3 || selectedScore <= -4) return 'BLOCK';
    if (!inTarget) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [selectedScore, inTarget, targetMin, targetMax]);

  return (
    <div className="space-y-4">
      {/* RASS Scale Visual */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Moon className="w-4 h-4 text-indigo-400" /> Richmond Agitation-Sedation Scale (RASS)</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {RASS_LEVELS.map(lvl => (
              <motion.button key={lvl.score} onClick={() => setSelectedScore(lvl.score)} whileTap={{ scale: 0.98 }}
                className={cn('w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left', lvl.border, lvl.color,
                  selectedScore === lvl.score ? 'ring-2 ring-primary/60 scale-[1.02] shadow-lg' : 'opacity-70 hover:opacity-100')}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-background/50">{lvl.score > 0 ? `+${lvl.score}` : lvl.score}</div>
                <div className="flex-1"><div className="text-xs font-semibold">{lvl.label}</div><div className="text-[10px] opacity-80">{lvl.desc}</div></div>
                {selectedScore === lvl.score && <Badge variant="outline" className="text-[10px]">Selected</Badge>}
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Zone */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Target Zone</h4>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">RASS</span>
              <span className="text-sm font-bold">{targetMin > 0 ? `+${targetMin}` : targetMin}</span>
              <span className="text-xs text-muted-foreground">to</span>
              <span className="text-sm font-bold">{targetMax > 0 ? `+${targetMax}` : targetMax}</span>
            </div>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {RASS_LEVELS.map(lvl => (
              <div key={lvl.score} className={cn('flex-1 transition-all', lvl.score >= targetMin && lvl.score <= targetMax ? 'bg-emerald-500' : 'bg-muted/30')} title={`RASS ${lvl.score > 0 ? '+' : ''}${lvl.score}`} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground"><span>+4</span><span>0</span><span>-5</span></div>
        </CardContent>
      </Card>

      {/* Result */}
      {selectedScore !== null && (
        <Alert className={cn(inTarget ? 'border-emerald-500/40 bg-emerald-500/10' : !inTarget && (selectedScore >= 2 || selectedScore <= -3) ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-500/40 bg-amber-500/10')}>
          <AlertTitle className="flex items-center gap-2 text-xs">
            {inTarget ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-amber-400" />}
            RASS {selectedScore > 0 ? `+${selectedScore}` : selectedScore} — {currentLevel?.label}
          </AlertTitle>
          <AlertDescription className="text-[11px] mt-1">
            {inTarget ? 'Within target sedation range. Continue current sedation regimen.' : 'Outside target range. Consider sedation adjustment. Review sedative infusion rates and address pain/agitation/delirium.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowAssessment(!showAssessment)} variant="outline" size="sm" className="text-xs">Assessment Steps</Button>
        <Button onClick={() => setShowAgents(!showAgents)} variant="outline" size="sm" className="text-xs">Sedative Reference</Button>
        <Badge variant="outline" className={cn('ml-auto text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : gate === 'ALLOW' ? 'border-emerald-500/40 text-emerald-400' : 'text-muted-foreground')}>Gate: {gate}</Badge>
      </div>

      {showAssessment && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-sm font-semibold">RASS Assessment Steps</h4>
            {ASSESSMENT_STEPS.map(s => (
              <div key={s.step} className="p-2 rounded-lg bg-muted/20 text-xs">
                <span className="font-semibold">Step {s.step} — {s.label}:</span> {s.desc}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {showAgents && (
        <Card className="glass-card">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-sm font-semibold">Sedative Agents by RASS Target</h4>
            {SEDATIVE_AGENTS.map((sa, i) => (
              <div key={i} className="p-2 rounded-lg bg-muted/20 text-xs space-y-0.5">
                <div className="font-semibold">RASS {sa.rassRange}</div>
                <div className="text-muted-foreground">{sa.agent}</div>
                <div className="text-[10px] text-primary">{sa.type}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}