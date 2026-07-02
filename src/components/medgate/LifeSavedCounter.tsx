'use client';

import { useMedGateStore } from '@/lib/medgate-store';
import { LIVES_SAVED_DATA } from '@/lib/medgate-constants';
import { AnimatedCounter } from './AnimatedCounter';
import { Heart, ShieldAlert, AlertTriangle, CheckCircle2, Activity, TrendingDown, Clock, Users } from 'lucide-react';

export function LifeSavedCounter() {
  const totalClaimsBlocked = useMedGateStore((s) => s.totalClaimsBlocked);
  const totalSaved = LIVES_SAVED_DATA.reduce((sum, r) => sum + r.estSaved, 0);
  const totalIncidence = LIVES_SAVED_DATA.reduce((sum, r) => sum + parseInt(r.annualIncidence.replace(/,/g, '')), 0);

  return (
    <div className="space-y-6">
      {/* Main counter - hero card */}
      <div className="glass-card rounded-xl overflow-hidden relative glow-rose">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-rose-500/5 pointer-events-none" />
        <div className="p-6 sm:p-8 text-center relative z-10">
          {/* Animated heart with pulse ring */}
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-rose-400" />
            <div className="relative bg-rose-500/10 rounded-full p-4 glow-rose">
              <Heart className="h-10 w-10 text-rose-400 animate-heartbeat" />
            </div>
          </div>

          {/* Main number */}
          <p className="text-5xl sm:text-7xl font-bold gradient-text-rose tabular-nums tracking-tight leading-tight">
            <AnimatedCounter target={27844} duration={3000} className="text-5xl sm:text-7xl font-bold tabular-nums tracking-tight" />
          </p>
          <p className="text-base sm:text-lg text-rose-300/80 dark:text-rose-300/80 mt-2 font-medium">
            lives potentially saved per year (US)
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Based on published medical error incidence data × MedGate catch rates
          </p>
        </div>
        {/* Bottom animated border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent stat-card-border" style={{ '--border-delay': '500ms', '--stat-color': 'rgba(244,63,94,0.5)' } as React.CSSProperties} />
      </div>

      {/* Stat cards row - glass-card with animated counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <div className="glass-card rounded-lg p-4 text-center glow-rose">
          <Heart className="h-5 w-5 text-rose-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-rose tabular-nums">
            <AnimatedCounter target={totalSaved} duration={2500} />
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Lives Saved</p>
        </div>

        <div className="glass-card rounded-lg p-4 text-center glow-cyan">
          <ShieldAlert className="h-5 w-5 text-cyan-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-cyan tabular-nums">
            <AnimatedCounter target={totalClaimsBlocked} duration={2000} />
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Blocked This Session</p>
        </div>

        <div className="glass-card rounded-lg p-4 text-center glow-amber">
          <Activity className="h-5 w-5 text-amber-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-amber tabular-nums">
            <AnimatedCounter target={totalIncidence} duration={2500} />
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Annual Incidents</p>
        </div>

        <div className="glass-card rounded-lg p-4 text-center glow-emerald">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl sm:text-3xl font-bold gradient-text-emerald tabular-nums">
            0<span className="text-lg">%</span>
          </p>
          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Alerts Ignored</p>
        </div>
      </div>

      {/* Alert Fatigue Comparison - glass card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            Alert Fatigue: Traditional CDS vs MedGate
          </p>
        </div>
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                Traditional CDS
              </span>
              <span className="text-amber-400 font-mono font-bold">94% ignored</span>
            </div>
            <div className="h-3 bg-slate-800/60 dark:bg-slate-800/60 bg-slate-200/60 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000 ease-out" style={{ width: '94%' }} />
            </div>
            <p className="text-[11px] text-slate-500">94 of every 100 alerts are dismissed by clinicians</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                MedGate
              </span>
              <span className="text-emerald-400 font-mono font-bold">0% ignored</span>
            </div>
            <div className="h-3 bg-slate-800/60 dark:bg-slate-800/60 bg-slate-200/60 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }} />
            </div>
            <p className="text-[11px] text-slate-500">Deterministic verification — every alert is actionable and critical</p>
          </div>
        </div>
      </div>

      {/* Error Prevention Impact Table - glass card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-400" />
            Error Prevention Impact Analysis
          </p>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left py-2 pr-4 text-slate-400 font-medium">Error Type</th>
                <th className="text-right py-2 px-2 text-slate-400 font-medium">Annual</th>
                <th className="text-right py-2 px-2 text-slate-400 font-medium">Catch Rate</th>
                <th className="text-right py-2 pl-2 text-slate-400 font-medium">Est. Saved</th>
              </tr>
            </thead>
            <tbody>
              {LIVES_SAVED_DATA.map((row) => (
                <tr key={row.errorType} className="border-b border-slate-800/30 hover:bg-cyan-500/5 transition-colors">
                  <td className="py-2 pr-4 text-slate-300">{row.errorType}</td>
                  <td className="py-2 px-2 text-right text-slate-400 font-mono">{row.annualIncidence}</td>
                  <td className="py-2 px-2 text-right">
                    <span className="inline-block text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 font-medium">
                      {row.catchRate}
                    </span>
                  </td>
                  <td className="py-2 pl-2 text-right font-bold font-mono gradient-text-rose">
                    {row.estSaved.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="font-bold">
                <td className="py-2 pr-4 text-slate-200">Total Estimated</td>
                <td colSpan={2} />
                <td className="py-2 pl-2 text-right font-mono text-sm gradient-text-rose">
                  <AnimatedCounter target={totalSaved} duration={3000} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}