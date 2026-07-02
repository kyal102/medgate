'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  Heart,
  Shield,
  ClipboardList,
  Thermometer,
  Flame,
  FileWarning,
  Package,
  Truck,
  Clock,
  UserCheck,
  ShieldCheck,
  Beaker,
  TestTube,
  Syringe,
  Gavel,
  Stethoscope,
  Plus,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type ProductType = 'PRBC' | 'FFP' | 'Platelets' | 'Cryoprecipitate' | 'Factor Concentrates';
type Urgency = 'Routine' | 'Urgent' | 'STAT' | 'MTP Activation';
type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
type SpecialReq = 'Irradiated' | 'CMV-negative' | 'Leukoreduced' | 'Washed' | 'HLA-matched';

interface TransfusionReaction {
  id: string;
  name: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening';
  onset: string;
  symptoms: string[];
  management: string[];
  color: string;
}

const PRODUCT_TYPES: { type: ProductType; defaultUnits: number }[] = [
  { type: 'PRBC', defaultUnits: 2 },
  { type: 'FFP', defaultUnits: 2 },
  { type: 'Platelets', defaultUnits: 1 },
  { type: 'Cryoprecipitate', defaultUnits: 10 },
  { type: 'Factor Concentrates', defaultUnits: 1 },
];

const INDICATIONS = ['Anemia', 'Active Bleeding', 'Surgery', 'Trauma', 'Coagulopathy', 'DIC', 'TTP/HUS', 'Other'];

const SPECIAL_REQUIREMENTS: SpecialReq[] = ['Irradiated', 'CMV-negative', 'Leukoreduced', 'Washed', 'HLA-matched'];

const PRE_TRANSFUSION_CHECKLIST = [
  { id: 'consent', label: 'Informed consent documented', icon: FileWarning },
  { id: 'patient_id', label: 'Patient ID verified (2 identifiers)', icon: UserCheck },
  { id: 'blood_group', label: 'Blood group confirmed', icon: Droplets },
  { id: 'crossmatch', label: 'Crossmatch result available and compatible', icon: ShieldCheck },
  { id: 'antibody', label: 'Antibody screen result reviewed', icon: TestTube },
  { id: 'indication', label: 'Transfusion indication documented', icon: ClipboardList },
  { id: 'special_req', label: 'Special requirements ordered', icon: Package },
  { id: 'premed', label: 'Pre-medication given (if indicated)', icon: Syringe },
];

const TRANSFUSION_REACTIONS: TransfusionReaction[] = [
  {
    id: 'acute_hemolytic', name: 'Acute Hemolytic Reaction', severity: 'Life-threatening', onset: 'Immediate (minutes)',
    symptoms: ['Fever, chills, rigors', 'Back/flank pain', 'Hemoglobinuria (dark urine)', 'Hypotension', 'Disseminated intravascular coagulation', 'Bleeding from IV sites'],
    management: ['STOP transfusion IMMEDIATELY', 'Maintain IV access with normal saline', 'Check vital signs q5 min', 'Send unit + patient blood sample to blood bank', 'Foley catheter — monitor urine output', 'Aggressive IV fluid resuscitation', 'Vasopressors if needed', 'DIC workup', 'Supportive care in ICU'],
    color: 'text-rose-500',
  },
  {
    id: 'febrile', name: 'Febrile Non-Hemolytic Reaction', severity: 'Mild', onset: 'During or within hours',
    symptoms: ['Temperature rise ≥1°C from baseline', 'Chills, rigors', 'Headache', 'Nausea'],
    management: ['Slow or stop transfusion', 'Antipyretic (acetaminophen)', 'Meperidine for severe rigors', 'Antihistamine if allergic component', 'Send workup to rule out hemolysis', 'Consider leukoreduced products for future'],
    color: 'text-amber-500',
  },
  {
    id: 'allergic', name: 'Allergic Reaction', severity: 'Mild-Moderate', onset: 'During transfusion',
    symptoms: ['Urticaria (hives)', 'Pruritus (itching)', 'Rash', 'Anaphylaxis (rare): bronchospasm, stridor, hypotension'],
    management: ['Mild: slow transfusion, antihistamine', 'Moderate: stop transfusion, epinephrine if anaphylaxis', 'Severe: treat as anaphylaxis — epinephrine IM, fluid resuscitation', 'For recurrent: consider washed RBCs', 'IgA-deficient patients may need IgA-deficient products'],
    color: 'text-amber-400',
  },
  {
    id: 'trali', name: 'TRALI', severity: 'Life-threatening', onset: 'Within 6 hours (usually 1-2hr)',
    symptoms: ['Acute respiratory distress', 'Bilateral pulmonary infiltrates on CXR', 'Fever', 'Hypotension or hypertension', 'No evidence of circulatory overload', 'Hypoxemia'],
    management: ['STOP transfusion immediately', 'Supportive respiratory care', 'Supplemental O₂ → intubation/ventilation if needed', 'IV fluids cautiously (avoid volume overload)', 'Corticosteroids (controversial)', 'Report to blood bank', 'Most patients improve within 48-96 hours', 'Mortality 5-10%'],
    color: 'text-rose-500',
  },
  {
    id: 'taco', name: 'TACO', severity: 'Severe', onset: 'During or within 6 hours',
    symptoms: ['Acute respiratory distress', 'Bilateral pulmonary edema', 'Hypertension', 'Elevated BNP/NT-proBNP', 'Response to diuretics', 'Fever (may be present)'],
    management: ['STOP or slow transfusion', 'Sit patient upright', 'Oxygen therapy', 'Diuretics (furosemide)', 'Reduce infusion rate', 'Monitor fluid balance strictly', 'Distinguish from TRALI (blood pressure response, BNP)'],
    color: 'text-rose-400',
  },
  {
    id: 'septic', name: 'Septic (Bacterial Contamination)', severity: 'Life-threatening', onset: 'Rapid (minutes to hours)',
    symptoms: ['High fever, rigors', 'Shock — hypotension, tachycardia', 'Nausea, vomiting, diarrhea', 'DIC', 'Gram-negative organisms most common'],
    management: ['STOP transfusion IMMEDIATELY', 'Broad-spectrum antibiotics STAT', 'IV fluid resuscitation', 'Vasopressors', 'Send unit for culture', 'Supportive care in ICU', 'Report to blood bank', 'High mortality — early recognition critical'],
    color: 'text-rose-500',
  },
];

