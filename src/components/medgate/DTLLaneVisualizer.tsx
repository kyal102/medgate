'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { DTL_LANES, MED_GATES } from '@/lib/medgate-constants';
import { GitBranch, Play, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function DTLLaneVisualizer() {
  const [activeClaim, setActiveClaim] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animPosition, setAnimPosition] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Staggered entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Animate a claim flowing through lanes
  useEffect(() => {
    if (!isAnimating) return;
    const timer = setInterval(() => {
      setAnimPosition((prev) => {
        if (prev >= 12) {
          setIsAnimating(false);
          setActiveClaim(null);
          return 0;
        }
        return prev + 0.15;
      });
    }, 80);
    return () => clearInterval(timer);
  }, [isAnimating]);

  const startAnimation = (laneIdx: number) => {
    setActiveClaim(laneIdx);
    setAnimPosition(0);
    setIsAnimating(true);
  };

  const reset = () => {
    setIsAnimating(false);
    setActiveClaim(null);
    setAnimPosition(0);
  };

  const getGateName = (gateId: string) => MED_GATES.find((g) => g.id === gateId)?.name.replace(' Gate', '') ?? gateId;

  const getLaneGlowClass = (color: string) => {
    if (color.includes('06b6d4') || color.includes('22d3ee') || color.includes('cyan')) return 'hover:glow-cyan';
    if (color.includes('10b981') || color.includes('34d399') || color.includes('emerald')) return 'hover:glow-emerald';
    if (color.includes('f43f5e') || color.includes('fb7185') || color.includes('rose')) return 'hover:glow-rose';
    if (color.includes('f59e0b') || color.includes('fbbf24') || color.includes('amber')) return 'hover:glow-amber';
    return 'hover:glow-cyan';
  };

  return (
    <div className="space-y-4">
      {/* Main card - glass card */}
      <div className="glass-card rounded-xl">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300 dark:text-slate-300 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-cyan-400" />
              DTL Lane Architecture
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={reset} className="h-6 text-[10px] border-slate-600 text-slate-400 hover:text-slate-200">
                <RotateCcw className="h-2.5 w-2.5 mr-1" /> Reset
              </Button>
              <Button size="sm" onClick={() => startAnimation(0)} disabled={isAnimating} className="h-6 text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white btn-glow">
                <Play className="h-2.5 w-2.5 mr-1" /> Animate Claim Flow
              </Button>
            </div>
          </div>
        </div>
        <div className="px-4 pb-4 overflow-x-auto">
          <div className="space-y-1.5 min-w-[700px]">
            {DTL_LANES.map((lane, laneIdx) => {
              const maxGates = Math.max(...DTL_LANES.map((l) => l.gates.length));
              const isActive = activeClaim === laneIdx;
              const showPulse = isActive && isAnimating;

              return (
                <div
                  key={lane.id}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 -mx-2 transition-all duration-300 cursor-pointer',
                    'glass-card-hover',
                    getLaneGlowClass(lane.color),
                    isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                  )}
                  style={{
                    transitionDelay: isReady ? `${laneIdx * 60}ms` : '0ms',
                  }}
                  onClick={() => !isAnimating && startAnimation(laneIdx)}
                >
                  {/* Lane label */}
                  <div className="w-20 shrink-0 text-right pr-2">
                    <p className="text-[10px] font-mono font-bold" style={{ color: lane.color }}>{lane.id}</p>
                    <p className="text-[9px] text-slate-500">{lane.name}</p>
                  </div>

                  {/* Track */}
                  <div
                    className="flex-1 h-10 rounded-md border relative overflow-hidden transition-all duration-300"
                    style={{
                      borderColor: showPulse ? `${lane.color}60` : `${lane.color}20`,
                      backgroundColor: showPulse ? `${lane.color}15` : `${lane.color}08`,
                    }}
                  >
                    {/* Track line */}
                    <div className="absolute top-1/2 left-3 right-3 h-px transition-opacity" style={{ backgroundColor: `${lane.color}30`, opacity: showPulse ? 1 : 0.5 }} />

                    {/* Gate nodes */}
                    {lane.gates.map((gateId, gIdx) => {
                      const leftPercent = 5 + (gIdx / Math.max(maxGates - 1, 1)) * 85;
                      const isPassed = showPulse && (animPosition / 12) * 85 >= (leftPercent - 5);
                      return (
                        <div
                          key={gateId}
                          className={cn(
                            'absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-bold text-white border-2 z-10 transition-all duration-300',
                            'hover:scale-125 hover:z-20',
                            isPassed && 'scale-110',
                          )}
                          style={{
                            left: `${leftPercent}%`,
                            backgroundColor: isPassed ? lane.color : `${lane.color}aa`,
                            borderColor: isPassed ? lane.color : `${lane.color}80`,
                            boxShadow: isPassed ? `0 0 12px ${lane.color}80, 0 0 24px ${lane.color}40` : 'none',
                          }}
                          title={getGateName(gateId)}
                        >
                          {gIdx + 1}
                        </div>
                      );
                    })}

                    {/* Animated claim dot */}
                    {showPulse && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white z-20 transition-all"
                        style={{
                          left: `${5 + (animPosition / 12) * 85}%`,
                          boxShadow: `0 0 10px ${lane.color}, 0 0 20px ${lane.color}80, 0 0 30px ${lane.color}40`,
                        }}
                      />
                    )}
                  </div>

                  {/* Gate count badge */}
                  <div className="w-8 shrink-0 text-center">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1 py-0 transition-all duration-300"
                      style={{
                        borderColor: showPulse ? `${lane.color}80` : `${lane.color}40`,
                        color: lane.color,
                        backgroundColor: showPulse ? `${lane.color}15` : 'transparent',
                      }}
                    >
                      {lane.gates.length}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend - glass card */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3 font-medium">Lane Legend</p>
          <div className="flex flex-wrap gap-3 stagger-children">
            {DTL_LANES.map((lane) => (
              <div
                key={lane.id}
                className="flex items-center gap-1.5 text-[10px] glass-card-hover rounded-md px-2 py-1 transition-all cursor-default"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full transition-shadow duration-300 hover:shadow-[0_0_8px_var(--lane-color)]"
                  style={{ backgroundColor: lane.color, '--lane-color': lane.color } as React.CSSProperties}
                />
                <span className="text-slate-400">{lane.id}: {lane.name}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Click any lane or &quot;Animate Claim Flow&quot; to see a claim being routed through the DTL architecture.
            Each numbered node represents a verification gate.
          </p>
        </div>
      </div>
    </div>
  );
}