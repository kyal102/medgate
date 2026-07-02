'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play, RotateCcw, Shield, Zap, Settings2, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Clock, Timer, BarChart3 } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

// ─── Gate Definitions ───────────────────────────────────────────────────────

const GATES = [
  { id: 'drug_interaction', name: 'Drug Interaction', category: 'PHARM', color: 'cyan', defaultSensitivity: 85 },
  { id: 'dose_verification', name: 'Dose Verification', category: 'PHARM', color: 'cyan', defaultSensitivity: 90 },
  { id: 'allergy_crossref', name: 'Allergy Cross-Ref', category: 'PHARM', color: 'cyan', defaultSensitivity: 95 },
  { id: 'lab_validity', name: 'Lab Result Validity', category: 'LAB', color: 'emerald', defaultSensitivity: 80 },
  { id: 'protocol_compliance', name: 'Protocol Compliance', category: 'PHARM', color: 'cyan', defaultSensitivity: 75 },
  { id: 'contrast_agent', name: 'Contrast Agent', category: 'RAD', color: 'amber', defaultSensitivity: 85 },
  { id: 'time_critical', name: 'Time Critical', category: 'EMERG', color: 'rose', defaultSensitivity: 90 },
  { id: 'pediatric_safety', name: 'Pediatric Safety', category: 'PEDS', color: 'amber', defaultSensitivity: 95 },
  { id: 'pregnancy_safety', name: 'Pregnancy Safety', category: 'OB', color: 'rose', defaultSensitivity: 95 },
  { id: 'vital_sign', name: 'Vital Sign Anomaly', category: 'EMERG', color: 'rose', defaultSensitivity: 80 },
  { id: 'antibiotic_stewardship', name: 'Antibiotic Stewardship', category: 'PHARM', color: 'cyan', defaultSensitivity: 70 },
  { id: 'blood_product', name: 'Blood Product', category: 'SURG', color: 'emerald', defaultSensitivity: 95 },
  { id: 'medical_device', name: 'Medical Device', category: 'ICU', color: 'amber', defaultSensitivity: 85 },
  { id: 'diagnostic_plausibility', name: 'Diagnostic Plausibility', category: 'PATH', color: 'emerald', defaultSensitivity: 75 },
] as const;

const SAMPLE_CLAIMS = [
  'Prescribe warfarin 5mg with trimethoprim-sulfamethoxazole for UTI',
  'Calculate vancomycin dose for 80kg male, CrCl 45mL/min',
  'Order IV contrast CT for patient with eGFR 35',
  'Administer amoxicillin to child with penicillin allergy documented',
  'Start magnesium sulfate for preeclampsia at 32 weeks gestation',
  'Program PCA pump: morphine 1mg/mL, demand 1mg, lockout 10min',
  'Verify INR of 5.2 — warfarin patient with bruising',
  'Check blood compatibility: Type A+ recipient, Type O- donor unit',
];

type GateDecision = 'ALLOW' | 'REVIEW' | 'BLOCK';

interface GateResult {
  gateId: string;
  gateName: string;
  decision: GateDecision;
  latencyMs: number;
  sensitivity: number;
}

interface SimulationResult {
  results: GateResult[];
  finalDecision: GateDecision;
  totalLatencyMs: number;
  defaultResults: GateResult[];
  defaultFinalDecision: GateDecision;
  defaultTotalLatencyMs: number;
}

