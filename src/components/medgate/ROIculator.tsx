'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator, TrendingUp, TrendingDown, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

// Savings over time data (5 years, growing with MedGate, flat without)
function getSavingsOverTime(annualSavings: number) {
  const medGateCost = 96000;
  const years = [1, 2, 3, 4, 5];
  return years.map((y) => ({
    year: `Y${y}`,
    without: 0,
    with: Math.max(0, annualSavings * y - medGateCost * y),
  }));
}

export function ROIculator() {
  const [beds, setBeds] = useState('300');
  const [admissions, setAdmissions] = useState('12000');
  const [errorRate, setErrorRate] = useState('0.07');
  const [costPerError, setCostPerError] = useState('8500');
  const [showResults, setShowResults] = useState(false);

  const bedsNum = parseInt(beds) || 0;
  const admissionsNum = parseInt(admissions) || 0;
  const errorRateNum = parseFloat(errorRate) || 0;
  const costNum = parseInt(costPerError) || 0;

  const totalErrors = Math.round(admissionsNum * errorRateNum);
  const medGateCatchRate = 0.87;
  const errorsCaught = Math.round(totalErrors * medGateCatchRate);
  const annualSavings = errorsCaught * costNum;
  const medGateCost = 96000;
  const netROI = annualSavings - medGateCost;
  const roiPercent = medGateCost > 0 ? Math.round((netROI / medGateCost) * 100) : 0;

  const savingsOverTime = getSavingsOverTime(annualSavings);
  const maxSavings = Math.max(...savingsOverTime.map((s) => s.with), 1);

  const calculate = () => setShowResults(true);

  return (
    <div className="space-y-6">
      {/* Input form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card rounded-xl p-4 space-y-4"
      >
        <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Calculator className="h-4 w-4 text-cyan-400" />
          ROI Calculator
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <Label className="text-[10px] text-slate-500">Hospital Beds</Label>
            <Input type="number" value={beds} onChange={(e) => setBeds(e.target.value)} className="glass-input text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Annual Admissions</Label>
            <Input type="number" value={admissions} onChange={(e) => setAdmissions(e.target.value)} className="glass-input text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Med Error Rate (%)</Label>
            <Input type="number" step="0.01" value={errorRate} onChange={(e) => setErrorRate(e.target.value)} className="glass-input text-xs mt-1" />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Cost per Error ($)</Label>
            <Input type="number" value={costPerError} onChange={(e) => setCostPerError(e.target.value)} className="glass-input text-xs mt-1" />
          </div>
        </div>
        <Button onClick={calculate} className="bg-cyan-600 hover:bg-cyan-700 text-white w-full btn-glow">
          <Calculator className="h-3.5 w-3.5 mr-2" />
          Calculate ROI
        </Button>
      </motion.div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Before/After comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Before MedGate */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl border border-rose-500/20 overflow-hidden">
                <div className="p-4">
                  <p className="text-sm font-medium text-rose-300 flex items-center gap-2 mb-3">
                    <TrendingDown className="h-4 w-4" />
                    Without MedGate (Annual)
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total medication errors</span>
                      <span className="text-rose-400 font-mono font-bold">
                        <AnimatedCounter target={totalErrors} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Errors reaching patients</span>
                      <span className="text-rose-300 font-mono">
                        <AnimatedCounter target={totalErrors} />
                      </span>
                    </div>
                    <div className="h-px bg-slate-700/50" />
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Total error cost</span>
                      <span className="text-rose-400 font-mono text-sm gradient-text-rose">
                        $<AnimatedCounter target={annualSavings} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* After MedGate */}
              <motion.div variants={itemVariants} className="glass-card rounded-xl border border-emerald-500/20 overflow-hidden">
                <div className="p-4">
                  <p className="text-sm font-medium text-emerald-300 flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4" />
                    With MedGate (Annual)
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Errors caught by MedGate</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        <AnimatedCounter target={errorsCaught} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Errors still reaching patients</span>
                      <span className="text-amber-400 font-mono">
                        <AnimatedCounter target={totalErrors - errorsCaught} />
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">MedGate license cost</span>
                      <span className="text-slate-400 font-mono">$<AnimatedCounter target={medGateCost} /></span>
                    </div>
                    <div className="h-px bg-slate-700/50" />
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">Net annual savings</span>
                      <span className="text-emerald-400 font-mono text-sm gradient-text-emerald">
                        $<AnimatedCounter target={netROI} />
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ROI summary cards */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 text-center">
                <div className="p-2 rounded-lg bg-cyan-500/10 inline-block mb-2">
                  <DollarSign className="h-5 w-5 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold tabular-nums gradient-text-cyan">
                  $<AnimatedCounter target={netROI} />
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Annual Savings</p>
              </motion.div>
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 text-center">
                <div className="p-2 rounded-lg bg-emerald-500/10 inline-block mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold tabular-nums gradient-text-emerald">
                  <AnimatedCounter target={roiPercent} />x
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Return on Investment</p>
              </motion.div>
              <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 text-center">
                <div className="p-2 rounded-lg bg-amber-500/10 inline-block mb-2">
                  <ShieldCheck className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold tabular-nums gradient-text-amber">
                  <AnimatedCounter target={87} />%
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Error Catch Rate</p>
              </motion.div>
            </div>

            {/* Savings over time bar chart */}
            <motion.div variants={itemVariants} className="glass-card rounded-xl p-4 mt-4">
              <p className="text-xs text-slate-400 mb-3 font-medium">Cumulative Savings Over 5 Years</p>
              <div className="flex items-end gap-3 h-32">
                {savingsOverTime.map((s, idx) => {
                  const height = maxSavings > 0 ? Math.max(4, (s.with / maxSavings) * 100) : 4;
                  return (
                    <div key={s.year} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] text-emerald-400 font-mono">
                        ${(s.with / 1000).toFixed(0)}k
                      </span>
                      <motion.div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md relative overflow-hidden"
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ delay: 0.6 + idx * 0.12, duration: 0.8, ease: 'easeOut' }}
                        style={{ minHeight: 4 }}
                      >
                        <div className="absolute inset-0 shimmer opacity-30" />
                      </motion.div>
                      <span className="text-[10px] text-slate-500">{s.year}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Insight */}
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-xl border border-cyan-500/20 p-4 flex items-center gap-3 mt-4"
            >
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <ArrowRight className="h-5 w-5 text-cyan-400 shrink-0" />
              </div>
              <p className="text-xs text-cyan-300">
                For a <span className="font-bold"><AnimatedCounter target={bedsNum} /></span>-bed hospital with <span className="font-bold"><AnimatedCounter target={admissionsNum} /></span> annual admissions,
                MedGate saves approximately <span className="font-bold gradient-text-emerald">$<AnimatedCounter target={netROI} />/year</span> —
                a <span className="font-bold gradient-text-emerald"><AnimatedCounter target={roiPercent} />x ROI</span> on your license investment.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}