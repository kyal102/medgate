'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EmergencyPathway {
  id: string;
  name: string;
  timeLimit: number;
  unit: string;
  steps: { time: number; label: string; description: string }[];
  lateConsequence: string;
}

const PATHWAYS: EmergencyPathway[] = [
  {
    id: 'stemi', name: 'STEMI', timeLimit: 90, unit: 'min',
    steps: [
      { time: 0, label: 'Door', description: 'Patient arrival / first medical contact' },
      { time: 10, label: 'ECG', description: '12-lead ECG acquisition and interpretation' },
      { time: 20, label: 'Cath Lab', description: 'Cath lab activation and team notification' },
      { time: 60, label: 'Transfer', description: 'Patient transport to cath lab (if applicable)' },
      { time: 90, label: 'Balloon', description: 'Wire crossing / balloon inflation (PCI)' },
    ],
    lateConsequence: 'Door-to-balloon > 90 min: Increased myocardial damage and mortality.',
  },
  {
    id: 'stroke', name: 'Stroke (tPA)', timeLimit: 60, unit: 'min',
    steps: [
      { time: 0, label: 'Door', description: 'Patient arrival — stroke team activation' },
      { time: 10, label: 'CT/CTA', description: 'Non-contrast head CT to exclude hemorrhage' },
      { time: 25, label: 'Labs', description: 'Glucose, coagulation, renal function' },
      { time: 45, label: 'Decision', description: 'Eligibility confirmed, consent obtained' },
      { time: 60, label: 'tPA', description: 'Alteplase bolus administered (door-to-needle)' },
    ],
    lateConsequence: 'Door-to-needle > 60 min: Reduced benefit, increased hemorrhagic transformation risk.',
  },
  {
    id: 'sepsis', name: 'Sepsis Bundle', timeLimit: 60, unit: 'min',
    steps: [
      { time: 0, label: 'Recognition', description: 'Sepsis suspected — measure lactate' },
      { time: 15, label: 'Cultures', description: 'Blood cultures × 2 before antibiotics' },
      { time: 30, label: 'Antibiotics', description: 'Broad-spectrum IV antibiotics' },
      { time: 45, label: 'Fluids', description: '30 mL/kg crystalloid if hypotensive/lactate ≥ 4' },
      { time: 60, label: 'Reassess', description: 'Hemodynamic reassessment, vasopressors if needed' },
    ],
    lateConsequence: '1-hour bundle not completed: Each hour delay increases mortality ~8%.',
  },
  {
    id: 'anaphylaxis', name: 'Anaphylaxis', timeLimit: 10, unit: 'min',
    steps: [
      { time: 0, label: 'Recognition', description: 'Anaphylaxis identified (airway/breathing/circulation)' },
      { time: 2, label: 'Epinephrine', description: 'IM Epinephrine 0.3-0.5 mg anterolateral thigh' },
      { time: 5, label: 'Position', description: 'Supine with legs elevated, airway management' },
      { time: 7, label: 'IV Access', description: 'Large-bore IV, fluid resuscitation' },
      { time: 10, label: 'Adjuncts', description: 'Antihistamines, steroids, nebulized salbutamol' },
    ],
    lateConsequence: 'Epinephrine > 10 min: Risk of fatal outcome. Epinephrine is FIRST-line.',
  },
  {
    id: 'trauma', name: 'Major Trauma', timeLimit: 60, unit: 'min',
    steps: [
      { time: 0, label: 'Primary Survey', description: 'ABCDE — Airway, Breathing, Circulation, Disability, Exposure' },
      { time: 10, label: 'Interventions', description: 'Hemorrhage control, airway, chest decompression' },
      { time: 20, label: 'Imaging', description: 'FAST ultrasound, portable CXR/pelvis X-ray' },
      { time: 40, label: 'Blood Products', description: 'Massive transfusion protocol if needed (1:1:1)' },
      { time: 60, label: 'Definitive', description: 'CT/OR decision — damage control surgery if unstable' },
    ],
    lateConsequence: 'Delay > 60 min to hemorrhage control: Exsanguination remains leading preventable trauma death.',
  },
  {
    id: 'pph', name: 'Postpartum Hemorrhage', timeLimit: 30, unit: 'min',
    steps: [
      { time: 0, label: 'Recognition', description: 'Blood loss > 500mL (vaginal) or > 1000mL (CS)' },
      { time: 5, label: 'UTK', description: 'Uterotonic agents (oxytocin, ergometrine, carboprost, misoprostol)' },
      { time: 10, label: 'Volume', description: 'Crystalloid resuscitation, crossmatch' },
      { time: 15, label: 'Surgical', description: 'Bimanual compression, intrauterine balloon, uterine packing' },
      { time: 30, label: 'Escalation', description: 'Consider intervention radiology, laparotomy if ongoing' },
    ],
    lateConsequence: 'Prolonged PPH: Risk of DIC, multi-organ failure, maternal death.',
  },
];