// ─── Deterministic hash seed ────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function simulateGate(claimText: string, gate: typeof GATES[number], enabled: boolean, sensitivity: number): GateResult {
  if (!enabled) {
    return {
      gateId: gate.id,
      gateName: gate.name,
      decision: 'ALLOW',
      latencyMs: 0.02,
      sensitivity,
    };
  }

  const seed = hashString(claimText + gate.id + sensitivity.toString());
  const r = seededRandom(seed);

  // Higher sensitivity = more strict = higher chance of block/review
  // At sensitivity 100: 60% block, 30% review, 10% allow
  // At sensitivity 50: 20% block, 30% review, 50% allow
  // At sensitivity 0: 0% block, 10% review, 90% allow
  const blockThreshold = (sensitivity / 100) * 0.6;
  const reviewThreshold = blockThreshold + 0.1 + (sensitivity / 100) * 0.2;

  let decision: GateDecision;
  if (r < blockThreshold) {
    decision = 'BLOCK';
  } else if (r < reviewThreshold) {
    decision = 'REVIEW';
  } else {
    decision = 'ALLOW';
  }

  // Mock realistic latency: 0.05ms - 0.8ms
  const latencyMs = 0.05 + seededRandom(seed + 999) * 0.75;

  return { gateId: gate.id, gateName: gate.name, decision, latencyMs, sensitivity };
}

// ─── Gate color map ─────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/5',
    text: 'text-cyan-400',
    badge: 'bg-cyan-500/15 text-cyan-400',
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400',
  },
  rose: {
    border: 'border-rose-500/30',
    bg: 'bg-rose-500/5',
    text: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-400',
  },
};

const DECISION_STYLES: Record<GateDecision, { bg: string; border: string; text: string; icon: typeof CheckCircle2; glow: string }> = {
  ALLOW: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', icon: CheckCircle2, glow: 'shadow-emerald-500/30' },
  REVIEW: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', icon: AlertTriangle, glow: 'shadow-amber-500/30' },
  BLOCK: { bg: 'bg-rose-500/10', border: 'border-rose-500/40', text: 'text-rose-400', icon: XCircle, glow: 'shadow-rose-500/30' },
};

// ─── Presets ────────────────────────────────────────────────────────────────

type GateConfig = Record<string, { enabled: boolean; sensitivity: number }>;

function buildDefaultConfig(): GateConfig {
  const cfg: GateConfig = {};
  for (const g of GATES) {
    cfg[g.id] = { enabled: true, sensitivity: g.defaultSensitivity };
  }
  return cfg;
}

