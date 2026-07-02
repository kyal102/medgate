'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCompareArrows,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  ShieldAlert,
  ArrowRightLeft,
  LogIn,
  ArrowRight,
  LogOut,
  Search,
  Pill,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Phase = 'admission' | 'transfer' | 'discharge';
type DiscrepancyType = 'omission' | 'addition' | 'dose_change' | 'frequency_change' | 'duplicate';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';
type ResolutionStatus = 'pending' | 'accepted' | 'rejected';

interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  route: string;
}

interface Discrepancy {
  id: string;
  type: DiscrepancyType;
  medication: string;
  details: string;
  suggestion: string;
  status: ResolutionStatus;
}

interface ReconciliationResult {
  discrepancies: Discrepancy[];
  criticalAlerts: string[];
  gate: GateDecision;
  reportId: string;
}

interface ReconcileHistoryEntry {
  id: string;
  phase: Phase;
  timestamp: number;
  discrepancyCount: number;
  criticalCount: number;
  resolvedCount: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const FREQUENCIES = ['qd', 'bid', 'tid', 'qid', 'q8h', 'q12h', 'q24h', 'prn', 'weekly', 'monthly'];
const ROUTES = ['PO', 'IV', 'IM', 'SC', 'SL', 'Topical', 'Inhaled', 'PR', 'Ophthalmic', 'Otic', 'Transdermal'];

const CRITICAL_MEDICATIONS = [
  'warfarin', 'heparin', 'enoxaparin', 'rivaroxaban', 'apixaban', 'dabigatran',
  'metoprolol', 'atenolol', 'propranolol', 'carvedilol',
  'insulin', 'glipizide', 'glyburide', 'glimepiride',
  'digoxin', 'amiodarone',
  'phenytoin', 'carbamazepine', 'valproate', 'lithium',
  'methotrexate', 'tacrolimus', 'cyclosporine',
];

const DISCREPANCY_CONFIG: Record<DiscrepancyType, { label: string; color: string; bgColor: string }> = {
  omission: { label: 'Omission', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/40' },
  addition: { label: 'Addition', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/40' },
  dose_change: { label: 'Dose Change', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/40' },
  frequency_change: { label: 'Frequency Change', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20 border-cyan-500/40' },
  duplicate: { label: 'Duplicate', color: 'text-rose-400', bgColor: 'bg-rose-500/20 border-rose-500/40' },
};

const PHASE_CONFIG: Record<Phase, { label: string; icon: typeof LogIn; description: string }> = {
  admission: { label: 'Admission', icon: LogIn, description: 'Compare home medications with admission orders' },
  transfer: { label: 'Transfer', icon: ArrowRight, description: 'Compare pre-transfer and post-transfer orders' },
  discharge: { label: 'Discharge', icon: LogOut, description: 'Compare inpatient meds with discharge prescriptions' },
};

const HISTORY_KEY = 'medgate-recon-history';

function loadHistory(): ReconcileHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: ReconcileHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 3)));
}

function genId() {
  return `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ------------------------------------------------------------------ */
/*  Helper: Simple discrepancy detection                               */
/* ------------------------------------------------------------------ */

function detectDiscrepancies(home: Medication[], current: Medication[]): { discrepancies: Discrepancy[]; criticalAlerts: string[] } {
  const discrepancies: Discrepancy[] = [];
  const criticalAlerts: string[] = [];

  const homeMap = new Map(home.map(m => [m.name.toLowerCase(), m]));
  const currentMap = new Map(current.map(m => [m.name.toLowerCase(), m]));
  const homeNames = new Set(home.map(m => m.name.toLowerCase()));
  const currentNames = new Set(current.map(m => m.name.toLowerCase()));

  // Check for omissions (in home but not in current)
  for (const [name, med] of homeMap) {
    if (!currentNames.has(name)) {
      const isCritical = CRITICAL_MEDICATIONS.some(c => name.includes(c));
      discrepancies.push({
        id: genId(),
        type: 'omission',
        medication: med.name,
        details: `${med.name} ${med.dose} ${med.frequency} ${med.route} is on home list but missing from current orders`,
        suggestion: isCritical
          ? `CRITICAL: Verify if ${med.name} should be ordered. This is a high-risk medication.`
          : `Confirm with prescriber if ${med.name} was intentionally discontinued.`,
        status: 'pending',
      });
      if (isCritical) {
        criticalAlerts.push(`⚠ CRITICAL OMISSION: ${med.name} (anticoagulant/immunosuppressant/beta-blocker) is missing from current orders`);
      }
    }
  }

  // Check for additions (in current but not in home)
  for (const [name, med] of currentMap) {
    if (!homeNames.has(name)) {
      discrepancies.push({
        id: genId(),
        type: 'addition',
        medication: med.name,
        details: `${med.name} ${med.dose} ${med.frequency} ${med.route} is in current orders but not on home medication list`,
        suggestion: `Verify if ${med.name} is a new medication or if it was previously undocumented.`,
        status: 'pending',
      });
    }
  }

  // Check for dose and frequency changes for medications in both lists
  for (const [name, homeMed] of homeMap) {
    const currentMed = currentMap.get(name);
    if (!currentMed) continue;

    if (homeMed.dose.toLowerCase() !== currentMed.dose.toLowerCase()) {
      discrepancies.push({
        id: genId(),
        type: 'dose_change',
        medication: homeMed.name,
        details: `Dose changed from ${homeMed.dose} to ${currentMed.dose}`,
        suggestion: `Verify dose change is intentional and documented. Old: ${homeMed.dose} → New: ${currentMed.dose}`,
        status: 'pending',
      });
    }

    if (homeMed.frequency.toLowerCase() !== currentMed.frequency.toLowerCase()) {
      discrepancies.push({
        id: genId(),
        type: 'frequency_change',
        medication: homeMed.name,
        details: `Frequency changed from ${homeMed.frequency} to ${currentMed.frequency}`,
        suggestion: `Confirm frequency change with prescriber. Old: ${homeMed.frequency} → New: ${currentMed.frequency}`,
        status: 'pending',
      });
    }
  }

  // Check for duplicates (similar names)
  const currentNamesArr = current.map(m => m.name.toLowerCase());
  for (let i = 0; i < currentNamesArr.length; i++) {
    for (let j = i + 1; j < currentNamesArr.length; j++) {
      if (currentNamesArr[i] !== currentNamesArr[j] &&
          (currentNamesArr[i].includes(currentNamesArr[j]) || currentNamesArr[j].includes(currentNamesArr[i]))) {
        discrepancies.push({
          id: genId(),
          type: 'duplicate',
          medication: current[i].name,
          details: `Potential duplicate: ${current[i].name} and ${current[j].name} may be the same medication or class`,
          suggestion: `Review both orders. Remove duplicate if confirmed.`,
          status: 'pending',
        });
      }
    }
  }

  return { discrepancies, criticalAlerts };
}

/* ------------------------------------------------------------------ */
/*  Medication Form Sub-component                                      */
/* ------------------------------------------------------------------ */

interface MedFormProps {
  onAdd: (med: Medication) => void;
  panelLabel: string;
}

function MedicationAddForm({ onAdd, panelLabel }: MedFormProps) {
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('qd');
  const [route, setRoute] = useState('PO');

  const add = () => {
    if (!name.trim() || !dose.trim()) return;
    onAdd({ id: genId(), name: name.trim(), dose: dose.trim(), frequency, route });
    setName('');
    setDose('');
  };

  return (
    <div className="space-y-3 p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Add to {panelLabel}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="col-span-2 sm:col-span-1">
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Drug name"
            className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
            onKeyDown={e => e.key === 'Enter' && add()}
          />
        </div>
        <div className="col-span-1 sm:col-span-1">
          <Input
            value={dose}
            onChange={e => setDose(e.target.value)}
            placeholder="e.g. 500mg"
            className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
            onKeyDown={e => e.key === 'Enter' && add()}
          />
        </div>
        <div>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={route} onValueChange={setRoute}>
            <SelectTrigger className="h-8 text-xs bg-slate-800/50 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROUTES.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button
        onClick={add}
        disabled={!name.trim() || !dose.trim()}
        size="sm"
        className="h-7 text-xs bg-cyan-600 hover:bg-cyan-500 text-white"
      >
        <Plus className="w-3 h-3 mr-1" /> Add
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Medication List Sub-component                                      */
/* ------------------------------------------------------------------ */

interface MedListProps {
  medications: Medication[];
  onRemove: (id: string) => void;
  label: string;
  accentColor: string;
}

function MedicationList({ medications, onRemove, label, accentColor }: MedListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-300">{label}</p>
        <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
          {medications.length} medication{medications.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      {medications.length === 0 ? (
        <div className="text-center py-8 text-slate-600">
          <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">No medications added yet</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
          <AnimatePresence>
            {medications.map((med) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                className={cn(
                  'flex items-center justify-between gap-2 px-3 py-2 rounded-md border',
                  'bg-slate-800/40 border-slate-700/30'
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{med.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {med.dose} · {med.frequency} · {med.route}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(med.id)}
                  className="h-7 w-7 p-0 text-slate-600 hover:text-rose-400 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function MedicationReconciliationEngine() {
  const [phase, setPhase] = useState<Phase>('admission');
  const [homeMeds, setHomeMeds] = useState<Medication[]>([]);
  const [currentMeds, setCurrentMeds] = useState<Medication[]>([]);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ReconcileHistoryEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return loadHistory(); } catch { return []; }
  });

  const addHomeMed = (med: Medication) => {
    setHomeMeds(prev => [...prev, med]);
    setResult(null);
  };

  const addCurrentMed = (med: Medication) => {
    setCurrentMeds(prev => [...prev, med]);
    setResult(null);
  };

  const removeHomeMed = (id: string) => {
    setHomeMeds(prev => prev.filter(m => m.id !== id));
    setResult(null);
  };

  const removeCurrentMed = (id: string) => {
    setCurrentMeds(prev => prev.filter(m => m.id !== id));
    setResult(null);
  };

  const resolveDiscrepancy = (discId: string, status: ResolutionStatus) => {
    if (!result) return;
    setResult(prev => prev ? {
      ...prev,
      discrepancies: prev.discrepancies.map(d => d.id === discId ? { ...d, status } : d),
    } : null);
  };

  const runReconciliation = async () => {
    if (homeMeds.length === 0 && currentMeds.length === 0) {
      toast.error('No medications to reconcile');
      return;
    }
    setLoading(true);
    const { discrepancies, criticalAlerts } = detectDiscrepancies(homeMeds, currentMeds);

    let gate: GateDecision = 'ALLOW';
    let reportId = `MR-${Date.now()}`;

    try {
      const res = await fetch('/api/medgate/med-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, homeMeds, currentMeds, discrepancies, criticalAlerts }),
      });
      if (res.ok) {
        const data = await res.json();
        gate = data.gateDecision || gate;
        reportId = data.reportId || reportId;
        if (data.discrepancies) {
          // Merge server discrepancies if returned
        }
      }
      if (criticalAlerts.length > 0 || discrepancies.some(d => d.type === 'omission')) {
        gate = 'NEEDS_REVIEW';
      }
      if (criticalAlerts.length >= 2) {
        gate = 'BLOCK';
      }
    } catch {
      if (criticalAlerts.length > 0 || discrepancies.some(d => d.type === 'omission')) {
        gate = 'NEEDS_REVIEW';
      }
      if (criticalAlerts.length >= 2) {
        gate = 'BLOCK';
      }
    }

    setResult({ discrepancies, criticalAlerts, gate, reportId });

    // Save to history
    const entry: ReconcileHistoryEntry = {
      id: Date.now().toString(),
      phase,
      timestamp: Date.now(),
      discrepancyCount: discrepancies.length,
      criticalCount: criticalAlerts.length,
      resolvedCount: 0,
    };
    const updated = [entry, ...history].slice(0, 3);
    setHistory(updated);
    saveHistory(updated);

    if (criticalAlerts.length > 0) {
      toast.error('Critical medication discrepancies found', {
        description: `${criticalAlerts.length} critical issue(s) require immediate attention.`,
        duration: 6000,
      });
    } else if (discrepancies.length > 0) {
      toast.warning('Discrepancies found', {
        description: `${discrepancies.length} discrepancy(ies) detected. Review and resolve.`,
      });
    } else {
      toast.success('Reconciliation complete', { description: 'No discrepancies found.' });
    }
    setLoading(false);
  };

  const phaseConfig = PHASE_CONFIG[phase];
  const PhaseIcon = phaseConfig.icon;

  const summaryStats = useMemo(() => {
    if (!result) return { total: 0, discrepancies: 0, critical: 0, resolved: 0 };
    const d = result.discrepancies;
    return {
      total: homeMeds.length + currentMeds.length,
      discrepancies: d.length,
      critical: result.criticalAlerts.length,
      resolved: d.filter(x => x.status !== 'pending').length,
    };
  }, [result, homeMeds, currentMeds]);

  const pendingCount = result ? result.discrepancies.filter(d => d.status === 'pending').length : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={GitCompareArrows}
        title="Medication Reconciliation Engine"
        subtitle="Detect omissions, additions, and dose discrepancies across care transitions"
        badge="Reconciliation"
        badgeColor="bg-amber-500/20 text-amber-400 border-amber-500/30"
      />

      {/* Phase Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.entries(PHASE_CONFIG) as [Phase, typeof PHASE_CONFIG.admission][]).map(([key, config]) => {
          const Icon = config.icon;
          const isActive = phase === key;
          return (
            <motion.button
              key={key}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setPhase(key); setResult(null); }}
              className={cn(
                'relative p-4 rounded-xl border text-center transition-all duration-200',
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
              )}
            >
              <Icon className={cn('w-6 h-6 mx-auto mb-2', isActive ? 'text-cyan-400' : 'text-slate-500')} />
              <p className={cn('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-400')}>{config.label}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{config.description}</p>
              {isActive && (
                <motion.div
                  layoutId="phase-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-500 rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Two-Panel Medication Layout */}
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Home Medications Panel */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              {phase === 'admission' ? 'Home Medications' : phase === 'transfer' ? 'Pre-Transfer Orders' : 'Inpatient Medications'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MedicationAddForm onAdd={addHomeMed} panelLabel={phase === 'admission' ? 'home' : 'pre-transfer'} />
            <MedicationList
              medications={homeMeds}
              onRemove={removeHomeMed}
              label={phase === 'admission' ? 'Home List' : 'Pre-Transfer'}
              accentColor="cyan"
            />
          </CardContent>
        </Card>

        {/* Current Orders Panel */}
        <Card className="glass-card border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              {phase === 'admission' ? 'Current Orders' : phase === 'transfer' ? 'Post-Transfer Orders' : 'Discharge Prescriptions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MedicationAddForm onAdd={addCurrentMed} panelLabel={phase === 'admission' ? 'orders' : phase === 'transfer' ? 'post-transfer' : 'discharge'} />
            <MedicationList
              medications={currentMeds}
              onRemove={removeCurrentMed}
              label={phase === 'admission' ? 'Current Orders' : phase === 'transfer' ? 'Post-Transfer' : 'Discharge'}
              accentColor="emerald"
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Run Reconciliation Button */}
      <Button
        onClick={runReconciliation}
        disabled={loading || (homeMeds.length === 0 && currentMeds.length === 0)}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white h-12"
      >
        {loading ? 'Running Reconciliation...' : 'Run Reconciliation'}
        <Search className="w-4 h-4 ml-2" />
      </Button>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Meds', value: summaryStats.total, color: 'text-cyan-400' },
                { label: 'Discrepancies', value: summaryStats.discrepancies, color: 'text-amber-400' },
                { label: 'Critical Issues', value: summaryStats.critical, color: 'text-rose-400' },
                { label: 'Resolved', value: summaryStats.resolved, color: 'text-emerald-400' },
              ].map(stat => (
                <Card key={stat.label} className="glass-card border-0">
                  <CardContent className="p-4 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={cn('text-2xl font-bold mt-1', stat.color)}>
                      <AnimatedCounter target={stat.value} duration={800} />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Critical Alerts */}
            {result.criticalAlerts.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Alert className="border-rose-500/40 bg-rose-500/10">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <AlertTitle className="text-rose-400 font-bold">Critical Medication Alerts</AlertTitle>
                  <AlertDescription>
                    <ul className="space-y-1 mt-1">
                      {result.criticalAlerts.map((alert, i) => (
                        <li key={i} className="text-xs text-rose-300">{alert}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Discrepancy List */}
            {result.discrepancies.length > 0 && (
              <Card className="glass-card border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Discrepancies
                    </CardTitle>
                    <Badge variant="outline" className={cn('text-xs',
                      pendingCount > 0 ? 'border-amber-500/30 text-amber-400' : 'border-emerald-500/30 text-emerald-400'
                    )}>
                      {pendingCount > 0 ? `${pendingCount} pending` : 'All resolved'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.discrepancies.map((disc, idx) => {
                    const config = DISCREPANCY_CONFIG[disc.type];
                    return (
                      <motion.div
                        key={disc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'rounded-lg border p-4 transition-opacity',
                          disc.status === 'rejected' ? 'opacity-40' : config.bgColor
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn('text-[10px]', config.bgColor, config.color)}>
                              {config.label}
                            </Badge>
                            <p className="text-sm font-medium text-white">{disc.medication}</p>
                          </div>
                          {disc.status !== 'pending' && (
                            <Badge variant="outline" className={cn('text-[10px]',
                              disc.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-slate-700 text-slate-400 border-slate-600'
                            )}>
                              {disc.status === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-1.5">{disc.details}</p>
                        <div className="flex items-start gap-1.5 mb-3">
                          <Info className="w-3 h-3 text-cyan-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-cyan-400/80">{disc.suggestion}</p>
                        </div>
                        {disc.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                              onClick={() => resolveDiscrepancy(disc.id, 'accepted')}
                            >
                              <Check className="w-3 h-3 mr-1" /> Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-slate-600 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                              onClick={() => resolveDiscrepancy(disc.id, 'rejected')}
                            >
                              <X className="w-3 h-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* No Discrepancies */}
            {result.discrepancies.length === 0 && result.criticalAlerts.length === 0 && (
              <Alert className="border-emerald-500/40 bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <AlertTitle className="text-emerald-400 font-bold">No Discrepancies Found</AlertTitle>
                <AlertDescription className="text-xs text-slate-400">
                  Home medications and current orders are aligned. Continue with standard care.
                </AlertDescription>
              </Alert>
            )}

            {/* Gate Decision */}
            <Alert className={cn('border',
              result.gate === 'ALLOW' ? 'bg-emerald-500/10 border-emerald-500/30' :
              result.gate === 'NEEDS_REVIEW' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-rose-500/10 border-rose-500/30'
            )}>
              {result.gate === 'ALLOW' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
               result.gate === 'NEEDS_REVIEW' ? <Info className="w-4 h-4 text-amber-400" /> :
               <XCircle className="w-4 h-4 text-rose-400" />}
              <AlertTitle className="text-sm font-bold">
                Gate Decision: {result.gate}
              </AlertTitle>
              <AlertDescription className="text-xs text-slate-400">
                Report ID: {result.reportId} · Phase: {phaseConfig.label}
              </AlertDescription>
            </Alert>

            {/* History */}
            {history.length > 0 && (
              <Card className="glass-card border-0">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    Recent Reconciliations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="space-y-1.5">
                    {history.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between px-3 py-2 rounded-md bg-slate-800/40 border border-slate-700/30"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                            {PHASE_CONFIG[entry.phase].label}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {entry.discrepancyCount} discrepancies
                            {entry.criticalCount > 0 && (
                              <span className="text-rose-400 ml-1">({entry.criticalCount} critical)</span>
                            )}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}