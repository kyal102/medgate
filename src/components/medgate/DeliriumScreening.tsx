'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Brain, CheckCircle2, XCircle, AlertTriangle, Info, ShieldCheck, ChevronDown } from 'lucide-react';

interface FeatureResult {
  positive: boolean;
  assessed: boolean;
}

const FEATURES = [
  { id: 'acute', label: 'Feature 1: Acute Onset / Fluctuating Course', description: 'Is there an acute change in mental status? Has the patient had fluctuating behavior in the past 24 hours?', method: 'Compare current mental status with baseline. Ask nurse/family about fluctuations.' },
  { id: 'inattention', label: 'Feature 2: Inattention', description: 'Difficulty focusing or maintaining attention? Easy to distract?', method: 'Use ASE Letters: Read S-A-V-E-A-H-A-A-R-T. Patient squeezes on "A".' },
  { id: 'loc', label: 'Feature 3: Altered Level of Consciousness', description: 'Any change in LOC beyond expected sedation level?', method: 'Assess RASS score. Is it different from baseline or target?' },
  { id: 'thinking', label: 'Feature 4: Disorganized Thinking', description: 'Incoherent or illogical speech? Unclear/irrational thinking?', method: 'YES/NO Questions: "Will a stone float on water?" "Are there fish in the sea?" Command: "Hold up 2 fingers"' },
];

const PREVENTION_BUNDLE = [
  'Reorient patient frequently (clock, calendar, familiar objects)',
  'Promote normal sleep-wake cycle (reduce noise/light at night)',
  'Early mobilization and physical therapy',
  'Avoid unnecessary catheters and restraints',
  'Maintain hydration and nutrition',
  'Address pain proactively (avoid opioids if possible)',
  'Encourage family presence and communication',
  'Avoid benzodiazepines (use non-benzo sedation)',
  'Correct sensory deficits (glasses, hearing aids)',
  'Cognitive stimulation (conversation, activities)',
];

