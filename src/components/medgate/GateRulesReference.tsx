'use client';

import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MED_GATES } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';

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

const RESULT_CLASSES: Record<string, string> = {
  ALLOW: 'gate-allow',
  BLOCK: 'gate-block',
  NEEDS_REVIEW: 'gate-review',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function GateRulesReference() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="glow-cyan"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          <Accordion type="multiple" className="space-y-2">
            {MED_GATES.map((gate) => {
              const Icon = gate.iconComponent;
              const matrix = DECISION_MATRIX[gate.id] || [];

              return (
                <motion.div key={gate.id} variants={itemVariants} className="gate-card-gradient-border">
                  <AccordionItem
                    value={gate.id}
                    className="glass-card-hover border-0 rounded-xl px-4 overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/20 shrink-0">
                          <Icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-medium gradient-text-cyan">
                            {gate.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {gate.lane} — {gate.checks.length} checks
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pb-2">
                        {/* Description */}
                        <p className="text-sm text-muted-foreground">{gate.description}</p>

                        {/* Checks list */}
                        <div>
                          <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                            Verification Checks
                          </h4>
                          <ul className="space-y-1.5">
                            {gate.checks.map((check, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0" />
                                {check}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Decision Matrix Table */}
                        {matrix.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                              Decision Matrix
                            </h4>
                            <div className="glass-card overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-border/50 hover:bg-transparent">
                                    <TableHead className="text-muted-foreground text-xs">Condition</TableHead>
                                    <TableHead className="text-muted-foreground text-xs w-32">Decision</TableHead>
                                    <TableHead className="text-muted-foreground text-xs">Reason</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {matrix.map((row, i) => (
                                    <TableRow key={i} className="border-border/50 hover:bg-accent/30">
                                      <TableCell className="text-sm text-foreground">{row.condition}</TableCell>
                                      <TableCell>
                                        <Badge
                                          variant="outline"
                                          className={cn('text-[10px] gate-badge-glow', RESULT_CLASSES[row.result])}
                                        >
                                          {row.result}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-sm text-muted-foreground">{row.reason}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              );
            })}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}