const PRESETS: { name: string; description: string; color: string; build: () => GateConfig }[] = [
  {
    name: 'Maximum Safety',
    description: 'All gates enabled, 100% sensitivity',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    build: () => {
      const cfg: GateConfig = {};
      for (const g of GATES) cfg[g.id] = { enabled: true, sensitivity: 100 };
      return cfg;
    },
  },
  {
    name: 'Balanced',
    description: 'All gates enabled, 70% sensitivity',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    build: () => {
      const cfg: GateConfig = {};
      for (const g of GATES) cfg[g.id] = { enabled: true, sensitivity: 70 };
      return cfg;
    },
  },
  {
    name: 'Minimal',
    description: '5 critical gates, 50% sensitivity',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    build: () => {
      const critical = ['drug_interaction', 'dose_verification', 'allergy_crossref', 'pregnancy_safety', 'blood_product'];
      const cfg: GateConfig = {};
      for (const g of GATES) cfg[g.id] = { enabled: critical.includes(g.id), sensitivity: 50 };
      return cfg;
    },
  },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function GateSimulationMode() {
  const [gateConfig, setGateConfig] = useState<GateConfig>(buildDefaultConfig);
  const [selectedClaim, setSelectedClaim] = useState<string>(SAMPLE_CLAIMS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [visibleGates, setVisibleGates] = useState<number>(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['PHARM', 'LAB']));
  const pipelineRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const enabledCount = useMemo(() => Object.values(gateConfig).filter(c => c.enabled).length, [gateConfig]);

  const toggleGate = useCallback((gateId: string) => {
    setGateConfig(prev => ({
      ...prev,
      [gateId]: { ...prev[gateId], enabled: !prev[gateId].enabled },
    }));
  }, []);

  const setSensitivity = useCallback((gateId: string, value: number) => {
    setGateConfig(prev => ({
      ...prev,
      [gateId]: { ...prev[gateId], sensitivity: value },
    }));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: typeof PRESETS[number]) => {
    setGateConfig(preset.build());
    setSimResult(null);
    setVisibleGates(0);
    toast.success(`Applied "${preset.name}" preset`, { description: preset.description });
  }, []);

  const resetConfig = useCallback(() => {
    setGateConfig(buildDefaultConfig());
    setSimResult(null);
    setVisibleGates(0);
    toast.info('Configuration reset to defaults');
  }, []);

  const runSimulation = useCallback(async () => {
    if (isRunning) return;
    abortRef.current = false;
    setIsRunning(true);
    setSimResult(null);
    setVisibleGates(0);

    const enabledGates = GATES.filter(g => gateConfig[g.id].enabled);

    // Pre-compute all results
    const results: GateResult[] = [];
    const defaultResults: GateResult[] = [];

    for (const gate of GATES) {
      results.push(simulateGate(selectedClaim, gate, gateConfig[gate.id].enabled, gateConfig[gate.id].sensitivity));
      defaultResults.push(simulateGate(selectedClaim, gate, true, gate.defaultSensitivity));
    }

    // Animate gate-by-gate
    for (let i = 0; i < GATES.length; i++) {
      if (abortRef.current) break;
      setVisibleGates(i + 1);
      await new Promise(r => setTimeout(r, 300));
    }

    const finalDecision = results.find(r => r.decision === 'BLOCK')
      ? 'BLOCK'
      : results.find(r => r.decision === 'REVIEW')
        ? 'REVIEW'
        : 'ALLOW';

    const defaultFinalDecision = defaultResults.find(r => r.decision === 'BLOCK')
      ? 'BLOCK'
      : defaultResults.find(r => r.decision === 'REVIEW')
        ? 'REVIEW'
        : 'ALLOW';

    const totalLatencyMs = results.reduce((s, r) => s + r.latencyMs, 0);
    const defaultTotalLatencyMs = defaultResults.reduce((s, r) => s + r.latencyMs, 0);

    if (!abortRef.current) {
      setSimResult({
        results,
        finalDecision,
        totalLatencyMs,
        defaultResults,
        defaultFinalDecision,
        defaultTotalLatencyMs,
      });
      toast.success('Simulation complete', {
        description: `Final decision: ${finalDecision} — ${totalLatencyMs.toFixed(2)}ms total latency`,
      });
    }

    setIsRunning(false);
  }, [gateConfig, selectedClaim, isRunning]);

  const stopSimulation = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
  }, []);

  // Group gates by category for the config panel
  const categories = useMemo(() => {
    const map = new Map<string, typeof GATES[number][]>();
    for (const g of GATES) {
      if (!map.has(g.category)) map.set(g.category, []);
      map.get(g.category)!.push(g);
    }
    return map;
  }, []);

  return (
    <div className="space-y-6">
      {/* Main container */}
      <div className="animated-border glass-card p-4 sm:p-6 space-y-6">
        {/* Header row: Presets + Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-cyan-400" />
              Gate Configuration
            </h3>
            <p className="text-xs text-muted-foreground">
              {enabledCount} of {GATES.length} gates enabled
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className={cn('text-xs h-7', preset.color)}
                onClick={() => applyPreset(preset)}
                disabled={isRunning}
              >
                {preset.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-muted-foreground"
              onClick={resetConfig}
              disabled={isRunning}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>

        {/* Gate config list grouped by category */}
        <div className="space-y-3">
          {Array.from(categories.entries()).map(([category, gates]) => {
            const isExpanded = expandedCategories.has(category);
            const catColors = COLOR_MAP[gates[0].color] || COLOR_MAP.cyan;
            return (
              <div key={category} className="glass-card">
                <button
                  className="w-full flex items-center justify-between p-3 text-left"
                  onClick={() => toggleCategory(category)}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('text-[10px]', catColors.badge, `border ${catColors.border}`)}>
                      {category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {gates.length} gate{gates.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {gates.map(gate => {
                          const cfg = gateConfig[gate.id];
                          const colors = COLOR_MAP[gate.color] || COLOR_MAP.cyan;
                          return (
                            <motion.div
                              key={gate.id}
                              layout
                              className={cn('rounded-lg border p-3 transition-all', cfg.enabled ? `${colors.border} ${colors.bg}` : 'border-slate-700/30 bg-slate-900/30 opacity-60')}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Switch
                                    checked={cfg.enabled}
                                    onCheckedChange={() => toggleGate(gate.id)}
                                    disabled={isRunning}
                                  />
                                  <span className={cn('text-xs font-medium truncate', cfg.enabled ? colors.text : 'text-muted-foreground')}>
                                    {gate.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                                    {cfg.sensitivity}%
                                  </span>
                                </div>
                              </div>
                              {cfg.enabled && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-2 ml-8"
                                >
                                  <Slider
                                    value={[cfg.sensitivity]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    onValueChange={v => setSensitivity(gate.id, v[0])}
                                    disabled={isRunning}
                                    className="w-full"
                                  />
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Runner */}
      <div className="glass-card p-4 sm:p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Play className="h-4 w-4 text-cyan-400" />
          Simulation Runner
        </h3>

        {/* Claim selector */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground font-medium">Test Claim</label>
          <Select value={selectedClaim} onValueChange={setSelectedClaim} disabled={isRunning}>
            <SelectTrigger className="glass-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SAMPLE_CLAIMS.map((claim, i) => (
                <SelectItem key={i} value={claim} className="text-xs">
                  {claim}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Run / Stop button */}
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <Button className="btn-glow" onClick={runSimulation} disabled={enabledCount === 0}>
              <Play className="h-4 w-4 mr-2" />
              Run Simulation
            </Button>
          ) : (
            <Button variant="destructive" onClick={stopSimulation}>
              <Zap className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          {isRunning && (
            <motion.span
              className="text-xs text-cyan-400"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              Evaluating gates...
            </motion.span>
          )}
        </div>

        {/* Visual Pipeline */}
        {(isRunning || visibleGates > 0) && (
          <div ref={pipelineRef} className="glass-card p-4 overflow-x-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
              Verification Pipeline
            </p>
            <div className="flex items-center gap-1 min-w-max">
              {/* Claim node */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="shrink-0 rounded-lg border border-slate-600/50 bg-slate-800/50 px-3 py-2 text-center"
              >
                <p className="text-[9px] text-slate-400 uppercase tracking-wider">Claim</p>
                <p className="text-[10px] text-slate-300 font-medium max-w-[100px] truncate">{selectedClaim.slice(0, 35)}…</p>
              </motion.div>

              <ArrowRight className="h-4 w-4 text-slate-600 mx-0.5 shrink-0" />

              {/* Gate nodes */}
              {GATES.map((gate, idx) => {
                const isVisible = idx < visibleGates;
                const cfg = gateConfig[gate.id];
                const result = simResult?.results[idx];
                const colors = COLOR_MAP[gate.color] || COLOR_MAP.cyan;

                if (!isVisible) {
                  return (
                    <div key={gate.id} className="flex items-center shrink-0">
                      <div className="w-8 h-8 rounded-full border border-slate-700/30 bg-slate-900/20" />
                      {idx < GATES.length - 1 && <ArrowRight className="h-3 w-3 text-slate-700/30 mx-0.5 shrink-0" />}
                    </div>
                  );
                }

                const decision = result?.decision || (cfg.enabled ? 'ALLOW' : 'ALLOW');
                const style = DECISION_STYLES[decision];
                const Icon = style.icon;

                return (
                  <div key={gate.id} className="flex items-center shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={cn(
                        'w-8 h-8 rounded-full border flex items-center justify-center relative',
                        !cfg.enabled ? 'border-slate-700/30 bg-slate-900/20' : `${style.border} ${style.bg} shadow-lg ${style.glow}`
                      )}
                    >
                      <Icon className={cn('h-3.5 w-3.5', !cfg.enabled ? 'text-slate-600' : style.text)} />
                      {/* Pulse ring for current gate */}
                      {isRunning && idx === visibleGates - 1 && cfg.enabled && (
                        <motion.div
                          className={cn('absolute inset-0 rounded-full border', style.border)}
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    {idx < GATES.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      >
                        <ArrowRight className="h-3 w-3 text-slate-600 mx-0.5 shrink-0" />
                      </motion.div>
                    )}
                  </div>
                );
              })}

              <ArrowRight className="h-4 w-4 text-slate-600 mx-0.5 shrink-0" />

              {/* Final decision node */}
              {simResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className={cn(
                    'shrink-0 rounded-lg border-2 px-4 py-2 text-center shadow-xl',
                    DECISION_STYLES[simResult.finalDecision].border,
                    DECISION_STYLES[simResult.finalDecision].bg,
                    DECISION_STYLES[simResult.finalDecision].glow
                  )}
                >
                  <p className={cn('text-sm font-bold', DECISION_STYLES[simResult.finalDecision].text)}>
                    {simResult.finalDecision}
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <AnimatePresence>
        {simResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Final Decision Card */}
            <div className={cn(
              'glass-card p-6 text-center relative overflow-hidden',
              simResult.finalDecision === 'ALLOW' && 'glow-emerald',
              simResult.finalDecision === 'REVIEW' && 'glow-amber',
              simResult.finalDecision === 'BLOCK' && 'glow-rose'
            )}>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
              >
                {simResult.finalDecision === 'ALLOW' && <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />}
                {simResult.finalDecision === 'REVIEW' && <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-2" />}
                {simResult.finalDecision === 'BLOCK' && <XCircle className="h-10 w-10 text-rose-400 mx-auto mb-2" />}
              </motion.div>
              <p className="text-2xl font-[Orbitron] font-bold tracking-wider mb-1">
                <span className={cn(
                  simResult.finalDecision === 'ALLOW' && 'text-emerald-400',
                  simResult.finalDecision === 'REVIEW' && 'text-amber-400',
                  simResult.finalDecision === 'BLOCK' && 'text-rose-400'
                )}>
                  {simResult.finalDecision}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Pipeline completed with{' '}
                <span className="gradient-text-cyan font-semibold">
                  <AnimatedCounter target={parseFloat(simResult.totalLatencyMs.toFixed(2))} decimals={2} suffix="ms" />
                </span>
                {' '}total latency
              </p>
            </div>

            {/* Statistics row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gates Enabled', value: enabledCount, suffix: `/${GATES.length}`, color: 'text-cyan-400' },
                { label: 'Allowed', value: simResult.results.filter(r => r.decision === 'ALLOW').length, suffix: '', color: 'text-emerald-400' },
                { label: 'Reviewed', value: simResult.results.filter(r => r.decision === 'REVIEW').length, suffix: '', color: 'text-amber-400' },
                { label: 'Blocked', value: simResult.results.filter(r => r.decision === 'BLOCK').length, suffix: '', color: 'text-rose-400' },
              ].map(stat => (
                <Card key={stat.label} className="glass-card">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className={cn('text-lg font-bold mt-1', stat.color)}>
                      <AnimatedCounter target={stat.value} />{stat.suffix}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Per-gate timing */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <Timer className="h-4 w-4 text-cyan-400" />
                Per-Gate Timing
              </h3>
              <div className="space-y-1.5">
                {simResult.results.map((r, idx) => {
                  const gate = GATES[idx];
                  const colors = COLOR_MAP[gate.color] || COLOR_MAP.cyan;
                  const style = DECISION_STYLES[r.decision];
                  const Icon = style.icon;
                  return (
                    <motion.div
                      key={r.gateId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-muted/30 transition-colors"
                    >
                      <Icon className={cn('h-3.5 w-3.5 shrink-0', style.text)} />
                      <span className={cn('text-xs font-medium w-36 sm:w-44 truncate', gateConfig[r.gateId].enabled ? colors.text : 'text-muted-foreground line-through')}>
                        {r.gateName}
                      </span>
                      {!gateConfig[r.gateId].enabled && (
                        <Badge variant="outline" className="text-[8px] border-slate-600/30 text-slate-500">disabled</Badge>
                      )}
                      <div className="flex-1" />
                      <span className="text-[10px] text-muted-foreground mr-1 hidden sm:inline">{r.decision}</span>
                      <span className={cn('text-xs font-mono font-semibold tabular-nums w-16 text-right', 'gradient-text-cyan')}>
                        {r.latencyMs.toFixed(2)}ms
                      </span>
                    </motion.div>
                  );
                })}
                <div className="border-t border-border/30 pt-2 mt-2 flex items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground font-medium">Total</span>
                  <span className="text-sm font-mono font-bold gradient-text-cyan tabular-nums">
                    <AnimatedCounter target={parseFloat(simResult.totalLatencyMs.toFixed(2))} decimals={2} suffix="ms" />
                  </span>
                </div>
              </div>
            </div>

            {/* Comparison: Default vs Your Settings */}
            <div className="glass-card p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                Comparison: Default vs Your Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Default */}
                <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Default Settings</p>
                    <Badge variant="outline" className={cn('text-[10px]', DECISION_STYLES[simResult.defaultFinalDecision].text, DECISION_STYLES[simResult.defaultFinalDecision].border)}>
                      {simResult.defaultFinalDecision}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Gates Enabled</span>
                      <span className="text-foreground font-medium">{GATES.length}/{GATES.length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Blocked</span>
                      <span className="text-rose-400 font-medium">{simResult.defaultResults.filter(r => r.decision === 'BLOCK').length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Reviewed</span>
                      <span className="text-amber-400 font-medium">{simResult.defaultResults.filter(r => r.decision === 'REVIEW').length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Allowed</span>
                      <span className="text-emerald-400 font-medium">{simResult.defaultResults.filter(r => r.decision === 'ALLOW').length}</span>
                    </div>
                    <div className="border-t border-border/30 pt-1.5 flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Total Latency</span>
                      <span className="gradient-text-cyan font-mono font-semibold">{simResult.defaultTotalLatencyMs.toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>

                {/* Your Settings */}
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-cyan-400">Your Settings</p>
                    <Badge variant="outline" className={cn('text-[10px]', DECISION_STYLES[simResult.finalDecision].text, DECISION_STYLES[simResult.finalDecision].border)}>
                      {simResult.finalDecision}
                    </Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Gates Enabled</span>
                      <span className="text-foreground font-medium">{enabledCount}/{GATES.length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Blocked</span>
                      <span className="text-rose-400 font-medium">{simResult.results.filter(r => r.decision === 'BLOCK').length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Reviewed</span>
                      <span className="text-amber-400 font-medium">{simResult.results.filter(r => r.decision === 'REVIEW').length}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Allowed</span>
                      <span className="text-emerald-400 font-medium">{simResult.results.filter(r => r.decision === 'ALLOW').length}</span>
                    </div>
                    <div className="border-t border-border/30 pt-1.5 flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Total Latency</span>
                      <span className="gradient-text-cyan font-mono font-semibold">{simResult.totalLatencyMs.toFixed(2)}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delta */}
              {simResult.finalDecision !== simResult.defaultFinalDecision && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                >
                  <p className="text-xs text-amber-400 font-medium flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Decision changed: <span className="font-bold">{simResult.defaultFinalDecision}</span> → <span className="font-bold">{simResult.finalDecision}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Your configuration produced a different outcome than the default settings.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}