export function DeliriumScreening() {
  const [features, setFeatures] = useState<Record<string, FeatureResult>>({
    acute: { positive: false, assessed: false },
    inattention: { positive: false, assessed: false },
    loc: { positive: false, assessed: false },
    thinking: { positive: false, assessed: false },
  });
  const [showPrevention, setShowPrevention] = useState(false);
  const [history, setHistory] = useState(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('delirium-history') || '[]'); } catch { return []; }
  });

  const result = useMemo(() => {
    const f = features;
    const f1 = f.acute.assessed && f.acute.positive;
    const f2 = f.inattention.assessed && f.inattention.positive;
    const f3 = f.loc.assessed && f.loc.positive;
    const f4 = f.thinking.assessed && f.thinking.positive;
    const deliriumPositive = f1 && f2 && (f3 || f4);
    const allAssessed = Object.values(f).every(v => v.assessed);
    return { f1, f2, f3, f4, deliriumPositive, allAssessed };
  }, [features]);

  const gate = useMemo(() => {
    if (!result.allAssessed) return 'PENDING';
    if (result.deliriumPositive) return 'BLOCK';
    if (result.f1 && result.f2) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [result]);

  const toggleFeature = (id: string, value: boolean) => {
    setFeatures(prev => ({ ...prev, [id]: { positive: value, assessed: true } }));
  };

  const saveAssessment = () => {
    const entry = { id: Date.now(), time: new Date().toISOString(), result: result.deliriumPositive ? 'Positive' : 'Negative', features: { ...features } };
    const newHistory = [entry, ...history].slice(0, 10);
    setHistory(newHistory);
    if (typeof window !== 'undefined') localStorage.setItem('delirium-history', JSON.stringify(newHistory));
    toast.success('Assessment saved');
  };

  const reset = () => {
    setFeatures({ acute: { positive: false, assessed: false }, inattention: { positive: false, assessed: false }, loc: { positive: false, assessed: false }, thinking: { positive: false, assessed: false } });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {FEATURES.map((feat, i) => (
          <motion.div key={feat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className={cn('glass-card transition-all duration-300', features[feat.id].assessed && (features[feat.id].positive ? 'cam-feature-positive' : 'cam-feature-negative'))}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm">{feat.label}</h4>
                  <Badge variant="outline" className={cn('text-xs', !features[feat.id].assessed && 'text-muted-foreground')}>
                    {features[feat.id].assessed ? (features[feat.id].positive ? 'Positive' : 'Negative') : 'Pending'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{feat.description}</p>
                <div className="rounded-lg bg-muted/30 p-2 text-xs space-y-1">
                  <span className="font-medium">Method: </span>{feat.method}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={features[feat.id].positive ? 'destructive' : 'outline'} className={cn('flex-1 text-xs', features[feat.id].positive && 'bg-rose-500/20 hover:bg-rose-500/30')} onClick={() => toggleFeature(feat.id, true)}>
                    <XCircle className="w-3 h-3 mr-1" /> Positive
                  </Button>
                  <Button size="sm" variant={!features[feat.id].positive && features[feat.id].assessed ? 'default' : 'outline'} className={cn('flex-1 text-xs', !features[feat.id].positive && features[feat.id].assessed && 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400')} onClick={() => toggleFeature(feat.id, false)}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Negative
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Algorithm Flow */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /> CAM-ICU Algorithm</h4>
          <div className="flex flex-col items-center gap-2 text-xs">
            <div className={cn('px-4 py-2 rounded-lg font-medium', result.f1 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-muted/30 text-muted-foreground border border-muted')}>Feature 1 + Feature 2</div>
            <div className="text-muted-foreground">AND</div>
            <div className={cn('px-4 py-2 rounded-lg font-medium', (result.f3 || result.f4) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-muted/30 text-muted-foreground border border-muted')}>Feature 3 OR Feature 4</div>
            <div className="text-muted-foreground mt-1">↓</div>
            <div className={cn('px-6 py-3 rounded-xl text-center font-bold', result.deliriumPositive ? 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40' : result.allAssessed ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40' : 'bg-muted/20 text-muted-foreground')}>
              {result.deliriumPositive ? 'DELIRIUM POSITIVE' : result.allAssessed ? 'DELIRIUM NEGATIVE' : 'Awaiting assessment'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result.allAssessed && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Alert className={cn(result.deliriumPositive ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
            <AlertTitle className="flex items-center gap-2">
              {result.deliriumPositive ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
              {result.deliriumPositive ? 'Delirium Detected — Immediate Action Required' : 'No Delirium — Continue Monitoring'}
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm">
              {result.deliriumPositive
                ? 'Initiate non-pharmacologic interventions immediately. Identify and treat reversible causes (infection, pain, medication side effects, urinary retention, constipation). Consider pharmacologic treatment if agitation is severe.'
                : 'Continue CAM-ICU screening every 8-12 hours. Maintain delirium prevention bundle. Reassess if clinical status changes.'}
            </AlertDescription>
          </Alert>
          {result.deliriumPositive && (
            <div className="mt-3 p-3 rounded-lg bg-muted/20 text-xs space-y-1">
              <p className="font-semibold">⚠️ Reversible Causes to Evaluate:</p>
              <p>Medications (anticholinergics, benzodiazepines, opioids) • Infection/Sepsis • Pain • Urinary retention • Constipation • Electrolyte imbalance • Alcohol/substance withdrawal • Hypoxia/Hypercapnia • Sleep deprivation</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button onClick={saveAssessment} size="sm" className="text-xs"><Info className="w-3 h-3 mr-1" /> Save Assessment</Button>
        <Button onClick={reset} variant="outline" size="sm" className="text-xs">Reset</Button>
        <Button onClick={() => setShowPrevention(!showPrevention)} variant="outline" size="sm" className="text-xs"><ChevronDown className="w-3 h-3 mr-1" /> Prevention Bundle</Button>
        <Badge variant="outline" className={cn('ml-auto text-xs px-3 py-1', gate === 'BLOCK' && 'border-rose-500/40 text-rose-400', gate === 'NEEDS_REVIEW' && 'border-amber-500/40 text-amber-400', gate === 'ALLOW' && 'border-emerald-500/40 text-emerald-400')}>
          Gate: {gate}
        </Badge>
      </div>

      {showPrevention && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
          <Card className="glass-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm">ABC Delirium Prevention Bundle</CardTitle></CardHeader>
            <CardContent className="space-y-1.5">
              {PREVENTION_BUNDLE.map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />{item}</div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Assessments</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {history.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/20">
                  <span>{new Date(h.time).toLocaleString()}</span>
                  <Badge variant="outline" className={cn(h.result === 'Positive' ? 'text-rose-400 border-rose-500/30' : 'text-emerald-400 border-emerald-500/30')}>{h.result}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}