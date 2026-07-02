'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useMedGateStore } from '@/lib/medgate-store';
import { MED_GATES } from '@/lib/medgate-constants';
import { ScrollReveal } from './ScrollReveal';

export function GatePerformanceCards() {
  const gatePerformance = useMedGateStore((s) => s.gatePerformance);

  return (
    <section id="gate-performance" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MED_GATES.map((gate, i) => {
            const stats = gatePerformance[gate.id];
            if (!stats) return null;

            const total = stats.blocked + stats.allowed + stats.needsReview;
            const blockedPct = total > 0 ? (stats.blocked / total) * 100 : 0;
            const allowedPct = total > 0 ? (stats.allowed / total) * 100 : 0;
            const reviewPct = total > 0 ? (stats.needsReview / total) * 100 : 0;

            const Icon = gate.iconComponent;

            return (
              <ScrollReveal key={gate.id} delay={0.05 * (i % 8)}>
                <Card className="border-slate-700/50 bg-slate-900/60 hover:border-cyan-500/30 transition-colors">
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-white truncate">
                          {gate.name.replace(' Gate', '')}
                        </h3>
                        <p className="text-[10px] text-slate-600">{gate.lane}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Processed</span>
                        <span className="text-slate-300 font-medium">
                          {stats.processed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Blocked</span>
                        <span className="text-rose-400 font-medium">
                          {stats.blocked.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Allowed</span>
                        <span className="text-emerald-400 font-medium">
                          {stats.allowed.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500">Review</span>
                        <span className="text-amber-400 font-medium">
                          {stats.needsReview.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Ratio bar */}
                    <div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
                        <div
                          className="bg-emerald-500 transition-all duration-500"
                          style={{ width: `${allowedPct}%` }}
                        />
                        <div
                          className="bg-rose-500 transition-all duration-500"
                          style={{ width: `${blockedPct}%` }}
                        />
                        <div
                          className="bg-amber-500 transition-all duration-500"
                          style={{ width: `${reviewPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-[9px] text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {allowedPct.toFixed(1)}%
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            {blockedPct.toFixed(1)}%
                          </span>
                          <span className="flex items-center gap-1 text-[9px] text-slate-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {reviewPct.toFixed(1)}%
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-600">
                          {stats.avgLatencyMs}ms avg
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}