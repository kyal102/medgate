'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowDown, Hash, Clock, AlertTriangle } from 'lucide-react';

interface ChainBlock {
  id: string;
  prevHash: string;
  hash: string;
  gate: string;
  decision: string;
  timestamp: string;
  nonce: number;
}

const CHAIN_BLOCKS: ChainBlock[] = [
  { id: 'BLK-0001', prevHash: '0x0000...0000', hash: '0x7a2b3c4d5e6f1a2b', gate: 'DTL Router', decision: 'ROUTE:PHARM', timestamp: '14:32:18.472', nonce: 48271 },
  { id: 'BLK-0002', prevHash: '0x7a2b3c4d5e6f1a2b', hash: '0xc4d8e9f0a1b2c3d4', gate: 'DrugInteractionGate', decision: 'BLOCK', timestamp: '14:32:18.473', nonce: 91034 },
  { id: 'BLK-0003', prevHash: '0xc4d8e9f0a1b2c3d4', hash: '0x1f6e7d8c9b0a1d2e', gate: 'DoseVerificationGate', decision: 'ALLOW', timestamp: '14:32:18.473', nonce: 67291 },
  { id: 'BLK-0004', prevHash: '0x1f6e7d8c9b0a1d2e', hash: '0xb3a7c6d5e4f3a2b1', gate: 'AllergyCrossRefGate', decision: 'ALLOW', timestamp: '14:32:18.474', nonce: 15820 },
  { id: 'BLK-0005', prevHash: '0xb3a7c6d5e4f3a2b1', hash: '0xe5f4d3c2b1a09876', gate: 'Evidence Pack Final', decision: 'OVERALL:BLOCK', timestamp: '14:32:18.474', nonce: 82463 },
];

export function EvidenceChain() {
  return (
    <div className="space-y-4">
      {/* Chain visualization */}
      <div className="space-y-0">
        {CHAIN_BLOCKS.map((block, idx) => {
          const isLast = idx === CHAIN_BLOCKS.length - 1;
          const isBlock = block.decision === 'BLOCK';
          return (
            <div key={block.id} className="flex flex-col items-center">
              <Card className={`border w-full max-w-md ${
                isBlock ? 'border-rose-500/30 bg-rose-500/5' : 'border-slate-700/50 bg-slate-900/80'
              }`}>
                <CardContent className="p-3 space-y-2">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-600">
                        <Hash className="h-2.5 w-2.5 mr-0.5" /> {block.id}
                      </Badge>
                      <Badge className={`text-[9px] ${
                        isBlock ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {block.decision}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500">
                      <Clock className="h-2.5 w-2.5" />
                      {block.timestamp}
                    </div>
                  </div>

                  {/* Gate */}
                  <p className="text-xs font-medium text-slate-300">{block.gate}</p>

                  {/* Hashes */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-600 w-16">prev:</span>
                      <span className="text-[9px] font-mono text-slate-500">{block.prevHash}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-cyan-600 w-16">hash:</span>
                      <span className="text-[9px] font-mono text-cyan-400/60">{block.hash}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-slate-600 w-16">nonce:</span>
                      <span className="text-[9px] font-mono text-slate-500">{block.nonce}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Connector */}
              {!isLast && (
                <div className="flex flex-col items-center py-1">
                  <div className="w-px h-4 bg-slate-700/50" />
                  <ArrowDown className="h-3 w-3 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tamper-proof callout */}
      <Card className="border-rose-500/20 bg-rose-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-rose-300">Tamper-Proof Chain</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Each block contains the hash of the previous block. Changing any single input (even one character in a 
              medication name) would change the hash of that block, which would invalidate all subsequent blocks in 
              the chain. This makes the evidence chain cryptographically tamper-evident.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integrity summary */}
      <Card className="border-cyan-500/20 bg-slate-900/80">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-cyan-300">Blockchain-Style Evidence Integrity</p>
            <p className="text-[11px] text-slate-400 mt-1">
              While not a cryptocurrency blockchain, MedGate uses the same cryptographic chaining principle 
              to ensure every verification step is linked, ordered, and tamper-evident. Auditors can verify 
              the entire chain from input to decision using only the final evidence hash.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
