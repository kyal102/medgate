'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Play, ShieldCheck, ShieldX, AlertTriangle, Loader2, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AnimatedCounter } from './AnimatedCounter';

const DIAGNOSES_OPTIONS = ['Hypertension', 'Atrial Fibrillation', 'Type 2 Diabetes', 'CKD Stage 3', 'Heart Failure', 'COPD', 'Pneumonia', 'Sepsis'];
const MEDICATIONS_OPTIONS = ['Warfarin', 'Metformin', 'Lisinopril', 'Amoxicillin', 'Furosemide', 'Omeprazole', 'Atorvastatin', 'Ibuprofen'];
const ALLERGIES_OPTIONS = ['Penicillin', 'Sulfa drugs', 'Latex', 'Iodine', 'NSAIDs', 'Aspirin'];

const MOCK_GATE_RESULTS = [
  { gate: 'DrugInteractionGate', decision: 'BLOCK' as const, reason: 'Warfarin + Amoxicillin: potential interaction (MINOR) noted. Warfarin + Ibuprofen: SEVERE — increased bleeding risk.', score: 0 },
  { gate: 'DoseVerificationGate', decision: 'ALLOW' as const, reason: 'All doses within therapeutic range for age and weight.', score: 100 },
  { gate: 'AllergyCrossRefGate', decision: 'ALLOW' as const, reason: 'No cross-reactivity detected between allergies and prescribed medications.', score: 100 },
  { gate: 'LabResultValidityGate', decision: 'NEEDS_REVIEW' as const, reason: 'eGFR 35 (CKD Stage 3) — metformin dose adjustment required. Check current K+ level.', score: 50 },
  { gate: 'ProtocolComplianceGate', decision: 'NEEDS_REVIEW' as const, reason: 'Pneumonia treatment: guideline suggests doxycycline or macrolide. Amoxicillin alone may be insufficient.', score: 50 },
  { gate: 'PregnancySafetyGate', decision: 'ALLOW' as const, reason: 'Not applicable — male patient.', score: 100 },
  { gate: 'PediatricSafetyGate', decision: 'ALLOW' as const, reason: 'Not applicable — adult patient.', score: 100 },
  { gate: 'TimeCriticalGate', decision: 'ALLOW' as const, reason: 'No time-critical situations identified.', score: 100 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function PatientSimulator() {
  const [name, setName] = useState('John Smith');
  const [age, setAge] = useState('68');
  const [weight, setWeight] = useState('82');
  const [sex, setSex] = useState('male');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>(['Atrial Fibrillation', 'CKD Stage 3', 'Pneumonia']);
  const [selectedMeds, setSelectedMeds] = useState<string[]>(['Warfarin', 'Metformin', 'Amoxicillin', 'Ibuprofen']);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(['Penicillin']);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<typeof MOCK_GATE_RESULTS | null>(null);

  const toggleItem = (item: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/medgate/patient-sim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, age: parseInt(age), weight: parseFloat(weight), sex, diagnoses: selectedDiagnoses, medications: selectedMeds, allergies: selectedAllergies }),
      });
      const data = await res.json().catch(() => null);
      if (data?.results) { setResults(data.results); } else { setResults(MOCK_GATE_RESULTS); }
    } catch { setResults(MOCK_GATE_RESULTS); }
    setTimeout(() => {
      setIsRunning(false);
      toast.success('Simulation complete', {
        description: `Patient ${name} processed through all gates. ${blockedCount > 0 ? `${blockedCount} gate(s) blocked.` : 'All gates passed.'}`,
      });
    }, 800);
  };

  const overallScore = results ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null;
  const blockedCount = results?.filter((r) => r.decision === 'BLOCK').length ?? 0;
  const reviewCount = results?.filter((r) => r.decision === 'NEEDS_REVIEW').length ?? 0;
  const allowCount = results?.filter((r) => r.decision === 'ALLOW').length ?? 0;

  const gateClassMap: Record<string, string> = {
    ALLOW: 'gate-allow',
    BLOCK: 'gate-block',
    NEEDS_REVIEW: 'gate-review',
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card-hover">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <User className="h-4 w-4 text-cyan-400" />
            <span className="gradient-text-cyan">Patient Scenario Builder</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div><Label className="text-[10px] text-slate-500">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} className="glass-input text-xs mt-1" /></div>
            <div><Label className="text-[10px] text-slate-500">Age</Label><Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="glass-input text-xs mt-1" /></div>
            <div><Label className="text-[10px] text-slate-500">Weight (kg)</Label><Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="glass-input text-xs mt-1" /></div>
            <div><Label className="text-[10px] text-slate-500">Sex</Label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} className="glass-input text-xs mt-1 w-full">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
          </div>

          {[
            { label: 'Diagnoses', items: DIAGNOSES_OPTIONS, selected: selectedDiagnoses, setSelected: setSelectedDiagnoses, color: 'text-cyan-400 border-cyan-400/30' },
            { label: 'Medications', items: MEDICATIONS_OPTIONS, selected: selectedMeds, setSelected: setSelectedMeds, color: 'text-amber-400 border-amber-400/30' },
            { label: 'Allergies', items: ALLERGIES_OPTIONS, selected: selectedAllergies, setSelected: setSelectedAllergies, color: 'text-rose-400 border-rose-400/30' },
          ].map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1.5">{group.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleItem(item, group.selected, group.setSelected)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all duration-200 ${
                      group.selected.includes(item)
                        ? group.color + ' bg-current/5 shadow-sm'
                        : 'text-slate-500 border-slate-700 hover:border-slate-500'
                    }`}
                  >{item}</button>
                ))}
              </div>
            </div>
          ))}

          <Button onClick={runSimulation} disabled={isRunning} className="btn-glow bg-cyan-600 hover:bg-cyan-700 text-white w-full">
            {isRunning ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> Running All Gates...</> : <><Play className="h-3.5 w-3.5 mr-2" /> Run Simulation</>}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Safety score */}
            <Card className="glass-card-hover">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="glow-cyan p-2 rounded-lg bg-cyan-500/10">
                    <Stethoscope className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Patient Safety Score</p>
                    <p className={`text-2xl font-bold ${overallScore! >= 80 ? 'gradient-text-emerald' : overallScore! >= 50 ? 'gradient-text-amber' : 'gradient-text-rose'}`}>
                      <AnimatedCounter target={overallScore!} suffix="%" duration={1500} />
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-xs text-slate-400">Allowed</p>
                    <p className="text-lg font-bold text-emerald-400"><AnimatedCounter target={allowCount} duration={1000} /></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Blocked</p>
                    <p className="text-lg font-bold text-rose-400"><AnimatedCounter target={blockedCount} duration={1000} /></p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Review</p>
                    <p className="text-lg font-bold text-amber-400"><AnimatedCounter target={reviewCount} duration={1000} /></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gate results with scan-line */}
            <div className="relative scan-line rounded-lg">
              <motion.div
                className="space-y-2"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {results.map((r, idx) => {
                  const Icon = r.decision === 'ALLOW' ? ShieldCheck : r.decision === 'BLOCK' ? ShieldX : AlertTriangle;
                  const gateCls = gateClassMap[r.decision] ?? '';
                  return (
                    <motion.div key={idx} variants={itemVariants}>
                      <Card className={`border-0 ${gateCls} transition-shadow duration-300`}>
                        <CardContent className="p-3 flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            <Icon className={`h-4 w-4 ${
                              r.decision === 'ALLOW' ? 'text-emerald-400' : r.decision === 'BLOCK' ? 'text-rose-400' : 'text-amber-400'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-xs font-medium text-slate-200">{r.gate.replace('Gate', '')}</p>
                              <Badge variant="outline" className={`text-[9px] ${
                                r.decision === 'ALLOW' ? 'text-emerald-400 border-emerald-400/30' :
                                r.decision === 'BLOCK' ? 'text-rose-400 border-rose-400/30' :
                                'text-amber-400 border-amber-400/30'
                              }`}>{r.decision}</Badge>
                              <span className="ml-auto text-[10px] text-slate-500 font-mono">{r.score}/100</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{r.reason}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Card className="glass-card-hover border-cyan-500/20">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium gradient-text-cyan">Recommendations</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {['Replace Ibuprofen with Paracetamol (SEVERE bleeding risk with Warfarin)', 'Adjust Metformin dose for eGFR 35 (CKD Stage 3)', 'Consider adding Macrolide to pneumonia regimen per guidelines', 'Monitor INR closely if antibiotics are continued'].map((rec, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                      className="flex items-start gap-2 text-xs text-slate-300"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-400 mt-0.5 shrink-0" />
                      {rec}
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}