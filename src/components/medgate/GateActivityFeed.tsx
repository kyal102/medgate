'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ScrollReveal } from './ScrollReveal';
import { MED_GATES, ICON_MAP } from '@/lib/medgate-constants';
import type { Decision } from '@/lib/medgate-constants';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const MOCK_CLAIMS = [
  'Prescribe warfarin and trimethoprim-sulfamethoxazole for AFib patient',
  'Potassium 7.8 mEq/L reported from floor nurse',
  'Patient with penicillin allergy: prescribe amoxicillin for UTI',
  'STEMI patient: door-to-balloon time at 95 minutes',
  'Prescribe isotretinoin to 28-year-old pregnant patient, first trimester',
  'Type A+ patient: administer Type B- packed RBCs',
  'Acetaminophen 1000mg QID for 15kg 3-year-old',
  'Prescribe tetracycline to 6-year-old child',
  'CT with contrast: patient on metformin, eGFR 35',
  'ARDS patient: set tidal volume 12 mL/kg IBW on ventilator',
  'CAP with CURB-65 score 3: prescribe ceftriaxone + azithromycin',
  'Gentamicin 7mg/kg IV once daily for 70kg patient',
  'Sodium 120 mEq/L — SIADH suspected',
  'Prescribe clopidogrel and omeprazole for post-MI patient',
  'Prescribe methotrexate and ibuprofen for RA patient',
  'Stroke patient: door-to-needle time at 45 minutes for tPA',
  'Patient: HR 120, RR 24, Temp 38.9, WBC 15.2, Lactate 4.2',
  'Prescribe cephalexin to pregnant patient with UTI, second trimester',
  'Digoxin 0.5mg IV for 85-year-old, eGFR 20',
  'Prescribe amoxicillin and probenecid for recurrent infection',
];

interface FeedEntry {
  id: string;
  timestamp: string;
  gateId: string;
  claim: string;
  decision: Decision;
}

function generateMockEntries(count: number): FeedEntry[] {
  const entries: FeedEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const gate = MED_GATES[Math.floor(Math.random() * MED_GATES.length)];
    const claim = MOCK_CLAIMS[Math.floor(Math.random() * MOCK_CLAIMS.length)];
    const rand = Math.random();
    const decision: Decision =
      rand < 0.55 ? 'ALLOW' : rand < 0.8 ? 'NEEDS_REVIEW' : 'BLOCK';

    entries.push({
      id: `feed-${i}`,
      timestamp: new Date(now - (count - i) * 3000).toISOString(),
      gateId: gate.id,
      claim,
      decision,
    });
  }

  return entries;
}

export function GateActivityFeed() {
  const [entries, setEntries] = useState<FeedEntry[]>(() => generateMockEntries(20));
  const scrollRef = useRef<HTMLDivElement>(null);
  const entryCountRef = useRef(20);

  useEffect(() => {
    const interval = setInterval(() => {
      const gate = MED_GATES[Math.floor(Math.random() * MED_GATES.length)];
      const claim = MOCK_CLAIMS[Math.floor(Math.random() * MOCK_CLAIMS.length)];
      const rand = Math.random();
      const decision: Decision =
        rand < 0.55 ? 'ALLOW' : rand < 0.8 ? 'NEEDS_REVIEW' : 'BLOCK';

      entryCountRef.current += 1;
      const newEntry: FeedEntry = {
        id: `feed-${entryCountRef.current}`,
        timestamp: new Date().toISOString(),
        gateId: gate.id,
        claim,
        decision,
      };

      setEntries((prev) => [newEntry, ...prev].slice(0, 50));
    }, 2500 + Math.random() * 1500);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <section id="activity-feed" className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <Card className="border-slate-700/50 bg-slate-900/60">
            <CardContent className="p-4">
              <ScrollArea className="max-h-[500px]" ref={scrollRef}>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {entries.map((entry) => {
                      const gate = MED_GATES.find((g) => g.id === entry.gateId);
                      const Icon = gate ? ICON_MAP[gate.icon] : Activity;

                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -20, height: 0 }}
                          animate={{ opacity: 1, x: 0, height: 'auto' }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3 }}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30"
                        >
                          {/* Gate icon */}
                          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 shrink-0 mt-0.5">
                            {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-slate-300 line-clamp-1">
                              {entry.claim}
                            </p>
                            <p className="text-[10px] text-slate-600 mt-0.5">
                              {gate?.name}
                            </p>
                          </div>

                          {/* Right side: decision + time */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', DECISION_COLORS[entry.decision])}
                            >
                              {entry.decision}
                            </Badge>
                            <span className="text-[10px] text-slate-600 font-mono">
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>
    </section>
  );
}