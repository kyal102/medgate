'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ContrastInput {
  egfr: string;
  metformin: boolean;
  iodineAllergy: boolean;
  priorReaction: boolean;
  pregnancy: boolean;
}

interface ContrastResult {
  status: 'green' | 'yellow' | 'red';
  warnings: string[];
  actions: string[];
  riskScore: number; // 0-100
}

const INITIAL: ContrastInput = { egfr: '', metformin: false, iodineAllergy: false, priorReaction: false, pregnancy: false };

const STATUS_CONFIG = {
  green: { label: 'PROCEED', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: CheckCircle, gradient: 'from-emerald-500 to-cyan-500' },
  yellow: { label: 'CAUTION', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertTriangle, gradient: 'from-amber-500 to-yellow-500' },
  red: { label: 'DO NOT PROCEED', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: XCircle, gradient: 'from-red-500 to-rose-500' },
};

export function ContrastSafetyChecker() {
  const [input, setInput] = useState<ContrastInput>(INITIAL);
  const [result, setResult] = useState<ContrastResult | null>(null);
  const update = (key: keyof ContrastInput, val: string | boolean) => setInput((p) => ({ ...p, [key]: val }));

  const egfrNum = parseFloat(input.egfr) || 0;

  const check = () => {
    const egfr = parseFloat(input.egfr) || 90;
    const warnings: string[] = [];
    const actions: string[] = [];
    let status: ContrastResult['status'] = 'green';
    let riskScore = 0;

    if (egfr < 30) {
      status = 'red';
      riskScore = 90;
      warnings.push('eGFR < 30: High risk of contrast-induced nephropathy (CIN).');
      actions.push('Consult radiology and nephrology before proceeding.');
      actions.push('Consider alternative imaging (MRI without gadolinium, ultrasound).');
      if (input.metformin) {
        riskScore = 100;
        warnings.push('Metformin + eGFR < 30: HIGH risk of lactic acidosis.');
        actions.push('STOP metformin 48 hours before and 48 hours after contrast.');
        actions.push('Check lactate and renal function at 48 hours post-procedure.');
      }
    } else if (egfr < 60) {
      status = 'yellow';
      riskScore = 45 + (60 - egfr);
      warnings.push('eGFR 30-59: Moderate risk of CIN.');
      actions.push('Ensure adequate hydration (IV NS 1 mL/kg/h for 6-12h pre/post).');
      if (input.metformin) {
        riskScore = Math.min(80, riskScore + 20);
        warnings.push('Metformin + eGFR 30-59: Risk of lactic acidosis.');
        actions.push('Hold metformin at time of procedure; resume after 48h if renal function stable.');
      }
    }

    if (input.iodineAllergy) {
      riskScore = Math.min(100, riskScore + 25);
      if (status === 'green') status = 'yellow';
      warnings.push('Iodine allergy documented: Risk of allergic reaction (urticaria to anaphylaxis).');
      actions.push('Premedication: Prednisolone 50mg PO 13h, 7h, 1h before + Diphenhydramine 50mg IV 1h before.');
      actions.push('Have emergency resuscitation equipment available.');
    }

    if (input.priorReaction) {
      status = 'red';
      riskScore = 100;
      warnings.push('Prior contrast reaction: Significantly increased risk of recurrence.');
      actions.push('STRONGLY consider non-contrast alternative.');
      actions.push('If contrast essential: full steroid premedication protocol + 24h observation.');
    }

    if (input.pregnancy) {
      riskScore = Math.min(100, riskScore + 20);
      if (status === 'green') status = 'yellow';
      warnings.push('Pregnancy: Iodinated contrast crosses placenta. Risk of fetal hypothyroidism.');
      actions.push('Consider alternative imaging (ultrasound, MRI without gadolinium).');
      actions.push('If contrast essential, inform patient and obtain informed consent.');
      actions.push('Check neonatal thyroid function after delivery.');
    }

    if (egfr >= 60 && !input.metformin && !input.iodineAllergy && !input.priorReaction && !input.pregnancy) {
      riskScore = 5;
      warnings.push('No contraindications identified.');
      actions.push('Standard protocol: verify consent, check allergies, ensure IV access.');
    }

    setResult({ status, warnings, actions, riskScore: Math.min(100, Math.max(0, riskScore)) });

    if (status === 'green') {
      toast.success('Contrast: Safe to proceed', { description: 'No contraindications identified.' });
    } else if (status === 'yellow') {
      toast.warning('Contrast: Caution advised', { description: warnings[0] });
    } else {
      toast.error('Contrast: DO NOT PROCEED', { description: warnings[0] });
    }
  };

  const riskColor = result
    ? result.status === 'green' ? '#10b981'
      : result.status === 'yellow' ? '#f59e0b' : '#f43f5e'
    : '#334155';

  return (
    <section className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">eGFR (mL/min)</label>
              <Input type="number" placeholder="e.g. 75" value={input.egfr} onChange={(e) => update('egfr', e.target.value)} className="glass-input" />
            </div>
            {([
              ['metformin', 'On Metformin'],
              ['iodineAllergy', 'Iodine Allergy'],
              ['priorReaction', 'Prior Contrast Reaction'],
              ['pregnancy', 'Pregnancy'],
            ] as const).map(([key, label], idx) => (
              <div key={idx} className="flex items-center gap-3 h-9">
                <Switch checked={input[key] as boolean} onCheckedChange={(v) => update(key, v)} />
                <Label className="text-sm text-slate-300">{label}</Label>
              </div>
            ))}
          </div>
          <Button onClick={check} disabled={!input.egfr} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
            Check Safety
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-4"
          >
            {/* Status Card with Risk Meter */}
            <Card className={cn('glass-card-hover border', STATUS_CONFIG[result.status].color)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4 mb-4">
                  {(() => { const Icon = STATUS_CONFIG[result.status].icon; return <Icon className="w-7 h-7 shrink-0" />; })()}
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-bold text-lg', result.status === 'green' ? 'text-emerald-400' : result.status === 'yellow' ? 'text-amber-400' : 'text-red-400')}>
                      {STATUS_CONFIG[result.status].label}
                    </p>
                    <p className="text-sm text-slate-400">
                      eGFR: <AnimatedCounter target={parseFloat(input.egfr) || 0} className="gradient-text-cyan font-semibold" /> mL/min
                    </p>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', STATUS_CONFIG[result.status].color)}>
                    Risk: <AnimatedCounter target={result.riskScore} suffix="%" className="ml-1" />
                  </Badge>
                </div>

                {/* Visual Risk Meter */}
                <div className="space-y-1.5">
                  <div className="relative h-4 w-full rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
                    {/* Gradient track */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 via-amber-500/40 to-red-500/40" />
                    {/* Fill bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.riskScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={cn(
                        'absolute top-0 h-full rounded-full',
                        `bg-gradient-to-r ${STATUS_CONFIG[result.status].gradient}`
                      )}
                      style={{ boxShadow: `0 0 12px ${riskColor}60` }}
                    />
                    {/* Tick marks */}
                    {[25, 50, 75].map((tick) => (
                      <div key={tick} className="absolute top-0 h-full w-px bg-slate-600/40" style={{ left: `${tick}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span className="text-emerald-500">Safe</span>
                    <span className="text-amber-500">Caution</span>
                    <span className="text-red-500">Contraindicated</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warnings */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-white flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Warnings
                </p>
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                  }}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {result.warnings.map((w, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, x: -8 },
                        show: { opacity: 1, x: 0 },
                      }}
                      className={cn('flex items-start gap-2 rounded-md px-3 py-2', w.includes('HIGH') || w.includes('Significantly') ? 'bg-rose-500/10' : 'bg-amber-500/10')}
                    >
                      <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', w.includes('HIGH') || w.includes('Significantly') ? 'text-rose-400' : 'text-amber-400')} />
                      <p className="text-sm text-slate-300">{w}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-white flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Required Actions
                </p>
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                  }}
                  initial="hidden"
                  animate="show"
                  className="space-y-2"
                >
                  {result.actions.map((a, i) => (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, x: -8 },
                        show: { opacity: 1, x: 0 },
                      }}
                      className="flex items-start gap-2 bg-cyan-500/5 rounded-md px-3 py-2"
                    >
                      <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-cyan-400" />
                      <p className="text-sm text-slate-300">{a}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}