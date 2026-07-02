'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, User, AlertCircle, FileText, Stethoscope, Lightbulb,
  ChevronDown, ChevronUp, Send, ShieldAlert, ShieldCheck, Clock, CheckCircle2, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

// --- ISBAR Sections ---
interface FieldDef {
  key: string;
  label: string;
  type: 'input' | 'textarea' | 'select';
  options?: string[];
  placeholder?: string;
}

interface IsbarSection {
  key: string;
  letter: string;
  title: string;
  weight: number;
  icon: React.ElementType;
  color: string;
  fields: FieldDef[];
}

const ISBAR_SECTIONS: IsbarSection[] = [
  {
    key: 'identify', letter: 'I', title: 'Identify', weight: 15,
    icon: User, color: 'text-cyan-400',
    fields: [
      { key: 'patientName', label: 'Patient Name', type: 'input', placeholder: 'e.g. John Smith' },
      { key: 'dob', label: 'Date of Birth', type: 'input', placeholder: 'e.g. 15/03/1965' },
      { key: 'urNumber', label: 'UR Number', type: 'input', placeholder: 'e.g. UR123456' },
      { key: 'ward', label: 'Ward/Room/Bed', type: 'input', placeholder: 'e.g. Ward 3A, Room 12, Bed 1' },
      { key: 'clinician', label: 'Responsible Clinician', type: 'input', placeholder: 'e.g. Dr. Williams' },
    ],
  },
  {
    key: 'situation', letter: 'S', title: 'Situation', weight: 25,
    icon: AlertCircle, color: 'text-amber-400',
    fields: [
      { key: 'presentingProblem', label: 'Presenting Problem', type: 'textarea', placeholder: 'Chief complaint / reason for admission' },
      { key: 'clinicalStatus', label: 'Current Clinical Status', type: 'select', options: ['Stable', 'Observation', 'Unstable', 'Critical'] },
      { key: 'codeStatus', label: 'Code Status', type: 'select', options: ['Full Code', 'DNR/DNI', 'DNR Only', 'Comfort Care', 'Not Documented'] },
      { key: 'acuteChanges', label: 'Acute Changes (last 24h)', type: 'textarea', placeholder: 'Any acute changes in condition' },
    ],
  },
  {
    key: 'background', letter: 'B', title: 'Background', weight: 20,
    icon: FileText, color: 'text-emerald-400',
    fields: [
      { key: 'pmh', label: 'Past Medical History', type: 'textarea', placeholder: 'Relevant medical history' },
      { key: 'allergies', label: 'Known Allergies', type: 'input', placeholder: 'e.g. Penicillin (rash)' },
      { key: 'medications', label: 'Current Medications', type: 'textarea', placeholder: 'Key medications list' },
      { key: 'socialHistory', label: 'Relevant Social History', type: 'textarea', placeholder: 'Smoking, alcohol, living situation' },
      { key: 'functionalStatus', label: 'Baseline Functional Status', type: 'select', options: ['Independent', 'Requires Assistance', 'Dependent', 'Bedbound', 'Unknown'] },
    ],
  },
  {
    key: 'assessment', letter: 'A', title: 'Assessment', weight: 25,
    icon: Stethoscope, color: 'text-primary',
    fields: [
      { key: 'impression', label: 'Clinical Impression / Diagnosis', type: 'textarea', placeholder: 'Working diagnosis / impression' },
      { key: 'investigations', label: 'Key Investigations', type: 'textarea', placeholder: 'Relevant labs, imaging, results' },
      { key: 'clinicalScores', label: 'Current Clinical Scores (NEWS2, GCS etc.)', type: 'input', placeholder: 'e.g. NEWS2: 4, GCS: 14' },
      { key: 'treatmentResponse', label: 'Response to Treatment', type: 'select', options: ['Improving', 'Stable', 'Deteriorating', 'No Change', 'Not Assessed'] },
    ],
  },
  {
    key: 'recommendation', letter: 'R', title: 'Recommendation', weight: 15,
    icon: Lightbulb, color: 'text-amber-500',
    fields: [
      { key: 'tasksRequired', label: 'Tasks Required', type: 'textarea', placeholder: 'Immediate tasks for receiving team' },
      { key: 'followUpPlan', label: 'Follow-up Plan', type: 'textarea', placeholder: 'Planned follow-up actions' },
      { key: 'contingencyPlan', label: 'Contingency Plan ("If X, then Y")', type: 'textarea', placeholder: 'e.g. If HR <50, hold metoprolol, call cardiology' },
      { key: 'dischargeTimeline', label: 'Expected Discharge/Transfer Timeline', type: 'select', options: ['<24h', '24-48h', '48-72h', '3-5 days', '5-7 days', '>7 days', 'Unknown'] },
    ],
  },
];

