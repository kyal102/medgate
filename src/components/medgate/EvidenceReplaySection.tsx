'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMedGateStore } from '@/lib/medgate-store';
import { Play, Pause, RotateCcw, ChevronRight, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_REPLAY_DATA = [
  {
    id: 'replay-1',
    claim: 'Prescribe warfarin 5mg with trimethoprim-sulfamethoxazole',
    steps: [
      { gate: 'DrugInteractionGate', input: 'Warfarin + TMP-SMX co-prescription', processing: 'Checking drug-drug interaction database...', decision: 'BLOCK' as const, evidence: ['SEVERE: Vitamin K synthesis inhibition', 'INR elevation 2-4 points expected'], latencyMs: 0.31 },
      { gate: 'DoseVerificationGate', input: 'Warfarin 5mg oral', processing: 'Verifying dose against patient parameters...', decision: 'ALLOW' as const, evidence: ['Within therapeutic range (2-10mg)'], latencyMs: 0.18 },
      { gate: 'AllergyCrossRefGate', input: 'Cross-reference allergy profile', processing: 'Checking allergy cross-reactivity...', decision: 'ALLOW' as const, evidence: ['No allergies detected for either drug'], latencyMs: 0.12 },
    ],
    overallDecision: 'BLOCK' as const,
    evidenceHash: '0xa7f3c9e2b8d1f4a6...c6b7a8',
  },
  {
    id: 'replay-2',
    claim: 'CT with contrast: patient on metformin, eGFR 35',
    steps: [
      { gate: 'ContrastAgentGate', input: 'CT contrast + metformin + eGFR 35', processing: 'Evaluating contrast agent safety...', decision: 'BLOCK' as const, evidence: ['eGFR 35 < 60 threshold', 'Metformin hold protocol required', 'Lactic acidosis risk'], latencyMs: 0.28 },
    ],
    overallDecision: 'BLOCK' as const,
    evidenceHash: '0xf1e2d3c4b5a6f7e8...d9c0b1',
  },
];

const STEP_ICONS = { ALLOW: CheckCircle2, BLOCK: XCircle, NEEDS_REVIEW: AlertTriangle };
const STEP_COLORS = { ALLOW: 'text-emerald-400', BLOCK: 'text-rose-400', NEEDS_REVIEW: 'text-amber-400' };
const STEP_BORDER_COLORS = { ALLOW: 'border-emerald-400/30', BLOCK: 'border-rose-400/30', NEEDS_REVIEW: 'border-amber-400/30' };
const STEP_BG_COLORS = { ALLOW: 'bg-emerald-500/5', BLOCK: 'bg-rose-500/5', NEEDS_REVIEW: 'bg-amber-500/5' };
const STEP_GLOW = { ALLOW: 'glow-emerald', BLOCK: 'glow-rose', NEEDS_REVIEW: 'glow-amber' };

export function EvidenceReplaySection() {
  const [selectedReplay, setSelectedReplay] = useState(MOCK_REPLAY_DATA[0]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepState, setStepState] = useState<'idle' | 'processing' | 'done'>('idle');

  const totalSteps = selectedReplay.steps.length;

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setIsPlaying(false);
    setStepState('idle');
  }, []);

  const advance = useCallback(() => {
    setStepState('processing');
    setTimeout(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps) {
          setIsPlaying(false);
          setStepState('done');
          return next;
        }
        setStepState('idle');
        return next;
      });
    }, 800);
  }, [totalSteps]);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps - 1 && stepState === 'done') return;
    const timer = setTimeout(advance, 1500);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, stepState, advance]);

  const togglePlay = () => {
    if (currentStep >= totalSteps - 1 && stepState === 'done') {
      reset();
      setTimeout(() => setIsPlaying(true), 50);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="space-y-4">
      {/* Replay selector */}
      <div className="flex gap-2 flex-wrap">
        {MOCK_REPLAY_DATA.map((r) => (
          <button
            key={r.id}
            onClick={() => { setSelectedReplay(r); reset(); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 truncate ${
              selectedReplay.id === r.id
                ? 'glass-card-hover border-cyan-500/40 text-cyan-300'
                : 'glass-card border-slate-700/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            {r.claim.substring(0, 40)}...
          </button>
        ))}
      </div>

      <Card className="glass-card-hover">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <span className="gradient-text-cyan">Verification Replay</span>
              {isPlaying && (
                <span className="pulse-ring inline-flex items-center gap-1.5 text-[10px] text-cyan-400 ml-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Live
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={reset} className="h-7 text-xs border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors">
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
              <Button size="sm" onClick={togglePlay} className={`btn-glow h-7 text-xs ${isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-cyan-600 hover:bg-cyan-700'} text-white transition-colors`}>
                {isPlaying ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Play</>}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-500 font-mono">{selectedReplay.claim}</p>

          {/* Steps with timeline */}
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-slate-700/50 to-transparent" />

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {selectedReplay.steps.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;
                  const isPending = idx > currentStep;
                  const showDecision = isCompleted || (isActive && stepState === 'done');
                  const isProcessing = isActive && stepState === 'processing';
                  const StepIcon = STEP_ICONS[step.decision];

                  return (
                    <motion.div
                      key={`${selectedReplay.id}-${idx}`}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{
                        opacity: isPending ? 0.4 : 1,
                        x: 0,
                        scale: isActive ? 1.01 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      className="relative pl-10"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-[10px] top-3 h-3 w-3 rounded-full border-2 transition-all duration-500 z-10 ${
                        isCompleted
                          ? `${STEP_BG_COLORS[step.decision]} ${STEP_BORDER_COLORS[step.decision]}`
                          : isActive
                          ? 'bg-cyan-500 border-cyan-400 shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-800 border-slate-700'
                      }`}>
                        {isProcessing && (
                          <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30" />
                        )}
                      </div>

                      {/* Data flow connector */}
                      {isActive && isProcessing && (
                        <motion.div
                          className="absolute left-[13px] top-6 w-0.5 h-4 bg-gradient-to-b from-cyan-400 to-transparent data-flow"
                          initial={{ scaleY: 0, originY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                        />
                      )}

                      <div className={`rounded-lg border p-3 transition-all duration-500 ${
                        isActive
                          ? 'border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/5'
                          : isCompleted && showDecision
                          ? `${STEP_BORDER_COLORS[step.decision]} ${STEP_BG_COLORS[step.decision]}`
                          : 'border-slate-800/50 bg-slate-900/30'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                              isCompleted && showDecision
                                ? `${STEP_BG_COLORS[step.decision]} ${STEP_COLORS[step.decision]}`
                                : isActive
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-slate-800 text-slate-600'
                            }`}>
                              {isCompleted && showDecision ? <StepIcon className="h-4 w-4" /> : isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-200">{step.gate}</p>
                              <p className="text-[10px] text-slate-500 truncate">{step.input}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isProcessing && (
                              <span className="text-[10px] text-cyan-400 animate-pulse">Processing...</span>
                            )}
                            {showDecision && (
                              <Badge variant="outline" className={`${STEP_COLORS[step.decision]} ${STEP_BORDER_COLORS[step.decision]} text-[10px]`}>
                                <StepIcon className="h-3 w-3 mr-1" />
                                {step.decision}
                                <span className="ml-1 opacity-60">{step.latencyMs}ms</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                        <AnimatePresence>
                          {showDecision && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-2 ml-8 space-y-1 overflow-hidden"
                            >
                              {step.evidence.map((e, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.1 }}
                                  className="flex items-start gap-1.5 text-[11px] text-slate-400"
                                >
                                  <ChevronRight className={`h-3 w-3 mt-0.5 shrink-0 ${STEP_COLORS[step.decision]}`} />
                                  {e}
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Overall result */}
          <AnimatePresence>
            {currentStep >= totalSteps - 1 && stepState === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`rounded-lg border p-4 mt-2 ${
                  selectedReplay.overallDecision === 'BLOCK'
                    ? 'border-rose-500/30 bg-rose-500/5 glow-rose'
                    : selectedReplay.overallDecision === 'ALLOW'
                    ? 'border-emerald-500/30 bg-emerald-500/5 glow-emerald'
                    : 'border-amber-500/30 bg-amber-500/5 glow-amber'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-200">Overall Decision</span>
                  <Badge className={`${
                    selectedReplay.overallDecision === 'BLOCK'
                      ? 'bg-rose-500/90 hover:bg-rose-500'
                      : selectedReplay.overallDecision === 'ALLOW'
                      ? 'bg-emerald-500/90 hover:bg-emerald-500'
                      : 'bg-amber-500/90 hover:bg-amber-500'
                  } text-white text-xs border-0`}>
                    {(() => {
                      const Icon = STEP_ICONS[selectedReplay.overallDecision];
                      return <><Icon className="h-3 w-3 mr-1" />{selectedReplay.overallDecision}</>;
                    })()}
                  </Badge>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1.5">Evidence Hash: {selectedReplay.evidenceHash}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}