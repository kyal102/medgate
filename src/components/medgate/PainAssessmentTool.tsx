'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Frown,
  Meh,
  Smile,
  SmilePlus,
  Ghost,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  Target,
  BookOpen,
  Clock,
  Shield,
  Heart,
  Brain,
  Eye,
  Pill,
  Flame,
  TrendingUp,
  MapPin,
  Stethoscope,
  ClipboardList,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PainAssessment {
  intensity: number;
  quality: string[];
  location: string[];
  type: 'Nociceptive' | 'Neuropathic' | 'Mixed';
  onset: 'Acute (<3mo)' | 'Subacute (3-12mo)' | 'Chronic (>12mo)';
  medications: string;
  functionalImpact: { sleep: number; mood: number; activity: number; work: number };
  timestamp: string;
}

interface PainHistoryEntry {
  assessment: PainAssessment;
  timestamp: string;
}

const PAIN_QUALITIES = [
  'Burning', 'Sharp', 'Aching', 'Throbbing', 'Shooting', 'Stabbing',
  'Cramping', 'Gnawing', 'Tender', 'Exhausting', 'Sickening', 'Fearful', 'Punishing', 'Cruel',
];

const BODY_REGIONS = [
  { id: 'head', label: 'Head', area: 'top: 2%; left: 42%; width: 16%; height: 10%' },
  { id: 'chest', label: 'Chest', area: 'top: 18%; left: 32%; width: 36%; height: 16%' },
  { id: 'abdomen', label: 'Abdomen', area: 'top: 36%; left: 32%; width: 36%; height: 14%' },
  { id: 'l_arm', label: 'L Arm', area: 'top: 18%; left: 14%; width: 14%; height: 32%' },
  { id: 'r_arm', label: 'R Arm', area: 'top: 18%; left: 72%; width: 14%; height: 32%' },
  { id: 'l_leg', label: 'L Leg', area: 'top: 54%; left: 30%; width: 16%; height: 38%' },
  { id: 'r_leg', label: 'R Leg', area: 'top: 54%; left: 54%; width: 16%; height: 38%' },
  { id: 'back', label: 'Back', area: 'top: 14%; left: 36%; width: 28%; height: 40%' },
];

const PAIN_FACES = [
  { level: 0, color: 'bg-emerald-500', label: 'No Pain' },
  { level: 2, color: 'bg-emerald-400', label: 'Mild' },
  { level: 4, color: 'bg-amber-400', label: 'Moderate' },
  { level: 6, color: 'bg-amber-500', label: 'Moderate-Severe' },
  { level: 8, color: 'bg-orange-500', label: 'Severe' },
  { level: 10, color: 'bg-rose-500', label: 'Worst Imaginable' },
];

const RED_FLAGS = [
  'Sudden severe pain (thunderclap)',
  'Pain with neurological signs (weakness, numbness, bowel/bladder dysfunction)',
  'Cancer-related pain',
  'IV drug use history',
  'Pain unresponsive to opioids',
  'Fever with spine pain',
  'Unexplained weight loss with pain',
];