const TEMPLATE_PRESETS: Record<string, Record<string, string>> = {
  'ICU to Ward': {
    patientName: '', dob: '', urNumber: '', ward: 'ICU Bed 4',
    clinician: '', presentingProblem: '', clinicalStatus: 'Observation',
    codeStatus: '', acuteChanges: '', pmh: '', allergies: '', medications: '',
    socialHistory: '', functionalStatus: 'Requires Assistance', impression: '',
    investigations: '', clinicalScores: '', treatmentResponse: 'Improving',
    tasksRequired: '', followUpPlan: '', contingencyPlan: '', dischargeTimeline: '24-48h',
  },
  'ED to Ward': {
    patientName: '', dob: '', urNumber: '', ward: 'ED Bay 7',
    clinician: '', presentingProblem: '', clinicalStatus: 'Stable',
    codeStatus: 'Full Code', acuteChanges: '', pmh: '', allergies: '', medications: '',
    socialHistory: '', functionalStatus: 'Independent', impression: '',
    investigations: '', clinicalScores: '', treatmentResponse: 'Stable',
    tasksRequired: '', followUpPlan: '', contingencyPlan: '', dischargeTimeline: '48-72h',
  },
  'Ward to Ward': {
    patientName: '', dob: '', urNumber: '', ward: 'Ward 2B, Bed 8',
    clinician: '', presentingProblem: '', clinicalStatus: 'Stable',
    codeStatus: '', acuteChanges: '', pmh: '', allergies: '', medications: '',
    socialHistory: '', functionalStatus: '', impression: '',
    investigations: '', clinicalScores: '', treatmentResponse: 'Stable',
    tasksRequired: '', followUpPlan: '', contingencyPlan: '', dischargeTimeline: '3-5 days',
  },
  'OR to Recovery': {
    patientName: '', dob: '', urNumber: '', ward: 'OR Suite 3 → Recovery Bay 2',
    clinician: '', presentingProblem: '', clinicalStatus: 'Observation',
    codeStatus: 'Full Code', acuteChanges: '', pmh: '', allergies: '', medications: '',
    socialHistory: '', functionalStatus: '', impression: '',
    investigations: '', clinicalScores: '', treatmentResponse: 'Not Assessed',
    tasksRequired: '', followUpPlan: '', contingencyPlan: '', dischargeTimeline: '<24h',
  },
};

const COMPLIANCE_HISTORY = [
  { id: 1, score: 72, grade: 'C', date: 'Mon' },
  { id: 2, score: 85, grade: 'B', date: 'Tue' },
  { id: 3, score: 68, grade: 'D', date: 'Wed' },
  { id: 4, score: 91, grade: 'A', date: 'Thu' },
  { id: 5, score: 78, grade: 'C', date: 'Fri' },
  { id: 6, score: 55, grade: 'F', date: 'Sat' },
  { id: 7, score: 88, grade: 'B', date: 'Sun' },
  { id: 8, score: 94, grade: 'A', date: 'Mon' },
  { id: 9, score: 82, grade: 'B', date: 'Tue' },
  { id: 10, score: 76, grade: 'C', date: 'Wed' },
];

