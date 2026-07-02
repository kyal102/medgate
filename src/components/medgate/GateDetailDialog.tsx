'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { GateInfo } from '@/lib/medgate-constants';
import { MED_GATES, MOCK_BENCHMARK_CASES } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';

interface GateDetailDialogProps {
  gate: GateInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DECISION_MATRIX: Record<string, { condition: string; result: string; reason: string }[]> = {
  DrugInteractionGate: [
    { condition: 'No interactions found', result: 'ALLOW', reason: 'No known clinical interactions detected' },
    { condition: 'MINOR interaction', result: 'ALLOW', reason: 'Minor interaction noted — no action required' },
    { condition: 'MODERATE interaction', result: 'NEEDS_REVIEW', reason: 'Moderate risk — clinical review recommended' },
    { condition: 'SEVERE interaction', result: 'BLOCK', reason: 'Severe interaction risk — combination contraindicated' },
    { condition: 'FATAL interaction', result: 'BLOCK', reason: 'Lethal interaction — ABSOLUTELY CONTRAINDICATED' },
  ],
  DoseVerificationGate: [
    { condition: 'Dose within therapeutic range', result: 'ALLOW', reason: 'Dose verified against clinical parameters' },
    { condition: 'Dose at upper/lower boundary', result: 'NEEDS_REVIEW', reason: 'Dose within limits but at boundary — verify intent' },
    { condition: 'Dose exceeds maximum', result: 'BLOCK', reason: 'Dose exceeds safe maximum for patient parameters' },
    { condition: 'Lethal dose detected', result: 'BLOCK', reason: 'DOSE IS LETHAL — immediate block required' },
  ],
  AllergyCrossRefGate: [
    { condition: 'No allergy match', result: 'ALLOW', reason: 'No allergy cross-reference concern' },
    { condition: 'Cross-reactivity class match', result: 'NEEDS_REVIEW', reason: 'Same drug class — review required' },
    { condition: 'Exact allergy match', result: 'BLOCK', reason: 'Direct allergy match — medication contraindicated' },
  ],
  LabResultValidityGate: [
    { condition: 'Value within reference range', result: 'ALLOW', reason: 'Lab value within normal limits' },
    { condition: 'Value outside ref but physiologically possible', result: 'NEEDS_REVIEW', reason: 'Abnormal value — clinical correlation needed' },
    { condition: 'Critical value', result: 'BLOCK', reason: 'Critical lab value — requires immediate action' },
    { condition: 'Physiologically impossible', result: 'BLOCK', reason: 'Value incompatible with life — likely error' },
  ],
  ProtocolComplianceGate: [
    { condition: 'Matches guideline recommendation', result: 'ALLOW', reason: 'Treatment plan aligns with evidence-based guidelines' },
    { condition: 'Partial guideline match', result: 'NEEDS_REVIEW', reason: 'Partially compliant — some deviations noted' },
    { condition: 'Non-compliant with guideline', result: 'BLOCK', reason: 'Treatment deviates from established clinical protocol' },
  ],
  ContrastAgentGate: [
    { condition: 'No contraindications', result: 'ALLOW', reason: 'Safe to proceed with contrast study' },
    { condition: 'eGFR borderline', result: 'NEEDS_REVIEW', reason: 'Borderline renal function — hydration protocol needed' },
    { condition: 'eGFR below threshold', result: 'BLOCK', reason: 'eGFR too low — contrast nephropathy risk' },
    { condition: 'Known contrast allergy', result: 'BLOCK', reason: 'Prior contrast reaction — premedication or alternative needed' },
  ],
  TimeCriticalGate: [
    { condition: 'Within time window', result: 'ALLOW', reason: 'Within recommended time window' },
    { condition: 'Approaching time limit', result: 'NEEDS_REVIEW', reason: 'Approaching critical time threshold' },
    { condition: 'Time window exceeded', result: 'BLOCK', reason: 'Critical time window exceeded — escalate immediately' },
  ],
  PediatricSafetyGate: [
    { condition: 'Age/weight appropriate', result: 'ALLOW', reason: 'Medication safe for pediatric patient' },
    { condition: 'Weight-band boundary', result: 'NEEDS_REVIEW', reason: 'Near weight-band transition — verify dose' },
    { condition: 'Age-restricted medication', result: 'BLOCK', reason: 'Medication contraindicated at this age' },
  ],
  PregnancySafetyGate: [
    { condition: 'Category A/B — safe', result: 'ALLOW', reason: 'No known risk in pregnancy' },
    { condition: 'Category C/D — risk in specific trimesters', result: 'NEEDS_REVIEW', reason: 'Risk depends on trimester — specialist review' },
    { condition: 'Category X — teratogen', result: 'BLOCK', reason: 'Known teratogen — ABSOLUTELY CONTRAINDICATED in pregnancy' },
  ],
  VitalSignAnomalyGate: [
    { condition: 'NEWS2 0-4 / stable', result: 'ALLOW', reason: 'Vital signs within acceptable parameters' },
    { condition: 'NEWS2 5-6 / elevated concern', result: 'NEEDS_REVIEW', reason: 'Elevated early warning score — increased monitoring' },
    { condition: 'NEWS2 ≥7 / critical', result: 'BLOCK', reason: 'Critical vital sign derangement — emergency response needed' },
  ],
  AntibioticStewardshipGate: [
    { condition: 'Appropriate spectrum & duration', result: 'ALLOW', reason: 'Antibiotic selection compliant with stewardship' },
    { condition: 'Broader spectrum than needed', result: 'NEEDS_REVIEW', reason: 'De-escalation opportunity identified' },
    { condition: 'Inappropriate for indication', result: 'BLOCK', reason: 'Antibiotic choice not appropriate for suspected pathogen' },
  ],
  BloodProductGate: [
    { condition: 'ABO/Rh compatible, crossmatch valid', result: 'ALLOW', reason: 'Blood product verified safe for transfusion' },
    { condition: 'Rh incompatibility', result: 'NEEDS_REVIEW', reason: 'Rh mismatch — may be acceptable in non-childbearing' },
    { condition: 'ABO incompatibility', result: 'BLOCK', reason: 'ABO mismatch — ABSOLUTELY CONTRAINDICATED' },
  ],
  MedicalDeviceGate: [
    { condition: 'Settings within protocol', result: 'ALLOW', reason: 'Device settings verified against clinical protocol' },
    { condition: 'Settings outside recommended range', result: 'NEEDS_REVIEW', reason: 'Device settings deviate from protocol — verify intent' },
    { condition: 'Dangerous device settings', result: 'BLOCK', reason: 'Device settings pose immediate patient harm risk' },
  ],
  DiagnosticPlausibilityGate: [
    { condition: 'Consistent with clinical picture', result: 'ALLOW', reason: 'Diagnosis consistent with presented data' },
    { condition: 'Partially consistent', result: 'NEEDS_REVIEW', reason: 'Diagnosis has some supporting evidence — alternative considered' },
    { condition: 'Inconsistent with data', result: 'BLOCK', reason: 'Diagnosis not supported by clinical evidence' },
  ],
};

const RESULT_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export function GateDetailDialog({ gate, open, onOpenChange }: GateDetailDialogProps) {
  const Icon = gate.iconComponent;
  const matrix = DECISION_MATRIX[gate.id] || [];
  const blockedExamples = MOCK_BENCHMARK_CASES.filter(
    (c) => c.gate === gate.id && c.expected_decision === 'BLOCK'
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-slate-900 border-slate-700/50 text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Icon className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {gate.name}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-400">
                {gate.description}
              </DialogDescription>
            </div>
          </div>
          <Badge variant="outline" className="w-fit text-xs border-slate-600 text-slate-400">
            Lane: {gate.lane}
          </Badge>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-2">
          <div className="space-y-6">
            {/* Checks performed */}
            <div>
              <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
                Verification Checks
              </h4>
              <ul className="space-y-2">
                {gate.checks.map((check, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            {/* Decision Matrix */}
            {matrix.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-wider">
                  Decision Matrix
                </h4>
                <div className="border border-slate-700/50 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-transparent">
                        <TableHead className="text-slate-400 text-xs">Condition</TableHead>
                        <TableHead className="text-slate-400 text-xs w-32">Decision</TableHead>
                        <TableHead className="text-slate-400 text-xs">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matrix.map((row, i) => (
                        <TableRow key={i} className="border-slate-700/50 hover:bg-slate-800/50">
                          <TableCell className="text-sm text-slate-300">{row.condition}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', RESULT_COLORS[row.result])}
                            >
                              {row.result}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-slate-400">{row.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Example Blocked Claims */}
            {blockedExamples.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 uppercase tracking-wider">
                  Example Blocked Claims
                </h4>
                <div className="space-y-2">
                  {blockedExamples.map((ex) => (
                    <div
                      key={ex.case_id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10"
                    >
                      <Badge variant="outline" className="text-[10px] text-rose-400 border-rose-500/30 shrink-0 mt-0.5">
                        {ex.risk_label}
                      </Badge>
                      <p className="text-sm text-slate-300">{ex.input}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}