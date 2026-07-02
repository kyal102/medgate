'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Lock,
  Unlock,
  UserPlus,
  Scissors,
  FileCheck,
  ClipboardCheck,
  TriangleAlert,
  CircleDot,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PhaseId = 'sign_in' | 'time_out' | 'sign_out';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface ChecklistItem {
  id: string;
  label: string;
  critical: boolean;
  checked: boolean;
  completedAt: string | null;
}

interface PhaseConfig {
  id: PhaseId;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  icon: typeof UserPlus;
  items: Omit<ChecklistItem, 'checked' | 'completedAt'>[];
}

interface PhaseState {
  completed: boolean;
  completedAt: string | null;
  gate: GateDecision | null;
  deviationLogged: boolean;
  items: ChecklistItem[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PHASES: PhaseConfig[] = [
  {
    id: 'sign_in',
    number: 1,
    title: 'Sign In',
    subtitle: 'Before Anesthesia Induction',
    description: 'Confirm patient identity, procedure, consent, and safety checks before anesthesia',
    icon: UserPlus,
    items: [
      { id: 'si-1', label: 'Patient identity confirmed', critical: true },
      { id: 'si-2', label: 'Procedure and site confirmed', critical: true },
      { id: 'si-3', label: 'Informed consent signed', critical: true },
      { id: 'si-4', label: 'Site marked (if applicable)', critical: false },
      { id: 'si-5', label: 'Anesthesia safety check completed', critical: true },
      { id: 'si-6', label: 'Allergies reviewed and documented', critical: true },
      { id: 'si-7', label: 'Difficult airway / aspiration risk assessed', critical: true },
    ],
  },
  {
    id: 'time_out',
    number: 2,
    title: 'Time Out',
    subtitle: 'Before Skin Incision',
    description: 'Final verification before incision with entire surgical team',
    icon: Scissors,
    items: [
      { id: 'to-1', label: 'All team members introduced by name and role', critical: false },
      { id: 'to-2', label: 'Patient name, procedure, and incision site confirmed by all', critical: true },
      { id: 'to-3', label: 'Antibiotic prophylaxis given within last 60 minutes', critical: true },
      { id: 'to-4', label: 'Anticipated critical events reviewed', critical: true },
      { id: 'to-5', label: 'Anesthesia concerns reviewed', critical: true },
      { id: 'to-6', label: 'Special equipment requirements confirmed', critical: false },
      { id: 'to-7', label: 'Blood product availability confirmed (if needed)', critical: false },
    ],
  },
  {
    id: 'sign_out',
    number: 3,
    title: 'Sign Out',
    subtitle: 'Before Patient Leaves Operating Room',
    description: 'Final accounting and handoff before patient leaves the OR',
    icon: FileCheck,
    items: [
      { id: 'so-1', label: 'Instrument, sponge, and needle counts complete and correct', critical: true },
      { id: 'so-2', label: 'Specimens labeled (name, specimen, site)', critical: true },
      { id: 'so-3', label: 'Equipment problems identified and addressed', critical: false },
      { id: 'so-4', label: 'Key concerns for recovery and management reviewed', critical: true },
      { id: 'so-5', label: 'Anticipated blood loss reviewed vs actual blood loss', critical: false },
    ],
  },
];

function initPhaseState(phase: PhaseConfig): PhaseState {
  return {
    completed: false,
    completedAt: null,
    gate: null,
    deviationLogged: false,
    items: phase.items.map(item => ({ ...item, checked: false, completedAt: null })),
  };
}

function gateColor(gate: GateDecision): string {
  if (gate === 'ALLOW') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (gate === 'NEEDS_REVIEW') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
}

/* ------------------------------------------------------------------ */
/*  Progress Ring SVG                                                  */
/* ------------------------------------------------------------------ */

function ProgressRing({ percentage, size = 48, stroke = 3, color = '#22d3ee' }: {
  percentage: number; size?: number; stroke?: number; color?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="currentColor" strokeWidth={stroke}
        className="text-slate-800"
      />
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function SurgicalSafetyChecklist() {
  const [procedureName, setProcedureName] = useState('');
  const [safetyConcerns, setSafetyConcerns] = useState('');
  const [phaseStates, setPhaseStates] = useState<Record<PhaseId, PhaseState>>(() => ({
    sign_in: initPhaseState(PHASES[0]),
    time_out: initPhaseState(PHASES[1]),
    sign_out: initPhaseState(PHASES[2]),
  }));
  const [activePhase, setActivePhase] = useState<PhaseId>('sign_in');
  const [loading, setLoading] = useState(false);

  const phasesOrder: PhaseId[] = ['sign_in', 'time_out', 'sign_out'];
  const activePhaseIdx = phasesOrder.indexOf(activePhase);
  const currentPhaseConfig = PHASES[activePhaseIdx];
  const currentState = phaseStates[activePhase];

  // Can we proceed to the next phase?
  const canProceed = useMemo(() => {
    if (currentState.completed) return true;
    const allCriticalChecked = currentState.items
      .filter(i => i.critical)
      .every(i => i.checked);
    return allCriticalChecked;
  }, [currentState]);

  const isPreviousPhaseComplete = (idx: number): boolean => {
    if (idx === 0) return true;
    const prevPhaseId = phasesOrder[idx - 1];
    return phaseStates[prevPhaseId].completed;
  };

  const toggleItem = (itemId: string) => {
    const now = new Date().toISOString();
    setPhaseStates(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        completed: false,
        completedAt: null,
        gate: null,
        items: prev[activePhase].items.map(item =>
          item.id === itemId
            ? { ...item, checked: !item.checked, completedAt: !item.checked ? now : null }
            : item
        ),
      },
    }));
  };

  const completePhase = async () => {
    if (!canProceed && !currentState.deviationLogged) {
      toast.error('Cannot complete phase', {
        description: 'All critical items must be checked, or a deviation must be logged.',
      });
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();
    const checkedCount = currentState.items.filter(i => i.checked).length;
    const totalCount = currentState.items.length;
    const allChecked = checkedCount === totalCount;

    let gate: GateDecision = 'ALLOW';
    if (currentState.deviationLogged || !allChecked) {
      gate = 'NEEDS_REVIEW';
    }
    const uncheckedCritical = currentState.items.filter(i => i.critical && !i.checked);
    if (uncheckedCritical.length > 0 && !currentState.deviationLogged) {
      gate = 'BLOCK';
    }

    try {
      const res = await fetch('/api/medgate/surgical-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: activePhase,
          procedureName,
          items: currentState.items,
          gate,
          deviationLogged: currentState.deviationLogged,
          safetyConcerns,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        gate = data.gateDecision || gate;
      }
    } catch {
      // Use local gate decision
    }

    setPhaseStates(prev => ({
      ...prev,
      [activePhase]: {
        ...prev[activePhase],
        completed: true,
        completedAt: now,
        gate,
      },
    }));

    toast.success(`${currentPhaseConfig.title} phase completed`, {
      description: gate === 'ALLOW' ? 'All checks passed. Gate: ALLOW' : `Gate: ${gate} — Deviations noted.`,
    });

    // Auto-advance to next phase if available
    if (activePhaseIdx < 2) {
      setTimeout(() => {
        setActivePhase(phasesOrder[activePhaseIdx + 1]);
      }, 800);
    }

    setLoading(false);
  };

  const logDeviation = () => {
    setPhaseStates(prev => ({
      ...prev,
      [activePhase]: { ...prev[activePhase], deviationLogged: true },
    }));
    toast.warning('Deviation logged', {
      description: 'You can now complete the phase. This will be noted in the surgical safety record.',
    });
  };

  // Stats
  const totalItems = PHASES.reduce((sum, p) => sum + p.items.length, 0);
  const totalChecked = useMemo(() => {
    let count = 0;
    for (const phaseId of phasesOrder) {
      count += phaseStates[phaseId].items.filter(i => i.checked).length;
    }
    return count;
  }, [phaseStates]);
  const overallPct = totalItems > 0 ? (totalChecked / totalItems) * 100 : 0;
  const completedPhases = phasesOrder.filter(pId => phaseStates[pId].completed).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={ShieldCheck}
        title="Surgical Safety Checklist"
        subtitle="WHO Surgical Safety Checklist — Digital Implementation"
        badge={completedPhases === 3 ? 'Complete' : `${completedPhases}/3 Phases`}
        badgeColor={completedPhases === 3
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        }
      />

      {/* Procedure Name */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Procedure Name</Label>
                <Input
                  value={procedureName}
                  onChange={e => setProcedureName(e.target.value)}
                  placeholder="e.g., Laparoscopic Cholecystectomy"
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Safety Concerns (Optional)</Label>
                <Input
                  value={safetyConcerns}
                  onChange={e => setSafetyConcerns(e.target.value)}
                  placeholder="Any safety concerns to note..."
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stepper */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {PHASES.map((phase, idx) => {
            const state = phaseStates[phase.id];
            const isActive = activePhase === phase.id;
            const isComplete = state.completed;
            const isAccessible = idx === 0 || phaseStates[phasesOrder[idx - 1]].completed;
            const PhaseIcon = phase.icon;
            const phasePct = state.items.length > 0
              ? (state.items.filter(i => i.checked).length / state.items.length) * 100
              : 0;

            return (
              <div key={phase.id} className="flex-1 flex flex-col items-center">
                {/* Connector line */}
                {idx > 0 && (
                  <div className="absolute top-6 left-0 right-0 flex items-center px-8 pointer-events-none" style={{ zIndex: 0 }}>
                    <div className="flex-1 h-0.5 bg-slate-800">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: '0%' }}
                        animate={{ width: phaseStates[phasesOrder[idx - 1]].completed ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={() => isAccessible && setActivePhase(phase.id)}
                  disabled={!isAccessible && !isActive}
                  className={cn(
                    'relative flex flex-col items-center gap-2 z-10 group',
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  )}
                >
                  {/* Progress Ring */}
                  <div className="relative">
                    <ProgressRing
                      percentage={isComplete ? 100 : phasePct}
                      size={52}
                      stroke={3}
                      color={isComplete ? '#10b981' : isActive ? '#22d3ee' : '#475569'}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isActive ? (
                        <PhaseIcon className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      'text-xs font-bold',
                      isComplete ? 'text-emerald-400' : isActive ? 'text-cyan-400' : 'text-slate-500'
                    )}>
                      Phase {phase.number}
                    </p>
                    <p className="text-[10px] text-slate-500">{phase.title}</p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <Card className="glass-card border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    {(() => { const I = currentPhaseConfig.icon; return <I className="w-5 h-5 text-cyan-400" />; })()}
                    Phase {currentPhaseConfig.number}: {currentPhaseConfig.title}
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{currentPhaseConfig.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ProgressRing
                      percentage={
                        currentState.items.length > 0
                          ? (currentState.items.filter(i => i.checked).length / currentState.items.length) * 100
                          : 0
                      }
                      size={40}
                      stroke={2.5}
                      color={currentState.completed ? '#10b981' : '#22d3ee'}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">
                        {currentState.items.filter(i => i.checked).length}/{currentState.items.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500">{currentPhaseConfig.description}</p>

              {/* Already completed banner */}
              {currentState.completed && (
                <Alert className="border-emerald-500/40 bg-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <AlertTitle className="text-emerald-400 text-sm">Phase Completed</AlertTitle>
                  <AlertDescription className="text-xs text-slate-400">
                    Completed at {currentState.completedAt ? new Date(currentState.completedAt).toLocaleTimeString() : 'N/A'}
                    {currentState.gate && ` · Gate: ${currentState.gate}`}
                    {currentState.deviationLogged && ' · Deviation logged'}
                  </AlertDescription>
                </Alert>
              )}

              <Separator className="bg-slate-700/50" />

              {/* Checklist Items */}
              <div className="space-y-2">
                {currentState.items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className={cn(
                      'flex items-start gap-3 rounded-lg px-4 py-3 transition-all duration-200 border',
                      idx % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10',
                      item.checked
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'border-slate-700/20'
                    )}
                  >
                    <div className="pt-0.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={() => toggleItem(item.id)}
                              className={cn(
                                'data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500',
                                item.critical && !item.checked && 'border-amber-500/50'
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            {item.critical ? 'Critical item — must be checked to proceed' : 'Non-critical item'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm',
                          item.checked ? 'text-emerald-300 line-through' : 'text-slate-300'
                        )}>
                          {item.label}
                        </span>
                        {item.critical && !item.checked && (
                          <Badge variant="outline" className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/40 shrink-0">
                            <TriangleAlert className="w-2.5 h-2.5 mr-0.5" />
                            CRITICAL
                          </Badge>
                        )}
                      </div>
                      {item.completedAt && (
                        <span className="text-[10px] text-emerald-600 font-mono">
                          ✓ {new Date(item.completedAt).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Incomplete critical items warning */}
              {!canProceed && !currentState.completed && !currentState.deviationLogged && (
                <Alert className="border-amber-500/40 bg-amber-500/10">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <AlertTitle className="text-amber-400 text-sm">Critical Items Incomplete</AlertTitle>
                  <AlertDescription className="text-xs text-slate-400">
                    {currentState.items.filter(i => i.critical && !i.checked).length} critical item(s) remain unchecked.
                    You must check all critical items or log a deviation to proceed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              {!currentState.completed && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={completePhase}
                    disabled={loading || (!canProceed && !currentState.deviationLogged)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white h-10"
                  >
                    {loading ? 'Completing...' : 'Complete Phase'}
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                  </Button>
                  {!canProceed && (
                    <Button
                      variant="outline"
                      onClick={logDeviation}
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 h-10"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Log Deviation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gate Decision for completed phase */}
          {currentState.completed && currentState.gate && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Alert className={cn('border', gateColor(currentState.gate))}>
                {currentState.gate === 'ALLOW' ? <CheckCircle2 className="w-4 h-4" /> :
                 currentState.gate === 'NEEDS_REVIEW' ? <Info className="w-4 h-4" /> :
                 <XCircle className="w-4 h-4" />}
                <AlertTitle className="text-sm font-bold">
                  Phase Gate Decision: {currentState.gate}
                </AlertTitle>
                <AlertDescription className="text-xs text-slate-400">
                  {currentState.gate === 'ALLOW'
                    ? 'All safety checks completed successfully.'
                    : currentState.deviationLogged
                      ? 'Phase completed with logged deviation(s). Clinical review recommended.'
                      : 'Phase completed with unresolved critical items.'
                  }
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Phase Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setActivePhase(phasesOrder[activePhaseIdx - 1])}
              disabled={activePhaseIdx === 0}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setActivePhase(phasesOrder[activePhaseIdx + 1])}
              disabled={activePhaseIdx === 2 || !isPreviousPhaseComplete(activePhaseIdx + 1)}
              className="border-slate-700 text-slate-400 hover:text-white"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Overall Summary */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-cyan-400" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <ProgressRing percentage={overallPct} size={64} stroke={4} color={overallPct === 100 ? '#10b981' : '#22d3ee'} />
            <div>
              <p className="text-2xl font-bold text-white">
                <AnimatedCounter target={totalChecked} duration={800} />
                <span className="text-slate-500 text-lg">/{totalItems}</span>
              </p>
              <p className="text-xs text-slate-500">items completed</p>
            </div>
            <div className="ml-auto flex gap-3">
              {PHASES.map(phase => {
                const state = phaseStates[phase.id];
                return (
                  <div key={phase.id} className="text-center">
                    <div className="relative">
                      <ProgressRing
                        percentage={state.items.length > 0
                          ? (state.items.filter(i => i.checked).length / state.items.length) * 100
                          : 0
                        }
                        size={36}
                        stroke={2}
                        color={state.completed ? '#10b981' : '#475569'}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {state.completed ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <span className="text-[9px] text-slate-500">
                            {state.items.filter(i => i.checked).length}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-600 mt-1">{phase.title}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className={cn('h-full rounded-full', overallPct === 100 ? 'bg-emerald-500' : 'bg-cyan-500')}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {/* Timeline */}
          <div className="space-y-2 pt-2">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Timeline</p>
            {PHASES.map(phase => {
              const state = phaseStates[phase.id];
              return (
                <div key={phase.id} className="flex items-center gap-3">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    state.completed ? 'bg-emerald-500' : activePhase === phase.id ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'
                  )} />
                  <p className="text-xs text-slate-400 flex-1">
                    Phase {phase.number}: {phase.title}
                  </p>
                  {state.completedAt && (
                    <span className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(state.completedAt).toLocaleTimeString()}
                    </span>
                  )}
                  {!state.completed && (
                    <span className="text-[10px] text-slate-700">Pending</span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}