'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Skull, Info, History, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DRUG_INTERACTIONS, type DrugInteraction } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';

const ALL_DRUGS = [
  'warfarin', 'trimethoprim-sulfamethoxazole', 'methotrexate', 'ibuprofen',
  'ssri', 'tramadol', 'clopidogrel', 'omeprazole', 'amoxicillin', 'probenecid',
  'metformin', 'contrast (iodinated)', 'statins', 'clarithromycin',
  'ace inhibitors', 'potassium supplements', 'digoxin', 'amiodarone',
  'levodopa', 'maois', 'paracetamol', 'aspirin', 'lithium', 'valproate',
];

const SEVERITY_STYLES: Record<string, string> = {
  MINOR: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
  MODERATE: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  SEVERE: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  FATAL: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
};

const SEVERITY_ICONS: Record<string, typeof Info> = {
  MINOR: Info,
  MODERATE: AlertTriangle,
  SEVERE: ShieldAlert,
  FATAL: Skull,
};

const SEVERITY_LEGEND = [
  { key: 'Critical/Fatal', color: 'bg-red-500', textColor: 'text-red-400', desc: 'Contraindicated — may cause death' },
  { key: 'Major/Severe', color: 'bg-rose-500', textColor: 'text-rose-400', desc: 'Serious harm — close monitoring required' },
  { key: 'Moderate', color: 'bg-amber-500', textColor: 'text-amber-400', desc: 'Clinically significant — monitor closely' },
  { key: 'Minor', color: 'bg-sky-500', textColor: 'text-sky-400', desc: 'Limited clinical effect — observe' },
];

interface HistoryEntry {
  drugA: string;
  drugB: string;
  timestamp: number;
  topSeverity: string;
}

const HISTORY_KEY = 'medgate-drug-check-history';

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 5)));
}

