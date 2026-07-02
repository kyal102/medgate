'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const BUNDLES = {
  clabsi: { name: 'CLABSI Prevention', items: ['Hand hygiene before access', 'Maximal barrier precautions', 'CHG skin antisepsis', 'Optimal site (subclavian preferred)', 'Daily line necessity review'] },
  cauti: { name: 'CAUTI Prevention', items: ['Indication documented at insertion', 'Aseptic technique for insertion', 'Secure catheter properly', 'Closed drainage system', 'Daily necessity review — remove ASAP'] },
  vap: { name: 'VAP Prevention', items: ['Head of bed elevation 30-45°', 'Daily sedation vacation (SAT)', 'DVT prophylaxis', 'Stress ulcer prophylaxis', 'Oral care with CHG (0.12%)'] },
};

export function InfectionControlBundles() {
  const [bundle, setBundle] = useState<keyof typeof BUNDLES>('clabsi');
  const [completed, setCompleted] = useState<Record<string, Record<number, boolean>>>({ clabsi: {}, cauti: {}, vap: {} });
  const [deviceDays, setDeviceDays] = useState({ cl: 100, foley: 150, vent: 80 });
  const [infections, setInfections] = useState({ cl: 1, foley: 2, vent: 1 });

  const current = BUNDLES[bundle];
  const items = completed[bundle] || {};
  const completedCount = current.items.filter((_, i) => items[i]).length;
  const compliance = Math.round((completedCount / current.items.length) * 100);

  const rates = {
    cl: deviceDays.cl > 0 ? ((infections.cl / deviceDays.cl) * 1000).toFixed(2) : '0',
    foley: deviceDays.foley > 0 ? ((infections.foley / deviceDays.foley) * 1000).toFixed(2) : '0',
    vent: deviceDays.vent > 0 ? ((infections.vent / deviceDays.vent) * 1000).toFixed(2) : '0',
  };
  const benchmarks = { cl: '0.8', foley: '1.2', vent: '1.0' };

  const toggleItem = (index: number) => setCompleted(prev => ({ ...prev, [bundle]: { ...prev[bundle], [index]: !prev[bundle]?.[index] } }));

  return (
    <div className="space-y-4">
      <Tabs value={bundle} onValueChange={v => setBundle(v as keyof typeof BUNDLES)}>
        <TabsList className="grid w-full grid-cols-3">
          {Object.entries(BUNDLES).map(([id, b]) => <TabsTrigger key={id} value={id} className="text-xs">{b.name}</TabsTrigger>)}
        </TabsList>

        {(['clabsi', 'cauti', 'vap'] as const).map(bId => (
          <TabsContent key={bId} value={bId} className="space-y-4 mt-3">
            <Card className="glass-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{BUNDLES[bId].name}</h4>
                  <span className={cn('text-lg font-bold', compliance >= 80 ? 'text-emerald-400' : compliance >= 60 ? 'text-amber-400' : 'text-rose-400')}>{compliance}%</span>
                </div>
                <Progress value={compliance} className="h-2" />
                <div className="space-y-2">
                  {BUNDLES[bId].items.map((item, i) => (
                    <button key={i} onClick={() => toggleItem(i)} className={cn('w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left text-xs', items[i] ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-muted/30 hover:bg-muted/20')}>
                      <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px]', items[i] ? 'bg-emerald-500 text-white' : 'border border-muted-foreground/30')}>{items[i] ? '✓' : ''}</div>
                      {item}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Infection Rates Dashboard */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Infection Rates (per 1,000 device-days)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'CLABSI', rate: rates.cl, benchmark: benchmarks.cl, days: deviceDays.cl, setDays: (v: number) => setDeviceDays(p => ({ ...p, cl: v })), infections: infections.cl, setInf: (v: number) => setInfections(p => ({ ...p, cl: v })) },
              { label: 'CAUTI', rate: rates.foley, benchmark: benchmarks.foley, days: deviceDays.foley, setDays: (v: number) => setDeviceDays(p => ({ ...p, foley: v })), infections: infections.foley, setInf: (v: number) => setInfections(p => ({ ...p, foley: v })) },
              { label: 'VAP', rate: rates.vent, benchmark: benchmarks.vent, days: deviceDays.vent, setDays: (v: number) => setDeviceDays(p => ({ ...p, vent: v })), infections: infections.vent, setInf: (v: number) => setInfections(p => ({ ...p, vent: v })) },
            ].map((d, i) => (
              <div key={i} className="icu-device-day p-3 text-center">
                <div className="text-xs font-semibold">{d.label}</div>
                <div className={cn('text-2xl font-bold', parseFloat(d.rate) > parseFloat(d.benchmark) ? 'text-rose-400' : 'text-emerald-400')}>{d.rate}</div>
                <div className="text-[9px] text-muted-foreground">Benchmark: {d.benchmark}</div>
                <div className="text-[9px] text-muted-foreground mt-1">{d.days} device-days | {d.infections} infections</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}