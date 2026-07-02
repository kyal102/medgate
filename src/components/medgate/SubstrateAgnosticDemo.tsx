'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Tablet, Building2, Satellite, Equal, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

const SUBSTRATES = [
  { name: 'Hospital Server', icon: Server, desc: 'On-premise data center', color: '#06b6d4', bg: 'from-cyan-950/40' },
  { name: 'Ambulance Tablet', icon: Tablet, desc: 'Mobile 4G/LTE', color: '#f59e0b', bg: 'from-amber-950/40' },
  { name: 'Pharmacy System', icon: Building2, desc: 'Cloud-hosted pharmacy', color: '#10b981', bg: 'from-emerald-950/40' },
  { name: 'Rural Clinic', icon: Satellite, desc: 'Satellite connection', color: '#8b5cf6', bg: 'from-violet-950/40' },
];

const TEST_CLAIM = 'Prescribe warfarin 5mg with trimethoprim-sulfamethoxazole';
const RESULT = { decision: 'BLOCK' as const, gate: 'DrugInteractionGate', reason: 'SEVERE: Vitamin K synthesis inhibition' };

export function SubstrateAgnosticDemo() {
  return (
    <div className="space-y-6">
      {/* Claim input */}
      <Card className="border-slate-700/50 bg-slate-900/80">
        <CardContent className="p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Same Clinical Claim</p>
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-xs text-slate-300 font-mono">{TEST_CLAIM}</p>
          </div>
          <div className="flex items-center justify-center gap-2 mt-3 text-slate-500">
            <span className="text-[10px]">Sent to 4 different substrates</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </CardContent>
      </Card>

      {/* Substrate cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SUBSTRATES.map((sub) => {
          const IconComp = sub.icon;
          return (
            <Card key={sub.name} className={`border bg-gradient-to-br ${sub.bg} to-slate-900/80`} style={{ borderColor: `${sub.color}30` }}>
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${sub.color}15` }}>
                    <IconComp className="h-4 w-4" style={{ color: sub.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200">{sub.name}</p>
                    <p className="text-[10px] text-slate-500">{sub.desc}</p>
                  </div>
                </div>

                {/* Same result */}
                <div className="rounded-lg bg-slate-900/60 border border-slate-700/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3 w-3 text-rose-400" />
                    <span className="text-xs font-medium text-rose-300">BLOCK</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{RESULT.gate}: {RESULT.reason}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono text-slate-600">evidence_hash: 0xa7f3c9e2b8d1f4a6...c6b7a8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Highlight */}
      <Card className="border-cyan-500/20 bg-cyan-500/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-3">
            <Equal className="h-5 w-5 text-cyan-400" />
            <p className="text-sm text-cyan-300 font-medium">
              Same input → Same output, regardless of substrate
            </p>
            <Equal className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center max-w-lg mx-auto">
            Because MedGate uses deterministic rule engines (not neural networks), the verification logic 
            produces bit-for-bit identical results on a hospital server, an ambulance tablet, a cloud pharmacy 
            system, or a rural clinic with satellite internet. The evidence hash is always the same.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