export function DrugInteractionChecker() {
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [results, setResults] = useState<DrugInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const checkInteraction = async (a?: string, b?: string) => {
    const dA = a ?? drugA;
    const dB = b ?? drugB;
    if (!dA || !dB) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/drug-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugA: dA, drugB: dB }),
      });
      if (res.ok) {
        const data = await res.json();
        const interactions = data.interactions || [];
        setResults(interactions);

        // Determine top severity for history
        const sevOrder = ['FATAL', 'SEVERE', 'MODERATE', 'MINOR'];
        const topSev = interactions.length > 0
          ? sevOrder.find(s => interactions.some((i: DrugInteraction) => i.severity === s)) || 'MINOR'
          : 'NONE';

        // Save to history
        const newEntry: HistoryEntry = { drugA: dA, drugB: dB, timestamp: Date.now(), topSeverity: topSev };
        const updated = [newEntry, ...history.filter(h => !(h.drugA === dA && h.drugB === dB))].slice(0, 5);
        setHistory(updated);
        saveHistory(updated);

        if (interactions.length > 0) {
          const hasFatal = interactions.some((i: DrugInteraction) => i.severity === 'FATAL');
          const hasSevere = interactions.some((i: DrugInteraction) => i.severity === 'SEVERE');
          if (hasFatal) {
            toast.error(`FATAL interaction detected!`, {
              description: `${dA} + ${dB} — ${interactions.length} interaction(s) found. Immediate review required.`,
              duration: 8000,
            });
          } else if (hasSevere) {
            toast.error('Severe drug interaction', {
              description: `${dA} + ${dB} — ${interactions.length} interaction(s) found.`,
              duration: 6000,
            });
          } else {
            toast.warning('Drug interactions found', {
              description: `${dA} + ${dB} — ${interactions.length} interaction(s) of minor/moderate severity.`,
            });
          }
        } else {
          toast.success('No interactions found', {
            description: `${dA} + ${dB} — No known interactions in database.`,
          });
        }
      } else {
        const local = DRUG_INTERACTIONS.filter(
          (d) =>
            (d.drugA.toLowerCase() === dA.toLowerCase() && d.drugB.toLowerCase() === dB.toLowerCase()) ||
            (d.drugB.toLowerCase() === dA.toLowerCase() && d.drugA.toLowerCase() === dB.toLowerCase())
        );
        setResults(local);
      }
    } catch {
      toast.error('Connection error', { description: 'Using local fallback database.' });
      const local = DRUG_INTERACTIONS.filter(
        (d) =>
          (d.drugA.toLowerCase() === dA.toLowerCase() && d.drugB.toLowerCase() === dB.toLowerCase()) ||
          (d.drugB.toLowerCase() === dA.toLowerCase() && d.drugA.toLowerCase() === dB.toLowerCase())
      );
      setResults(local);
    }
    setLoading(false);
  };

  const rerunCheck = (entry: HistoryEntry) => {
    setDrugA(entry.drugA);
    setDrugB(entry.drugB);
    checkInteraction(entry.drugA, entry.drugB);
  };

  return (
    <section className="space-y-6">
      {/* Severity Legend */}
      <Card className="glass-card border-0">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity Legend</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {SEVERITY_LEGEND.map((sev) => (
              <div key={sev.key} className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', sev.color)} />
                <div>
                  <p className={cn('text-[10px] font-semibold', sev.textColor)}>{sev.key}</p>
                  <p className="text-[9px] text-slate-500 leading-tight">{sev.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Drug A</label>
              <Input
                placeholder="e.g. warfarin"
                value={drugA}
                onChange={(e) => setDrugA(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                list="drug-list-a"
              />
              <datalist id="drug-list-a">
                {ALL_DRUGS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Drug B</label>
              <Input
                placeholder="e.g. aspirin"
                value={drugB}
                onChange={(e) => setDrugB(e.target.value)}
                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                list="drug-list-b"
              />
              <datalist id="drug-list-b">
                {ALL_DRUGS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
            </div>
          </div>
          <Button
            onClick={() => checkInteraction()}
            disabled={loading || !drugA || !drugB}
            className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            {loading ? 'Checking...' : 'Check Interaction'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Checks */}
      {history.length > 0 && (
        <Card className="glass-card border-0">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Recent Checks
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="space-y-1.5">
              {history.map((entry, i) => (
                <button
                  key={`${entry.drugA}-${entry.drugB}-${i}`}
                  onClick={() => rerunCheck(entry)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-slate-800/40 border border-slate-700/30 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <RotateCcw className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                    <span className="text-xs text-slate-300 truncate">
                      <span className="font-medium text-white">{entry.drugA}</span>
                      <span className="text-slate-500 mx-1">↔</span>
                      <span className="font-medium text-white">{entry.drugB}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {entry.topSeverity !== 'NONE' && (
                      <div className={cn('w-2 h-2 rounded-full',
                        entry.topSeverity === 'FATAL' ? 'bg-red-500' :
                        entry.topSeverity === 'SEVERE' ? 'bg-rose-500' :
                        entry.topSeverity === 'MODERATE' ? 'bg-amber-500' :
                        'bg-sky-500'
                      )} />
                    )}
                    <span className="text-[10px] text-slate-600 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {results.length === 0 && drugA && drugB && !loading && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-sm">No known interactions found between {drugA} and {drugB}.</p>
          </CardContent>
        </Card>
      )}
      <div className="space-y-4">
        {results.map((r, i) => {
          const SevIcon = SEVERITY_ICONS[r.severity] || Info;
          return (
            <Card key={i} className={cn('border', SEVERITY_STYLES[r.severity])}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">
                    {r.drugA} ↔ {r.drugB}
                  </CardTitle>
                  <Badge variant="outline" className={cn(SEVERITY_STYLES[r.severity])}>
                    <SevIcon className="w-3 h-3 mr-1" />
                    {r.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Mechanism</p>
                  <p className="text-slate-200 text-sm">{r.mechanism}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Clinical Effect</p>
                  <p className="text-slate-200 text-sm">{r.clinicalEffect}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Management</p>
                  <p className={cn('text-sm font-medium', r.severity === 'FATAL' ? 'text-red-400' : r.severity === 'SEVERE' ? 'text-rose-300' : 'text-amber-300')}>
                    {r.management}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}