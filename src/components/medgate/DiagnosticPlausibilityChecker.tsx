'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlausibilityResult {
  score: number;
  matchingFactors: { factor: string; matched: boolean; detail: string }[];
  redFlags: string[];
}

const DIAGNOSIS_PATTERNS: Record<string, { symptoms: string[]; labs: string[]; ageRange: [number, number]; redFlags: string[]; antiPatterns: string[] }> = {
  'Acute Myocardial Infarction': {
    symptoms: ['chest pain', 'chest pressure', 'dyspnea', 'diaphoresis', 'nausea', 'radiating pain', 'arm pain', 'jaw pain'],
    labs: ['troponin', 'ck', 'ecg', 'st elevation', 't wave'],
    ageRange: [30, 100],
    redFlags: ['ST elevation', 'troponin > 0.04', 'hemodynamic instability', 'cardiac arrest'],
    antiPatterns: ['pediatric', 'age 5', 'age 8'],
  },
  'Pneumonia': {
    symptoms: ['cough', 'fever', 'dyspnea', 'pleuritic', 'sputum', 'chills', 'malaise', 'tachypnea'],
    labs: ['wbc', 'crp', 'infiltrate', 'consolidation', 'procalcitonin'],
    ageRange: [0, 100],
    redFlags: ['SpO2 < 90%', 'respiratory failure', 'sepsis', 'empyema'],
    antiPatterns: [],
  },
  'Pulmonary Embolism': {
    symptoms: ['dyspnea', 'pleuritic chest pain', 'cough', 'hemoptysis', 'leg swelling', 'tachycardia', 'syncope'],
    labs: ['d-dimer', 'ctpa', 'wells score', 'hypoxia', 'respiratory alkalosis'],
    ageRange: [18, 100],
    redFlags: ['hemodynamic instability', 'right heart strain', 'massive PE', 'cardiac arrest'],
    antiPatterns: ['age 3', 'age 5'],
  },
  'Sepsis': {
    symptoms: ['fever', 'hypotension', 'altered mental status', 'tachycardia', 'tachypnea', 'oliguria', 'confusion'],
    labs: ['lactate', 'wbc', 'procalcitonin', 'blood culture', 'crp', 'creatinine'],
    ageRange: [0, 100],
    redFlags: ['lactate > 4', 'MAP < 65', 'multi-organ failure', 'septic shock'],
    antiPatterns: [],
  },
  'Acute Appendicitis': {
    symptoms: ['abdominal pain', 'right lower quadrant', 'rlq', 'nausea', 'vomiting', 'anorexia', 'fever', 'migratory pain', 'mcburney'],
    labs: ['wbc', 'crp', 'neutrophil', 'ultrasound', 'ct abdomen'],
    ageRange: [5, 80],
    redFlags: ['perforation', 'peritonitis', 'appendiceal mass', 'pregnancy'],
    antiPatterns: [],
  },
};

