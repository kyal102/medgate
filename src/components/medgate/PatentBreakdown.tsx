'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, GitBranch, Zap, CheckCircle2, ArrowRight } from 'lucide-react';

const PATENTS = [
  {
    number: 'AU 2026905289',
    title: 'Deterministic Threshold Lanes (DTL)',
    subtitle: 'Medical Information Routing Architecture',
    icon: GitBranch,
    color: 'cyan',
    explanation: 'Imagine a hospital where every piece of medical information is automatically sorted into specialized verification lanes — like airport security checkpoints for clinical data. Each lane has expert guards (gates) that check specific things: drug interactions, dosing, allergies, lab values.',
    keyClaims: [
      'Routes clinical claims through domain-specific verification lanes',
      'Each lane contains deterministic rule-based verification gates',
      'Gates produce evidence packs with cryptographic hash chains',
      'Same input always produces same output — 100% deterministic',
      'No probabilistic reasoning, no AI hallucinations, no confidence scores',
      'Substrate-agnostic: runs on any compute platform identically',
    ],
    medicalApplication: 'Enables real-time verification of every medication order, lab result, and clinical decision without adding latency. Replaces probabilistic AI systems that can hallucinate or produce inconsistent results.',
  },
  {
    number: 'Patent 3',
    title: 'Cross-Domain Verification Resonance',
    subtitle: 'Multi-Lane Safety Cascade System',
    icon: Zap,
    color: 'amber',
    explanation: 'Think of it like a security system where detecting an intruder at the front door automatically locks all interior doors and calls the police. In MedGate, when one verification gate detects a problem, it automatically triggers related checks in other medical domains.',
    keyClaims: [
      'Gate findings in one domain trigger verification in other domains',
      'Creates a cascade of safety checks from a single clinical event',
      'Ensures comprehensive coverage across all medical specialties',
      'Real-time resonance: no waiting for batch processing',
      'Evidence chain maintains integrity across domain boundaries',
      'Prevents siloed errors that single-domain systems miss',
    ],
    medicalApplication: 'A drug interaction (pharmacology) automatically triggers lab monitoring (laboratory), dose adjustment checks (pharmacology), and vital sign alerts (emergency) — all from a single prescription order.',
  },
];

const COLOR_MAP: Record<string, { text: string; border: string; bg: string; iconBg: string }> = {
  cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-500/5', iconBg: 'bg-cyan-500/10' },
  amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', iconBg: 'bg-amber-500/10' },
};

export function PatentBreakdown() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {PATENTS.map((patent) => {
          const colors = COLOR_MAP[patent.color];
          const IconComp = patent.icon;
          return (
            <Card key={patent.number} className={`border ${colors.border} ${colors.bg}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg ${colors.iconBg} shrink-0`}>
                    <IconComp className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div>
                    <Badge variant="outline" className={`${colors.text} ${colors.border} text-[10px] mb-1`}>
                      <FileText className="h-2.5 w-2.5 mr-1" /> {patent.number}
                    </Badge>
                    <CardTitle className={`text-sm font-medium ${colors.text}`}>{patent.title}</CardTitle>
                    <p className="text-[11px] text-slate-500 mt-0.5">{patent.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Explanation */}
                <div className="rounded-lg bg-slate-800/50 p-3">
                  <p className="text-[11px] text-slate-300 leading-relaxed">{patent.explanation}</p>
                </div>

                {/* Key claims */}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Key Claims</p>
                  <ul className="space-y-1.5">
                    {patent.keyClaims.map((claim, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-300">
                        <CheckCircle2 className={`h-3 w-3 mt-0.5 shrink-0 ${colors.text}`} />
                        {claim}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Medical application */}
                <div className="rounded-lg border border-slate-700/30 p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Medical Application</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{patent.medicalApplication}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
