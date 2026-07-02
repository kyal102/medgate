'use client';

import { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GateInfo } from '@/lib/medgate-constants';
import { useMedGateStore } from '@/lib/medgate-store';
import { cn } from '@/lib/utils';

interface GateCardProps {
  gate: GateInfo;
  onClick?: () => void;
}

export function GateCard({ gate, onClick }: GateCardProps) {
  const gatePerformance = useMedGateStore((s) => s.gatePerformance);
  const stats = gatePerformance[gate.id];
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const Icon = gate.iconComponent;

  // Trigger shimmer once when card enters viewport
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const allowedPct =
    stats && stats.processed > 0
      ? (stats.allowed / stats.processed) * 100
      : 0;
  const blockedPct =
    stats && stats.processed > 0
      ? (stats.blocked / stats.processed) * 100
      : 0;

  return (
    <Card
      ref={cardRef}
      onClick={onClick}
      className={cn(
        'group cursor-pointer border-slate-700/50 glass-card-hover gate-card-gradient-border gate-card-shimmer',
        'transition-all duration-300 ease-out',
        isVisible && 'is-visible',
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shrink-0 pulse-ring group-hover:bg-cyan-500/20 transition-all duration-300 ease-out">
              <Icon className="w-5 h-5 text-cyan-400 transition-transform duration-300 ease-out group-hover:scale-110" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {gate.name.replace(' Gate', '')}
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-slate-600 text-slate-400 mt-0.5 gate-badge-glow"
              >
                {gate.lane}
              </Badge>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {gate.description}
        </p>

        {/* Stats section */}
        {stats && (
          <>
            <div className="gate-stats-divider" />
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-slate-500">
                  {stats.allowed.toLocaleString()} allowed
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="text-[10px] text-slate-500">
                  {stats.blocked.toLocaleString()} blocked
                </span>
              </div>
              <div className="ml-auto text-[10px] text-slate-600">
                {stats.processed.toLocaleString()} processed
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Progress bar at the very bottom of the card */}
      {stats && (
        <div className="gate-progress-bar">
          <div
            className="gate-progress-allowed"
            style={{ width: `${allowedPct}%` }}
          />
          <div
            className="gate-progress-blocked"
            style={{ width: `${blockedPct}%` }}
          />
        </div>
      )}
    </Card>
  );
}