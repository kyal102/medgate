'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, XCircle, CheckCircle, Ban, FlaskConical, Beaker } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LAB_REFERENCES } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ANALYTES = Object.keys(LAB_REFERENCES);

interface LabValidationResult {
  analyte: string;
  value: number;
  unit: string;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'impossible';
  flags: string[];
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  normal: { label: 'NORMAL', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: CheckCircle },
  low: { label: 'ABNORMAL', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertTriangle },
  high: { label: 'ABNORMAL', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: AlertTriangle },
  critical_low: { label: 'CRITICAL', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: XCircle },
  critical_high: { label: 'CRITICAL', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', icon: XCircle },
  impossible: { label: 'IMPOSSIBLE', color: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse', icon: Ban },
};

const QUICK_PANELS: Record<string, { label: string; icon: typeof Beaker; values: { analyte: string; value: number }[] }> = {
  bmp: {
    label: 'Basic Metabolic',
    icon: Beaker,
    values: [
      { analyte: 'sodium', value: 138 },
      { analyte: 'potassium', value: 4.2 },
      { analyte: 'glucose', value: 105 },
      { analyte: 'creatinine', value: 1.1 },
      { analyte: 'bicarbonate', value: 24 },
    ],
  },
  cbc: {
    label: 'Complete Blood Count',
    icon: FlaskConical,
    values: [
      { analyte: 'hemoglobin', value: 13.5 },
      { analyte: 'wbc', value: 7.2 },
      { analyte: 'platelets', value: 250 },
      { analyte: 'inr', value: 1.0 },
    ],
  },
  liver: {
    label: 'Liver Function',
    icon: Beaker,
    values: [
      { analyte: 'bicarbonate', value: 23 },
      { analyte: 'glucose', value: 88 },
      { analyte: 'potassium', value: 3.8 },
      { analyte: 'sodium', value: 140 },
    ],
  },
  coag: {
    label: 'Coagulation',
    icon: FlaskConical,
    values: [
      { analyte: 'inr', value: 1.1 },
      { analyte: 'platelets', value: 220 },
      { analyte: 'hemoglobin', value: 14.0 },
    ],
  },
};

export function LabResultValidator() {
  const [analyte, setAnalyte] = useState('');
  const [value, setValue] = useState('');
  const [results, setResults] = useState<LabValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelResults, setPanelResults] = useState<LabValidationResult[]>([]);

  const unit = analyte ? LAB_REFERENCES[analyte]?.unit || '' : '';

  const validate = async () => {
    if (!analyte || !value) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/lab-validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analyte, value: parseFloat(value) }),
      });
      let data: LabValidationResult;
      if (res.ok) {
        data = await res.json();
      } else {
        data = localValidate(analyte, parseFloat(value));
      }
      setResultAndToast(data);
    } catch {
      const data = localValidate(analyte, parseFloat(value));
      setResultAndToast(data);
    }
    setLoading(false);
  };

  const setResultAndToast = (data: LabValidationResult) => {
    setResults([data]);
    const status = data.status;
    if (status === 'normal') {
      toast.success(`${data.analyte}: ${data.value} ${data.unit} — Normal`, { description: 'Result is within reference range.' });
    } else if (status === 'impossible') {
      toast.error(`${data.analyte}: ${data.value} ${data.unit} — Impossible`, { description: 'Outside physiological limits. Possible pre-analytical error.' });
    } else if (status.startsWith('critical')) {
      toast.error(`${data.analyte}: ${data.value} ${data.unit} — Critical!`, { description: data.flags[0] || 'Immediate action required.' });
    } else {
      toast.warning(`${data.analyte}: ${data.value} ${data.unit} — Abnormal`, { description: data.flags[0] || 'Outside reference range.' });
    }
  };

  const loadPanel = (panelKey: string) => {
    const panel = QUICK_PANELS[panelKey];
    if (!panel) return;
    const panelRes = panel.values.map((v) => localValidate(v.analyte, v.value));
    setPanelResults(panelRes);
    setResults([]);
    toast.info(`${panel.label} panel loaded`, { description: `${panel.values.length} analytes validated.` });
  };

  return (
    <section className="space-y-6">
      {/* Quick Lab Panel Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 uppercase tracking-wider self-center mr-1">Quick Panels:</span>
        {Object.entries(QUICK_PANELS).map(([key, panel]) => {
          const Icon = panel.icon;
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => loadPanel(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                'bg-slate-800/60 border-slate-600/50 text-slate-300 hover:bg-cyan-500/15 hover:border-cyan-500/40 hover:text-cyan-300'
              )}
            >
              <Icon className="w-3 h-3" />
              {panel.label}
            </motion.button>
          );
        })}
      </div>

      <Card className="glass-card-hover">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Analyte</label>
              <Select value={analyte} onValueChange={(v) => { setAnalyte(v); setResults([]); setPanelResults([]); }}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Select analyte" />
                </SelectTrigger>
                <SelectContent>
                  {ANALYTES.map((a) => (
                    <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Value</label>
              <Input type="number" step="any" placeholder="e.g. 4.2" value={value} onChange={(e) => setValue(e.target.value)} className="glass-input" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Unit</label>
              <Input value={unit} readOnly className="glass-input opacity-60" />
            </div>
          </div>
          <Button onClick={validate} disabled={loading || !analyte || !value} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
            {loading ? 'Validating...' : 'Validate'}
          </Button>
        </CardContent>
      </Card>

      {/* Single result */}
      <AnimatePresence>
        {results.map((result, idx) => (
          <motion.div
            key={`${result.analyte}-${idx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <Card className="glass-card-hover">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-white">
                    {result.analyte.charAt(0).toUpperCase() + result.analyte.slice(1)}: {result.value} {result.unit}
                  </CardTitle>
                  <Badge variant="outline" className={cn('text-sm px-3 py-1', STATUS_MAP[result.status].color)}>
                    {(() => { const Ic = STATUS_MAP[result.status].icon; return Ic ? <Ic className="w-3.5 h-3.5 mr-1.5" /> : null; })()}
                    {STATUS_MAP[result.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyte && (() => {
                  const ref = LAB_REFERENCES[analyte];
                  if (!ref) return null;
                  const totalRange = ref.physMax - ref.physMin;
                  const valPct = ((parseFloat(value) - ref.physMin) / totalRange) * 100;
                  const refLowPct = ((ref.refLow - ref.physMin) / totalRange) * 100;
                  const refHighPct = ((ref.refHigh - ref.physMin) / totalRange) * 100;
                  const critLowPct = ((ref.critLow - ref.physMin) / totalRange) * 100;
                  const critHighPct = ((ref.critHigh - ref.physMin) / totalRange) * 100;
                  return (
                    <div className="space-y-2">
                      <div className="relative h-6 w-full rounded-full overflow-hidden bg-slate-800">
                        <div className="absolute inset-0 flex">
                          <div className="bg-red-500/30 h-full" style={{ width: `${critLowPct}%` }} />
                          <div className="bg-amber-500/20 h-full" style={{ width: `${refLowPct - critLowPct}%` }} />
                          <div className="bg-emerald-500/30 h-full" style={{ width: `${refHighPct - refLowPct}%` }} />
                          <div className="bg-amber-500/20 h-full" style={{ width: `${critHighPct - refHighPct}%` }} />
                          <div className="bg-red-500/30 h-full" style={{ width: `${100 - critHighPct}%` }} />
                        </div>
                        <motion.div
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          className={cn(
                            'absolute top-0 h-full w-1 bg-white shadow-lg shadow-white/50 z-10 origin-left',
                            (valPct < critLowPct || valPct > critHighPct) && 'bg-red-400 animate-pulse'
                          )}
                          style={{ left: `${Math.max(0, Math.min(100, valPct))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{ref.physMin}</span>
                        <span className="text-red-400">Crit: {ref.critLow}</span>
                        <span className="text-emerald-400">Ref: {ref.refLow}–{ref.refHigh}</span>
                        <span className="text-red-400">Crit: {ref.critHigh}</span>
                        <span>{ref.physMax}</span>
                      </div>
                    </div>
                  );
                })()}
                {result.flags.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Flags</p>
                    {result.flags.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-md px-3 py-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <p className="text-sm text-rose-300">{f}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Panel results */}
      <AnimatePresence>
        {panelResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="glass-card-hover p-4 space-y-3"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Panel Results</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {panelResults.map((r, i) => {
                const S = STATUS_MAP[r.status];
                const Icon = S.icon;
                return (
                  <motion.div
                    key={`${r.analyte}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 25 }}
                    className="flex items-center gap-3 rounded-lg border bg-slate-800/40 px-3 py-2.5"
                  >
                    <Icon className={cn('w-4 h-4 shrink-0',
                      r.status === 'normal' ? 'text-emerald-400' :
                      r.status === 'impossible' ? 'text-red-400' :
                      r.status.startsWith('critical') ? 'text-rose-400' : 'text-amber-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{r.analyte.charAt(0).toUpperCase() + r.analyte.slice(1)}</p>
                      <p className="text-xs text-slate-400">{r.value} {r.unit}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0.5 shrink-0', S.color)}>
                      {S.label}
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function localValidate(analyte: string, value: number): LabValidationResult {
  const ref = LAB_REFERENCES[analyte];
  if (!ref) return { analyte, value, unit: '', status: 'normal', flags: ['Unknown analyte'] };
  const flags: string[] = [];
  if (value < ref.physMin || value > ref.physMax) {
    flags.push(`Value ${value} ${ref.unit} is outside physiological limits (${ref.physMin}–${ref.physMax}). Possible pre-analytical error.`);
    return { analyte, value, unit: ref.unit, status: 'impossible', flags };
  }
  if (value < ref.critLow) {
    flags.push(`CRITICAL LOW: ${value} ${ref.unit} is below critical threshold of ${ref.critLow}. Immediate action required.`);
    return { analyte, value, unit: ref.unit, status: 'critical_low', flags };
  }
  if (value > ref.critHigh) {
    flags.push(`CRITICAL HIGH: ${value} ${ref.unit} exceeds critical threshold of ${ref.critHigh}. Immediate action required.`);
    return { analyte, value, unit: ref.unit, status: 'critical_high', flags };
  }
  if (value < ref.refLow) {
    flags.push(`Below reference range (ref: ${ref.refLow}–${ref.refHigh}). Consider clinical context.`);
    return { analyte, value, unit: ref.unit, status: 'low', flags };
  }
  if (value > ref.refHigh) {
    flags.push(`Above reference range (ref: ${ref.refLow}–${ref.refHigh}). Consider clinical context.`);
    return { analyte, value, unit: ref.unit, status: 'high', flags };
  }
  return { analyte, value, unit: ref.unit, status: 'normal', flags: [] };
}