function getGrade(score: number): { grade: string; color: string; bg: string } {
  if (score >= 90) return { grade: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  if (score >= 75) return { grade: 'B', color: 'text-cyan-400', bg: 'bg-cyan-500/20' };
  if (score >= 60) return { grade: 'C', color: 'text-amber-400', bg: 'bg-amber-500/20' };
  if (score >= 50) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500/20' };
  return { grade: 'F', color: 'text-rose-400', bg: 'bg-rose-500/20' };
}

function getGateDecision(score: number): { label: string; color: string; icon: React.ElementType } {
  if (score >= 75) return { label: 'PASS', color: 'text-emerald-400', icon: ShieldCheck };
  if (score >= 50) return { label: 'NEEDS_REVIEW', color: 'text-amber-400', icon: AlertCircle };
  return { label: 'BLOCK', color: 'text-rose-400', icon: ShieldAlert };
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export function ClinicalHandoverAuditor() {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
    setActiveSection(idx);
  };

  const setFieldValue = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const applyTemplate = (name: string) => {
    setFormData(TEMPLATE_PRESETS[name]);
  };

  const sectionScores = useMemo(() => {
    return ISBAR_SECTIONS.map((section) => {
      const filled = section.fields.filter((f) => formData[f.key]?.trim()).length;
      const total = section.fields.length;
      const pct = (filled / total) * 100;
      return { ...section, filled, total, pct };
    });
  }, [formData]);

  const overallScore = useMemo(() => {
    let totalWeighted = 0;
    let totalWeight = 0;
    sectionScores.forEach((s) => {
      totalWeighted += (s.filled / s.total) * s.weight;
      totalWeight += s.weight;
    });
    return totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : 0;
  }, [sectionScores]);

  const missingFields = useMemo(() => {
    const missing: { section: string; field: string }[] = [];
    ISBAR_SECTIONS.forEach((section) => {
      section.fields.forEach((f) => {
        if (!formData[f.key]?.trim()) {
          missing.push({ section: section.title, field: f.label });
        }
      });
    });
    return missing;
  }, [formData]);

  const gradeInfo = getGrade(overallScore);
  const gateInfo = getGateDecision(overallScore);
  const GateIcon = gateInfo.icon;

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      await fetch('/api/medgate/handover-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData, score: overallScore, grade: gradeInfo.grade }),
      });
      setAuditResult(`Audit submitted — Score: ${overallScore}% (${gradeInfo.grade})`);
    } catch {
      setAuditResult('Audit recorded locally — Score: ' + overallScore + '% (' + gradeInfo.grade + ')');
    }
    setIsAuditing(false);
  };

  return (
    <div className="space-y-6">
      {/* ISBAR Stepper Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <ClipboardCheck className="w-5 h-5 text-primary" />
          <h3 className="text-white font-semibold">ISBAR Handover Framework</h3>
          <div className="flex-1" />
          <div className="flex gap-2 flex-wrap">
            {Object.keys(TEMPLATE_PRESETS).map((preset) => (
              <TooltipProvider key={preset}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs border-slate-600 text-slate-300 hover:text-primary hover:border-primary/50"
                      onClick={() => applyTemplate(preset)}
                    >
                      {preset}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Load {preset} template</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* ISBAR Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
          {ISBAR_SECTIONS.map((section, idx) => {
            const SectionIcon = section.icon;
            const score = sectionScores[idx];
            const isActive = activeSection === idx;
            const isExpanded = expandedSections.has(idx);
            return (
              <motion.button
                key={section.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setActiveSection(idx); toggleSection(idx); }}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer',
                  isActive
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600',
                  score.pct === 100 && 'border-emerald-500/30'
                )}
              >
                <div className={cn(
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-lg sm:text-xl font-bold border-2 transition-colors',
                  isActive ? 'border-primary bg-primary/20 text-primary' : `${section.color} border-slate-600 bg-slate-800/50`
                )}>
                  {score.pct === 100 ? (
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  ) : (
                    <SectionIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                <span className={cn('text-[10px] sm:text-xs font-medium', isActive ? 'text-primary' : 'text-slate-400')}>
                  {section.letter} — {section.title}
                </span>
                <span className="text-[10px] text-slate-500">{score.filled}/{score.total}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute -bottom-px left-2 right-2 h-0.5 bg-primary rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Main content: Form + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Area */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence mode="wait">
            {ISBAR_SECTIONS.map((section, idx) => {
              if (!expandedSections.has(idx)) return null;
              const SectionIcon = section.icon;
              const score = sectionScores[idx];
              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="overflow-hidden"
                >
                  <Card className="glass-card rounded-xl overflow-hidden">
                    <CardHeader
                      className="pb-3 cursor-pointer hover:bg-slate-800/20 transition-colors"
                      onClick={() => toggleSection(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-slate-800', section.color)}>
                            <SectionIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                              <span className="text-primary font-bold">{section.letter}</span> {section.title}
                              <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-400">
                                {section.weight}% weight
                              </Badge>
                            </CardTitle>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={score.pct} className="w-20 sm:w-32 h-2" />
                          <span className={cn('text-xs font-mono min-w-[3rem] text-right', score.pct === 100 ? 'text-emerald-400' : 'text-slate-400')}>
                            {Math.round(score.pct)}%
                          </span>
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4 space-y-3">
                      {section.fields.map((field) => {
                        const isMissing = !formData[field.key]?.trim();
                        return (
                          <motion.div
                            key={field.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * section.fields.indexOf(field) }}
                            className={cn('space-y-1.5', isMissing && 'group')}
                          >
                            <Label className={cn(
                              'text-xs flex items-center gap-1.5',
                              isMissing ? 'text-slate-400' : 'text-slate-300'
                            )}>
                              {field.label}
                              {isMissing && <XCircle className="w-3 h-3 text-rose-500/50 group-hover:text-rose-400" />}
                              {!isMissing && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            </Label>
                            {field.type === 'input' && (
                              <Input
                                value={formData[field.key] || ''}
                                onChange={(e) => setFieldValue(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                className={cn(
                                  'glass-input text-sm',
                                  isMissing ? 'border-slate-700' : 'border-emerald-500/30'
                                )}
                              />
                            )}
                            {field.type === 'textarea' && (
                              <Textarea
                                value={formData[field.key] || ''}
                                onChange={(e) => setFieldValue(field.key, e.target.value)}
                                placeholder={field.placeholder}
                                rows={3}
                                className={cn(
                                  'glass-input text-sm resize-none',
                                  isMissing ? 'border-slate-700' : 'border-emerald-500/30'
                                )}
                              />
                            )}
                            {field.type === 'select' && (
                              <Select
                                value={formData[field.key] || ''}
                                onValueChange={(v) => setFieldValue(field.key, v)}
                              >
                                <SelectTrigger className={cn(
                                  'glass-input text-sm',
                                  isMissing ? 'border-slate-700' : 'border-emerald-500/30'
                                )}>
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((opt) => (
                                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </motion.div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Right Sidebar - Score Dashboard */}
        <div className="space-y-4">
          {/* Overall Score */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="glass-card rounded-xl p-5 text-center"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Overall Compliance Score</p>
            <div className="relative inline-block">
              <p className={cn('text-5xl font-bold', gradeInfo.color)}>
                <AnimatedCounter target={overallScore} suffix="%" />
              </p>
            </div>
            <motion.div
              key={gradeInfo.grade}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mt-3"
            >
              <Badge className={cn('text-lg font-bold px-4 py-1 border-0', gradeInfo.bg, gradeInfo.color)}>
                Grade {gradeInfo.grade}
              </Badge>
            </motion.div>

            {/* Gate Decision */}
            <motion.div
              key={gateInfo.label}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={cn(
                'mt-4 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border',
                gateInfo.label === 'PASS'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : gateInfo.label === 'NEEDS_REVIEW'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
              )}
            >
              <GateIcon className={cn('w-4 h-4', gateInfo.color)} />
              <span className={cn('text-sm font-semibold', gateInfo.color)}>
                {gateInfo.label === 'NEEDS_REVIEW' ? 'NEEDS REVIEW' : gateInfo.label}
              </span>
            </motion.div>
          </motion.div>

          {/* Section Breakdown */}
          <Card className="glass-card rounded-xl p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Section Scores</p>
            <div className="space-y-3">
              {sectionScores.map((s, idx) => (
                <div key={s.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <button
                      onClick={() => { setActiveSection(idx); if (!expandedSections.has(idx)) toggleSection(idx); }}
                      className={cn('font-medium hover:underline', s.color)}
                    >
                      {s.letter} — {s.title}
                    </button>
                    <span className="text-slate-400 font-mono">{s.filled}/{s.total} ({s.weight}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.pct}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className={cn(
                        'h-full rounded-full',
                        s.pct === 100 ? 'bg-emerald-500' : s.pct >= 50 ? 'bg-cyan-500' : 'bg-rose-500'
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Missing Items */}
          {missingFields.length > 0 && (
            <Card className="glass-card rounded-xl p-4 border-rose-500/20">
              <p className="text-xs text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Missing Items ({missingFields.length})
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {missingFields.map((m, i) => (
                  <div key={i} className="text-xs text-rose-300/70 flex items-center gap-2">
                    <span className="text-rose-500/50">•</span>
                    <span className="text-slate-400">{m.section}:</span>
                    <span className="text-rose-400">{m.field}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Audit Button */}
          <Button
            onClick={handleAudit}
            disabled={isAuditing}
            className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30"
          >
            {isAuditing ? (
              <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Clock className="w-4 h-4 mr-2" /></motion.div>Auditing...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Audit Handover</>
            )}
          </Button>

          {auditResult && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-center text-slate-400 bg-slate-800/50 rounded-lg p-3">
              {auditResult}
            </motion.div>
          )}
        </div>
      </div>

      {/* Compliance History Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <p className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Compliance History (Last 10 Audits)
        </p>
        <div className="flex items-end gap-2 h-32 sm:h-40">
          {COMPLIANCE_HISTORY.map((entry, idx) => {
            const g = getGrade(entry.score);
            const barColor = entry.score >= 90 ? 'bg-emerald-500' : entry.score >= 75 ? 'bg-cyan-500' : entry.score >= 60 ? 'bg-amber-500' : entry.score >= 50 ? 'bg-orange-500' : 'bg-rose-500';
            return (
              <div key={entry.id} className="flex-1 flex flex-col items-center gap-1">
                <span className={cn('text-[10px] font-mono', g.color)}>{entry.score}%</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(entry.score / 100) * 100}%` }}
                  transition={{ delay: idx * 0.06, type: 'spring', stiffness: 200, damping: 20 }}
                  className={cn('w-full rounded-t-md min-h-[4px]', barColor)}
                  style={{ opacity: 0.8 }}
                />
                <span className="text-[10px] text-slate-500">{entry.date}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}