const MTP_MONITORING_PARAMS = [
  { label: 'Ionized Calcium', normal: '1.0-1.25 mmol/L', icon: Beaker },
  { label: 'Potassium', normal: '3.5-5.0 mEq/L', icon: Zap },
  { label: 'Temperature', normal: '>36°C', icon: Thermometer },
  { label: 'Base Deficit', normal: '-2 to +2', icon: Activity },
  { label: 'pH', normal: '7.35-7.45', icon: TestTube },
  { label: 'Lactate', normal: '<2.0 mmol/L', icon: Flame },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BloodProductOrdering() {
  const [activeTab, setActiveTab] = useState('order');
  const [productType, setProductType] = useState<ProductType>('PRBC');
  const [units, setUnits] = useState(2);
  const [indication, setIndication] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('Routine');
  const [specialReqs, setSpecialReqs] = useState<SpecialReq[]>([]);
  const [patientBloodType, setPatientBloodType] = useState<BloodType>('O-');
  const [antibodyScreen, setAntibodyScreen] = useState<'Negative' | 'Positive - Identified' | 'Positive - Unidentified' | 'Pending'>('Pending');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [mtpPRBCUnits, setMtpPRBCUnits] = useState(0);
  const [ordered, setOrdered] = useState(false);

  const toggleSpecialReq = (req: SpecialReq) => {
    setSpecialReqs(prev => prev.includes(req) ? prev.filter(r => r !== req) : [...prev, req]);
  };

  const toggleChecklist = (id: string) => {
    setChecklist(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const allChecked = checkedCount === PRE_TRANSFUSION_CHECKLIST.length;

  // MTP calculations
  const mtpFFP = mtpPRBCUnits; // 1:1:1
  const mtpPlatelets = mtpPRBCUnits;
  const mtpCaClAmps = Math.ceil(mtpPRBCUnits / 4); // 1 amp per 4 units

  const placeOrder = () => {
    if (urgency === 'MTP Activation' && mtpPRBCUnits < 4) {
      toast.error('MTP requires minimum 4 units PRBC');
      return;
    }
    setOrdered(true);
    toast.success(`${productType} order placed — ${urgency}`);
  };

  const severityColor = (severity: string) => {
    if (severity === 'Life-threatening') return 'text-rose-500';
    if (severity === 'Severe') return 'text-rose-400';
    if (severity === 'Moderate') return 'text-amber-500';
    return 'text-amber-400';
  };

  return (
    <section className="space-y-6">
      <SectionHeader icon={Droplets} title="Blood Product Ordering" subtitle="Pre-Transfusion Verification & Massive Transfusion Protocol — Every Unit Verified" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card flex-wrap">
          <TabsTrigger value="order" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ClipboardList className="w-4 h-4 mr-1" /> Order Form
          </TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ShieldCheck className="w-4 h-4 mr-1" /> Pre-Transfusion
          </TabsTrigger>
          <TabsTrigger value="mtp" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Truck className="w-4 h-4 mr-1" /> MTP Protocol
          </TabsTrigger>
          <TabsTrigger value="reactions" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <AlertOctagon className="w-4 h-4 mr-1" /> Reactions
          </TabsTrigger>
        </TabsList>

        {/* Order Form Tab */}
        <TabsContent value="order" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Package className="w-4 h-4" /> Product Order</h3>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Product Type</Label>
                <Select value={productType} onValueChange={(v) => { setProductType(v as ProductType); setUnits(PRODUCT_TYPES.find(p => p.type === v)?.defaultUnits || 1); }}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(p => <SelectItem key={p.type} value={p.type}>{p.type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Units / Volume</Label>
                <Input type="number" min={1} max={50} value={units} onChange={(e) => setUnits(parseInt(e.target.value) || 1)} className="text-sm" />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Indication</Label>
                <Select value={indication} onValueChange={setIndication}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select indication..." /></SelectTrigger>
                  <SelectContent>
                    {INDICATIONS.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Urgency</Label>
                <Select value={urgency} onValueChange={(v) => setUrgency(v as Urgency)}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Routine', 'Urgent', 'STAT', 'MTP Activation'] as Urgency[]).map(u => (
                      <SelectItem key={u} value={u}>
                        <span className={cn(
                          u === 'STAT' || u === 'MTP Activation' ? 'text-rose-400' : u === 'Urgent' ? 'text-amber-400' : ''
                        )}>{u}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Special Requirements</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIAL_REQUIREMENTS.map(req => (
                    <button
                      key={req}
                      onClick={() => toggleSpecialReq(req)}
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-full border transition-all',
                        specialReqs.includes(req)
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                          : 'border-muted-foreground/20 text-muted-foreground hover:border-muted-foreground/40'
                      )}
                    >
                      {req}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {/* Patient Blood Type */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Droplets className="w-4 h-4" /> Patient Blood Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodType[]).map(bt => (
                    <button
                      key={bt}
                      onClick={() => setPatientBloodType(bt)}
                      className={cn(
                        'text-sm p-2 rounded-lg border text-center font-bold transition-all',
                        patientBloodType === bt
                          ? 'border-primary bg-cyan-500/10 text-primary'
                          : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                      )}
                    >
                      {bt}
                    </button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Antibody Screen</Label>
                  <Select value={antibodyScreen} onValueChange={(v) => setAntibodyScreen(v as typeof antibodyScreen)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['Negative', 'Positive - Identified', 'Positive - Unidentified', 'Pending'] as const).map(s => (
                        <SelectItem key={s} value={s}>
                          <span className={cn(s.startsWith('Positive') ? 'text-amber-400' : s === 'Pending' ? 'text-muted-foreground' : 'text-emerald-400')}>{s}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {antibodyScreen.startsWith('Positive') && (
                  <Alert className="border-amber-500/30 bg-amber-500/5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <AlertTitle className="text-amber-400 text-xs">Antibody Positive</AlertTitle>
                    <AlertDescription className="text-amber-300/80 text-xs">
                      {antibodyScreen === 'Positive - Unidentified'
                        ? 'Unidentified antibodies — antigen-negative units required. Extended crossmatch needed. Expect longer processing time.'
                        : 'Identified antibodies — specify phenotype requirements when ordering.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Order Summary */}
              <div className="glass-card rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Gavel className="w-4 h-4" /> Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="font-semibold">{productType}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Units</span><span className="font-semibold">{units}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Indication</span><span className="font-semibold">{indication || '—'}</span></div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Urgency</span>
                    <span className={cn('font-semibold', urgency === 'STAT' || urgency === 'MTP Activation' ? 'text-rose-400' : urgency === 'Urgent' ? 'text-amber-400' : '')}>{urgency}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Blood Type</span><span className="font-semibold text-primary">{patientBloodType}</span></div>
                  {specialReqs.length > 0 && (
                    <div className="flex justify-between flex-wrap gap-1">
                      <span className="text-muted-foreground">Special</span>
                      <div className="flex gap-1 flex-wrap justify-end">{specialReqs.map(r => <Badge key={r} variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-300 border-cyan-500/20">{r}</Badge>)}</div>
                    </div>
                  )}
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={placeOrder}>
                  <Plus className="w-4 h-4 mr-2" /> Place Order
                </Button>
              </div>
            </motion.div>
          </div>

          {ordered && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">Order Placed Successfully</p>
                <p className="text-xs text-emerald-300/70">{productType} × {units} units — {urgency} — Blood bank notified</p>
              </div>
            </motion.div>
          )}
        </TabsContent>

        {/* Pre-Transfusion Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Pre-Transfusion Verification Checklist
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{checkedCount}/{PRE_TRANSFUSION_CHECKLIST.length}</span>
                    <Progress value={(checkedCount / PRE_TRANSFUSION_CHECKLIST.length) * 100} className="w-20 h-2" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Complete ALL items before initiating transfusion. Two-registered-nurse verification required at bedside.</p>
                <div className="space-y-3">
                  {PRE_TRANSFUSION_CHECKLIST.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div
                        onClick={() => toggleChecklist(item.id)}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                          checklist[item.id]
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-muted-foreground/10 hover:border-muted-foreground/30'
                        )}
                      >
                        <div className={cn(
                          'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                          checklist[item.id] ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30'
                        )}>
                          {checklist[item.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                        <item.icon className={cn('w-4 h-4 shrink-0', checklist[item.id] ? 'text-emerald-400' : 'text-muted-foreground')} />
                        <span className={cn('text-sm', checklist[item.id] ? 'text-foreground' : 'text-muted-foreground')}>{item.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{i + 1}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">Verification Status</p>
                  {allChecked ? (
                    <>
                      <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2" />
                      <span className="text-lg font-bold text-emerald-500">COMPLETE</span>
                      <p className="text-xs text-muted-foreground mt-1">All checks passed — safe to transfuse</p>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
                      <span className="text-lg font-bold text-amber-500"><AnimatedCounter target={checkedCount} /> / {PRE_TRANSFUSION_CHECKLIST.length}</span>
                      <p className="text-xs text-muted-foreground mt-1">Complete all items before transfusing</p>
                    </>
                  )}
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-rose-400 mb-3 flex items-center gap-2">
                    <AlertOctagon className="w-3.5 h-3.5" /> Critical Reminders
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {[
                      'TWO identifiers required at bedside (name + DOB/MRN)',
                      'Patient blood sample label must be completed AT bedside',
                      'Visual inspection of unit before transfusion',
                      'Document vital signs: pre, 15min, 30min, end',
                      'First 15 minutes: stay with patient — highest risk period',
                      'Never hang blood with other medications',
                      'Normal saline ONLY — no dextrose or LR through same line',
                    ].map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* MTP Tab */}
        <TabsContent value="mtp" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Activation Criteria */}
            <div className="glass-card rounded-xl p-6 mb-4">
              <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" /> MTP Activation Criteria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { criteria: '>4 units PRBC in 1 hour', icon: Clock, color: 'text-rose-400' },
                  { criteria: '>10 units PRBC in 24 hours', icon: RefreshCw, color: 'text-rose-400' },
                  { criteria: 'Anticipated massive hemorrhage', icon: Flame, color: 'text-amber-400' },
                ].map((c, i) => (
                  <div key={i} className="glass-card rounded-lg p-3 flex items-center gap-2 text-sm border border-rose-500/20">
                    <c.icon className={cn('w-4 h-4 shrink-0', c.color)} />
                    {c.criteria}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MTP Calculator */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Truck className="w-4 h-4" /> MTP Blood Product Calculator</h3>
                <p className="text-xs text-muted-foreground">Enter units of PRBC to calculate required FFP and Platelets (1:1:1 ratio)</p>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">PRBC Units Transfused/Planned</Label>
                  <Input type="number" min={0} max={100} value={mtpPRBCUnits} onChange={(e) => setMtpPRBCUnits(parseInt(e.target.value) || 0)} className="text-lg font-bold text-center" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                  <div className="glass-card rounded-lg p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">PRBC</p>
                    <p className="text-2xl font-bold text-primary"><AnimatedCounter target={mtpPRBCUnits} /></p>
                    <p className="text-[10px] text-muted-foreground">units</p>
                  </div>
                  <div className="glass-card rounded-lg p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">FFP</p>
                    <p className="text-2xl font-bold text-amber-500"><AnimatedCounter target={mtpFFP} /></p>
                    <p className="text-[10px] text-muted-foreground">units (1:1)</p>
                  </div>
                  <div className="glass-card rounded-lg p-4 text-center">
                    <p className="text-[10px] text-muted-foreground">Platelets</p>
                    <p className="text-2xl font-bold text-emerald-500"><AnimatedCounter target={mtpPlatelets} /></p>
                    <p className="text-[10px] text-muted-foreground">pools (1:1)</p>
                  </div>
                </div>

                {/* Additional MTP Guidance */}
                <div className="space-y-3">
                  <div className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Beaker className="w-3.5 h-3.5" /> CaCl₂ (1 amp / 4 units PRBC)</span>
                    <span className="text-sm font-bold text-amber-500">{mtpCaClAmps} amps</span>
                  </div>
                  <div className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Thermometer className="w-3.5 h-3.5" /> Blood Warmer</span>
                    <Badge variant="outline" className={cn('text-[10px]', mtpPRBCUnits >= 4 ? 'bg-rose-500/15 text-rose-400' : 'bg-muted/10 text-muted-foreground')}>
                      {mtpPRBCUnits >= 4 ? 'REQUIRED' : 'Optional'}
                    </Badge>
                  </div>
                  <div className="glass-card rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Droplets className="w-3.5 h-3.5" /> TXA</span>
                    <span className="text-xs text-foreground">1g IV over 10min, then 1g over 8hr</span>
                  </div>
                </div>
              </div>

              {/* Monitoring Parameters */}
              <div className="glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2"><Activity className="w-4 h-4" /> MTP Monitoring Parameters</h3>
                <p className="text-xs text-muted-foreground">Monitor every 30 minutes during active MTP</p>
                <div className="space-y-3">
                  {MTP_MONITORING_PARAMS.map((param, i) => (
                    <motion.div key={param.label} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className="glass-card rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <param.icon className="w-4 h-4 text-primary" />
                        <span className="text-sm">{param.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{param.normal}</span>
                    </motion.div>
                  ))}
                </div>

                {/* MTP Ratio Visual */}
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">1:1:1 Ratio Visual</h4>
                  <div className="flex gap-2 items-end h-24">
                    <div className="flex-1 bg-primary/30 rounded-t-lg relative" style={{ height: `${Math.max(4, mtpPRBCUnits * 5)}%` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{mtpPRBCUnits}</span>
                      </div>
                    </div>
                    <div className="flex-1 bg-amber-500/30 rounded-t-lg relative" style={{ height: `${Math.max(4, mtpFFP * 5)}%` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-amber-500">{mtpFFP}</span>
                      </div>
                    </div>
                    <div className="flex-1 bg-emerald-500/30 rounded-t-lg relative" style={{ height: `${Math.max(4, mtpPlatelets * 5)}%` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-500">{mtpPlatelets}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex-1 text-center">PRBC</span>
                    <span className="flex-1 text-center">FFP</span>
                    <span className="flex-1 text-center">Plt</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Transfusion Reactions Tab */}
        <TabsContent value="reactions" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-xl p-6 mb-4">
              <Alert className="border-rose-500/30 bg-rose-500/5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <AlertTitle className="text-rose-400">If Any Transfusion Reaction Suspected</AlertTitle>
                <AlertDescription className="text-rose-300/80 text-sm">
                  1. STOP the transfusion immediately  2. Maintain IV access with normal saline  3. Assess vital signs  4. Notify blood bank and physician  5. Send unit + post-reaction blood sample
                </AlertDescription>
              </Alert>
            </div>

            <div className="space-y-4">
              {TRANSFUSION_REACTIONS.map((reaction, ri) => (
                <motion.div
                  key={reaction.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ri * 0.05 }}
                  className="glass-card rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <AlertOctagon className={cn('w-4 h-4', reaction.color)} />
                        {reaction.name}
                      </h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className={cn('text-[10px]', severityColor(reaction.severity) === 'text-rose-500' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')}>
                          {reaction.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] bg-muted/10 text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" /> {reaction.onset}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1"><Info className="w-3 h-3" /> Symptoms</p>
                      <ul className="space-y-1">
                        {reaction.symptoms.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" /> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Management</p>
                      <ul className="space-y-1">
                        {reaction.management.map((m, i) => (
                          <li key={i} className={cn('text-xs flex items-start gap-1.5',
                            i === 0 ? 'text-rose-400 font-semibold' : 'text-muted-foreground'
                          )}>
                            <span className={cn('w-1 h-1 rounded-full mt-1.5 shrink-0', i === 0 ? 'bg-rose-500' : 'bg-emerald-500')} /> {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  );
}