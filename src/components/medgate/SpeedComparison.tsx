'use client';

import { AnimatedCounter } from './AnimatedCounter';
import { SPEED_COMPARISON_DATA } from '@/lib/medgate-constants';
import { Zap, User, ArrowRight, Gauge } from 'lucide-react';

export function SpeedComparison() {
  // Parse improvement string to a number for AnimatedCounter
  const parseImprovementNum = (imp: string): number => {
    const match = imp.match(/[\d,.]+/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(/,/g, ''));
    if (imp.includes('M')) return num * 1000000;
    return num * 1000;
  };

  return (
    <div className="space-y-4">
      {/* Main card - glass styling */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Side-by-Side Speed Comparison
          </p>
        </div>
        <div className="px-4 pb-4">
          {/* Header */}
          <div className="grid grid-cols-[1fr_80px_32px_80px_1fr] items-center gap-2 pb-3 border-b border-slate-700/30 mb-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-rose-400">
                <User className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Human Review</span>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-500">Time</div>
            <div />
            <div className="text-center text-[10px] text-slate-500">Time</div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">MedGate</span>
              </div>
            </div>
          </div>

          {/* Comparison rows with animated bars */}
          <div className="stagger-children">
            {SPEED_COMPARISON_DATA.map((row, idx) => {
              const [minStr, maxStr] = row.humanTime.replace(' min', '').replace('s', '').split('-').map(Number);
              const humanBarWidth = 10 + (Math.log10((minStr + maxStr) / 2 * 60) / Math.log10(3600)) * 90;
              const improvementNum = parseImprovementNum(row.improvement);

              return (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_80px_32px_80px_1fr] items-center gap-2 py-2.5 border-b border-slate-800/20 last:border-0 hover:bg-cyan-500/5 rounded px-1 transition-colors"
                >
                  {/* Human side */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-300 font-medium text-right">{row.task}</p>
                    <div className="h-2.5 bg-slate-800/60 dark:bg-slate-800/60 bg-slate-200/60 rounded-full overflow-hidden flex justify-end">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500/30 to-rose-500/60 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${humanBarWidth}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs font-mono text-rose-400 text-center font-medium">{row.humanTime}</p>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-cyan-400" />
                      <ArrowRight className="h-4 w-4 text-cyan-500/60 relative" />
                    </div>
                  </div>

                  {/* MedGate side */}
                  <p className="text-xs font-mono text-emerald-400 text-center">&lt;1ms</p>
                  <div className="space-y-1">
                    <p className="text-[10px] text-cyan-400/80 text-left font-mono font-medium gradient-text-cyan">
                      <AnimatedCounter target={improvementNum} duration={2000} suffix="x" decimals={0} />
                    </p>
                    <div className="h-2.5 bg-slate-800/60 dark:bg-slate-800/60 bg-slate-200/60 rounded-full overflow-hidden relative">
                      <div className="h-full bg-emerald-500 rounded-full glow-emerald" style={{ width: '3px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key insight - glass card with glow */}
      <div className="glass-card rounded-lg overflow-hidden glow-cyan">
        <div className="p-4 text-center">
          <div className="relative inline-block mb-2">
            <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-cyan-400" />
            <Zap className="h-6 w-6 text-cyan-400 relative" />
          </div>
          <p className="text-sm text-cyan-300 font-medium">
            Medical information verified before a human could even begin reading it
          </p>
          <p className="text-[11px] text-slate-400 mt-2 max-w-md mx-auto">
            At sub-millisecond verification speeds, MedGate completes its full deterministic analysis pipeline
            in less time than it takes a neuron to fire. This enables real-time verification at every clinical
            decision point without adding any perceptible delay.
          </p>
        </div>
        {/* Animated bottom border */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>
    </div>
  );
}