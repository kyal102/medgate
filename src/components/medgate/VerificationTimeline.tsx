'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from './AnimatedCounter';
import { toast } from 'sonner';
import { Clock, Search, Trash2, ShieldCheck, ShieldX, ShieldAlert, Activity } from 'lucide-react';

const MOCK_CLAIMS = [
  'Prescribe warfarin 5mg daily',
  'Administer amoxicillin 500mg TID for pneumonia',
  'Order contrast-enhanced CT abdomen',
  'Calculate vancomycin dose for 80kg patient',
  'Verify INR result of 4.2 for warfarin patient',
  'Check compatibility for O-negative blood transfusion',
  'Review antibiotic selection for sepsis protocol',
  'Validate pediatric dose of acetaminophen for 15kg child',
  'Screen for pregnancy drug interactions - metformin',
  'Check device settings for PCA pump',
];

const MOCK_GATES = [
  'DrugInteractionGate', 'DoseVerificationGate', 'LabResultValidityGate',
  'ProtocolComplianceGate', 'ContrastAgentGate', 'TimeCriticalGate',
  'PediatricSafetyGate', 'PregnancySafetyGate', 'BloodProductGate', 'MedicalDeviceGate',
];

type Decision = 'ALLOW' | 'BLOCK' | 'REVIEW';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  claim: string;
  gate: string;
  decision: Decision;
  durationMs: number;
}

const DECISION_CONFIG: Record<Decision, { color: string; glow: string; badge: string; icon: typeof ShieldCheck }> = {
  ALLOW: { color: 'text-emerald-400', glow: 'glow-emerald', badge: 'gate-allow', icon: ShieldCheck },
  BLOCK: { color: 'text-rose-400', glow: 'glow-rose', badge: 'gate-block', icon: ShieldX },
  REVIEW: { color: 'text-amber-400', glow: 'glow-amber', badge: 'gate-review', icon: ShieldAlert },
};

function generateMockEvent(): TimelineEvent {
  const claim = MOCK_CLAIMS[Math.floor(Math.random() * MOCK_CLAIMS.length)];
  const gate = MOCK_GATES[Math.floor(Math.random() * MOCK_GATES.length)];
  const r = Math.random();
  const decision: Decision = r < 0.6 ? 'ALLOW' : r < 0.85 ? 'BLOCK' : 'REVIEW';
  const durationMs = Math.round(0.1 + Math.random() * 0.9);

  return {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date(),
    claim,
    gate,
    decision,
    durationMs,
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

type FilterType = 'ALL' | 'ALLOW' | 'BLOCK' | 'REVIEW';

export function VerificationTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAutoScrolling = useRef(false);

  // Generate mock events periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const evt = generateMockEvent();
      setEvents((prev) => [...prev, evt]);
    }, 3000 + Math.random() * 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to latest
  useEffect(() => {
    if (events.length === 0) return;
    isAutoScrolling.current = true;
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      isAutoScrolling.current = false;
    });
  }, [events.length]);

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filter !== 'ALL') {
      result = result.filter((e) => e.decision === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.claim.toLowerCase().includes(q) || e.gate.toLowerCase().includes(q));
    }
    return result;
  }, [events, filter, search]);

  const stats = useMemo(() => {
    const total = events.length;
    const allowed = events.filter((e) => e.decision === 'ALLOW').length;
    const passRate = total > 0 ? (allowed / total) * 100 : 0;
    const avgLatency = total > 0 ? events.reduce((sum, e) => sum + e.durationMs, 0) / total : 0;
    return { total, passRate, avgLatency };
  }, [events]);

  const handleClearHistory = useCallback(() => {
    setEvents([]);
    toast.success('Verification history cleared');
  }, []);

  const filterButtons: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Allowed', value: 'ALLOW' },
    { label: 'Blocked', value: 'BLOCK' },
    { label: 'Review', value: 'REVIEW' },
  ];

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Verifications</div>
          <div className="text-2xl font-bold text-primary">
            <AnimatedCounter target={stats.total} duration={1500} />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Pass Rate</div>
          <div className="text-2xl font-bold text-emerald-400">
            <AnimatedCounter target={stats.passRate} duration={1500} decimals={1} suffix="%" />
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Latency</div>
          <div className="text-2xl font-bold text-cyan-400">
            <AnimatedCounter target={stats.avgLatency} duration={1500} decimals={2} suffix="ms" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((fb) => (
            <Button
              key={fb.value}
              variant={filter === fb.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(fb.value)}
              className={
                filter === fb.value
                  ? fb.value === 'ALLOW'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                    : fb.value === 'BLOCK'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30'
                      : fb.value === 'REVIEW'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                        : 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
                  : 'glass-card-hover'
              }
            >
              {fb.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search claims..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9 w-full sm:w-56"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearHistory}
            className="glass-card-hover text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} className="max-h-[600px] overflow-y-auto space-y-0 relative pr-2">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-sm">No verification events yet</p>
            <p className="text-xs mt-1 opacity-60">New events will appear in real-time</p>
          </div>
        ) : (
          <div className="relative">
            {/* Animated connecting line */}
            <div className="absolute left-[15px] top-0 bottom-0 w-[2px] data-flow" />

            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => {
                const config = DECISION_CONFIG[event.decision];
                const IconComp = config.icon;
                const isRecent = index >= filteredEvents.length - 2;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="relative pl-10 pb-6 group"
                  >
                    {/* Dot with pulse ring */}
                    <div className="absolute left-0 top-1 z-10">
                      {isRecent && (
                        <span className="absolute inset-0 rounded-full pulse-ring opacity-50" />
                      )}
                      <div
                        className={`w-[32px] h-[32px] rounded-full flex items-center justify-center border-2 ${config.badge} ${config.glow} transition-all duration-300`}
                      >
                        <IconComp className={`h-4 w-4 ${config.color}`} />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="glass-card gate-card-gradient-border rounded-lg p-4 transition-all duration-300 hover:shadow-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${config.badge} text-xs font-semibold`}>
                            {event.decision}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {event.gate}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.timestamp)}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-cyan-400">
                          {event.durationMs.toFixed(2)}ms
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{event.claim}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}