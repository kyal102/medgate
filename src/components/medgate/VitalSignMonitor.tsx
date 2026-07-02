'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VitalInput {
  spo2: string;
  hr: string;
  sbp: string;
  rr: string;
  temp: string;
  consciousness: string;
}

interface ParamResult {
  name: string;
  value: number | string;
  unit: string;
  status: 'normal' | 'elevated' | 'critical' | 'low';
  score: number;
}

interface VitalsResult {
  news2: number;
  qsofa: number;
  params: ParamResult[];
  recommendations: string[];
}

const INITIAL: VitalInput = { spo2: '', hr: '', sbp: '', rr: '', temp: '', consciousness: 'A' };

const PRESETS: { label: string; values: VitalInput }[] = [
  { label: 'Normal Adult', values: { spo2: '98', hr: '72', sbp: '120', rr: '16', temp: '36.8', consciousness: 'A' } },
  { label: 'Tachycardic', values: { spo2: '96', hr: '135', sbp: '115', rr: '22', temp: '37.2', consciousness: 'A' } },
  { label: 'Hypotensive', values: { spo2: '94', hr: '110', sbp: '82', rr: '24', temp: '36.5', consciousness: 'V' } },
  { label: 'Febrile Sepsis', values: { spo2: '91', hr: '128', sbp: '88', rr: '28', temp: '39.4', consciousness: 'C' } },
  { label: 'Pediatric 5yo', values: { spo2: '97', hr: '110', sbp: '95', rr: '24', temp: '37.5', consciousness: 'A' } },
];

function news2Color(score: number) {
  if (score <= 4) return 'text-emerald-400';
  if (score <= 6) return 'text-amber-400';
  return 'text-red-400';
}

function news2Bg(score: number) {
  if (score <= 4) return 'bg-emerald-500';
  if (score <= 6) return 'bg-amber-500';
  return 'bg-red-500';
}

function paramStatusColor(s: string) {
  if (s === 'normal') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  if (s === 'elevated') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (s === 'low') return 'bg-sky-500/20 text-sky-400 border-sky-500/40';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
}

function gaugeColor(status: string) {
  if (status === 'normal') return { from: '#10b981', to: '#34d399' }; // emerald
  if (status === 'elevated') return { from: '#f59e0b', to: '#fbbf24' }; // amber
  if (status === 'low') return { from: '#0ea5e9', to: '#38bdf8' }; // sky
  return { from: '#f43f5e', to: '#fb7185' }; // rose
}

function gaugePercent(paramName: string, value: number | string): number {
  const v = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(v)) return 50;
  switch (paramName) {
    case 'SpO2': return Math.min(100, Math.max(0, ((v - 70) / 30) * 100));
    case 'HR': return Math.min(100, Math.max(0, (v / 200) * 100));
    case 'SBP': return Math.min(100, Math.max(0, (v / 200) * 100));
    case 'RR': return Math.min(100, Math.max(0, (v / 40) * 100));
    case 'Temp': return Math.min(100, Math.max(0, ((v - 34) / 8) * 100));
    case 'AVPU': return v === 'A' ? 100 : v === 'C' ? 50 : v === 'V' ? 30 : 10;
    default: return 50;
  }
}

