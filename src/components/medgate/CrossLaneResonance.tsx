'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Zap, GitBranch, Pill, FlaskConical, Activity, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

const RESONANCE_EXAMPLES = [
  {
    title: 'Drug Interaction → Lab Monitoring',
    description: 'A SEVERE drug interaction in the PHARM lane triggers an automatic lab monitoring request in the LAB lane',
    laneA: { id: 'PHARM', name: 'Pharmacology', color: '#06b6d4', icon: Pill },
    gateA: 'DrugInteractionGate',
    trigger: 'Warfarin + TMP-SMX detected',
    laneB: { id: 'LAB', name: 'Laboratory', color: '#8b5cf6', icon: FlaskConical },
    gateB: 'LabResultValidityGate',
    action: 'INR monitoring flagged critical',
    resonanceScore: 94,
  },
  {
    title: 'Contrast Agent → Renal Lab Check',
    description: 'A contrast imaging order in the RAD lane triggers renal function verification in the LAB lane',
    laneA: { id: 'RAD', name: 'Radiology', color: '#3b82f6', icon: Activity },
    gateA: 'ContrastAgentGate',
    trigger: 'CT contrast ordered + metformin',
    laneB: { id: 'LAB', name: 'Laboratory', color: '#8b5cf6', icon: FlaskConical },
    gateB: 'LabResultValidityGate',
    action: 'eGFR threshold check triggered',
    resonanceScore: 87,
  },
  {
    title: 'Vital Signs → Emergency Protocol',
    description: 'Abnormal vitals in the EMERG lane trigger protocol verification in the PHARM lane',
    laneA: { id: 'EMERG', name: 'Emergency', color: '#ef4444', icon: Activity },
    gateA: 'VitalSignAnomalyGate',
    trigger: 'qSOFA ≥ 2 (sepsis screen positive)',
    laneB: { id: 'PHARM', name: 'Pharmacology', color: '#06b6d4', icon: Pill },
    gateB: 'AntibioticStewardshipGate',
    action: 'Empiric antibiotic selection verified',
    resonanceScore: 91,
  },
  {
    title: 'Blood Product → Lab Crossmatch',
    description: 'A blood transfusion order in the SURG lane triggers crossmatch verification and lab confirmation',
    laneA: { id: 'SURG', name: 'Surgical', color: '#6366f1', icon: Droplets },
    gateA: 'BloodProductGate',
    trigger: 'Type B- RBCs for Type A+ patient',
    laneB: { id: 'LAB', name: 'Laboratory', color: '#8b5cf6', icon: FlaskConical },
    gateB: 'LabResultValidityGate',
    action: 'ABO incompatibility confirmed, BLOCK propagated',
    resonanceScore: 98,
  },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 20 } },
};

export function CrossLaneResonance() {
  return (
    <div className="space-y-6">
      {/* Title with gradient */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <h3 className="text-lg font-bold gradient-text-multicolor">
          Cross-Domain Verification Resonance
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          When one gate fires, resonance cascades across domain lanes
        </p>
      </motion.div>

      {/* Patent callout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <Card className="glass-card glow-cyan border-cyan-500/20 bg-gradient-to-r from-cyan-500/5 to-violet-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-cyan-300">Patent 3: Cross-Domain Verification Resonance</p>
              <p className="text-[11px] text-slate-400 mt-1">
                When a gate in one domain produces a finding, it can trigger verification in a completely different{' '}
                domain lane. This creates a resonance effect where a single clinical event cascades through multiple{' '}
                verification paths simultaneously, ensuring comprehensive safety coverage.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Resonance score summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="glass-card glow-cyan p-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resonance Paths</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={RESONANCE_EXAMPLES.length} />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Domains Linked</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={5} />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Score</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={92.5} decimals={1} suffix="%" />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Latency</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={0.34} decimals={2} suffix="ms" />
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resonance examples */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="space-y-4"
      >
        {RESONANCE_EXAMPLES.map((ex, idx) => {
          const IconA = ex.laneA.icon;
          const IconB = ex.laneB.icon;
          return (
            <motion.div key={idx} variants={staggerItem}>
              <Card className="glass-card glass-card-hover border-slate-700/50 bg-slate-900/80 transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium text-slate-300">{ex.title}</CardTitle>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Score</span>
                      <span className="text-sm font-bold gradient-text-multicolor">
                        <AnimatedCounter target={ex.resonanceScore} suffix="%" />
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500">{ex.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                    {/* Lane A card */}
                    <div className="flex-1 min-w-[180px] w-full sm:w-auto rounded-lg border p-3" style={{ borderColor: `${ex.laneA.color}30`, backgroundColor: `${ex.laneA.color}08` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <IconA className="h-3.5 w-3.5" style={{ color: ex.laneA.color }} />
                        <Badge className="text-[9px]" style={{ backgroundColor: `${ex.laneA.color}20`, color: ex.laneA.color, borderColor: `${ex.laneA.color}30` }}>
                          {ex.laneA.id}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{ex.gateA}</p>
                      <p className="text-[11px] text-slate-300 mt-1">{ex.trigger}</p>
                    </div>

                    {/* Arrow with glow */}
                    <div className="flex flex-col items-center gap-1 shrink-0 relative">
                      <div className="absolute inset-0 glow-cyan rounded-full blur-sm pointer-events-none" />
                      <ArrowRight className="h-4 w-4 text-amber-400 relative z-10" />
                      <span className="text-[8px] text-amber-400 font-bold uppercase tracking-wider relative z-10">triggers</span>
                      <GitBranch className="h-3.5 w-3.5 text-amber-400 relative z-10" />
                    </div>

                    {/* Lane B card */}
                    <div className="flex-1 min-w-[180px] w-full sm:w-auto rounded-lg border p-3" style={{ borderColor: `${ex.laneB.color}30`, backgroundColor: `${ex.laneB.color}08` }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <IconB className="h-3.5 w-3.5" style={{ color: ex.laneB.color }} />
                        <Badge className="text-[9px]" style={{ backgroundColor: `${ex.laneB.color}20`, color: ex.laneB.color, borderColor: `${ex.laneB.color}30` }}>
                          {ex.laneB.id}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">{ex.gateB}</p>
                      <p className="text-[11px] text-slate-300 mt-1">{ex.action}</p>
                    </div>
                  </div>

                  {/* Active resonance indicator */}
                  <div className="mt-3 flex items-center gap-2">
                    <span className="pulse-ring relative inline-flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] text-emerald-400/80">Active resonance pathway</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}