const RECOMMENDATIONS: Record<string, { ladder: string; meds: string[]; nonPharm: string[] }> = {
  'Nociceptive': {
    ladder: 'WHO Step 1-3',
    meds: ['Acetaminophen 650-1000mg q6h (max 3g/day)', 'NSAIDs (ibuprofen 400-600mg q6h)', 'Short-acting opioid PRN for moderate (oxycodone 5-10mg)', 'Long-acting opioid for severe (morphine ER, oxycodone ER)'],
    nonPharm: ['Ice/heat therapy', 'Physical therapy', 'TENS unit', 'Positioning', 'Relaxation techniques'],
  },
  'Neuropathic': {
    ladder: 'Adjuvant-first approach',
    meds: ['Gabapentin 300-3600mg/day', 'Pregabalin 75-300mg BID', 'Duloxetine 30-60mg daily', 'Amitriptyline 10-75mg at bedtime', 'Lidocaine patches 5%', 'Topical capsaicin 8%'],
    nonPharm: ['Desensitization therapy', 'Transcutaneous electrical nerve stimulation', 'Cognitive behavioral therapy', 'Mindfulness-based stress reduction', 'Acupuncture'],
  },
  'Mixed': {
    ladder: 'Combination approach',
    meds: ['WHO ladder + adjuvants', 'Acetaminophen/NSAID backbone', 'Gabapentinoid for neuropathic component', 'Consider low-dose opioid if function severely impaired'],
    nonPharm: ['Multidisciplinary pain clinic referral', 'Physical therapy', 'Psychological support', 'Interventional procedures (epidural, nerve block)'],
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PainAssessmentTool() {
  const [intensity, setIntensity] = useState(0);
  const [quality, setQuality] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [painType, setPainType] = useState<'Nociceptive' | 'Neuropathic' | 'Mixed'>('Nociceptive');
  const [onset, setOnset] = useState<string>('Acute (<3mo)');
  const [medications, setMedications] = useState('');
  const [functionalImpact, setFunctionalImpact] = useState({ sleep: 0, mood: 0, activity: 0, work: 0 });
  const [history, setHistory] = useState<PainHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('pain-assessment-history');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [assessed, setAssessed] = useState(false);

  const toggleQuality = (q: string) => {
    setQuality(prev => prev.includes(q) ? prev.filter(x => x !== q) : [...prev, q]);
  };

  const toggleLocation = (loc: string) => {
    setLocations(prev => prev.includes(loc) ? prev.filter(x => x !== loc) : [...prev, loc]);
  };

  const saveToHistory = useCallback((assessment: PainAssessment) => {
    const entry: PainHistoryEntry = { assessment, timestamp: new Date().toISOString() };
    const updated = [entry, ...history].slice(0, 5);
    setHistory(updated);
    try { localStorage.setItem('pain-assessment-history', JSON.stringify(updated)); } catch { /* ignore */ }
  }, [history]);

  const assessPain = () => {
    if (intensity === 0) {
      toast.error('Please select a pain intensity');
      return;
    }
    const assessment: PainAssessment = {
      intensity, quality, location: locations, type: painType, onset: onset as PainAssessment['onset'],
      medications, functionalImpact, timestamp: new Date().toISOString(),
    };
    saveToHistory(assessment);
    setAssessed(true);
    toast.success('Pain assessment complete');
  };

  const getIntensityColor = (val: number) => {
    if (val <= 3) return 'text-emerald-500';
    if (val <= 6) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getIntensityBg = (val: number) => {
    if (val <= 3) return 'bg-emerald-500';
    if (val <= 6) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const gaugePercentage = (intensity / 10) * 100;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (gaugePercentage / 100) * circumference;

  return (
    <section className="space-y-6">
      <SectionHeader icon={Stethoscope} title="Pain Assessment Tool" subtitle="Multidimensional Pain Assessment — WHO Analgesic Ladder Integration" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pain Rating & Type */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          {/* Circular Gauge */}
          <div className="glass-card rounded-xl p-6 flex flex-col items-center">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><Target className="w-4 h-4" /> Pain Intensity</h3>
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="60" cy="60" r="54"
                  stroke="currentColor"
                  className={intensity <= 3 ? 'text-emerald-500' : intensity <= 6 ? 'text-amber-500' : 'text-rose-500'}
                  strokeWidth="8" fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-bold', getIntensityColor(intensity))}>
                  <AnimatedCounter target={intensity} />
                </span>
                <span className="text-xs text-muted-foreground">/ 10</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {PAIN_FACES.map(f => (
                <button
                  key={f.level}
                  onClick={() => setIntensity(f.level)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg transition-all border',
                    intensity === f.level
                      ? 'border-primary bg-cyan-500/10 scale-110'
                      : 'border-transparent hover:border-muted-foreground/30'
                  )}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', f.color, 'opacity-80')} />
                  <span className="text-[10px] text-muted-foreground">{f.level}</span>
                </button>
              ))}
            </div>
            <Input
              type="range" min={0} max={10} step={1}
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="mt-3 w-full accent-primary"
            />
          </div>

          {/* Pain Type */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Brain className="w-4 h-4" /> Pain Classification</h3>
            <RadioGroup value={painType} onValueChange={(v) => setPainType(v as typeof painType)} className="space-y-2">
              {['Nociceptive', 'Neuropathic', 'Mixed'].map(t => (
                <div key={t} className="flex items-center space-x-2">
                  <RadioGroupItem value={t} id={t} />
                  <Label htmlFor={t} className="text-sm cursor-pointer">{t}</Label>
                </div>
              ))}
            </RadioGroup>
            <Separator className="my-3" />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Onset</Label>
              <RadioGroup value={onset} onValueChange={setOnset} className="space-y-2">
                {['Acute (<3mo)', 'Subacute (3-12mo)', 'Chronic (>12mo)'].map(o => (
                  <div key={o} className="flex items-center space-x-2">
                    <RadioGroupItem value={o} id={o} />
                    <Label htmlFor={o} className="text-xs cursor-pointer">{o}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </motion.div>

        {/* Middle Column - Quality, Location, Functional */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          {/* Pain Quality */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Flame className="w-4 h-4" /> Pain Quality <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400">{quality.length} selected</Badge></h3>
            <div className="flex flex-wrap gap-2">
              {PAIN_QUALITIES.map(q => (
                <button
                  key={q}
                  onClick={() => toggleQuality(q)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-full border transition-all',
                    quality.includes(q)
                      ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                      : 'border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Body Location */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> Pain Location <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400">{locations.length} areas</Badge></h3>
            <div className="relative w-full h-48 bg-muted/10 rounded-lg border border-muted-foreground/10">
              {/* Simple body outline grid */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-[10px] text-muted-foreground">Head</div>
                <div className="w-16 h-16 rounded-md border-2 border-dashed border-muted-foreground/30 mt-1 flex items-center justify-center text-[10px] text-muted-foreground">Torso</div>
                <div className="flex gap-6 mt-1">
                  <div className="w-6 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">L</div>
                  <div className="w-6 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">R</div>
                </div>
                <div className="flex gap-4 mt-1">
                  <div className="w-7 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">L</div>
                  <div className="w-7 h-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-[8px] text-muted-foreground">R</div>
                </div>
              </div>
              {BODY_REGIONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleLocation(r.id)}
                  className={cn(
                    'absolute rounded text-[9px] px-1 py-0.5 transition-all border',
                    locations.includes(r.id)
                      ? 'bg-rose-500/30 border-rose-500/50 text-rose-300'
                      : 'bg-transparent border-transparent hover:bg-muted/20'
                  )}
                  style={{ top: r.area.split('; ')[0].split(': ')[1], left: r.area.split('; ')[1].split(': ')[1], width: r.area.split('; ')[2].split(': ')[1], height: r.area.split('; ')[3].split(': ')[1] }}
                  title={r.label}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Functional Impact */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Functional Impact</h3>
            <div className="space-y-3">
              {(['sleep', 'mood', 'activity', 'work'] as const).map(f => (
                <div key={f} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-muted-foreground">{f}</span>
                    <span className={cn(getIntensityColor(functionalImpact[f]))}>{functionalImpact[f]}/10</span>
                  </div>
                  <Input
                    type="range" min={0} max={10} step={1}
                    value={functionalImpact[f]}
                    onChange={(e) => setFunctionalImpact(prev => ({ ...prev, [f]: parseInt(e.target.value) }))}
                    className="w-full accent-primary"
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Right Column - Medications, Red Flags, History */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Pill className="w-4 h-4" /> Current Medications</h3>
            <Textarea
              placeholder="List current pain medications, doses, frequency..."
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="text-sm min-h-[80px]"
            />
          </div>

          {/* Red Flags */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Red Flags</h3>
            <ul className="space-y-2">
              {RED_FLAGS.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-rose-300/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>

          {/* Assess Button */}
          <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white" onClick={assessPain}>
            <ClipboardList className="w-4 h-4 mr-2" /> Assess Pain
          </Button>

          {/* History */}
          {history.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><History className="w-4 h-4" /> Recent Assessments</h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="text-xs glass-card rounded-lg p-3 space-y-1"
                  >
                    <div className="flex justify-between">
                      <span className={cn('font-bold', getIntensityColor(h.assessment.intensity))}>Pain: {h.assessment.intensity}/10</span>
                      <span className="text-muted-foreground">{new Date(h.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{h.assessment.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{h.assessment.onset}</Badge>
                      {h.assessment.location.length > 0 && <Badge variant="outline" className="text-[10px]">{h.assessment.location.join(', ')}</Badge>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Assessment Results */}
      {assessed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Assessment Summary &amp; Recommendations</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="glass-card rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Intensity</p>
                <p className={cn('text-2xl font-bold', getIntensityColor(intensity))}>
                  <AnimatedCounter target={intensity} suffix="/10" />
                </p>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-lg font-bold text-foreground">{painType}</p>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Locations</p>
                <p className="text-lg font-bold text-foreground">{locations.length || 'None'}</p>
              </div>
              <div className="glass-card rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">Avg. Functional Impact</p>
                <p className={cn('text-2xl font-bold', getIntensityColor((functionalImpact.sleep + functionalImpact.mood + functionalImpact.activity + functionalImpact.work) / 4))}>
                  <AnimatedCounter target={((functionalImpact.sleep + functionalImpact.mood + functionalImpact.activity + functionalImpact.work) / 4)} decimals={1} suffix="/10" />
                </p>
              </div>
            </div>

            {/* WHO Ladder Recommendations */}
            {(() => {
              const rec = RECOMMENDATIONS[painType];
              return (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Pill className="w-4 h-4 text-emerald-400" /> Pharmacologic ({rec.ladder})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rec.meds.map((m, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                          className="text-xs glass-card rounded-lg p-3 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          {m}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2"><Heart className="w-4 h-4 text-amber-400" /> Non-Pharmacologic</h4>
                    <div className="flex flex-wrap gap-2">
                      {rec.nonPharm.map((np, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-amber-500/10 text-amber-300 border-amber-500/20">{np}</Badge>
                      ))}
                    </div>
                  </div>
                  {/* Severity-based escalation */}
                  {intensity >= 7 && (
                    <Alert className="border-rose-500/30 bg-rose-500/5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <AlertTitle className="text-rose-400">Severe Pain — Escalation Recommended</AlertTitle>
                      <AlertDescription className="text-rose-300/80 text-sm">
                        Pain ≥7/10 warrants urgent reassessment. Consider specialist pain consult, multimodal analgesia, and close monitoring for opioid adverse effects.
                      </AlertDescription>
                    </Alert>
                  )}
                  {intensity >= 4 && painType === 'Neuropathic' && (
                    <Alert className="border-amber-500/30 bg-amber-500/5">
                      <Info className="w-4 h-4 text-amber-500" />
                      <AlertTitle className="text-amber-400">Neuropathic Pain Alert</AlertTitle>
                      <AlertDescription className="text-amber-300/80 text-sm">
                        Neuropathic pain often responds poorly to conventional analgesics. Adjuvant medications (gabapentinoids, TCAs, SNRIs) are first-line.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })()}
          </div>
        </motion.div>
      )}
    </section>
  );
}