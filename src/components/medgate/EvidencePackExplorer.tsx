'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMedGateStore } from '@/lib/medgate-store';
import { Package, Search, Hash, Clock, GitBranch, FileWarning, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_EVIDENCE_PACKS = [
  {
    hash: '0xa7f3c9e2b8d1f4a6e5c7d8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8',
    timestamp: '2025-01-15T14:32:18.472Z',
    lane: 'PHARM',
    claim: 'Prescribe warfarin 5mg with trimethoprim-sulfamethoxazole',
    verifications: [
      {
        gate: 'DrugInteractionGate',
        decision: 'BLOCK' as const,
        evidence: ['Warfarin + TMP-SMX: SEVERE interaction', 'Vitamin K synthesis inhibition by TMP-SMX', 'INR elevation 2-4 points expected', 'Clinical guideline: avoid combination'],
        missingEvidence: [],
      },
      {
        gate: 'DoseVerificationGate',
        decision: 'ALLOW' as const,
        evidence: ['Warfarin 5mg within therapeutic range (2-10mg)', 'Standard maintenance dose confirmed'],
        missingEvidence: ['Patient INR value', 'Recent dietary vitamin K intake'],
      },
      {
        gate: 'AllergyCrossRefGate',
        decision: 'ALLOW' as const,
        evidence: ['No known allergy to warfarin', 'No known allergy to sulfonamides in patient record'],
        missingEvidence: [],
      },
    ],
  },
  {
    hash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
    timestamp: '2025-01-15T14:28:05.119Z',
    lane: 'LAB',
    claim: 'Potassium 7.8 mEq/L reported',
    verifications: [
      {
        gate: 'LabResultValidityGate',
        decision: 'BLOCK' as const,
        evidence: ['Potassium 7.8 exceeds critical high threshold (6.5 mEq/L)', 'Requires immediate clinical intervention', 'Possible hemolysis artifact'],
        missingEvidence: ['Hemolyzed sample indicator', 'Repeat specimen confirmation'],
      },
    ],
  },
];

const DECISION_STYLES = {
  ALLOW: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30', icon: CheckCircle2, glow: 'glow-emerald', gateClass: 'gate-allow' },
  BLOCK: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', icon: FileWarning, glow: 'glow-rose', gateClass: 'gate-block' },
  NEEDS_REVIEW: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: FileWarning, glow: 'glow-amber', gateClass: 'gate-review' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export function EvidencePackExplorer() {
  const claimHistory = useMedGateStore((s) => s.claimHistory);
  const [hashInput, setHashInput] = useState('');
  const [selectedPack, setSelectedPack] = useState(MOCK_EVIDENCE_PACKS[0]);

  const handleSearch = () => {
    if (!hashInput.trim()) return;
    const found = MOCK_EVIDENCE_PACKS.find((p) => p.hash.startsWith(hashInput.trim()));
    if (found) setSelectedPack(found);
  };

  const recentHistory = claimHistory.slice(0, 5);

  const evidenceCount = selectedPack?.verifications.reduce((acc, v) => acc + v.evidence.length, 0) ?? 0;
  const missingCount = selectedPack?.verifications.reduce((acc, v) => acc + v.missingEvidence.length, 0) ?? 0;
  const blockCount = selectedPack?.verifications.filter((v) => v.decision === 'BLOCK').length ?? 0;
  const allowCount = selectedPack?.verifications.filter((v) => v.decision === 'ALLOW').length ?? 0;

  return (
    <div className="space-y-4">
      <Card className="glass-card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Search className="h-4 w-4 text-cyan-400" />
            <span className="gradient-text-cyan">Lookup Evidence Pack</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Paste evidence hash (0x...)"
              className="glass-input text-xs font-mono text-cyan-300"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} size="sm" className="btn-glow bg-cyan-600 hover:bg-cyan-700 text-white shrink-0">
              Search
            </Button>
          </div>
          {recentHistory.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] text-slate-500">Recent verifications:</p>
              <div className="flex flex-wrap gap-1.5">
                {recentHistory.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setSelectedPack({
                      hash: h.evidence_hash,
                      timestamp: h.timestamp,
                      lane: h.lane,
                      claim: h.claim,
                      verifications: h.gate_results.map((gr) => ({
                        gate: gr.gate,
                        decision: gr.decision,
                        evidence: gr.evidence,
                        missingEvidence: gr.missing_evidence,
                      })),
                    })}
                    className="text-[10px] font-mono glass-card hover:bg-slate-700/60 text-slate-400 hover:text-cyan-300 px-2 py-0.5 rounded border border-slate-700/50 transition-colors truncate max-w-[200px]"
                  >
                    {h.evidence_hash.substring(0, 16)}...
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPack && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card border-cyan-500/20">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <div className="glow-cyan p-1.5 rounded-md bg-cyan-500/10">
                      <Package className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="gradient-text-cyan">Evidence Pack</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">{selectedPack.claim}</p>
                </div>
                <Badge variant="outline" className="text-cyan-400 border-cyan-400/30 shrink-0">
                  {selectedPack.lane}
                </Badge>
              </div>

              {/* Data visualization bar */}
              <div className="flex gap-3 mt-3 text-[11px]">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-slate-400">Evidence:</span>
                  <span className="font-semibold text-emerald-400">{evidenceCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60">
                  <FileWarning className="h-3 w-3 text-amber-400" />
                  <span className="text-slate-400">Missing:</span>
                  <span className="font-semibold text-amber-400">{missingCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60">
                  <GitBranch className="h-3 w-3 text-rose-400" />
                  <span className="text-slate-400">Blocked:</span>
                  <span className="font-semibold text-rose-400">{blockCount}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800/60">
                  <CheckCircle2 className="h-3 w-3 text-cyan-400" />
                  <span className="text-slate-400">Allowed:</span>
                  <span className="font-semibold text-cyan-400">{allowCount}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> <span className="font-mono text-cyan-400/70">{selectedPack.hash}</span></span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(selectedPack.timestamp).toLocaleString()}</span>
              </div>

              <motion.div
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {selectedPack.verifications.map((v, idx) => {
                  const style = DECISION_STYLES[v.decision] ?? DECISION_STYLES.ALLOW;
                  const IconComp = style.icon;
                  return (
                    <motion.div key={idx} variants={itemVariants}>
                      <div className={`rounded-lg border p-3 ${style.bg} ${style.border} ${style.gateClass} transition-shadow duration-300`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                            <div className={`${style.glow} p-1 rounded bg-current/10`}>
                              <GitBranch className={`h-3.5 w-3.5 ${style.color}`} />
                            </div>
                            {v.gate}
                          </span>
                          <Badge variant="outline" className={`${style.color} ${style.border} text-[10px]`}>
                            <IconComp className="h-3 w-3 mr-1" />
                            {v.decision}
                          </Badge>
                        </div>
                        {v.evidence.length > 0 && (
                          <div className="space-y-1 mb-2">
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Evidence</p>
                            {v.evidence.map((e, i) => (
                              <div key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                                {e}
                              </div>
                            ))}
                          </div>
                        )}
                        {v.missingEvidence.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] text-amber-500 uppercase tracking-wider font-medium">Missing Evidence</p>
                            {v.missingEvidence.map((e, i) => (
                              <div key={i} className="text-xs text-amber-300/70 flex items-start gap-1.5">
                                <FileWarning className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                                {e}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}