export function TimeCriticalPathway() {
  const [pathwayId, setPathwayId] = useState('');
  const [elapsed, setElapsed] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [currentElapsed, setCurrentElapsed] = useState(0);

  const pathway = PATHWAYS.find((p) => p.id === pathwayId);
  const elapsedMin = elapsed ? parseFloat(elapsed) : currentElapsed;
  const pct = pathway ? Math.min((elapsedMin / pathway.timeLimit) * 100, 120) : 0;
  const remaining = pathway ? Math.max(pathway.timeLimit - elapsedMin, 0) : 0;
  const overtime = pathway ? elapsedMin - pathway.timeLimit : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setCurrentElapsed((p) => Math.round((p + 0.1) * 10) / 10);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const getStatus = () => {
    if (!pathway) return 'idle';
    if (pct <= 60) return 'green';
    if (pct <= 90) return 'amber';
    if (pct <= 100) return 'red';
    return 'overtime';
  };

  const status = getStatus();

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Emergency Pathway</label>
              <Select value={pathwayId} onValueChange={(v) => { setPathwayId(v); setIsRunning(false); setCurrentElapsed(0); setElapsed(''); }}>
                <SelectTrigger className="w-full bg-slate-800/50 border-slate-600 text-white">
                  <SelectValue placeholder="Select pathway" />
                </SelectTrigger>
                <SelectContent>
                  {PATHWAYS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-slate-400">(&lt;{p.timeLimit}{p.unit})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Elapsed Time ({pathway?.unit || 'min'})</label>
              <div className="flex gap-2">
                <Input
                  type="number" step="0.1" placeholder="e.g. 45"
                  value={isRunning ? currentElapsed.toString() : elapsed}
                  onChange={(e) => setElapsed(e.target.value)}
                  disabled={isRunning}
                  className="flex-1 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
                <Button
                  variant={isRunning ? 'destructive' : 'default'}
                  onClick={() => { setIsRunning(!isRunning); if (isRunning) setElapsed(currentElapsed.toString()); }}
                  className={isRunning ? 'bg-rose-600 hover:bg-rose-500' : 'bg-cyan-600 hover:bg-cyan-500'}
                >
                  {isRunning ? 'Stop' : 'Start'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {pathway && (
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white">{pathway.name}</CardTitle>
                <div className="flex items-center gap-2">
                  {overtime > 0 && (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                      <ShieldAlert className="w-3 h-3 mr-1" />OVERTIME +{overtime.toFixed(1)}{pathway.unit}
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn(
                    status === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    status === 'amber' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    status === 'red' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                    'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                  )}>
                    {status === 'green' ? 'ON TRACK' : status === 'amber' ? 'APPROACHING' : status === 'red' ? 'CRITICAL' : 'EXCEEDED'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative overflow-hidden">
                <div className="h-6 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-300',
                      status === 'green' ? 'bg-emerald-500' :
                      status === 'amber' ? 'bg-amber-500' :
                      'bg-red-500'
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                {/* Time limit marker */}
                <div className="absolute top-0 h-full w-0.5 bg-white/80 z-10" style={{ left: '100%' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>0{pathway.unit}</span>
                <span className="text-cyan-400">{elapsedMin.toFixed(1)}{pathway.unit} elapsed</span>
                <span className={cn(remaining > 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {remaining > 0 ? `${remaining.toFixed(1)}${pathway.unit} remaining` : 'TIME EXCEEDED'}
                </span>
                <span>{pathway.timeLimit}{pathway.unit}</span>
              </div>
            </CardContent>
          </Card>

          {/* Visual timeline */}
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm">Pathway Steps</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                {/* Track line */}
                <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-slate-700" />
                <div className="space-y-4">
                  {pathway.steps.map((step, i) => {
                    const stepReached = elapsedMin >= step.time;
                    const nextStep = pathway.steps[i + 1];
                    const isCurrentStep = stepReached && nextStep ? elapsedMin < nextStep.time : stepReached && i === pathway.steps.length - 1;
                    return (
                      <div key={i} className="relative flex gap-4 items-start">
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 border-2',
                          stepReached ? (isCurrentStep ? 'bg-cyan-500/30 border-cyan-400' : 'bg-emerald-500/30 border-emerald-400') : 'bg-slate-800 border-slate-600'
                        )}>
                          {stepReached ? (isCurrentStep ? <Clock className="w-4 h-4 text-cyan-400" /> : <CheckCircle className="w-4 h-4 text-emerald-400" />) :
                            <div className="w-2 h-2 rounded-full bg-slate-500" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm font-semibold', stepReached ? 'text-white' : 'text-slate-500')}>{step.label}</p>
                            <span className="text-xs text-slate-500">{step.time}{pathway.unit}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {overtime > 0 && (
            <Card className="bg-rose-500/10 border-rose-500/30">
              <CardContent className="p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-rose-400 font-bold">TIME EXCEEDED</p>
                  <p className="text-sm text-rose-300 mt-1">{pathway.lateConsequence}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}