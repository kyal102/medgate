'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Shield,
  Ruler,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  ClipboardList,
  Heart,
  Eye,
  Flame,
  Bandage,
  FileText,
  Gauge,
  Thermometer,
  Layers,
  Target,
  Scan,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type WoundType = 'Pressure Injury' | 'Surgical Wound' | 'Venous Ulcer' | 'Arterial Ulcer' | 'Diabetic Ulcer' | 'Burn' | 'Trauma' | 'Other';
type ExudateLevel = 'None' | 'Scant' | 'Small' | 'Moderate' | 'Large';

interface BradenSubscale {
  id: string;
  label: string;
  options: { label: string; value: number }[];
}

interface WoundAssessment {
  woundType: WoundType;
  braden: Record<string, number>;
  stage: string;
  length: number;
  width: number;
  depth: number;
  exudate: ExudateLevel;
  granulation: number;
  slough: number;
  eschar: number;
  notes: string;
}

const WOUND_TYPES: WoundType[] = ['Pressure Injury', 'Surgical Wound', 'Venous Ulcer', 'Arterial Ulcer', 'Diabetic Ulcer', 'Burn', 'Trauma', 'Other'];

const BRADEN_SCALES: BradenSubscale[] = [
  { id: 'sensory', label: 'Sensory Perception', options: [
    { label: 'Completely Limited', value: 1 }, { label: 'Very Limited', value: 2 },
    { label: 'Slightly Limited', value: 3 }, { label: 'No Impairment', value: 4 },
  ]},
  { id: 'moisture', label: 'Moisture', options: [
    { label: 'Constantly Moist', value: 1 }, { label: 'Very Moist', value: 2 },
    { label: 'Occasionally Moist', value: 3 }, { label: 'Rarely Moist', value: 4 },
  ]},
  { id: 'activity', label: 'Activity', options: [
    { label: 'Bedfast', value: 1 }, { label: 'Chairfast', value: 2 },
    { label: 'Walks Occasionally', value: 3 }, { label: 'Walks Frequently', value: 4 },
  ]},
  { id: 'mobility', label: 'Mobility', options: [
    { label: 'Completely Immobile', value: 1 }, { label: 'Very Limited', value: 2 },
    { label: 'Slightly Limited', value: 3 }, { label: 'No Limitations', value: 4 },
  ]},
  { id: 'nutrition', label: 'Nutrition', options: [
    { label: 'Very Poor', value: 1 }, { label: 'Probably Inadequate', value: 2 },
    { label: 'Adequate', value: 3 }, { label: 'Excellent', value: 4 },
  ]},
  { id: 'friction', label: 'Friction/Shear', options: [
    { label: 'Problem', value: 1 }, { label: 'Potential Problem', value: 2 },
    { label: 'No Apparent Problem', value: 3 },
  ]},
];

const PRESSURE_STAGES = [
  { id: 'stage1', label: 'Stage 1', desc: 'Non-blanchable erythema of intact skin', color: 'text-amber-500' },
  { id: 'stage2', label: 'Stage 2', desc: 'Partial-thickness skin loss with dermis exposed', color: 'text-amber-500' },
  { id: 'stage3', label: 'Stage 3', desc: 'Full-thickness skin loss (fat visible, no bone/tendon)', color: 'text-rose-500' },
  { id: 'stage4', label: 'Stage 4', desc: 'Full-thickness skin loss (bone/tendon/muscle visible)', color: 'text-rose-500' },
  { id: 'unstageable', label: 'Unstageable', desc: 'Obscured by slough/eschar', color: 'text-amber-500' },
  { id: 'dti', label: 'Deep Tissue Injury', desc: 'Persistent non-blanchable deep red/maroon', color: 'text-rose-500' },
];

const EXUDATE_OPTIONS: ExudateLevel[] = ['None', 'Scant', 'Small', 'Moderate', 'Large'];

