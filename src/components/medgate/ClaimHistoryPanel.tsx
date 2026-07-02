'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMedGateStore } from '@/lib/medgate-store';
import type { ClaimHistoryEntry, GateVerificationResult, Decision } from '@/lib/medgate-constants';
import { ScrollReveal } from './ScrollReveal';
import { History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  EVIDENCE_REQUIRED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const LANE_COLORS: Record<string, string> = {
  PHARM: 'border-teal-500/30 text-teal-400',
  LAB: 'border-purple-500/30 text-purple-400',
  PATH: 'border-rose-500/30 text-rose-400',
  CARD: 'border-red-500/30 text-red-400',
  RAD: 'border-blue-500/30 text-blue-400',
  EMERG: 'border-red-500/30 text-red-400',
  PEDS: 'border-amber-500/30 text-amber-400',
  OB: 'border-pink-500/30 text-pink-400',
  SURG: 'border-indigo-500/30 text-indigo-400',
  ICU: 'border-red-500/30 text-red-400',
};

const GATE_DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  EVIDENCE_REQUIRED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

export function ClaimHistoryPanel() {
  const { claimHistory, setClaimHistory } = useMedGateStore();
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered =
    filter === 'all'
      ? claimHistory
      : claimHistory.filter((e) => e.overall_decision === filter);

  const handleClear = () => {
    setClaimHistory([]);
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <section id="claim-history" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-8">
          {claimHistory.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="shrink-0 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter */}
        <ScrollReveal>
          <div className="mb-4">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40 bg-slate-900/60 border-slate-700/50 text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Decisions</SelectItem>
                <SelectItem value="ALLOW">Allowed</SelectItem>
                <SelectItem value="BLOCK">Blocked</SelectItem>
                <SelectItem value="NEEDS_REVIEW">Needs Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtered.length === 0 && (
            <Card className="border-slate-700/30 bg-slate-900/30">
              <CardContent className="p-8 text-center">
                <History className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">No claim history yet.</p>
              </CardContent>
            </Card>
          )}

          {filtered.length > 0 && (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2">
                {filtered.map((entry) => {
                  const isExpanded = expandedId === entry.id;

                  return (
                    <Card
                      key={entry.id}
                      className="border-slate-700/40 bg-slate-900/50 cursor-pointer hover:border-slate-600/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <CardContent className="p-3">
                        {/* Main row */}
                        <div className="flex items-start gap-3">
                          {/* Chevron */}
                          <div className="mt-0.5 text-slate-600">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 line-clamp-1">
                              {entry.claim}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px]', DECISION_COLORS[entry.overall_decision])}
                              >
                                {entry.overall_decision}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px]',
                                  LANE_COLORS[entry.lane] || 'border-slate-700 text-slate-500'
                                )}
                              >
                                {entry.lane}
                              </Badge>
                              <span className="text-[10px] text-slate-600 font-mono">
                                {formatTimestamp(entry.timestamp)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expanded gate results */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
                                {entry.gate_results.map((gr: GateVerificationResult, gi: number) => (
                                  <div
                                    key={gi}
                                    className="flex items-start gap-2 text-xs"
                                  >
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-[9px] shrink-0 mt-0.5',
                                        GATE_DECISION_COLORS[gr.decision]
                                      )}
                                    >
                                      {gr.decision}
                                    </Badge>
                                    <div className="min-w-0">
                                      <p className="text-slate-400">
                                        {gr.gate.replace(/([A-Z])/g, ' $1').trim()}
                                      </p>
                                      <p className="text-slate-600 mt-0.5">{gr.reason}</p>
                                    </div>
                                  </div>
                                ))}
                                <div className="text-[10px] text-slate-700 pt-1 font-mono">
                                  evidence: {entry.evidence_hash.slice(0, 24)}...
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </ScrollReveal>
      </div>
    </section>
  );
}