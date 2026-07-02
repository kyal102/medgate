'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMedGateStore } from '@/lib/medgate-store';
import type { VerificationResult } from '@/lib/medgate-constants';
import { ScrollReveal } from './ScrollReveal';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  EVIDENCE_REQUIRED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

interface BatchResult {
  claim: string;
  decision: string;
  risk_label: string;
  gates_triggered: string[];
}

export function BatchClaimVerifier() {
  const { mergeHistoryEntries, incrementBlocked } = useMedGateStore();
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleBatchSubmit = async () => {
    const claims = input
      .split('\n')
      .map((c) => c.trim())
      .filter(Boolean);

    if (claims.length === 0) return;

    setError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/medgate/batch-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claims }),
      });

      if (!res.ok) throw new Error(`Batch verification failed: ${res.status}`);

      const data: VerificationResult[] = await res.json();

      const batchResults: BatchResult[] = data.map((r) => {
        const blockedGates = r.verifications
          .filter((v) => v.decision === 'BLOCK')
          .map((v) => v.gate);

        if (r.overall_decision === 'BLOCK') incrementBlocked();

        return {
          claim: r.claim,
          decision: r.overall_decision,
          risk_label: r.verifications.find((v) => v.decision === 'BLOCK')?.risk_label || '',
          gates_triggered: blockedGates,
        };
      });

      setResults(batchResults);
      const blocked = batchResults.filter((r) => r.decision === 'BLOCK').length;
      const allowed = batchResults.filter((r) => r.decision === 'ALLOW').length;
      toast.success('Batch verification complete', {
        description: `${batchResults.length} claims processed: ${allowed} allowed, ${blocked} blocked.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Batch verification failed', { description: err instanceof Error ? err.message : 'Unknown error.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="batch-verify" className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Input panel */}
            <Card className="lg:col-span-1 border-slate-700/50 bg-slate-900/60">
              <CardContent className="p-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">
                    Enter one claim per line:
                  </p>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Prescribe warfarin and trimethoprim-sulfamethoxazole\nPotassium 7.8 mEq/L\nPatient with penicillin allergy: prescribe amoxicillin\nPrescribe tetracycline to 6-year-old child`}
                    className="min-h-[250px] bg-slate-800/50 border-slate-700 text-slate-200 placeholder:text-slate-600 text-sm font-mono resize-none"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">{input.split('\n').filter((l) => l.trim()).length} claims</p>
                </div>

                <Button
                  onClick={handleBatchSubmit}
                  disabled={!input.trim() || isProcessing}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Verify All Claims
                    </span>
                  )}
                </Button>

                {error && (
                  <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md p-2">
                    {error}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Results panel */}
            <Card className="lg:col-span-2 border-slate-700/50 bg-slate-900/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  Results {results.length > 0 && `(${results.length} claims)`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {isProcessing && (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-slate-800/50" />
                    ))}
                  </div>
                )}

                {!isProcessing && results.length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-8">
                    Batch verification results will appear here.
                  </p>
                )}

                {results.length > 0 && (
                  <ScrollArea className="max-h-[500px]">
                    <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-700/50 hover:bg-transparent">
                            <TableHead className="text-slate-400 text-xs">Claim</TableHead>
                            <TableHead className="text-slate-400 text-xs w-32">Decision</TableHead>
                            <TableHead className="text-slate-400 text-xs w-40">Risk Label</TableHead>
                            <TableHead className="text-slate-400 text-xs">Gates Triggered</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((r, i) => (
                            <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/30">
                              <TableCell className="text-sm text-slate-300 max-w-[200px]">
                                <span className="line-clamp-2">{r.claim}</span>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn('text-[10px]', DECISION_COLORS[r.decision])}
                                >
                                  {r.decision}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-400">{r.risk_label || '—'}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {r.gates_triggered.map((g, gi) => (
                                    <Badge
                                      key={gi}
                                      variant="outline"
                                      className="text-[9px] border-rose-500/20 text-rose-400"
                                    >
                                      {g.replace(/([A-Z])/g, ' $1').trim().replace(' Gate', '')}
                                    </Badge>
                                  ))}
                                  {r.gates_triggered.length === 0 && (
                                    <span className="text-[10px] text-slate-600">None</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Summary */}
                    <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        {results.filter((r) => r.decision === 'ALLOW').length} Allowed
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        {results.filter((r) => r.decision === 'BLOCK').length} Blocked
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        {results.filter((r) => r.decision === 'NEEDS_REVIEW').length} Needs Review
                      </span>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}