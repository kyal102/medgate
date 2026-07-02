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
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Baby,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  Heart,
  Thermometer,
  Eye,
  Shield,
  Pill,
  Stethoscope,
  ClipboardList,
  Scale,
  FlaskConical,
  Droplets,
  Brain,
  Milestone,
  FileWarning,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

interface APGARItem {
  id: string;
  label: string;
  options: { label: string; value: number; short: string }[];
}

interface APGARTimePoint {
  minute: number;
  scores: Record<string, number>;
}

interface BallardItem {
  id: string;
  label: string;
  category: 'neuromuscular' | 'physical';
  options: { label: string; value: number; criteria: string }[];
}

interface NeonatalMeds {
  name: string;
  dose: string;
  indication: string;
  maxDose?: string;
  caution?: string;
  contraindicated?: boolean;
}

const APGAR_ITEMS: APGARItem[] = [
  { id: 'appearance', label: 'Appearance (Skin Color)', options: [
    { label: 'Blue/pale all over', value: 0, short: 'Blue/pale' },
    { label: 'Acrocyanotic (blue extremities)', value: 1, short: 'Acrocyanotic' },
    { label: 'Completely pink', value: 2, short: 'Pink' },
  ]},
  { id: 'pulse', label: 'Pulse (Heart Rate)', options: [
    { label: 'Absent', value: 0, short: 'Absent' },
    { label: '<100 bpm', value: 1, short: '<100' },
    { label: '≥100 bpm', value: 2, short: '≥100' },
  ]},
  { id: 'grimace', label: 'Grimace (Reflex Irritability)', options: [
    { label: 'No response', value: 0, short: 'None' },
    { label: 'Grimace', value: 1, short: 'Grimace' },
    { label: 'Cry, cough, sneeze', value: 2, short: 'Cry' },
  ]},
  { id: 'activity', label: 'Activity (Muscle Tone)', options: [
    { label: 'Limp', value: 0, short: 'Limp' },
    { label: 'Some flexion', value: 1, short: 'Flexion' },
    { label: 'Active motion', value: 2, short: 'Active' },
  ]},
  { id: 'respiration', label: 'Respiration', options: [
    { label: 'Absent', value: 0, short: 'Absent' },
    { label: 'Slow/irregular', value: 1, short: 'Slow' },
    { label: 'Good crying', value: 2, short: 'Good' },
  ]},
];