export function DiagnosticPlausibilityChecker() {
  const [diagnosis, setDiagnosis] = useState('');
  const [age, setAge] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [labs, setLabs] = useState('');
  const [result, setResult] = useState<PlausibilityResult | null>(null);

  const check = () => {
    if (!diagnosis || !symptoms) return;
    setResult(localCheck(diagnosis, age ? parseInt(age) : 50, symptoms, labs));
  };

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm text-slate-400">Proposed Diagnosis</label>
              <Input placeholder="e.g. Acute Myocardial Infarction" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Patient Age</label>
              <Input type="number" placeholder="e.g. 65" value={age} onChange={(e) => setAge(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Symptoms (comma-separated)</label>
            <Textarea placeholder="e.g. chest pain, dyspnea, diaphoresis" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={2} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Key Labs / Findings (comma-separated)</label>
            <Textarea placeholder="e.g. troponin elevated, ST elevation on ECG" value={labs} onChange={(e) => setLabs(e.target.value)} rows={2} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
          </div>
          <Button onClick={check} disabled={!diagnosis || !symptoms} className="bg-cyan-600 hover:bg-cyan-500 text-white">
            Check Plausibility
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Plausibility Score</CardTitle>
                <div className="flex items-center gap-3">
                  <span className={cn('text-3xl font-bold',
                    result.score >= 70 ? 'text-emerald-400' :
                    result.score >= 40 ? 'text-amber-400' : 'text-rose-400'
                  )}>{result.score}%</span>
                  <Badge variant="outline" className={cn(
                    result.score >= 70 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    result.score >= 40 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                    'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  )}>
                    {result.score >= 70 ? 'HIGH' : result.score >= 40 ? 'MODERATE' : 'LOW'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700',
                  result.score >= 70 ? 'bg-emerald-500' :
                  result.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                )} style={{ width: `${result.score}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" />Matching Factors</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-64 overflow-y-auto">
              {result.matchingFactors.map((f, i) => (
                <div key={i} className={cn('flex items-start gap-3 rounded-md px-3 py-2', f.matched ? 'bg-emerald-500/10' : 'bg-slate-800/50')}>
                  {f.matched ? <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className={cn('text-sm font-medium', f.matched ? 'text-emerald-300' : 'text-slate-400')}>{f.factor}</p>
                    <p className="text-xs text-slate-500">{f.detail}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {result.redFlags.length > 0 && (
            <Card className="bg-rose-500/10 border-rose-500/30">
              <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-400" />Red Flags</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.redFlags.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 bg-rose-500/10 rounded-md px-3 py-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-sm text-rose-300">{f}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}

function localCheck(diagnosis: string, age: number, symptoms: string, labs: string): PlausibilityResult {
  const pattern = DIAGNOSIS_PATTERNS[diagnosis];
  if (!pattern) {
    return { score: 30, matchingFactors: [{ factor: 'Diagnosis', matched: false, detail: `${diagnosis} not in known diagnostic patterns.` }], redFlags: ['Unknown diagnosis pattern. Manual clinical review required.'] };
  }

  const symLower = symptoms.toLowerCase();
  const labLower = labs.toLowerCase();
  const combined = `${symLower} ${labLower}`;

  const matchingFactors: PlausibilityResult['matchingFactors'] = [];
  let score = 0;

  const symMatches = pattern.symptoms.filter((s) => symLower.includes(s.toLowerCase()));
  matchingFactors.push({
    factor: 'Symptom Correlation',
    matched: symMatches.length >= 2,
    detail: `${symMatches.length}/${pattern.symptoms.length} expected symptoms found: ${symMatches.length > 0 ? symMatches.join(', ') : 'none matched'}.`,
  });
  score += Math.min(symMatches.length / 3, 1) * 35;

  const labMatches = pattern.labs.filter((l) => combined.includes(l.toLowerCase()));
  matchingFactors.push({
    factor: 'Lab/Investigation Correlation',
    matched: labMatches.length >= 1,
    detail: `${labMatches.length}/${pattern.labs.length} expected findings found: ${labMatches.length > 0 ? labMatches.join(', ') : 'none matched'}.`,
  });
  score += Math.min(labMatches.length / 2, 1) * 30;

  const ageOk = age >= pattern.ageRange[0] && age <= pattern.ageRange[1];
  matchingFactors.push({
    factor: 'Age Plausibility',
    matched: ageOk,
    detail: ageOk ? `Age ${age} is within expected range (${pattern.ageRange[0]}-${pattern.ageRange[1]}).` : `Age ${age} is outside expected range (${pattern.ageRange[0]}-${pattern.ageRange[1]}).`,
  });
  score += ageOk ? 15 : 0;

  const hasAntiPattern = pattern.antiPatterns.some((p) => combined.includes(p.toLowerCase()));
  if (hasAntiPattern) score -= 20;

  const redFlags: string[] = [];
  const detectedFlags = pattern.redFlags.filter((f) => combined.includes(f.toLowerCase()));
  detectedFlags.forEach((f) => redFlags.push(`Red flag present: ${f}`));
  if (detectedFlags.length > 0) {
    matchingFactors.push({
      factor: 'Red Flags Detected',
      matched: true,
      detail: `${detectedFlags.length} red flag(s) detected: ${detectedFlags.join(', ')}.`,
    });
    score += 20;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  return { score, matchingFactors, redFlags };
}