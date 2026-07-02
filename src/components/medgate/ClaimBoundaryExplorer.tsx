'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useMedGateStore } from '@/lib/medgate-store';
import { MOCK_BENCHMARK_CASES } from '@/lib/medgate-constants';
import type { VerificationResult, Decision } from '@/lib/medgate-constants';
import { ScrollReveal } from './ScrollReveal';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BoundaryResult {
  caseId: string;
  input: string;
  expectedDecision: Decision;
  actualDecision: Decision | null;
  correct: boolean | null;
  result: VerificationResult | null;
  loading: boolean;
}

const BOUNDARY_CASES = [
  { id: 'BC-NORMAL-DOSE', label: 'Normal dose at upper limit', input: 'Gentamicin 7mg/kg IV once daily for 70kg patient', expected: 'ALLOW' as Decision, lane: 'PHARM' },
  { id: 'BC-LETHAL-DOSE', label: 'Lethal pediatric dose', input: 'Acetaminophen 1000mg QID for 15kg 3-year-old', expected: 'BLOCK' as Decision, lane: 'PHARM' },
  { id: 'BC-CRITICAL-LAB', label: 'Critical lab value', input: 'Potassium 7.8 mEq/L', expected: 'BLOCK' as Decision, lane: 'LAB' },
  { id: 'BC-IMPOSSIBLE-LAB', label: 'Physiologically impossible', input: 'pH 6.5 in living patient', expected: 'BLOCK' as Decision, lane: 'LAB' },
  { id: 'BC-ALLERGY-EXACT', label: 'Exact allergy match', input: 'Patient with penicillin allergy: prescribe amoxicillin', expected: 'BLOCK' as Decision, lane: 'PHARM' },
  { id: 'BC-ALLERGY-SAFE', label: 'Allergy-safe alternative', input: 'Patient with penicillin allergy: prescribe azithromycin', expected: 'ALLOW' as Decision, lane: 'PHARM' },
  { id: 'BC-TIME-EXCEED', label: 'Time window exceeded', input: 'STEMI patient: door-to-balloon time at 95 minutes', expected: 'NEEDS_REVIEW' as Decision, lane: 'EMERG' },
  { id: 'BC-TIME-APPROACH', label: 'Time approaching limit', input: 'Stroke patient: door-to-needle time at 45 minutes for tPA', expected: 'NEEDS_REVIEW' as Decision, lane: 'EMERG' },
  { id: 'BC-ABO-INCOMPAT', label: 'ABO blood incompatibility', input: 'Type A+ patient: administer Type B- packed RBCs', expected: 'BLOCK' as Decision, lane: 'SURG' },
  { id: 'BC-TERATOGEN', label: 'Known teratogen in pregnancy', input: 'Prescribe isotretinoin to 28-year-old pregnant patient, first trimester', expected: 'BLOCK' as Decision, lane: 'OB' },
  { id: 'BC-PREGNANCY-SAFE', label: 'Pregnancy-safe medication', input: 'Prescribe cephalexin to pregnant patient with UTI, second trimester', expected: 'ALLOW' as Decision, lane: 'OB' },
  { id: 'BC-PROTOCOL-OK', label: 'Guideline-compliant treatment', input: 'CAP with CURB-65 score 3: prescribe ceftriaxone + azithromycin', expected: 'ALLOW' as Decision, lane: 'PHARM' },
  { id: 'BC-CONTRAST-BLOCK', label: 'Contrast with low eGFR', input: 'CT with contrast: patient on metformin, eGFR 35', expected: 'BLOCK' as Decision, lane: 'RAD' },
  { id: 'BC-VENT-BAD', label: 'Dangerous ventilator setting', input: 'ARDS patient: set tidal volume 12 mL/kg IBW on ventilator', expected: 'BLOCK' as Decision, lane: 'ICU' },
  { id: 'BC-PEDS-RESTRICT', label: 'Age-restricted medication', input: 'Prescribe tetracycline to 6-year-old child', expected: 'BLOCK' as Decision, lane: 'PEDS' },
  { id: 'BC-SEPSIS', label: 'Sepsis screening positive', input: 'Patient: HR 120, RR 24, Temp 38.9, WBC 15.2, Lactate 4.2, SBP 85', expected: 'BLOCK' as Decision, lane: 'EMERG' },
];

const DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function ClaimBoundaryExplorer() {
  const { mergeHistoryEntries, incrementBlocked } = useMedGateStore();
  const [results, setResults] = useState<Record<string, BoundaryResult>>({});
  const [runningAll, setRunningAll] = useState(false);

  const runSingle = async (boundaryCase: typeof BOUNDARY_CASES[0]) => {
    setResults((prev) => ({
      ...prev,
      [boundaryCase.id]: {
        caseId: boundaryCase.id,
        input: boundaryCase.input,
        expectedDecision: boundaryCase.expected,
        actualDecision: null,
        correct: null,
        result: null,
        loading: true,
      },
    }));

    try {
      const res = await fetch('/api/medgate/verify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim: boundaryCase.input, lane: boundaryCase.lane }),
      });

      if (!res.ok) throw new Error('Verification failed');

      const data: VerificationResult = await res.json();
      const actual = data.overall_decision;
      const correct = actual === boundaryCase.expected;

      if (actual === 'BLOCK') incrementBlocked();

      setResults((prev) => ({
        ...prev,
        [boundaryCase.id]: {
          caseId: boundaryCase.id,
          input: boundaryCase.input,
          expectedDecision: boundaryCase.expected,
          actualDecision: actual,
          correct,
          result: data,
          loading: false,
        },
      }));
    } catch {
      setResults((prev) => ({
        ...prev,
        [boundaryCase.id]: {
          caseId: boundaryCase.id,
          input: boundaryCase.input,
          expectedDecision: boundaryCase.expected,
          actualDecision: null,
          correct: false,
          result: null,
          loading: false,
        },
      }));
    }
  };

  const runAll = async () => {
    setRunningAll(true);
    for (const bc of BOUNDARY_CASES) {
      await runSingle(bc);
      await new Promise((r) => setTimeout(r, 200));
    }
    setRunningAll(false);
  };

  const totalCorrect = Object.values(results).filter((r) => r.correct === true).length;
  const totalTested = Object.values(results).filter((r) => r.correct !== null).length;

  return (
    <section id="boundaries" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Button
              onClick={runAll}
              disabled={runningAll}
              className="btn-glow bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
            >
              {runningAll ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running all...
                </span>
              ) : (
                'Run All Boundary Tests'
              )}
            </Button>

            {totalTested > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className={cn('font-semibold gradient-text-emerald',
                  totalCorrect === totalTested ? '' : 'gradient-text-amber'
                )}>
                  {totalCorrect}/{totalTested} correct
                </span>
                {totalCorrect === totalTested && totalTested === BOUNDARY_CASES.length && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
            )}
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.04 } },
            }}
          >
            {BOUNDARY_CASES.map((bc) => {
              const r = results[bc.id];
              const isTested = r && r.correct !== null;
              const isLoading = r?.loading;

              return (
                <motion.div
                  key={bc.id}
                  variants={{
                    hidden: { opacity: 0, y: 12, scale: 0.97 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } },
                  }}
                >
                  <Card
                    className={cn(
                      'glass-card-hover transition-all',
                      isTested && r.correct && 'border-emerald-500/40',
                      isTested && !r.correct && 'border-rose-500/40',
                    )}
                  >
                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-100">{bc.label}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{bc.input}</p>
                        </div>
                        {isTested && (
                          r.correct ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px]', DECISION_COLORS[bc.expected])}
                        >
                          Expected: {bc.expected}
                        </Badge>
                        {isTested && r.actualDecision && (
                          <Badge
                            variant="outline"
                            className={cn('text-[10px]', DECISION_COLORS[r.actualDecision])}
                          >
                            Got: {r.actualDecision}
                          </Badge>
                        )}
                      </div>

                      {!isLoading && !isTested && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-7 text-[10px] border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                          onClick={() => runSingle(bc)}
                        >
                          Run Test
                        </Button>
                      )}

                      {isLoading && (
                        <div className="shimmer rounded-md h-7 flex items-center justify-center">
                          <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </ScrollReveal>
      </div>
    </section>
  );
}