const BALLARD_ITEMS: BallardItem[] = [
  // Neuromuscular
  { id: 'posture', label: 'Posture', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
    { label: '5', value: 5, criteria: '' },
  ]},
  { id: 'square_window', label: 'Square Window (Wrist)', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
    { label: '5', value: 5, criteria: '' },
  ]},
  { id: 'arm_recoil', label: 'Arm Recoil', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  { id: 'popliteal', label: 'Popliteal Angle', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
    { label: '5', value: 5, criteria: '' },
  ]},
  { id: 'scarf', label: 'Scarf Sign', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
    { label: '5', value: 5, criteria: '' },
  ]},
  { id: 'heel_ear', label: 'Heel to Ear', category: 'neuromuscular', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  // Physical
  { id: 'skin', label: 'Skin', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
    { label: '5', value: 5, criteria: '' },
  ]},
  { id: 'lanugo', label: 'Lanugo', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  { id: 'plantar', label: 'Plantar Creases', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  { id: 'breast', label: 'Breast', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  { id: 'eye_ear', label: 'Eye/Ear', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
  { id: 'genitals', label: 'Genitals', category: 'physical', options: [
    { label: '-1', value: -1, criteria: '' }, { label: '0', value: 0, criteria: '' },
    { label: '1', value: 1, criteria: '' }, { label: '2', value: 2, criteria: '' },
    { label: '3', value: 3, criteria: '' }, { label: '4', value: 4, criteria: '' },
  ]},
];

// Ballard score to gestational age mapping (simplified)
const BALLARD_GA_MAP: [number, number][] = [
  [-10, 20], [-5, 22], [0, 24], [5, 26], [10, 28], [15, 30], [20, 32],
  [25, 33], [30, 34], [35, 35], [40, 36], [45, 37], [50, 38], [55, 39], [60, 40], [65, 42], [70, 44],
];

const NEONATAL_MEDS: NeonatalMeds[] = [
  { name: 'Ampicillin', dose: '50 mg/kg IV q8-12h', indication: 'Sepsis prophylaxis/treatment', maxDose: '2g', caution: 'Adjust for renal function' },
  { name: 'Gentamicin', dose: '5 mg/kg IV q24h', indication: 'Gram-negative coverage', caution: 'Monitor trough levels', contraindicated: false },
  { name: 'Surfactant', dose: '100-200 mg/kg', indication: 'RDS (respiratory distress syndrome)', caution: 'Administer via ETT' },
  { name: 'Caffeine Citrate', dose: '20 mg/kg loading, 5-10 mg/kg maintenance', indication: 'Apnea of prematurity', maxDose: 'Maintenance: 10 mg/kg/day' },
  { name: 'Phenobarbital', dose: '20 mg/kg loading', indication: 'Neonatal seizures', caution: 'Monitor levels' },
  { name: 'Diazepam', dose: 'CONTRAINDICATED', indication: 'Neonatal seizures', contraindicated: true, caution: 'Use phenobarbital or fosphenytoin instead. Risk of propylene glycol toxicity.' },
  { name: 'Ibuprofen Lysine', dose: '10 mg/kg, then 5 mg/kg at 24h and 48h', indication: 'PDA closure', caution: 'Monitor renal function, platelets' },
  { name: 'Indomethacin', dose: '0.1-0.2 mg/kg IV', indication: 'PDA closure', caution: 'Renal, GI, platelet toxicity' },
  { name: 'Vitamin K', dose: '1 mg IM (0.5 mg if <1kg)', indication: 'Hemorrhagic disease prevention', caution: 'Standard of care' },
  { name: 'Erythromycin Ophthalmic', dose: '0.5% ointment', indication: 'Gonococcal prophylaxis', caution: 'Apply within 2hr of birth' },
  { name: 'Naloxone', dose: '0.1 mg/kg IV/IM', indication: 'Opioid depression', caution: 'Short acting — may need repeat doses' },
  { name: 'Epinephrine', dose: '0.01-0.03 mg/kg IV', indication: 'Neonatal resuscitation', caution: 'Use 1:10,000 concentration for IV' },
];

const PRESETS = [
  {
    label: 'Healthy Newborn',
    icon: '✅',
    apgar: { '1': { appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 }, '5': { appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 } },
    weight: 3.5,
  },
  {
    label: 'Preterm 32 Weeks',
    icon: '👶',
    apgar: { '1': { appearance: 1, pulse: 1, grimace: 1, activity: 1, respiration: 1 }, '5': { appearance: 1, pulse: 2, grimace: 1, activity: 1, respiration: 2 } },
    weight: 1.5,
  },
  {
    label: 'Neonatal Distress',
    icon: '🚨',
    apgar: { '1': { appearance: 0, pulse: 1, grimace: 0, activity: 0, respiration: 1 }, '5': { appearance: 1, pulse: 1, grimace: 1, activity: 1, respiration: 1 } },
    weight: 3.2,
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getAPGARCategory(score: number): { label: string; color: string; bgColor: string } {
  if (score >= 7) return { label: 'Normal', color: 'text-emerald-500', bgColor: 'bg-emerald-500/15' };
  if (score >= 4) return { label: 'Some Assistance Needed', color: 'text-amber-500', bgColor: 'bg-amber-500/15' };
  return { label: 'Resuscitation Needed', color: 'text-rose-500', bgColor: 'bg-rose-500/15' };
}

function getGestationalAge(ballardScore: number): number {
  if (ballardScore <= BALLARD_GA_MAP[0][0]) return BALLARD_GA_MAP[0][1];
  for (let i = 1; i < BALLARD_GA_MAP.length; i++) {
    if (ballardScore <= BALLARD_GA_MAP[i][0]) {
      const prevScore = BALLARD_GA_MAP[i - 1][0];
      const prevGA = BALLARD_GA_MAP[i - 1][1];
      const currScore = BALLARD_GA_MAP[i][0];
      const currGA = BALLARD_GA_MAP[i][1];
      const ratio = (ballardScore - prevScore) / (currScore - prevScore);
      return Math.round(prevGA + ratio * (currGA - prevGA));
    }
  }
  return BALLARD_GA_MAP[BALLARD_GA_MAP.length - 1][1];
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NeonatalChecker() {
  const [activeTab, setActiveTab] = useState('apgar');
  const [apgar, setApgar] = useState<Record<string, Record<string, number>>>({
    '1': { appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 },
    '5': { appearance: 2, pulse: 2, grimace: 2, activity: 2, respiration: 2 },
  });
  const [ballard, setBallard] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState(3.5);
  const [selectedMed, setSelectedMed] = useState<string>('');
  const [tpnDextrose, setTpnDextrose] = useState(10);
  const [tpnAminoAcids, setTpnAminoAcids] = useState(2.5);
  const [tpnLipids, setTpnLipids] = useState(2);
  const [showMeds, setShowMeds] = useState(false);

  const getApgarTotal = (minute: string) =>
    Object.values(apgar[minute] || {}).reduce((a, b) => a + b, 0);

  const ballardScore = useMemo(() => Object.values(ballard).reduce((a, b) => a + b, 0), [ballard]);
  const gestAge = useMemo(() => getGestationalAge(ballardScore), [ballardScore]);

  const loadPreset = (preset: (typeof PRESETS)[number]) => {
    setApgar(preset.apgar);
    setWeight(preset.weight);
    toast.success(`Loaded: ${preset.label}`);
  };

  const setApgarValue = (minute: string, item: string, value: number) => {
    setApgar(prev => ({
      ...prev,
      [minute]: { ...(prev[minute] || {}), [item]: value },
    }));
  };

  const setBallardValue = (id: string, value: number) => {
    setBallard(prev => ({ ...prev, [id]: value }));
  };

  // TPN calculations
  const tpnFluidRate = weight * 4; // ~4 mL/kg/hr for day 1
  const dextroseInfusionRate = (tpnDextrose / 100) * (tpnFluidRate * 20 / weight); // mg/kg/min approx
  const aminoAcidInfusion = tpnAminoAcids; // g/kg/day
  const lipidInfusion = tpnLipids; // g/kg/day

  return (
    <section className="space-y-6">
      <SectionHeader icon={Baby} title="Neonatal Safety Checker" subtitle="APGAR, Ballard Score & Neonatal Drug Safety — First Hours Matter" />

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <Button key={p.label} variant="outline" size="sm" className="glass-card border-cyan-500/20 hover:border-cyan-500/40 text-xs" onClick={() => loadPreset(p)}>
            {p.icon} {p.label}
          </Button>
        ))}
      </div>

      {/* Weight Input */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <Label className="text-sm text-muted-foreground">Birth Weight (kg):</Label>
        <Input type="number" min={0.2} max={6} step={0.01} value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} className="w-28 text-sm" />
        <Badge variant="outline" className={cn(
          'text-xs',
          weight < 1.0 ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
          weight < 2.5 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
          'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        )}>
          {weight < 1.0 ? 'Extremely Low BW' : weight < 1.5 ? 'Very Low BW' : weight < 2.5 ? 'Low BW' : 'Normal BW'}
        </Badge>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card flex-wrap">
          <TabsTrigger value="apgar" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Heart className="w-4 h-4 mr-1" /> APGAR
          </TabsTrigger>
          <TabsTrigger value="ballard" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Scale className="w-4 h-4 mr-1" /> Ballard
          </TabsTrigger>
          <TabsTrigger value="meds" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Pill className="w-4 h-4 mr-1" /> Drug Safety
          </TabsTrigger>
          <TabsTrigger value="tpn" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FlaskConical className="w-4 h-4 mr-1" /> TPN Helper
          </TabsTrigger>
        </TabsList>

        {/* APGAR Tab */}
        <TabsContent value="apgar" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['1', '5'].map(minute => {
              const total = getApgarTotal(minute);
              const cat = getAPGARCategory(total);
              return (
                <motion.div key={minute} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: parseInt(minute) * 0.1 }} className="glass-card rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                      <Activity className="w-4 h-4" /> {minute}-Minute APGAR
                    </h3>
                    <div className="text-right">
                      <span className={cn('text-3xl font-bold', cat.color)}>
                        <AnimatedCounter target={total} />
                      </span>
                      <span className="text-sm text-muted-foreground"> / 10</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn('text-xs', cat.bgColor, cat.color, 'border-current/20')}>
                    {cat.label}
                  </Badge>
                  <div className="space-y-3">
                    {APGAR_ITEMS.map(item => (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className={cn(
                            'text-xs font-semibold',
                            (apgar[minute]?.[item.id] || 0) === 2 ? 'text-emerald-500' :
                            (apgar[minute]?.[item.id] || 0) === 1 ? 'text-amber-500' : 'text-rose-500'
                          )}>{apgar[minute]?.[item.id] || 0}/2</p>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {item.options.map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setApgarValue(minute, item.id, opt.value)}
                              className={cn(
                                'text-[10px] px-2 py-1.5 rounded-md border transition-all text-center',
                                (apgar[minute]?.[item.id] || 0) === opt.value
                                  ? opt.value === 2 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                    : opt.value === 1 ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                    : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                  : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                              )}
                            >
                              {opt.short}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* APGAR Interpretation Guide */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-6">
            <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2"><Info className="w-4 h-4" /> APGAR Interpretation Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="glass-card rounded-lg p-3 border-l-4 border-rose-500">
                <p className="font-bold text-rose-400 mb-1">0–3: Resuscitation Needed</p>
                <p className="text-muted-foreground">Immediate intervention. Positive pressure ventilation, chest compressions may be needed. Full resuscitation team.</p>
              </div>
              <div className="glass-card rounded-lg p-3 border-l-4 border-amber-500">
                <p className="font-bold text-amber-400 mb-1">4–6: Some Assistance</p>
                <p className="text-muted-foreground">May require stimulation, clearing airway, supplemental oxygen. Close monitoring.</p>
              </div>
              <div className="glass-card rounded-lg p-3 border-l-4 border-emerald-500">
                <p className="font-bold text-emerald-400 mb-1">7–10: Normal</p>
                <p className="text-muted-foreground">Routine care. Continue monitoring. Skin-to-skin contact encouraged.</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Ballard Tab */}
        <TabsContent value="ballard" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Scoring */}
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Scale className="w-4 h-4" /> Ballard Score Assessment</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {BALLARD_ITEMS.map(item => (
                    <div key={item.id} className="glass-card rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{item.label}</p>
                        <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {item.options.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => setBallardValue(item.id, opt.value)}
                            className={cn(
                              'text-[10px] px-2 py-1 rounded border transition-all',
                              ballard[item.id] === opt.value
                                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                                : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                            )}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">Ballard Score</p>
                  <span className="text-3xl font-bold text-primary">
                    <AnimatedCounter target={ballardScore} />
                  </span>
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground mb-1">Estimated Gestational Age</p>
                  <span className="text-2xl font-bold text-primary">
                    <AnimatedCounter target={gestAge} /> <span className="text-sm">weeks</span>
                  </span>
                  <Badge variant="outline" className={cn('mt-2 text-xs',
                    gestAge < 28 ? 'bg-rose-500/15 text-rose-400' :
                    gestAge < 34 ? 'bg-amber-500/15 text-amber-400' :
                    gestAge < 37 ? 'bg-amber-500/10 text-amber-300' :
                    'bg-emerald-500/15 text-emerald-400'
                  )}>
                    {gestAge < 28 ? 'Extremely Preterm' : gestAge < 34 ? 'Moderate-Late Preterm' : gestAge < 37 ? 'Late Preterm' : 'Term'}
                  </Badge>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Gestational Age Categories</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { range: '<28w', label: 'Extremely Preterm', color: 'text-rose-500' },
                      { range: '28-32w', label: 'Very Preterm', color: 'text-rose-400' },
                      { range: '32-34w', label: 'Moderate-Late Preterm', color: 'text-amber-500' },
                      { range: '34-37w', label: 'Late Preterm', color: 'text-amber-400' },
                      { range: '37-42w', label: 'Term', color: 'text-emerald-500' },
                    ].map(c => (
                      <div key={c.label} className="flex justify-between">
                        <span className={c.color}>{c.label}</span>
                        <span className="text-muted-foreground">{c.range}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Drug Safety Tab */}
        <TabsContent value="meds" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Pill className="w-4 h-4" /> Neonatal Drug Reference</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Weight (kg):</Label>
                  <Input type="number" min={0.2} max={6} step={0.01} value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)} className="w-20 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {NEONATAL_MEDS.map((med, i) => {
                  const isSelected = selectedMed === med.name;
                  const isDoseCalc = med.dose.includes('mg/kg');
                  let calculatedDose = '';
                  if (isDoseCalc && weight > 0) {
                    const match = med.dose.match(/([\d.]+)\s*mg\/kg/);
                    if (match) calculatedDose = ` = ${(parseFloat(match[1]) * weight).toFixed(1)} mg`;
                  }

                  return (
                    <motion.div
                      key={med.name}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedMed(isSelected ? '' : med.name)}
                      className={cn(
                        'glass-card rounded-lg p-4 cursor-pointer transition-all border',
                        isSelected ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/5' : 'border-transparent hover:border-muted-foreground/20',
                        med.contraindicated && 'border-rose-500/30'
                      )}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className={cn('text-sm font-semibold', med.contraindicated ? 'text-rose-500' : 'text-foreground')}>{med.name}</p>
                        {med.contraindicated && (
                          <Badge className="bg-rose-500/15 text-rose-400 text-[10px] border-rose-500/30" variant="outline">⚠ CONTRA</Badge>
                        )}
                      </div>
                      <p className="text-xs text-primary">{med.dose}{calculatedDose && <span className="text-emerald-400 ml-1">({calculatedDose})</span>}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{med.indication}</p>
                      {med.caution && (
                        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {med.caution}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* TPN Helper Tab */}
        <TabsContent value="tpn" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><FlaskConical className="w-4 h-4" /> TPN Calculator</h3>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Label>Dextrose Concentration (%)</Label>
                      <span className="text-primary">{tpnDextrose}%</span>
                    </div>
                    <Input type="range" min={5} max={25} step={2.5} value={tpnDextrose} onChange={(e) => setTpnDextrose(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Label>Amino Acids (g/kg/day)</Label>
                      <span className="text-emerald-500">{tpnAminoAcids} g/kg/day</span>
                    </div>
                    <Input type="range" min={1} max={4} step={0.5} value={tpnAminoAcids} onChange={(e) => setTpnAminoAcids(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <Label>Intralipids (g/kg/day)</Label>
                      <span className="text-amber-500">{tpnLipids} g/kg/day</span>
                    </div>
                    <Input type="range" min={0.5} max={4} step={0.5} value={tpnLipids} onChange={(e) => setTpnLipids(parseFloat(e.target.value))} className="w-full" />
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Droplets className="w-4 h-4" /> Calculated Infusion Rates</h3>
                <div className="space-y-3">
                  <div className="glass-card rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Fluid Rate (Day 1)</span>
                    <span className="text-sm font-semibold text-primary"><AnimatedCounter target={tpnFluidRate} decimals={1} /> mL/kg/day</span>
                  </div>
                  <div className="glass-card rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Hourly Rate</span>
                    <span className="text-sm font-semibold text-primary"><AnimatedCounter target={tpnFluidRate / 24} decimals={1} /> mL/kg/hr</span>
                  </div>
                  <div className="glass-card rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Dextrose Infusion Rate</span>
                    <span className="text-sm font-semibold text-primary"><AnimatedCounter target={dextroseInfusionRate} decimals={1} /> mg/kg/min</span>
                  </div>
                  <Separator />
                  <div className="glass-card rounded-lg p-3 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Calories</span>
                    <span className="text-sm font-semibold text-emerald-500">
                      <AnimatedCounter target={tpnDextrose * 3.4 * weight / 100 + tpnAminoAcids * 4 + tpnLipids * 9} decimals={0} /> kcal/day
                    </span>
                  </div>
                </div>

                {/* Safety Alerts */}
                {dextroseInfusionRate > 12 && (
                  <Alert className="border-rose-500/30 bg-rose-500/5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <AlertTitle className="text-rose-400 text-xs">High Dextrose Rate</AlertTitle>
                    <AlertDescription className="text-rose-300/80 text-xs">Infusion rate {'>'}12 mg/kg/min risks hyperglycemia. Monitor glucose q4-6h.</AlertDescription>
                  </Alert>
                )}
                {tpnLipids > 3 && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <AlertTitle className="text-amber-400 text-xs">Lipid Caution</AlertTitle>
                    <AlertDescription className="text-amber-300/80 text-xs">High lipid rates may cause hypertriglyceridemia. Monitor triglycerides.</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  );
}