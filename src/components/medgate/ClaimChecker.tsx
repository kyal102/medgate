'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useMedGateStore } from '@/lib/medgate-store';
import { DTL_LANES } from '@/lib/medgate-constants';
import type { VerificationResult, GateVerificationResult, ClaimHistoryEntry } from '@/lib/medgate-constants';
import { ScrollReveal } from './ScrollReveal';
import { Send, Hash, AlertTriangle, CheckCircle2, XCircle, HelpCircle, Download, ChevronDown, Zap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Stethoscope, Type } from 'lucide-react';

const DECISION_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  ALLOW: { color: 'border-emerald-500/40 bg-emerald-500/5', icon: CheckCircle2, label: 'ALLOWED' },
  BLOCK: { color: 'border-rose-500/40 bg-rose-500/5', icon: XCircle, label: 'BLOCKED' },
  NEEDS_REVIEW: { color: 'border-amber-500/40 bg-amber-500/5', icon: HelpCircle, label: 'NEEDS REVIEW' },
  EVIDENCE_REQUIRED: { color: 'border-cyan-500/40 bg-cyan-500/5', icon: AlertTriangle, label: 'EVIDENCE REQUIRED' },
};

const GATE_DECISION_COLORS: Record<string, string> = {
  ALLOW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  BLOCK: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  NEEDS_REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  EVIDENCE_REQUIRED: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const QUICK_TEMPLATES = [
  {
    id: 'warfarin-interaction',
    label: 'Warfarin + TMP-SMX',
    claim: 'Prescribe warfarin 5mg daily and trimethoprim-sulfamethoxazole 800/160mg BID for a 65-year-old male with AFib and UTI.',
    lane: 'PHARM',
    context: { age: '65', weight: '80', sex: 'male', medications: 'warfarin', diagnoses: 'AFib, UTI' },
  },
  {
    id: 'pediatric-dose',
    label: 'Pediatric Amoxicillin',
    claim: 'Prescribe amoxicillin 500mg TID for a 3-year-old child weighing 15kg with acute otitis media.',
    lane: 'PHARM',
    context: { age: '3', weight: '15', sex: 'male', allergies: '', medications: '', diagnoses: 'Acute Otitis Media' },
  },
  {
    id: 'pregnancy-drug',
    label: 'Pregnancy - Category X',
    claim: 'Prescribe isotretinoin 40mg daily for severe acne in a 28-year-old female who is 12 weeks pregnant.',
    lane: 'PHARM',
    context: { age: '28', weight: '60', sex: 'female', allergies: '', medications: '', diagnoses: 'Severe Acne, Pregnancy 12 weeks' },
  },
  {
    id: 'ckd-dose',
    label: 'CKD Dose Adjustment',
    claim: 'Prescribe metformin 1000mg BID for a 72-year-old male with type 2 diabetes and CKD Stage 4 (eGFR 22).',
    lane: 'PHARM',
    context: { age: '72', weight: '85', sex: 'male', allergies: '', medications: 'metformin', diagnoses: 'Type 2 Diabetes, CKD Stage 4' },
  },
  {
    id: 'sepsis-bundle',
    label: 'Sepsis 1-Hour Bundle',
    claim: 'Patient presents with suspected sepsis: temp 38.9°C, HR 118, RR 24, WBC 15.2. Initiate sepsis protocol with blood cultures, lactate, and broad-spectrum antibiotics.',
    lane: 'CLINICAL',
    context: { age: '58', weight: '75', sex: 'male', allergies: 'penicillin', medications: '', diagnoses: 'Suspected Sepsis' },
  },
];

export function ClaimChecker() {
  const {
    claimInput,
    setClaimInput,
    claimResult,
    setClaimResult,
    isCheckingClaim,
    setIsCheckingClaim,
    mergeHistoryEntries,
  } = useMedGateStore();

  const [lane, setLane] = useState('PHARM');
  const [patientAge, setPatientAge] = useState('65');
  const [patientWeight, setPatientWeight] = useState('70');
  const [patientSex, setPatientSex] = useState('male');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [diagnoses, setDiagnoses] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [patientOpen, setPatientOpen] = useState(false);
  const [diagCategory, setDiagCategory] = useState('');

  const DIAGNOSIS_CATEGORIES: Record<string, { label: string; claims: string[] }> = {
    cardiac: {
      label: 'Cardiac',
      claims: [
        'Prescribe clopidogrel 75mg daily for a 70-year-old male post-MI with concurrent omeprazole 20mg daily.',
        'Start digoxin 0.25mg daily for a 65-year-old female with AFib and CKD Stage 3 (eGFR 35).',
        'Prescribe amiodarone 200mg daily for rate control in a 58-year-old male already on warfarin.',
        'Initiate ACE inhibitor therapy with lisinopril 10mg for a 55-year-old male with HFrEF (EF 30%).',
        'Prescribe simvastatin 40mg daily with clarithromycin 500mg BID for a 68-year-old with pneumonia.',
      ],
    },
    respiratory: {
      label: 'Respiratory',
      claims: [
        'Prescribe theophylline 300mg BID for a 60-year-old smoker with COPD already taking ciprofloxacin.',
        'Administer beta-agonist nebulizer to a 45-year-old with tachycardia (HR 130) and acute asthma exacerbation.',
        'Start prophylactic heparin for a 72-year-old with severe COPD exacerbation requiring NIV.',
        'Prescribe azithromycin 500mg daily for a 50-year-old with QTc prolongation (QTc 480ms) and pneumonia.',
      ],
    },
    neurological: {
      label: 'Neurological',
      claims: [
        'Prescribe tramadol 50mg QID for a 55-year-old male with chronic pain currently taking sertraline 100mg.',
        'Administer IV phenytoin 1g loading dose for status epilepticus in a 40-year-old with known G6PD deficiency.',
        'Start levodopa 100mg TID for a 70-year-old with Parkinson disease who is on MAO inhibitor selegiline.',
        'Prescribe lithium 300mg TID for bipolar disorder in a 48-year-old with stage 3 CKD and on NSAIDs.',
      ],
    },
    infection: {
      label: 'Infection',
      claims: [
        'Prescribe vancomycin IV for MRSA bacteremia in a 65-year-old with eGFR 25 (CKD Stage 4).',
        'Start fluconazole 400mg daily for candidemia in a 50-year-old on warfarin with target INR 2.5.',
        'Administer aminoglycoside gentamicin for sepsis in a 70-year-old with baseline creatinine 1.8.',
        'Prescribe metronidazole 500mg TID with warfarin 5mg for a 60-year-old with intra-abdominal infection.',
      ],
    },
    renal: {
      label: 'Renal',
      claims: [
        'Prescribe metformin 1000mg BID for a 62-year-old with type 2 diabetes and CKD Stage 4 (eGFR 20).',
        'Administer IV contrast-enhanced CT for a 75-year-old with eGFR 28 and diabetes.',
        'Prescribe NSAID ibuprofen 600mg TID for a 58-year-old with CKD Stage 3 and hypertension.',
        'Dose enoxaparin 1mg/kg BID for DVT prophylaxis in a 68-year-old with eGFR 18.',
      ],
    },
    hepatic: {
      label: 'Hepatic',
      claims: [
        'Prescribe acetaminophen 1000mg QID for pain in a 55-year-old with Child-Pugh C cirrhosis.',
        'Start statin therapy with atorvastatin 40mg for a 60-year-old with elevated ALT 3x upper limit.',
        'Prescribe ketoconazole 400mg daily for fungal infection in a 50-year-old with compensated cirrhosis.',
        'Administer midazolam for procedural sedation in a 65-year-old with hepatic impairment (Child-Pugh B).',
      ],
    },
  };

  // Ctrl+Enter shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && claimInput.trim() && !isCheckingClaim) {
      e.preventDefault();
      handleSubmit();
    }
  }, [claimInput, isCheckingClaim]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectDiagClaim = (claim: string) => {
    setClaimInput(claim);
    setTimeout(() => handleSubmit(), 50);
  };

  const applyTemplate = (template: typeof QUICK_TEMPLATES[0]) => {
    setClaimInput(template.claim);
    setLane(template.lane);
    if (template.context) {
      setPatientAge(template.context.age);
      setPatientWeight(template.context.weight);
      setPatientSex(template.context.sex);
      setAllergies(template.context.allergies);
      setMedications(template.context.medications);
      setDiagnoses(template.context.diagnoses);
    }
    toast.info(`Template loaded: ${template.label}`, {
      description: 'Review and submit for verification.',
    });
  };

  const exportReport = () => {
    if (!claimResult) return;
    const lines = [
      '═══════════════════════════════════════════════',
      '  MedGate Verification Report',
      '═══════════════════════════════════════════════',
      '',
      `Claim: ${claimResult.claim}`,
      `Lane:  ${claimResult.lane}`,
      `Decision: ${claimResult.overall_decision}`,
      `Timestamp: ${claimResult.timestamp}`,
      `Evidence Hash: ${claimResult.evidence_hash}`,
      `Total Latency: ${claimResult.total_latency_ms}ms`,
      '',
      '── Gate Results ──────────────────────────────',
      '',
      ...claimResult.verifications.map((vr: GateVerificationResult, i: number) => {
        const gateName = vr.gate.replace(/([A-Z])/g, ' $1').trim();
        return [
          `Gate ${i + 1}: ${gateName}`,
          `  Decision:  ${vr.decision}`,
          `  Reason:    ${vr.reason}`,
          vr.risk_label ? `  Risk:      ${vr.risk_label}` : '',
          vr.evidence.length > 0 ? `  Evidence:  ${vr.evidence.join(', ')}` : '',
          `  Latency:   ${vr.latency_ms}ms`,
          '',
        ].filter(Boolean).join('\n');
      }),
      '═══════════════════════════════════════════════',
      '  Deterministic — Zero Hallucination',
      '  MedGate © 2026 — Not for Clinical Use',
      '═══════════════════════════════════════════════',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medgate-report-${claimResult.evidence_hash.slice(0, 12)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported', {
      description: 'Verification report downloaded as text file.',
    });
  };

  const handleSubmit = async () => {
    if (!claimInput.trim()) return;
    setError(null);
    setIsCheckingClaim(true);

    try {
      const res = await fetch('/api/medgate/verify-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: claimInput.trim(),
          lane,
          patient_context: {
            age: parseInt(patientAge) || 65,
            weight_kg: parseFloat(patientWeight) || 70,
            sex: patientSex as 'male' | 'female' | 'other',
            allergies: allergies.split(',').map((a) => a.trim()).filter(Boolean),
            current_medications: medications.split(',').map((m) => m.trim()).filter(Boolean),
            diagnoses: diagnoses.split(',').map((d) => d.trim()).filter(Boolean),
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Verification failed: ${res.status}`);
      }

      const result: VerificationResult = await res.json();
      setClaimResult(result);

      const blockedCount = result.verifications.filter((v) => v.decision === 'BLOCK').length;
      const allowedCount = result.verifications.filter((v) => v.decision === 'ALLOW').length;

      if (result.overall_decision === 'BLOCK') {
        toast.error('Claim BLOCKED', {
          description: `${blockedCount} of ${result.verifications.length} gates blocked this claim. ${result.verifications.find((v) => v.decision === 'BLOCK')?.reason || ''}`,
          duration: 6000,
        });
      } else if (result.overall_decision === 'NEEDS_REVIEW') {
        toast.warning('Claim needs review', {
          description: `${result.total_latency_ms}ms — Manual review recommended.`,
        });
      } else {
        toast.success('Claim ALLOWED', {
          description: `All ${allowedCount} gates passed in ${result.total_latency_ms}ms.`,
        });
      }

      // Add to history
      const historyEntry: ClaimHistoryEntry = {
        id: `claim-${Date.now()}`,
        claim: result.claim,
        lane: result.lane,
        overall_decision: result.overall_decision,
        risk_label: result.verifications.find((v) => v.decision === 'BLOCK')?.risk_label || 'NONE',
        timestamp: result.timestamp,
        evidence_hash: result.evidence_hash,
        gate_results: result.verifications,
      };
      mergeHistoryEntries([historyEntry]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Verification failed', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      });
    } finally {
      setIsCheckingClaim(false);
    }
  };

  const overallConfig = claimResult ? DECISION_CONFIG[claimResult.overall_decision] || DECISION_CONFIG.ALLOW : null;

  return (
    <section className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Input panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass-card-hover border-0">
            <CardContent className="p-4 space-y-4">
              {/* Quick Templates */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Templates</Label>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="px-2 py-1 text-[10px] font-medium rounded-md bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-200"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Claim input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="text-sm text-slate-400">Medical Claim</Label>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-[10px] font-mono', claimInput.length > 500 ? 'text-rose-400' : claimInput.length > 300 ? 'text-amber-400' : 'text-slate-600')}>
                      {claimInput.length}
                    </span>
                    <Type className="w-3 h-3 text-slate-600" />
                  </div>
                </div>
                <Textarea
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      if (claimInput.trim() && !isCheckingClaim) handleSubmit();
                    }
                  }}
                  placeholder="e.g., Prescribe warfarin and trimethoprim-sulfamethoxazole for 65yo male"
                  className="min-h-[100px] glass-input border-0 text-slate-200 placeholder:text-slate-600 text-sm resize-none"
                />
                <p className="text-[10px] text-slate-600 mt-1 text-right">Ctrl+Enter to submit</p>
              </div>

              {/* Quick Diagnosis Check */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Diagnosis Check</Label>
                </div>
                <select
                  value={diagCategory}
                  onChange={(e) => setDiagCategory(e.target.value)}
                  className="w-full h-8 rounded-md border border-slate-700/50 bg-slate-800/60 px-3 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/40"
                >
                  <option value="">Select diagnostic category...</option>
                  {Object.entries(DIAGNOSIS_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
                {diagCategory && DIAGNOSIS_CATEGORIES[diagCategory] && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DIAGNOSIS_CATEGORIES[diagCategory].claims.map((claim, i) => (
                      <button
                        key={i}
                        onClick={() => selectDiagClaim(claim)}
                        disabled={isCheckingClaim}
                        className="px-2 py-1 text-[10px] font-medium rounded-md bg-cyan-500/5 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition-all duration-200 text-left max-w-full truncate"
                      >
                        {claim.length > 60 ? claim.slice(0, 60) + '…' : claim}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Lane select */}
              <div>
                <Label className="text-sm text-slate-400 mb-1.5 block">Verification Lane</Label>
                <Select value={lane} onValueChange={setLane}>
                  <SelectTrigger className="glass-input border-0 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DTL_LANES.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name} ({l.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Patient context - collapsible */}
              <Collapsible open={patientOpen} onOpenChange={setPatientOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <ChevronDown className={cn('w-3.5 h-3.5 text-slate-500 transition-transform', patientOpen && 'rotate-180')} />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Context</span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-slate-700 text-slate-600 ml-auto">Optional</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Age</Label>
                      <Input
                        type="number"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="h-8 glass-input border-0 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-500 mb-1 block">Weight (kg)</Label>
                      <Input
                        type="number"
                        value={patientWeight}
                        onChange={(e) => setPatientWeight(e.target.value)}
                        className="h-8 glass-input border-0 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Sex</Label>
                    <Select value={patientSex} onValueChange={setPatientSex}>
                      <SelectTrigger className="h-8 glass-input border-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Allergies (comma-separated)</Label>
                    <Input
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      placeholder="penicillin, sulfa"
                      className="h-8 glass-input border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Current Medications</Label>
                    <Input
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                      placeholder="warfarin, metformin"
                      className="h-8 glass-input border-0 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500 mb-1 block">Diagnoses</Label>
                    <Input
                      value={diagnoses}
                      onChange={(e) => setDiagnoses(e.target.value)}
                      placeholder="AFib, CKD Stage 3"
                      className="h-8 glass-input border-0 text-sm"
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={!claimInput.trim() || isCheckingClaim}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium btn-glow"
              >
                {isCheckingClaim ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying through 14 gates...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit for Verification
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
        </div>

        {/* Results panel */}
        <div className="lg:col-span-3">
          {isCheckingClaim && (
            <div className="space-y-3 stagger-children">
              <Skeleton className="h-16 w-full bg-slate-800/50 shimmer" />
              <Skeleton className="h-24 w-full bg-slate-800/50 shimmer" />
              <Skeleton className="h-24 w-full bg-slate-800/50 shimmer" />
              <Skeleton className="h-24 w-full bg-slate-800/50 shimmer" />
            </div>
          )}

          {!isCheckingClaim && !claimResult && (
            <Card className="glass-card border-0">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 mb-2">Submit a medical claim to see gate-by-gate verification results.</p>
                <p className="text-xs text-slate-600">Or try one of the quick templates above.</p>
              </CardContent>
            </Card>
          )}

          {claimResult && overallConfig && (
            <div className="space-y-4">
              {/* Overall decision card */}
              <Card className={cn('glass-card border', overallConfig.color)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {<overallConfig.icon className={cn('w-6 h-6',
                        claimResult.overall_decision === 'ALLOW' ? 'text-emerald-400' :
                        claimResult.overall_decision === 'BLOCK' ? 'text-rose-400' :
                        'text-amber-400'
                      )} />}
                      <div>
                        <p className={cn('text-lg font-bold',
                          claimResult.overall_decision === 'ALLOW' ? 'text-emerald-400' :
                          claimResult.overall_decision === 'BLOCK' ? 'text-rose-400' :
                          'text-amber-400'
                        )}>
                          {overallConfig.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {claimResult.verifications.length} gates checked · {claimResult.total_latency_ms}ms total latency
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportReport}
                        className="h-8 gap-1.5 text-slate-400 hover:text-white"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-xs">Export</span>
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Hash className="w-3 h-3" />
                        <span className="font-mono">{claimResult.evidence_hash.slice(0, 16)}...</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gate-by-gate results */}
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-3">
                  {claimResult.verifications.map((vr: GateVerificationResult, i: number) => {
                    const GateIcon = DECISION_CONFIG[vr.decision]?.icon || CheckCircle2;
                    return (
                      <Card key={i} className="glass-card-hover border-0">
                        <CardHeader className="p-3 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <GateIcon className={cn('w-4 h-4',
                                vr.decision === 'ALLOW' ? 'text-emerald-400' :
                                vr.decision === 'BLOCK' ? 'text-rose-400' :
                                vr.decision === 'NEEDS_REVIEW' ? 'text-amber-400' :
                                'text-cyan-400'
                              )} />
                              <CardTitle className="text-sm font-medium text-white">
                                {vr.gate.replace(/([A-Z])/g, ' $1').trim()}
                              </CardTitle>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn('text-[10px]', GATE_DECISION_COLORS[vr.decision])}
                            >
                              {vr.decision}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                          <p className="text-xs text-slate-400 leading-relaxed">{vr.reason}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {vr.risk_label && (
                              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                                {vr.risk_label}
                              </Badge>
                            )}
                            {vr.evidence.length > 0 && (
                              <div className="text-[10px] text-slate-600 flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {vr.evidence.slice(0, 3).join(', ')}
                                {vr.evidence.length > 3 && ` +${vr.evidence.length - 3}`}
                              </div>
                            )}
                            <span className="text-[10px] text-slate-700 ml-auto font-mono">{vr.latency_ms}ms</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}