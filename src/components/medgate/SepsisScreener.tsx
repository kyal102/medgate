'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, ShieldAlert, AlertTriangle, Check, X, Clock, Download, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SepsisInput {
  temp: string;
  hr: string;
  rr: string;
  sbp: string;
  wbc: string;
  lactate: string;
  consciousness: string;
  infection: boolean;
}

interface SepsisResult {
  qsofa: number;
  sirs: { name: string; met: boolean }[];
  sofa: number;
  likelihood: 'low' | 'moderate' | 'high' | 'very_high';
  septicShock: boolean;
  bundle: { item: string; done: boolean }[];
}

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  timestamp: string | null;
}

const INITIAL: SepsisInput = { temp: '', hr: '', rr: '', sbp: '', wbc: '', lactate: '', consciousness: 'A', infection: false };

const BUNDLE_CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'blood-cultures', label: 'Blood cultures obtained', checked: false, timestamp: null },
  { id: 'lactate-level', label: 'Lactate level measured', checked: false, timestamp: null },
  { id: 'broad-spectrum-abx', label: 'Broad-spectrum antibiotics administered', checked: false, timestamp: null },
  { id: 'iv-fluids', label: 'IV fluid resuscitation (30 mL/kg crystalloid)', checked: false, timestamp: null },
  { id: 'vasopressors', label: 'Vasopressors initiated (if needed)', checked: false, timestamp: null },
];

function likelihoodColor(l: string) {
  if (l === 'low') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  if (l === 'moderate') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (l === 'high') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
}

function likelihoodPct(l: string) {
  if (l === 'low') return 15;
  if (l === 'moderate') return 45;
  if (l === 'high') return 75;
  return 95;
}

function likelihoodBarColor(l: string) {
  if (l === 'low') return 'bg-emerald-500';
  if (l === 'moderate') return 'bg-amber-500';
  if (l === 'high') return 'bg-rose-500';
  return 'bg-red-500';
}

