'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, FileWarning, ChevronDown, ChevronUp, Plus, X, Send,
  ShieldAlert, ShieldCheck, Search, HelpCircle, Target, Clock, ArrowRight, User, Cog, Wrench, Trees, Package, Building2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// --- Types ---
interface IncidentReport {
  date: string;
  department: string;
  category: string;
  severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
  description: string;
  immediateActions: string[];
  rootCauseCategories: string[];
  contributingFactors: string[];
  correctiveActions: string[];
  followUpRequired: boolean;
  reporter: string;
}

interface IncidentHistory {
  id: number;
  date: string;
  department: string;
  category: string;
  severity: string;
  status: 'open' | 'closed' | 'follow-up';
  description: string;
}

const SEVERITY_CONFIG = {
  minor: { label: 'Minor', color: 'text-emerald-400', bg: 'bg-emerald-500/20', badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400', bar: 'bg-emerald-500' },
  moderate: { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20', badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400', bar: 'bg-amber-500' },
  major: { label: 'Major', color: 'text-rose-400', bg: 'bg-rose-500/20', badge: 'border-rose-500/40 bg-rose-500/10 text-rose-400', bar: 'bg-rose-500' },
  catastrophic: { label: 'Catastrophic', color: 'text-rose-300', bg: 'bg-rose-600/30', badge: 'border-rose-500/60 bg-rose-500/20 text-rose-300', bar: 'bg-rose-600' },
};

const CATEGORIES = [
  { key: 'medication', label: 'Medication Error', icon: '💊' },
  { key: 'fall', label: 'Patient Fall', icon: '🚶' },
  { key: 'infection', label: 'Healthcare-Acquired Infection', icon: '🦠' },
  { key: 'surgical', label: 'Surgical Complication', icon: '🔪' },
  { key: 'diagnostic', label: 'Diagnostic Delay/Error', icon: '🔬' },
  { key: 'equipment', label: 'Equipment Failure', icon: '⚙️' },
  { key: 'communication', label: 'Communication Failure', icon: '💬' },
  { key: 'procedural', label: 'Procedural Error', icon: '📋' },
  { key: 'transfusion', label: 'Transfusion Event', icon: '🩸' },
  { key: 'pressure', label: 'Pressure Injury', icon: '🛏️' },
  { key: 'behavioral', label: 'Behavioral/Safety Event', icon: '⚠️' },
  { key: 'other', label: 'Other', icon: '📌' },
];

const ROOT_CAUSE_CATS = [
  'Human Factors', 'System Design', 'Training', 'Communication',
  'Equipment', 'Environment', 'Organizational', 'Policy',
];

const DEPARTMENTS = ['Emergency', 'ICU', 'Surgery', 'Medicine', 'Oncology', 'Pediatrics', 'OB/GYN', 'Radiology', 'Lab', 'Pharmacy', 'Other'];

// Fishbone bones
interface FishboneBone {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  factors: string[];
}

const INITIAL_BONES: FishboneBone[] = [
  { key: 'people', label: 'People', icon: User, color: 'text-cyan-400', factors: [] },
  { key: 'process', label: 'Process', icon: Cog, color: 'text-emerald-400', factors: [] },
  { key: 'equipment', label: 'Equipment', icon: Wrench, color: 'text-amber-400', factors: [] },
  { key: 'environment', label: 'Environment', icon: Trees, color: 'text-green-400', factors: [] },
  { key: 'materials', label: 'Materials', icon: Package, color: 'text-purple-400', factors: [] },
  { key: 'management', label: 'Management', icon: Building2, color: 'text-rose-400', factors: [] },
];

const MOCK_HISTORY: IncidentHistory[] = [
  { id: 1, date: '2024-01-15', department: 'Medicine', category: 'Medication Error', severity: 'moderate', status: 'closed', description: 'Wrong dose of insulin administered' },
  { id: 2, date: '2024-01-22', department: 'Surgery', category: 'Surgical Complication', severity: 'major', status: 'follow-up', description: 'Retained surgical instrument' },
  { id: 3, date: '2024-02-03', department: 'Emergency', category: 'Communication Failure', severity: 'minor', status: 'closed', description: 'Handover information missing' },
  { id: 4, date: '2024-02-14', department: 'ICU', category: 'Equipment Failure', severity: 'major', status: 'open', description: 'Ventilator alarm failure' },
  { id: 5, date: '2024-02-28', department: 'Medicine', category: 'Patient Fall', severity: 'moderate', status: 'closed', description: 'Patient fell during transfer' },
  { id: 6, date: '2024-03-05', department: 'Oncology', category: 'Medication Error', severity: 'catastrophic', status: 'open', description: 'Chemotherapy overdosage' },
  { id: 7, date: '2024-03-12', department: 'Surgery', category: 'Procedural Error', severity: 'moderate', status: 'follow-up', description: 'Wrong site marking' },
  { id: 8, date: '2024-03-20', department: 'Pediatrics', category: 'Diagnostic Delay', severity: 'major', status: 'closed', description: 'Delayed sepsis recognition' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export function IncidentRootCauseAnalyzer() {
  const [report, setReport] = useState<IncidentReport>({
    date: new Date().toISOString().slice(0, 10), department: '', category: '',
    severity: 'moderate', description: '', immediateActions: [], rootCauseCategories: [],
    contributingFactors: [], correctiveActions: [], followUpRequired: false, reporter: '',
  });
  const [actionInput, setActionInput] = useState('');
  const [factorInput, setFactorInput] = useState('');
  const [correctiveInput, setCorrectiveInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [historyFilter, setHistoryFilter] = useState({ department: 'all', severity: 'all', status: 'all' });
  const [expandedIncident, setExpandedIncident] = useState<number | null>(null);

  // Fishbone state
  const [bones, setBones] = useState<FishboneBone[]>(INITIAL_BONES);
  const [boneInputs, setBoneInputs] = useState<Record<string, string>>({});
  const [selectedBone, setSelectedBone] = useState<string | null>(null);

  // 5-Why state
  const [whys, setWhys] = useState<string[]>(['', '', '', '', '']);

  const updateReport = (key: keyof IncidentReport, value: unknown) => {
    setReport((prev) => ({ ...prev, [key]: value }));
  };

  const addChip = (field: 'immediateActions' | 'contributingFactors' | 'correctiveActions', value: string, setter: (v: string) => void) => {
    if (!value.trim()) return;
    updateReport(field, [...report[field], value.trim()]);
    setter('');
  };

  const removeChip = (field: 'immediateActions' | 'contributingFactors' | 'correctiveActions', index: number) => {
    updateReport(field, report[field].filter((_, i) => i !== index));
  };

  const addBoneFactor = (boneKey: string) => {
    const val = boneInputs[boneKey]?.trim();
    if (!val) return;
    setBones((prev) => prev.map((b) => b.key === boneKey ? { ...b, factors: [...b.factors, val] } : b));
    setBoneInputs((prev) => ({ ...prev, [boneKey]: '' }));
  };

  const removeBoneFactor = (boneKey: string, idx: number) => {
    setBones((prev) => prev.map((b) => b.key === boneKey ? { ...b, factors: b.factors.filter((_, i) => i !== idx) } : b));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await fetch('/api/medgate/incident-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, bones: bones.map((b) => ({ key: b.key, factors: b.factors })), whys }),
      });
      setSubmitResult('Incident report submitted successfully');
    } catch {
      setSubmitResult('Report recorded locally');
    }
    setIsSubmitting(false);
  };

  const filteredHistory = useMemo(() => {
    return MOCK_HISTORY.filter((h) => {
      if (historyFilter.department !== 'all' && h.department !== historyFilter.department) return false;
      if (historyFilter.severity !== 'all' && h.severity !== historyFilter.severity) return false;
      if (historyFilter.status !== 'all' && h.status !== historyFilter.status) return false;
      return true;
    });
  }, [historyFilter]);

  const severityDistribution = useMemo(() => {
    const dist: Record<string, number> = { minor: 0, moderate: 0, major: 0, catastrophic: 0 };
    MOCK_HISTORY.forEach((h) => { dist[h.severity] = (dist[h.severity] || 0) + 1; });
    return dist;
  }, []);

  const gateDecision = useMemo(() => {
    if (report.severity === 'catastrophic') return { label: 'BLOCK', color: 'text-rose-400', icon: ShieldAlert };
    if (report.severity === 'major') return { label: 'ESCALATE', color: 'text-amber-400', icon: AlertTriangle };
    return { label: 'TRACK', color: 'text-emerald-400', icon: ShieldCheck };
  }, [report.severity]);
  const GateIcon = gateDecision.icon;

  const totalBoneFactors = bones.reduce((sum, b) => sum + b.factors.length, 0);

  return (
    <div className="space-y-6">
      {/* Report Form (Collapsible) */}
      <Collapsible open={formOpen} onOpenChange={setFormOpen}>
        <Card className="glass-card rounded-xl overflow-hidden">
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-slate-800/20 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-amber-400" />
                  Incident Report Form
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs',
                    gateDecision.label === 'BLOCK' ? 'border-rose-500/30 bg-rose-500/10' :
                    gateDecision.label === 'ESCALATE' ? 'border-amber-500/30 bg-amber-500/10' :
                    'border-emerald-500/30 bg-emerald-500/10'
                  )}>
                    <GateIcon className={cn('w-3.5 h-3.5', gateDecision.color)} />
                    <span className={gateDecision.color}>{gateDecision.label}</span>
                  </div>
                  {formOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              {/* Top row: date, dept, category, severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Incident Date</Label>
                  <Input type="date" value={report.date} onChange={(e) => updateReport('date', e.target.value)} className="glass-input text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Department</Label>
                  <Select value={report.department} onValueChange={(v) => updateReport('department', v)}>
                    <SelectTrigger className="glass-input text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Category</Label>
                  <Select value={report.category} onValueChange={(v) => updateReport('category', v)}>
                    <SelectTrigger className="glass-input text-sm"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (<SelectItem key={c.key} value={c.key}>{c.icon} {c.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Severity</Label>
                  <Select value={report.severity} onValueChange={(v) => updateReport('severity', v)}>
                    <SelectTrigger className="glass-input text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Description</Label>
                <Textarea value={report.description} onChange={(e) => updateReport('description', e.target.value)} placeholder="Describe the incident in detail..." rows={3} className="glass-input text-sm resize-none" />
              </div>

              {/* Immediate Actions (chips) */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Immediate Actions Taken</Label>
                <div className="flex gap-2">
                  <Input value={actionInput} onChange={(e) => setActionInput(e.target.value)} placeholder="Add action..." className="glass-input text-sm flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('immediateActions', actionInput, setActionInput))} />
                  <Button size="sm" variant="outline" className="border-slate-600" onClick={() => addChip('immediateActions', actionInput, setActionInput)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.immediateActions.map((a, i) => (
                    <Badge key={i} variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs py-1">
                      {a} <button onClick={() => removeChip('immediateActions', i)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Root Cause Categories */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Root Cause Categories</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ROOT_CAUSE_CATS.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-slate-700/50 bg-slate-800/30 cursor-pointer hover:border-slate-600 transition-colors">
                      <Checkbox
                        checked={report.rootCauseCategories.includes(cat)}
                        onCheckedChange={(checked) => {
                          if (checked) updateReport('rootCauseCategories', [...report.rootCauseCategories, cat]);
                          else updateReport('rootCauseCategories', report.rootCauseCategories.filter((c) => c !== cat));
                        }}
                      />
                      <span className="text-xs text-slate-300">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contributing Factors */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Contributing Factors</Label>
                <div className="flex gap-2">
                  <Input value={factorInput} onChange={(e) => setFactorInput(e.target.value)} placeholder="Add factor..." className="glass-input text-sm flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('contributingFactors', factorInput, setFactorInput))} />
                  <Button size="sm" variant="outline" className="border-slate-600" onClick={() => addChip('contributingFactors', factorInput, setFactorInput)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.contributingFactors.map((f, i) => (
                    <Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs py-1">
                      {f} <button onClick={() => removeChip('contributingFactors', i)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Corrective Actions */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Corrective Actions</Label>
                <div className="flex gap-2">
                  <Input value={correctiveInput} onChange={(e) => setCorrectiveInput(e.target.value)} placeholder="Add corrective action..." className="glass-input text-sm flex-1" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChip('correctiveActions', correctiveInput, setCorrectiveInput))} />
                  <Button size="sm" variant="outline" className="border-slate-600" onClick={() => addChip('correctiveActions', correctiveInput, setCorrectiveInput)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {report.correctiveActions.map((a, i) => (
                    <Badge key={i} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs py-1">
                      {a} <button onClick={() => removeChip('correctiveActions', i)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Follow-up + Reporter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/30">
                  <Label className="text-xs text-slate-400">Follow-up Required</Label>
                  <Switch checked={report.followUpRequired} onCheckedChange={(v) => updateReport('followUpRequired', v)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Reporter (optional)</Label>
                  <Input value={report.reporter} onChange={(e) => updateReport('reporter', e.target.value)} placeholder="Your name" className="glass-input text-sm" />
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3">
                <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30">
                  {isSubmitting ? <><Clock className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Send className="w-4 h-4 mr-2" />Submit Incident Report</>}
                </Button>
                {submitResult && <span className="text-xs text-emerald-400">{submitResult}</span>}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Fishbone Diagram */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-slate-300">Fishbone (Ishikawa) Diagram</p>
          <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400 ml-auto">{totalBoneFactors} factors</Badge>
        </div>

        {/* SVG Fishbone */}
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 800 400" className="w-full h-auto min-w-[600px]" style={{ maxHeight: '400px' }}>
            {/* Main spine (horizontal) */}
            <line x1="60" y1="200" x2="720" y2="200" stroke="#334155" strokeWidth="3" />
            {/* Arrow at head */}
            <polygon points="720,190 740,200 720,210" fill="#334155" />
            {/* Incident label */}
            <rect x="740" y="180" width="60" height="40" rx="8" fill="rgba(244,63,94,0.2)" stroke="rgba(244,63,94,0.5)" strokeWidth="1" />
            <text x="770" y="205" textAnchor="middle" fill="#f43f5e" fontSize="10" fontWeight="bold">INCIDENT</text>

            {/* Bones - 3 on top, 3 on bottom */}
            {bones.map((bone, idx) => {
              const isTop = idx < 3;
              const topIdx = isTop ? idx : idx - 3;
              const x = 180 + topIdx * 180;
              const y1 = isTop ? 200 : 200;
              const y2 = isTop ? 40 : 360;
              const labelY = isTop ? 25 : 385;
              const boneColor = bone.color === 'text-cyan-400' ? '#22d3ee'
                : bone.color === 'text-emerald-400' ? '#10b981'
                : bone.color === 'text-amber-400' ? '#f59e0b'
                : bone.color === 'text-green-400' ? '#4ade80'
                : bone.color === 'text-purple-400' ? '#a855f7'
                : '#f43f5e';

              return (
                <g key={bone.key}>
                  {/* Bone line */}
                  <line x1={x} y1={y1} x2={x} y2={y2} stroke={boneColor} strokeWidth="2" opacity="0.6" />
                  {/* Bone label */}
                  <text x={x} y={labelY} textAnchor="middle" fill={boneColor} fontSize="11" fontWeight="bold">{bone.label}</text>
                  {/* Factors as text */}
                  {bone.factors.map((f, fi) => {
                    const fy = isTop ? 50 + fi * 22 : 355 - fi * 22;
                    return (
                      <g key={fi}>
                        <rect x={x - 65} y={fy - 9} width={130} height="18" rx="4" fill={`${boneColor}15`} stroke={`${boneColor}30`} strokeWidth="0.5" />
                        <text x={x} y={fy + 3} textAnchor="middle" fill={boneColor} fontSize="9">{f}</text>
                      </g>
                    );
                  })}
                  {/* "+" button indicator if no factors */}
                  {bone.factors.length === 0 && (
                    <text x={x} y={isTop ? 80 : 320} textAnchor="middle" fill="#475569" fontSize="10">+ add factors</text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bone factor inputs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
          {bones.map((bone) => {
            const BoneIcon = bone.icon;
            return (
              <div key={bone.key} className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <BoneIcon className={cn('w-3.5 h-3.5', bone.color)} />
                  <span className={cn('text-[10px] font-medium', bone.color)}>{bone.label}</span>
                </div>
                <div className="flex gap-1">
                  <Input
                    value={boneInputs[bone.key] || ''}
                    onChange={(e) => setBoneInputs((p) => ({ ...p, [bone.key]: e.target.value }))}
                    placeholder="Add factor"
                    className="glass-input text-[11px] h-7 px-2"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBoneFactor(bone.key))}
                  />
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={() => addBoneFactor(bone.key)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {bone.factors.map((f, fi) => (
                    <Badge key={fi} variant="outline" className={cn('text-[8px] py-0 px-1.5 border', bone.color.replace('text-', 'border-').replace('400', '500/30'))}>
                      {f}
                      <button onClick={() => removeBoneFactor(bone.key, fi)} className="ml-0.5 hover:text-white"><X className="w-2.5 h-2.5" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 5-Why Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <p className="text-sm font-medium text-slate-300">5-Why Root Cause Chain</p>
        </div>
        <div className="space-y-2">
          {whys.map((w, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  idx === 4 ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                )}>
                  {idx + 1}
                </div>
                {idx < 4 && <div className="w-px h-4 bg-slate-700" />}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs text-slate-400">Why {idx + 1}?</p>
                <Input
                  value={w}
                  onChange={(e) => setWhys((prev) => prev.map((v, i) => i === idx ? e.target.value : v))}
                  placeholder={idx === 0 ? 'Why did the incident occur?' : `Because...`}
                  className={cn(
                    'glass-input text-sm',
                    idx === 4 && 'border-rose-500/30 focus:border-rose-500/50'
                  )}
                />
                {idx === 4 && w && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2"
                  >
                    <p className="text-[10px] text-rose-300 font-medium">Root Cause Identified</p>
                    <p className="text-xs text-slate-300 mt-0.5">{w}</p>
                  </motion.div>
                )}
              </div>
              {idx < 4 && (
                <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 mt-3" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Bottom: History Table + Severity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History Table */}
        <div className="lg:col-span-2">
          <Card className="glass-card rounded-xl overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Incident History
                </CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Select value={historyFilter.department} onValueChange={(v) => setHistoryFilter((p) => ({ ...p, department: v }))}>
                    <SelectTrigger className="glass-input w-[120px] text-[11px] h-7"><SelectValue placeholder="Dept" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Depts</SelectItem>
                      {DEPARTMENTS.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={historyFilter.severity} onValueChange={(v) => setHistoryFilter((p) => ({ ...p, severity: v }))}>
                    <SelectTrigger className="glass-input w-[110px] text-[11px] h-7"><SelectValue placeholder="Severity" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {Object.keys(SEVERITY_CONFIG).map((k) => (<SelectItem key={k} value={k}>{SEVERITY_CONFIG[k as keyof typeof SEVERITY_CONFIG].label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <Select value={historyFilter.status} onValueChange={(v) => setHistoryFilter((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="glass-input w-[100px] text-[11px] h-7"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-transparent">
                    <TableHead className="text-slate-400 text-xs">Date</TableHead>
                    <TableHead className="text-slate-400 text-xs">Dept</TableHead>
                    <TableHead className="text-slate-400 text-xs">Category</TableHead>
                    <TableHead className="text-slate-400 text-xs">Severity</TableHead>
                    <TableHead className="text-slate-400 text-xs">Status</TableHead>
                    <TableHead className="text-slate-400 text-xs">Gate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredHistory.map((h) => {
                      const sevCfg = SEVERITY_CONFIG[h.severity as keyof typeof SEVERITY_CONFIG];
                      const gd = h.severity === 'catastrophic' ? { label: 'BLOCK', color: 'text-rose-400' }
                        : h.severity === 'major' ? { label: 'ESCALATE', color: 'text-amber-400' }
                        : { label: 'TRACK', color: 'text-emerald-400' };
                      return (
                        <motion.tr
                          key={h.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="border-slate-700/50 hover:bg-slate-800/30 cursor-pointer"
                          onClick={() => setExpandedIncident(expandedIncident === h.id ? null : h.id)}
                        >
                          <TableCell className="text-slate-300 text-xs">{h.date}</TableCell>
                          <TableCell className="text-slate-300 text-xs">{h.department}</TableCell>
                          <TableCell className="text-slate-300 text-xs">{h.category}</TableCell>
                          <TableCell><Badge variant="outline" className={cn('text-[10px]', sevCfg.badge)}>{sevCfg.label}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('text-[10px]',
                              h.status === 'open' ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                                : h.status === 'follow-up' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                                : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                            )}>
                              {h.status}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn('text-xs font-medium', gd.color)}>{gd.label}</TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
              {/* Expanded detail */}
              <AnimatePresence>
                {expandedIncident && (() => {
                  const h = MOCK_HISTORY.find((i) => i.id === expandedIncident);
                  if (!h) return null;
                  return (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/30">
                        <p className="text-xs text-slate-400 mb-1">Description</p>
                        <p className="text-sm text-slate-200">{h.description}</p>
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Severity Distribution Chart */}
        <div className="space-y-4">
          <Card className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Severity Distribution</p>
            <div className="space-y-2.5">
              {Object.entries(severityDistribution).map(([key, count]) => {
                const cfg = SEVERITY_CONFIG[key as keyof typeof SEVERITY_CONFIG];
                const maxCount = Math.max(...Object.values(severityDistribution));
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={cfg.color}>{cfg.label}</span>
                      <span className="text-slate-400 font-mono">{count}</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className={cn('h-full rounded-full', cfg.bar)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Summary */}
          <Card className="glass-card rounded-xl p-4 border-amber-500/20 bg-amber-500/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-300">Analysis Summary</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {MOCK_HISTORY.length} incidents on record. {severityDistribution.open || 0} open, {severityDistribution.catastrophic} catastrophic.
                  Most common category: <span className="text-white">Medication Error</span>. Use the fishbone diagram and 5-Why to identify systemic root causes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}