export function VitalSignMonitor() {
  const [vitals, setVitals] = useState<VitalInput>(INITIAL);
  const [result, setResult] = useState<VitalsResult | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (key: keyof VitalInput, val: string) => setVitals((p) => ({ ...p, [key]: val }));

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setVitals(preset.values);
    setResult(null);
  };

  const analyze = async () => {
    if (!vitals.spo2 || !vitals.hr || !vitals.sbp || !vitals.rr || !vitals.temp) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/vital-signs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spo2: parseInt(vitals.spo2), hr: parseInt(vitals.hr), sbp: parseInt(vitals.sbp),
          rr: parseInt(vitals.rr), temp: parseFloat(vitals.temp), consciousness: vitals.consciousness,
        }),
      });
      if (res.ok) { setResult(await res.json()); } else { setResult(localAnalyze(vitals)); }
    } catch { setResult(localAnalyze(vitals)); }
    setLoading(false);
  };

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          {/* Quick Presets */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quick Presets</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium rounded-md border transition-all duration-200',
                    'bg-slate-800/60 border-slate-700/50 text-slate-400',
                    'hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-cyan-500/5'
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {([
              ['spo2', 'SpO2 (%)', '96'],
              ['hr', 'Heart Rate (bpm)', '72'],
              ['sbp', 'Systolic BP (mmHg)', '120'],
              ['rr', 'Resp Rate (/min)', '16'],
              ['temp', 'Temperature (°C)', '37.0'],
            ] as const).map(([key, label, placeholder]) => (
              <div key={key} className="space-y-2">
                <label className="text-sm text-slate-400">{label}</label>
                <Input
                  type="number" step={key === 'temp' ? '0.1' : '1'}
                  placeholder={placeholder}
                  value={vitals[key as keyof VitalInput]}
                  onChange={(e) => update(key as keyof VitalInput, e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            ))}
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Consciousness (ACVPU)</label>
              <select
                value={vitals.consciousness}
                onChange={(e) => update('consciousness', e.target.value)}
                className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/50 px-3 text-sm text-white"
              >
                {['A', 'C', 'V', 'P', 'U'].map((c) => (
                  <option key={c} value={c}>
                    {c === 'A' ? 'Alert' : c === 'C' ? 'Confusion' : c === 'V' ? 'Voice' : c === 'P' ? 'Pain' : 'Unresponsive'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button onClick={analyze} disabled={loading} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white">
            {loading ? 'Analyzing...' : 'Analyze Vitals'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-6 flex flex-col items-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">NEWS2 Score</p>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none" className={news2Bg(result.news2)}
                      strokeWidth="10" strokeDasharray={`${Math.min(result.news2 * 10, 100) * 3.14} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-3xl font-bold', news2Color(result.news2))}>{result.news2}</span>
                    <span className="text-xs text-slate-400">/20</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('mt-3',
                  result.news2 <= 4 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                  result.news2 <= 6 ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                  'bg-rose-500/20 text-rose-400 border-rose-500/40'
                )}>
                  {result.news2 <= 4 ? 'Low Risk' : result.news2 <= 6 ? 'Medium Risk' : 'High Risk'}
                </Badge>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardContent className="p-6 flex flex-col items-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">qSOFA Score</p>
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(30,41,59)" strokeWidth="10" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      className={result.qsofa >= 2 ? 'bg-rose-500' : 'bg-emerald-500'}
                      strokeWidth="10" strokeDasharray={`${(result.qsofa / 3) * 314} 314`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={cn('text-3xl font-bold', result.qsofa >= 2 ? 'text-rose-400' : 'text-emerald-400')}>{result.qsofa}</span>
                    <span className="text-xs text-slate-400">/3</span>
                  </div>
                </div>
                <Badge variant="outline" className={cn('mt-3',
                  result.qsofa >= 2 ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                )}>
                  {result.qsofa >= 2 ? 'Sepsis Likely' : 'Low Suspicion'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Color-coded gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.params.map((p, i) => {
              const colors = gaugeColor(p.status);
              const pct = gaugePercent(p.name, p.value);
              return (
                <Card key={i} className="bg-slate-900/80 border-slate-700/50">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">{p.name}</p>
                      <Badge variant="outline" className={cn('text-[10px]', paramStatusColor(p.status))}>
                        {p.status === 'elevated' && <ArrowUp className="w-2 h-2 mr-0.5" />}
                        {p.status === 'low' && <ArrowDown className="w-2 h-2 mr-0.5" />}
                        {p.score}pt
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-xl font-bold text-white">{p.value}</p>
                      <span className="text-xs text-slate-500">{p.unit}</span>
                    </div>
                    {/* Gauge bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {result.recommendations.length > 0 && (
            <Card className="bg-slate-900/80 border-slate-700/50">
              <CardHeader className="pb-2"><CardTitle className="text-white text-sm">Recommendations</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle className={cn('w-4 h-4 mt-0.5 shrink-0', i === 0 ? 'text-rose-400' : 'text-amber-400')} />
                    <p className="text-sm text-slate-300">{r}</p>
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

function localAnalyze(v: VitalInput): VitalsResult {
  const spo2 = parseInt(v.spo2), hr = parseInt(v.hr), sbp = parseInt(v.sbp);
  const rr = parseInt(v.rr), temp = parseFloat(v.temp), cons = v.consciousness;
  const params: ParamResult[] = [];
  let news2 = 0;

  let s = spo2 <= 91 ? 3 : spo2 <= 93 ? 2 : spo2 <= 95 ? 1 : 0; news2 += s;
  params.push({ name: 'SpO2', value: spo2, unit: '%', status: s === 0 ? 'normal' : s >= 3 ? 'critical' : 'elevated', score: s });

  s = hr >= 131 ? 3 : hr >= 111 ? 2 : hr >= 91 ? 1 : hr <= 40 ? 3 : hr <= 50 ? 1 : 0; news2 += s;
  params.push({ name: 'HR', value: hr, unit: 'bpm', status: s === 0 ? 'normal' : s >= 3 ? 'critical' : 'elevated', score: s });

  s = sbp <= 90 ? 3 : sbp <= 100 ? 2 : sbp <= 110 ? 1 : 0; news2 += s;
  params.push({ name: 'SBP', value: sbp, unit: 'mmHg', status: s === 0 ? 'normal' : s >= 3 ? 'critical' : 'low', score: s });

  s = rr >= 25 ? 3 : rr >= 21 ? 2 : rr <= 8 ? 3 : rr <= 11 ? 1 : 0; news2 += s;
  params.push({ name: 'RR', value: rr, unit: '/min', status: s === 0 ? 'normal' : s >= 3 ? 'critical' : 'elevated', score: s });

  s = temp >= 39.1 ? 3 : temp >= 38.1 ? 1 : temp <= 35.0 ? 3 : temp <= 36.0 ? 1 : 0; news2 += s;
  params.push({ name: 'Temp', value: temp, unit: '°C', status: s === 0 ? 'normal' : s >= 3 ? 'critical' : 'elevated', score: s });

  s = cons === 'A' ? 0 : cons === 'C' || cons === 'V' ? 3 : cons === 'P' ? 3 : 3; news2 += s;
  params.push({ name: 'AVPU', value: cons, unit: '', status: s === 0 ? 'normal' : 'critical', score: s });

  const qsofa = [hr >= 130, sbp <= 100, cons !== 'A'].filter(Boolean).length;

  const recs: string[] = [];
  if (news2 >= 7) recs.push('URGENT: High clinical risk — escalate to critical care team immediately.');
  else if (news2 >= 5) recs.push('Medium risk — increase monitoring frequency to at least hourly. Consider senior review.');
  else recs.push('Low clinical risk — continue routine monitoring (4-12 hourly).');
  if (qsofa >= 2) recs.push('qSOFA ≥ 2: Consider sepsis screening. Obtain lactate and blood cultures if suspected infection.');
  if (spo2 <= 93) recs.push('Supplemental oxygen recommended. Target SpO2 94-98% (88-92% if COPD).');

  return { news2, qsofa, params, recommendations: recs };
}