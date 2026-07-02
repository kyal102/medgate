'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Route, CheckCircle2, XCircle, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

const PATHWAYS = {
  ami: {
    name: 'AMI (STEMI/NSTEMI)', color: 'rose',
    steps: [
      { id: 'ecg', label: 'Door-to-ECG', target: '<10 min', critical: true },
      { id: 'cath', label: 'Door-to-Balloon (STEMI)', target: '<90 min', critical: true },
      { id: 'dapt', label: 'DAPT (Aspirin + P2Y12)', target: 'Within 24h', critical: false },
      { id: 'bb', label: 'Beta-Blocker', target: 'Within 24h', critical: false },
      { id: 'statin', label: 'High-Intensity Statin', target: 'Within 24h', critical: false },
      { id: 'acei', label: 'ACE-I / ARB', target: 'Within 24h', critical: false },
      { id: 'rehab', label: 'Cardiac Rehab Referral', target: 'Before discharge', critical: false },
    ],
  },
  stroke: {
    name: 'Stroke (Acute Ischemic)', color: 'amber',
    steps: [
      { id: 'ct', label: 'Door-to-CT', target: '<25 min', critical: true },
      { id: 'tpa', label: 'Door-to-Needle (tPA)', target: '<60 min', critical: true },
      { id: 'bp', label: 'BP Management', target: 'Per protocol', critical: true },
      { id: 'dysphagia', label: 'Dysphagia Screen', target: 'Before PO', critical: false },
      { id: 'dvt', label: 'DVT Prophylaxis', target: 'Within 24h', critical: false },
      { id: 'aspirin', label: 'Aspirin 160-325mg', target: 'Within 24-48h', critical: false },
      { id: 'rehab', label: 'Stroke Rehab Assessment', target: 'Within 48h', critical: false },
    ],
  },
  copd: {
    name: 'COPD Exacerbation', color: 'primary',
    steps: [
      { id: 'abg', label: 'ABG within 1 hour', target: '<60 min', critical: true },
      { id: 'steroids', label: 'Systemic Corticosteroids', target: '<1 hour', critical: true },
      { id: 'bronchodilators', label: 'SABAs + Anticholinergics', target: '<1 hour', critical: true },
      { id: 'oxygen', label: 'Controlled O₂ (SpO2 88-92%)', target: 'Continuous', critical: true },
      { id: 'niv', label: 'NIV if pH <7.35', target: 'Within 1 hour', critical: true },
      { id: 'smoking', label: 'Smoking Cessation', target: 'During admission', critical: false },
      { id: 'inhalers', label: 'Discharge Inhaler Plan', target: 'Before discharge', critical: false },
    ],
  },
};

type PathwayId = keyof typeof PATHWAYS;

export function ClinicalPathwayValidator() {
  const [pathway, setPathway] = useState<PathwayId>('ami');
  const [steps, setSteps] = useState<Record<string, Record<string, { completed: boolean; time: string }>>>({});

  const currentPathway = PATHWAYS[pathway];
  const currentSteps = steps[pathway] || {};
  const completedCount = currentPathway.steps.filter(s => currentSteps[s.id]?.completed).length;
  const criticalMissed = currentPathway.steps.filter(s => s.critical && !currentSteps[s.id]?.completed).length;
  const compliance = Math.round((completedCount / currentPathway.steps.length) * 100);

  const gate = useMemo(() => {
    if (criticalMissed > 0) return 'BLOCK';
    if (compliance < 70) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [criticalMissed, compliance]);

  const toggleStep = (stepId: string) => {
    const now = new Date().toISOString();
    setSteps(prev => ({
      ...prev,
      [pathway]: {
        ...prev[pathway],
        [stepId]: { completed: !prev[pathway]?.[stepId]?.completed, time: !prev[pathway]?.[stepId]?.completed ? now : '' },
      },
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(PATHWAYS) as [PathwayId, typeof PATHWAYS.ami][]).map(([id, pw]) => (
          <Button key={id} size="sm" variant={pathway === id ? 'default' : 'outline'} onClick={() => setPathway(id)} className={cn('text-xs', pathway === id && 'bg-primary/20 text-primary')}>
            {pw.name}
          </Button>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">{currentPathway.name} Compliance</h4>
            <span className={cn('text-sm font-bold', compliance >= 90 ? 'text-emerald-400' : compliance >= 70 ? 'text-amber-400' : 'text-rose-400')}>{compliance}% ({completedCount}/{currentPathway.steps.length})</span>
          </div>
          <Progress value={compliance} className="h-2" />
          {criticalMissed > 0 && <div className="text-[10px] text-rose-400">⚠ {criticalMissed} critical step(s) missed</div>}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {currentPathway.steps.map((step, i) => {
          const state = currentSteps[step.id];
          const isComplete = state?.completed;
          return (
            <motion.div key={step.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <div className={cn('pathway-step rounded-lg border', isComplete ? 'pathway-step-complete' : 'pathway-step-pending')}>
                <div className="flex items-center gap-3 flex-1">
                  <button onClick={() => toggleStep(step.id)} className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors', isComplete ? 'bg-emerald-500 text-white' : 'border-2 border-muted-foreground/30 hover:border-primary/40')}>
                    {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{i + 1}</span>}
                  </button>
                  <div className="flex-1">
                    <div className="text-xs font-semibold">{step.label}</div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" /> Target: {step.target}
                      {state?.time && <span>• Completed: {new Date(state.time).toLocaleTimeString()}</span>}
                    </div>
                  </div>
                  {step.critical && !isComplete && <Badge className="text-[9px] bg-rose-500/20 text-rose-400 border-rose-500/30">Critical</Badge>}
                  {step.critical && isComplete && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Done</Badge>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}