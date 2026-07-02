'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lock, Hash, Shield, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';

const FLOW_STEPS = [
  { id: 'input', label: 'Clinical Claim', sublabel: 'Medication order, lab result, or diagnostic claim', color: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'bg-cyan-400/10' },
  { id: 'dtl', label: 'DTL Router', sublabel: 'Routes to appropriate verification lanes', color: 'text-violet-400', border: 'border-violet-400/30', bg: 'bg-violet-400/10' },
  { id: 'gate1', label: 'Gate 1', sublabel: 'Primary verification (e.g., Drug Interaction)', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/10', decision: 'ALLOW' },
  { id: 'gate2', label: 'Gate 2', sublabel: 'Secondary verification (e.g., Dose Check)', color: 'text-amber-400', border: 'border-amber-400/30', bg: 'bg-amber-400/10', decision: 'BLOCK' },
  { id: 'evidence', label: 'Evidence Pack', sublabel: 'Immutable chain of all gate outputs', color: 'text-cyan-400', border: 'border-cyan-400/30', bg: 'bg-cyan-400/10' },
  { id: 'output', label: 'Decision', sublabel: 'ALLOW or BLOCK with full evidence trail', color: 'text-emerald-400', border: 'border-emerald-400/30', bg: 'bg-emerald-400/10' },
];

const MOCK_HASHES = [
  '0x7a2b...f3e1',
  '0xc4d8...a9b2',
  '0x1f6e...8d4c',
  '0xb3a7...e5f0',
  '0x9d2c...1a8e',
  '0xe6f4...3b7d',
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
};

export function InformationIntegrity() {
  return (
    <div className="space-y-6">
      {/* Flow visualization */}
      <Card className="glass-card glow-cyan border-slate-700/50 bg-slate-900/80">
        <CardContent className="p-6">
          {/* Horizontal flow */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="flex items-center gap-0 overflow-x-auto pb-4"
          >
            {FLOW_STEPS.map((step, idx) => (
              <motion.div key={step.id} variants={staggerItem} className="flex items-center shrink-0">
                <div className={`data-flow rounded-lg border p-3 min-w-[100px] sm:min-w-[130px] ${step.border} ${step.bg} relative`}>
                  <p className={`text-xs font-medium ${step.color}`}>{step.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{step.sublabel}</p>
                  {step.decision && (
                    <Badge className={`mt-1.5 text-[9px] ${step.decision === 'ALLOW' ? 'bg-emerald-500' : 'bg-rose-500'} text-white`}>
                      {step.decision === 'ALLOW' ? <><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> ALLOW</> : <><XCircle className="h-2.5 w-2.5 mr-0.5" /> BLOCK</>}
                    </Badge>
                  )}
                  {/* Hash */}
                  <div className="mt-2 flex items-center gap-1">
                    <Hash className="h-2.5 w-2.5 text-slate-600" />
                    <span className="text-[9px] font-mono text-slate-600">{MOCK_HASHES[idx]}</span>
                  </div>
                </div>
                {idx < FLOW_STEPS.length - 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <ArrowRight className="h-4 w-4 text-cyan-400/60 mx-1 shrink-0" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Hash chain explanation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-4 p-3 rounded-lg glass-card border border-slate-700/30"
          >
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-slate-300 font-medium">Hash Chain Integrity</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Each step&apos;s output is cryptographically hashed. That hash becomes input to the next step.{' '}
                  <span className="text-cyan-400 font-medium">No information is lost, modified, or probabilistically generated.</span>
                </p>
                <div className="flex items-center gap-1 mt-2 text-[10px] font-mono text-slate-500">
                  {MOCK_HASHES.map((h, i) => (
                    <span key={i}>
                      {h}{i < MOCK_HASHES.length - 1 && <ArrowRight className="inline h-2.5 w-2.5 mx-1 text-cyan-400/40" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      {/* Integrity percentage stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card glow-cyan p-4"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Preservation</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={100} suffix="%" />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Determinism</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={100} suffix="%" />
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Audit Trail</p>
            <p className="text-xl font-bold mt-1 gradient-text-cyan">
              <AnimatedCounter target={100} suffix="%" />
            </p>
          </div>
        </div>
      </motion.div>

      {/* Decision paths */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <motion.div variants={staggerItem}>
          <Card className="glass-card border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">ALLOW Path (Green)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All gates passed → Evidence pack compiled → Deterministic ALLOW decision with full audit trail
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {['Input', 'DTL', 'G1 ✓', 'G2 ✓', 'G3 ✓', 'Evidence', 'ALLOW'].map((s, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {s}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Card className="glass-card border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-400" />
                <span className="text-sm font-medium text-rose-300">BLOCK Path (Red)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Any gate blocks → Evidence pack records reason → Deterministic BLOCK decision with clinical justification
              </p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {['Input', 'DTL', 'G1 ✓', 'G2 ✗', 'Evidence', 'BLOCK'].map((s, i) => (
                  <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded border ${
                    s.includes('✗') || s === 'BLOCK' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700/50'
                  }`}>
                    {s}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Integrity guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass-card glow-cyan border-cyan-500/20 bg-slate-900/80">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-cyan-300">Information Integrity Guarantee</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Unlike probabilistic AI systems that generate &quot;best guess&quot; outputs, MedGate uses deterministic{' '}
                rule engines. The same input always produces the same output — verifiable, reproducible, and auditable.{' '}
                No hallucinations, no confidence scores, no probabilistic reasoning.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold gradient-text-cyan"><AnimatedCounter target={0} suffix="%" /></span>
                  <span className="text-[10px] text-slate-400">Hallucination Rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold gradient-text-cyan"><AnimatedCounter target={0} decimals={1} /></span>
                  <span className="text-[10px] text-slate-400">Probabilistic Components</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}