'use client';

import { AnimatedCounter } from './AnimatedCounter';
import { SPEED_COMPARISON_DATA } from '@/lib/medgate-constants';
import { Zap, Timer, TrendingUp, Gauge, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export function InfoVelocityDashboard() {
  const chartData = SPEED_COMPARISON_DATA.map((d) => {
    const [minStr, maxStr] = d.humanTime.replace(' min', '').replace('s', '').split('-');
    const midSec = ((parseInt(minStr) + parseInt(maxStr)) / 2) * 60;
    return {
      task: d.task,
      humanSeconds: midSec,
      medgateSeconds: 0.001,
      improvement: d.improvement,
    };
  });

  // Parse improvement for AnimatedCounter
  const parseImprovement = (imp: string): number => {
    const match = imp.match(/[\d,.]+/);
    if (!match) return 0;
    const num = parseFloat(match[0].replace(/,/g, ''));
    if (imp.includes('M')) return num * 1000000;
    return num * 1000;
  };

  return (
    <div className="space-y-6">
      {/* Hero stat - glass card with glow */}
      <div className="glass-card rounded-xl overflow-hidden relative glow-cyan">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/5 pointer-events-none" />
        <div className="p-6 sm:p-8 text-center relative z-10">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 rounded-full animate-ping opacity-10 bg-cyan-400" />
            <div className="relative bg-cyan-500/10 rounded-full p-3 glow-cyan">
              <Zap className="h-8 w-8 text-cyan-400" />
            </div>
          </div>
          <p className="text-3xl sm:text-5xl font-bold gradient-text-cyan tabular-nums leading-tight">
            <AnimatedCounter target={120000} duration={2500} suffix="x" />
            {' '}to{' '}
            <AnimatedCounter target={3600000} duration={3000} suffix="x" />
          </p>
          <p className="text-sm text-cyan-300/70 mt-2 font-medium">faster than human review</p>
          <p className="text-[10px] text-slate-500 mt-2">
            Medical information verified before a human could even begin reading it
          </p>
        </div>
        <div className="h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      </div>

      {/* Speed metric cards - glass cards with animated counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger-children">
        <div className="glass-card rounded-lg p-4 text-center glow-cyan">
          <Gauge className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-cyan tabular-nums">
            &lt;1<span className="text-sm">ms</span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">MedGate Speed</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center glow-rose">
          <Timer className="h-5 w-5 text-rose-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-rose tabular-nums">
            <AnimatedCounter target={420} duration={2000} suffix="s" />
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Avg Human Time</p>
        </div>
        <div className="glass-card rounded-lg p-4 text-center glow-emerald col-span-2 sm:col-span-1">
          <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-emerald tabular-nums">
            <AnimatedCounter target={6} duration={1500} />
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Verification Gates</p>
        </div>
      </div>

      {/* Racing bars - glass card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Speed Comparison (seconds, log scale)
          </p>
        </div>
        <div className="px-4 pb-4 space-y-3 stagger-children">
          {SPEED_COMPARISON_DATA.map((d, idx) => {
            const humanWidth = 30 + ((Math.log10(parseImprovement(d.improvement)) / Math.log10(3600000)) * 65);
            return (
              <div key={d.task} className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300 w-36 sm:w-44 truncate">{d.task}</span>
                  <span className="text-cyan-400 font-mono font-medium">{d.improvement}</span>
                </div>
                <div className="relative h-6 rounded-md overflow-hidden bg-slate-800/40 dark:bg-slate-800/40 bg-slate-200/40">
                  {/* Human bar */}
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-500/20 to-rose-500/40 rounded-l-md transition-all duration-1000 ease-out"
                    style={{ width: `${humanWidth}%` }}
                  >
                    <span className="text-[9px] text-rose-300 ml-2 leading-6">{d.humanTime}</span>
                  </div>
                  {/* MedGate bar */}
                  <div className="absolute top-0 left-0 h-2.5 bg-emerald-500 rounded-full mt-[7px] glow-emerald" style={{ width: '4px' }} />
                  <span className="absolute top-1.5 left-1.5 text-[7px] text-emerald-300 font-mono">&lt;1ms</span>
                  {/* Arrow indicator */}
                  <ArrowRight className="absolute top-1/2 -translate-y-1/2 right-2 h-3 w-3 text-slate-500/50" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log scale chart - glass card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
            <Timer className="h-4 w-4 text-cyan-400" />
            Human Review Time by Task (seconds)
          </p>
        </div>
        <div className="px-4 pb-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} scale="log" domain={[0.001, 3600]} />
              <YAxis type="category" dataKey="task" width={120} tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <ReferenceLine x={0.001} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'MedGate', fill: '#10b981', fontSize: 10 }} />
              <Bar dataKey="humanSeconds" fill="#f43f5e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key insight - glass card with glow */}
      <div className="glass-card rounded-lg overflow-hidden glow-emerald">
        <div className="p-4 flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-full animate-ping opacity-15 bg-emerald-400" />
            <Zap className="h-5 w-5 text-emerald-400 relative" />
          </div>
          <p className="text-xs text-emerald-300">
            At sub-millisecond speeds, MedGate can verify every medication order, lab result, and clinical decision{' '}
            <span className="font-bold">in real-time</span> — before the clinician even moves to the next screen.
          </p>
        </div>
      </div>
    </div>
  );
}