const STAGE_TREATMENTS: Record<string, string[]> = {
  stage1: ['Protective dressing (transparent film)', 'Reposition q2h', 'Skin moisturizer', 'Pressure redistribution surface', 'Nutritional optimization'],
  stage2: ['Hydrocolloid or foam dressing', 'Silicone border dressings', 'Wound cleanser (non-cytotoxic)', 'Offloading', 'Monitor for infection signs'],
  stage3: ['Alginate or hydrofiber dressing for moderate exudate', 'Negative Pressure Wound Therapy (NPWT) consideration', 'Wound debridement if necrotic tissue', 'Antibiotic if infection', 'Surgical consultation'],
  stage4: ['NPWT recommended', 'Surgical debridement', 'Specialty wound consult', 'Systemic antibiotics if infected', 'Consider flap surgery', 'Vascular assessment'],
  unstageable: ['Do NOT stage until wound bed visible', 'Chemical or enzymatic debridement', 'Consult wound care specialist', 'Absorbent dressing for exudate management'],
  dti: ['Do NOT debride — tissue may evolve', 'Protect from friction/shear', 'Offloading pressure', 'Monitor daily for evolution', 'Photograph and reassess in 24-48hr'],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getBradenRisk(score: number): { label: string; color: string; bgColor: string } {
  if (score <= 9) return { label: 'Very High Risk', color: 'text-rose-500', bgColor: 'bg-rose-500/15' };
  if (score <= 12) return { label: 'High Risk', color: 'text-rose-500', bgColor: 'bg-rose-500/10' };
  if (score <= 14) return { label: 'Moderate Risk', color: 'text-amber-500', bgColor: 'bg-amber-500/10' };
  if (score <= 18) return { label: 'Mild Risk', color: 'text-amber-500', bgColor: 'bg-amber-500/5' };
  return { label: 'No Risk', color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WoundCareDocumentation() {
  const [woundType, setWoundType] = useState<WoundType>('Pressure Injury');
  const [braden, setBraden] = useState<Record<string, number>>({
    sensory: 4, moisture: 4, activity: 4, mobility: 4, nutrition: 4, friction: 3,
  });
  const [stage, setStage] = useState('stage1');
  const [measurements, setMeasurements] = useState({ length: 0, width: 0, depth: 0 });
  const [exudate, setExudate] = useState<ExudateLevel>('None');
  const [woundBed, setWoundBed] = useState({ granulation: 70, slough: 20, eschar: 10 });
  const [notes, setNotes] = useState('');
  const [documented, setDocumented] = useState(false);

  const bradenTotal = useMemo(() => Object.values(braden).reduce((a, b) => a + b, 0), [braden]);
  const bradenRisk = useMemo(() => getBradenRisk(bradenTotal), [bradenTotal]);
  const bradenMax = 23;
  const bradenPercent = (bradenTotal / bradenMax) * 100;

  const woundBedTotal = woundBed.granulation + woundBed.slough + woundBed.eschar;
  const woundBedError = woundBedTotal !== 100;

  const setBradenValue = (id: string, value: number) => {
    setBraden(prev => ({ ...prev, [id]: value }));
  };

  const documentWound = () => {
    if (woundType === 'Pressure Injury' && woundBedError) {
      toast.error('Wound bed percentages must sum to 100%');
      return;
    }
    setDocumented(true);
    toast.success('Wound assessment documented');
  };

  return (
    <section className="space-y-6">
      <SectionHeader icon={Bandage} title="Wound Care Documentation" subtitle="Pressure Injury Staging & Braden Scale — Comprehensive Wound Assessment" />

      <Tabs defaultValue="assessment" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="assessment" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ClipboardList className="w-4 h-4 mr-1" /> Assessment
          </TabsTrigger>
          <TabsTrigger value="braden" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Gauge className="w-4 h-4 mr-1" /> Braden Scale
          </TabsTrigger>
          <TabsTrigger value="staging" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Layers className="w-4 h-4 mr-1" /> Staging
          </TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileText className="w-4 h-4 mr-1" /> Treatment Plan
          </TabsTrigger>
        </TabsList>

        {/* Assessment Tab */}
        <TabsContent value="assessment" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Stethoscope className="w-4 h-4" /> Wound Information</h3>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Wound Type</Label>
                <Select value={woundType} onValueChange={(v) => setWoundType(v as WoundType)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WOUND_TYPES.map(wt => <SelectItem key={wt} value={wt}>{wt}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Exudate</Label>
                <Select value={exudate} onValueChange={(v) => setExudate(v as ExudateLevel)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXUDATE_OPTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional wound observations..." className="text-sm min-h-[80px]" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Ruler className="w-4 h-4" /> Measurements (cm)</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['length', 'width', 'depth'] as const).map(m => (
                  <div key={m} className="space-y-1">
                    <Label className="text-xs text-muted-foreground capitalize">{m}</Label>
                    <Input type="number" min={0} step={0.1} value={measurements[m]}
                      onChange={(e) => setMeasurements(prev => ({ ...prev, [m]: parseFloat(e.target.value) || 0 }))}
                      className="text-sm" />
                  </div>
                ))}
              </div>

              {woundType !== 'Pressure Injury' ? null : (
                <>
                  <Separator />
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-2"><Scan className="w-3.5 h-3.5" /> Wound Bed Composition (%)</h4>
                  <div className="space-y-3">
                    {(['granulation', 'slough', 'eschar'] as const).map(c => (
                      <div key={c} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize text-muted-foreground">{c}</span>
                          <span className={cn(
                            c === 'granulation' ? 'text-emerald-500' : c === 'slough' ? 'text-amber-500' : 'text-rose-500'
                          )}>{woundBed[c]}%</span>
                        </div>
                        <Input type="range" min={0} max={100} step={5} value={woundBed[c]}
                          onChange={(e) => setWoundBed(prev => ({ ...prev, [c]: parseInt(e.target.value) }))}
                          className="w-full" />
                      </div>
                    ))}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total</span>
                      <span className={cn(woundBedError ? 'text-rose-500 font-bold' : 'text-emerald-500')}>
                        {woundBedTotal}% {woundBedError ? '(must = 100%)' : '✓'}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={documentWound}>
                <FileText className="w-4 h-4 mr-2" /> Document Assessment
              </Button>
            </motion.div>
          </div>
        </TabsContent>

        {/* Braden Scale Tab */}
        <TabsContent value="braden" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Braden Subscales */}
            <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Gauge className="w-4 h-4" /> Braden Scale Assessment</h3>
              <div className="space-y-4">
                {BRADEN_SCALES.map(sub => (
                  <div key={sub.id} className="glass-card rounded-lg p-4">
                    <p className="text-sm font-semibold mb-2">{sub.label}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {sub.options.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBradenValue(sub.id, opt.value)}
                          className={cn(
                            'text-xs p-2 rounded-lg border text-left transition-all',
                            braden[sub.id] === opt.value
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                              : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                          )}
                        >
                          <span className="font-bold">{opt.value}</span> — {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Braden Score Summary */}
            <div className="space-y-4">
              <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                <p className="text-xs text-muted-foreground mb-2">Braden Score</p>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="currentColor" className="text-muted-foreground/20" strokeWidth="8" fill="none" />
                    <motion.circle
                      cx="60" cy="60" r="52"
                      stroke="currentColor"
                      className={bradenRisk.color.replace('text-', 'text-')}
                      strokeWidth="8" fill="none" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 - (bradenPercent / 100) * 2 * Math.PI * 52 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-2xl font-bold', bradenRisk.color)}>
                      <AnimatedCounter target={bradenTotal} /> / {bradenMax}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('mt-2 text-sm', bradenRisk.bgColor, bradenRisk.color, 'border-current/20')}>
                  {bradenRisk.label}
                </Badge>
              </div>

              {/* Risk Level Reference */}
              <div className="glass-card rounded-xl p-6">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Risk Level Reference</h4>
                <div className="space-y-2">
                  {[
                    { range: '≤9', label: 'Very High Risk', color: 'bg-rose-500' },
                    { range: '10–12', label: 'High Risk', color: 'bg-rose-500/70' },
                    { range: '13–14', label: 'Moderate Risk', color: 'bg-amber-500' },
                    { range: '15–18', label: 'Mild Risk', color: 'bg-amber-500/50' },
                    { range: '19–23', label: 'No Risk', color: 'bg-emerald-500' },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-2 text-xs">
                      <div className={cn('w-3 h-3 rounded-full', r.color)} />
                      <span className="text-muted-foreground w-14">{r.range}</span>
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscale Breakdown */}
              <div className="glass-card rounded-xl p-6">
                <h4 className="text-xs font-semibold text-muted-foreground mb-3">Subscale Scores</h4>
                <div className="space-y-2">
                  {BRADEN_SCALES.map(sub => (
                    <div key={sub.id} className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">{sub.label}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(braden[sub.id] / 4) * 100} className="w-16 h-1.5" />
                        <span className={cn(
                          braden[sub.id] <= 2 ? 'text-rose-500' : braden[sub.id] === 3 ? 'text-amber-500' : 'text-emerald-500',
                          'font-semibold w-4 text-right'
                        )}>{braden[sub.id]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Staging Tab */}
        <TabsContent value="staging" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Pressure Injury Staging</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESSURE_STAGES.map(s => (
                <motion.button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    'text-left p-4 rounded-xl border transition-all',
                    stage === s.id
                      ? 'border-cyan-500/50 bg-cyan-500/10 shadow-lg shadow-cyan-500/5'
                      : 'border-muted-foreground/10 hover:border-muted-foreground/30'
                  )}
                >
                  <p className={cn('font-bold text-sm mb-1', stage === s.id ? 'text-primary' : s.color)}>{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Treatment Plan Tab */}
        <TabsContent value="plan" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><FileText className="w-4 h-4" /> Treatment Recommendations</h3>
              <Badge variant="outline" className={cn('text-xs', PRESSURE_STAGES.find(s => s.id === stage)?.color === 'text-rose-500' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>
                {PRESSURE_STAGES.find(s => s.id === stage)?.label}
              </Badge>
            </div>

            {woundType !== 'Pressure Injury' ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Treatment recommendations for: <span className="text-foreground font-semibold">{woundType}</span></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { icon: Eye, text: 'Assess wound bed and periwound skin' },
                    { icon: Droplets, text: 'Manage moisture balance with appropriate dressing' },
                    { icon: Shield, text: 'Infection prevention — monitor for signs of infection' },
                    { icon: Heart, text: 'Optimize nutrition (protein, vitamin C, zinc)' },
                    { icon: Activity, text: 'Address underlying etiology' },
                    { icon: Thermometer, text: 'Document and photograph wound regularly' },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-sm glass-card rounded-lg p-3">
                      <item.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {item.text}
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {stage !== 'unstageable' && stage !== 'dti' && (
                  <Alert className={cn(
                    stage === 'stage3' || stage === 'stage4'
                      ? 'border-rose-500/30 bg-rose-500/5'
                      : 'border-amber-500/30 bg-amber-500/5'
                  )}>
                    {(stage === 'stage3' || stage === 'stage4') ? (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    ) : (
                      <Info className="w-4 h-4 text-amber-500" />
                    )}
                    <AlertTitle className={stage === 'stage3' || stage === 'stage4' ? 'text-rose-400' : 'text-amber-400'}>
                      {PRESSURE_STAGES.find(s => s.id === stage)?.label} — {stage === 'stage3' || stage === 'stage4' ? 'Urgent Intervention Required' : 'Active Management Needed'}
                    </AlertTitle>
                    <AlertDescription className="text-sm text-muted-foreground">
                      {stage === 'stage3' || stage === 'stage4'
                        ? 'Full-thickness loss requires surgical evaluation, NPWT consideration, and aggressive wound management.'
                        : 'Monitor for progression and ensure adequate pressure redistribution.'}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(STAGE_TREATMENTS[stage] || []).map((t, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2 text-sm glass-card rounded-lg p-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      {t}
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Braden-based interventions */}
            {bradenTotal <= 14 && (
              <div className="mt-4">
                <Separator className="mb-4" />
                <h4 className="text-sm font-semibold text-amber-500 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Braden-Based Risk Interventions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {bradenTotal <= 9 ? [
                    'Turn/reposition q2h around the clock',
                    'Specialty pressure redistribution mattress',
                    'Heel suspension devices',
                    'Nutrition consult (high-protein supplements)',
                    'Moisture barrier cream q shift',
                    'WOCN consult immediately',
                  ] : bradenTotal <= 12 ? [
                    'Reposition q2h while awake',
                    'Pressure redistribution surface',
                    'Skin assessment each shift',
                    'Maximize mobility',
                    'Nutrition optimization',
                  ] : [
                    'Reposition q2-3h',
                    'Standard pressure redistribution',
                    'Daily skin assessment',
                    'Encourage mobility',
                  ].map((int, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs glass-card rounded-lg p-2.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      {int}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Documented Summary */}
      {documented && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Assessment Documented</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-muted-foreground text-xs">Type:</span> <span className="font-semibold">{woundType}</span></div>
            <div><span className="text-muted-foreground text-xs">Stage:</span> <span className="font-semibold">{PRESSURE_STAGES.find(s => s.id === stage)?.label || 'N/A'}</span></div>
            <div><span className="text-muted-foreground text-xs">Size:</span> <span className="font-semibold">{measurements.length}×{measurements.width}×{measurements.depth} cm</span></div>
            <div><span className="text-muted-foreground text-xs">Braden:</span> <span className={cn('font-semibold', bradenRisk.color)}>{bradenTotal} ({bradenRisk.label})</span></div>
          </div>
        </motion.div>
      )}
    </section>
  );
}