function formatTime(ts: string | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function computeElapsedFromFirst(items: ChecklistItem[]): string {
  const checked = items.filter((i) => i.timestamp);
  if (checked.length === 0) return '--:--';
  const first = new Date(checked[0].timestamp!).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - first) / 1000);
  const m = Math.floor(diffSec / 60);
  const s = diffSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SepsisScreener() {
  const [input, setInput] = useState<SepsisInput>(INITIAL);
  const [result, setResult] = useState<SepsisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(BUNDLE_CHECKLIST_ITEMS);
  const [tick, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed time timer
  useEffect(() => {
    const hasChecked = checklist.some((i) => i.timestamp);
    if (hasChecked) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTick((n) => n + 1);
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [checklist]);

  // Compute elapsed from first checked item (tick drives re-renders for live update)
  const hasAnyChecked = checklist.some((i) => i.timestamp);
  const elapsed = hasAnyChecked ? computeElapsedFromFirst(checklist) : '--:--';
  void tick; // tick triggers re-renders for live elapsed timer

  const update = (key: keyof SepsisInput, val: string | boolean) => setInput((p) => ({ ...p, [key]: val }));

  const screen = async () => {
    if (!input.temp || !input.hr || !input.rr || !input.sbp) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/sepsis-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: parseFloat(input.temp), heartRate: parseInt(input.hr), respiratoryRate: parseInt(input.rr),
          systolicBP: parseInt(input.sbp), wbc: input.wbc ? parseFloat(input.wbc) : undefined,
          lactate: input.lactate ? parseFloat(input.lactate) : undefined,
          consciousness: input.consciousness, sirs_suspected_infection: input.infection,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (data.sepsis_likelihood === 'HIGH' || data.sepsis_likelihood === 'SEPTIC SHOCK') {
          toast.error(`⚠ ${data.sepsis_likelihood}`, {
            description: `SOFA: ${data.sofa_score} · qSOFA: ${data.qsofa_score} · Lactate: ${data.lactate || 'N/A'}. Immediate clinical review required.`,
            duration: 10000,
          });
        } else if (data.sepsis_likelihood === 'MODERATE') {
          toast.warning('Sepsis risk: MODERATE', {
            description: `qSOFA: ${data.qsofa_score} — Close monitoring recommended.`,
          });
        }
      } else { setResult(localScreen(input)); }
    } catch { setResult(localScreen(input)); }
    setLoading(false);
  };

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked, timestamp: !item.checked ? new Date().toISOString() : null }
          : item
      )
    );
  };

  const exportChecklist = () => {
    const checked = checklist.filter((i) => i.checked);
    const unchecked = checklist.filter((i) => !i.checked);
    const firstTime = checked.length > 0 ? checked[0].timestamp : null;

    const lines = [
      '═══════════════════════════════════════════',
      '  Sepsis 1-Hour Bundle Checklist',
      '═══════════════════════════════════════════',
      '',
      `Generated: ${new Date().toISOString()}`,
      `Screen Result: ${result ? result.likelihood.toUpperCase() : 'Not screened'}`,
      firstTime ? `Bundle Start: ${formatTime(firstTime)}` : '',
      '',
      '── Completed Items ──────────────────────',
      '',
      ...checked.map((i) => `[✓] ${i.label}\n    Time: ${formatTime(i.timestamp)}`).join('\n\n').split('\n'),
      '',
      '── Pending Items ────────────────────────',
      '',
      ...unchecked.map((i) => `[ ] ${i.label}`).join('\n').split('\n'),
      '',
      `Progress: ${checked.length}/${checklist.length} (${Math.round((checked.length / checklist.length) * 100)}%)`,
      '═══════════════════════════════════════════',
      '  MedGate — Not for Clinical Use',
      '═══════════════════════════════════════════',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sepsis-bundle-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Checklist exported', {
      description: 'Sepsis 1-Hour Bundle checklist downloaded.',
    });
  };

  const completedCount = checklist.filter((i) => i.checked).length;

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(
              [['temp', 'Temp (°C)', '37.0'], ['hr', 'HR (bpm)', '80'], ['rr', 'RR (/min)', '18'], ['sbp', 'SBP (mmHg)', '120'],
               ['wbc', 'WBC (x10⁹/L)', '8.0'], ['lactate', 'Lactate (mmol/L)', '1.5']] as const
            ).map(([key, label, ph]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm text-slate-400">{label}</label>
                <Input type="number" step={key === 'temp' || key === 'lactate' ? '0.1' : '1'} placeholder={ph}
                  value={input[key as keyof SepsisInput] as string} onChange={(e) => update(key as keyof SepsisInput, e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Consciousness</label>
              <select value={input.consciousness} onChange={(e) => update('consciousness', e.target.value)}
                className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/50 px-3 text-sm text-white">
                {['A', 'C', 'V', 'P', 'U'].map((c) => (<option key={c} value={c}>{c === 'A' ? 'Alert' : c === 'C' ? 'Confusion' : c === 'V' ? 'Voice' : c === 'P' ? 'Pain' : 'Unresponsive'}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <Switch checked={input.infection} onCheckedChange={(v) => update('infection', v)} />
            <Label className="text-sm text-slate-300">Suspected infection</Label>
          </div>
          <Button onClick={screen} disabled={loading} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white">
            {loading ? 'Screening...' : 'Screen for Sepsis'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider">qSOFA</p>
                <p className={cn('text-3xl font-bold mt-1', result.qsofa >= 2 ? 'text-rose-400' : 'text-emerald-400')}>{result.qsofa}/3</p>
                <Badge variant="outline" className={cn('mt-2 text-xs', result.qsofa >= 2 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40')}>
                  {result.qsofa >= 2 ? 'Positive' : 'Negative'}
                </Badge>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider">SIRS Criteria</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{result.sirs.filter((s) => s.met).length}/4</p>
                <div className="flex flex-wrap gap-1 justify-center mt-2">
                  {result.sirs.map((s, i) => (
                    <Badge key={i} variant="outline" className={cn('text-[10px]', s.met ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-800 text-slate-500 border-slate-700')}>
                      {s.met ? '✓' : '✗'} {s.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider">SOFA Score</p>
                <p className={cn('text-3xl font-bold mt-1', result.sofa >= 2 ? 'text-rose-400' : 'text-slate-300')}>{result.sofa}/24</p>
                <Badge variant="outline" className={cn('mt-2 text-xs', result.sofa >= 2 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-slate-800 text-slate-400 border-slate-700')}>
                  {result.sofa >= 2 ? 'Organ Dysfunction' : 'No Dysfunction'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Sepsis Likelihood</CardTitle>
                <Badge variant="outline" className={likelihoodColor(result.likelihood)}>
                  {result.likelihood.replace(/_/g, ' ').toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', likelihoodBarColor(result.likelihood))}
                  style={{ width: `${likelihoodPct(result.likelihood)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Low</span><span>Moderate</span><span>High</span><span>Very High</span>
              </div>
            </CardContent>
          </Card>

          {result.septicShock && (
            <Card className="bg-red-500/10 border-red-500/40 animate-pulse">
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-400" />
                <div>
                  <p className="text-red-400 font-bold">SEPTIC SHOCK WARNING</p>
                  <p className="text-sm text-red-300">Sepsis with vasopressor requirement and/or lactate &gt; 2 mmol/L despite adequate volume resuscitation.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900/80 border-slate-700/50">
            <CardHeader className="pb-3"><CardTitle className="text-white text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-amber-400" />1-Hour Bundle (API)</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {result.bundle.map((b, i) => (
                <div key={i} className={cn('flex items-center gap-3 rounded-md px-3 py-2', b.done ? 'bg-emerald-500/10' : 'bg-slate-800/50')}>
                  {b.done ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-slate-500" />}
                  <span className={cn('text-sm', b.done ? 'text-emerald-300' : 'text-slate-400')}>{b.item}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 1-Hour Bundle Checklist with Timestamps */}
          <Card className="glass-card border-0">
            <CardHeader className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  1-Hour Bundle Checklist
                </CardTitle>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-mono text-slate-400">{elapsed}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                    {completedCount}/{checklist.length}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer transition-all duration-200 border',
                    item.checked
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50'
                  )}
                >
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => toggleChecklist(item.id)}
                    className="pointer-events-none"
                  />
                  <span className={cn('text-sm flex-1', item.checked ? 'text-emerald-300' : 'text-slate-400')}>
                    {item.label}
                  </span>
                  {item.checked && item.timestamp && (
                    <span className="text-[10px] font-mono text-emerald-500/70">
                      {formatTime(item.timestamp)}
                    </span>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden mr-3">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportChecklist}
                  className="h-7 gap-1.5 text-slate-400 hover:text-white shrink-0"
                >
                  <Download className="w-3 h-3" />
                  <span className="text-[10px]">Export</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

function localScreen(v: SepsisInput): SepsisResult {
  const temp = parseFloat(v.temp), hr = parseInt(v.hr), rr = parseInt(v.rr), sbp = parseInt(v.sbp);
  const wbc = v.wbc ? parseFloat(v.wbc) : 8, lactate = v.lactate ? parseFloat(v.lactate) : 1;
  const qsofa = [hr >= 130, sbp <= 100, v.consciousness !== 'A'].filter(Boolean).length;

  const sirs = [
    { name: 'Temp >38/ <36', met: temp > 38 || temp < 36 },
    { name: 'HR >90', met: hr > 90 },
    { name: 'RR >20', met: rr > 20 },
    { name: 'WBC >12/ <4', met: wbc > 12 || wbc < 4 },
  ];

  let sofa = 0;
  if (sbp < 100) sofa += 1;
  if (lactate >= 2) sofa += 1;
  if (v.consciousness !== 'A') sofa += 1;
  if (rr >= 22) sofa += 1;
  if (wbc >= 12 || wbc < 4) sofa += 1;

  const septicShock = sofa >= 2 && (sbp < 90 || lactate > 2);

  let likelihood: SepsisResult['likelihood'] = 'low';
  if ((qsofa >= 2 && v.infection) || sofa >= 2) likelihood = 'very_high';
  else if (qsofa >= 2 || (sirs.filter((s) => s.met).length >= 3 && v.infection)) likelihood = 'high';
  else if (sirs.filter((s) => s.met).length >= 2 && v.infection) likelihood = 'moderate';

  return {
    qsofa, sirs, sofa, likelihood, septicShock,
    bundle: [
      { item: 'Measure lactate level', done: v.lactate !== '' },
      { item: 'Obtain blood cultures before antibiotics', done: false },
      { item: 'Administer broad-spectrum antibiotics', done: false },
      { item: 'Administer 30 mL/kg crystalloid if hypotension or lactate ≥4', done: sbp < 90 && v.infection },
      { item: 'Apply vasopressors if MAP < 65 after fluids', done: false },
    ],
  };
}