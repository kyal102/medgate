'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

const WARFARIN_ADJUST = [
  { range: [0, 1.4], label: 'INR Subtherapeutic', action: 'Increase warfarin 5-20% (consider loading dose if <1.5)', color: 'inr-zone-subtherapeutic' },
  { range: [1.5, 1.9], label: 'Below Target', action: 'Increase dose 5-10%. Repeat INR in 1-2 weeks.', color: 'inr-zone-subtherapeutic' },
  { range: [2.0, 3.0], label: 'Therapeutic (AF/DVT)', action: 'Continue current dose. Routine INR monitoring.', color: 'inr-zone-therapeutic' },
  { range: [3.1, 4.0], label: 'Supratherapeutic', action: 'Hold 1 dose. Resume at lower dose when INR <3.0.', color: 'inr-zone-supratherapeutic' },
  { range: [4.1, 5.0], label: 'High INR (no bleeding)', action: 'Hold warfarin. Vitamin K 1-2.5mg PO. Repeat INR in 24h.', color: 'inr-zone-critical' },
  { range: [5.1, 9.0], label: 'Very High (no bleeding)', action: 'Hold warfarin. Vitamin K 2.5-5mg PO. Repeat INR in 24h. Restart when INR <5.', color: 'inr-zone-critical' },
  { range: [9.1, 100], label: 'Critical INR', action: 'Hold warfarin. Vitamin K 10mg IV over 20 min. FFP or PCC if bleeding. Repeat INR q6-12h.', color: 'inr-zone-critical' },
];

const DOACS = [
  { name: 'Apixaban', afDose: '5mg BID', afRenal: { normal: '5mg BID', cr30: '5mg BID', cr25: '5mg BID', cr15: 'Avoid (or 5mg BID if on dialysis)' }, vteDose: '10mg BID ×7d, then 5mg BID', reversal: 'Andexanet alfa (Andexxa)', holdPeriop: '24-48h', halfLife: '12h' },
  { name: 'Rivaroxaban', afDose: '20mg daily with evening meal', afRenal: { normal: '20mg daily', cr30: '15mg daily', cr25: '15mg daily', cr15: 'Avoid' }, vteDose: '15mg BID ×21d, then 20mg daily', reversal: 'Andexanet alfa', holdPeriop: '24-48h', halfLife: '5-13h' },
  { name: 'Dabigatran', afDose: '150mg BID', afRenal: { normal: '150mg BID', cr30: '150mg BID', cr25: '75mg BID', cr15: 'Avoid' }, vteDose: '150mg BID', reversal: 'Idarucizumab (Praxbind) 5g IV', holdPeriop: '24-48h (48-96h if CrCl<50)', halfLife: '12-17h' },
  { name: 'Edoxaban', afDose: '60mg daily', afRenal: { normal: '60mg daily', cr30: '30mg daily', cr25: '30mg daily', cr15: 'Avoid' }, vteDose: '60mg daily', reversal: 'Andexanet alfa', holdPeriop: '24-48h', halfLife: '10-14h' },
];

export function AnticoagulationManager() {
  const [inr, setInr] = useState(2.5);
  const [indication, setIndication] = useState('af');
  const [crCl, setCrCl] = useState(80);
  const [activeDoac, setActiveDoac] = useState('apixaban');
  const [tab, setTab] = useState('warfarin');

  const warfarinAdj = WARFARIN_ADJUST.find(a => inr >= a.range[0] && inr <= a.range[1]);

  const gate = useMemo(() => {
    if (tab === 'warfarin' && inr > 5) return 'BLOCK';
    if (tab === 'warfarin' && (inr < 1.5 || inr > 4)) return 'NEEDS_REVIEW';
    if (tab === 'doac' && crCl < 25) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [tab, inr, crCl]);

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="warfarin" className="text-xs">Warfarin</TabsTrigger>
          <TabsTrigger value="doac" className="text-xs">DOACs</TabsTrigger>
        </TabsList>

        <TabsContent value="warfarin" className="space-y-4 mt-3">
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs">Current INR</Label><Input type="number" step="0.1" value={inr} onChange={e => setInr(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">Indication</Label>
                  <div className="flex gap-1 mt-1">
                    {[{ v: 'af', l: 'AF' }, { v: 'dvt', l: 'DVT/VTE' }, { v: 'mvr', l: 'MVR' }].map(o => (
                      <button key={o.v} onClick={() => setIndication(o.v)} className={cn('flex-1 text-[10px] p-1.5 rounded border transition-all', indication === o.v ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30')}>{o.l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/20 text-[10px]">
                Target INR: <strong>{indication === 'mvr' ? '2.5-3.5' : '2.0-3.0'}</strong> | Current: <strong className={cn(warfarinAdj?.color === 'inr-zone-therapeutic' ? 'text-emerald-400' : warfarinAdj?.color === 'inr-zone-critical' ? 'text-rose-400' : 'text-amber-400')}>{inr}</strong>
              </div>
            </CardContent>
          </Card>

          {warfarinAdj && (
            <Alert className={cn(warfarinAdj.color === 'inr-zone-therapeutic' ? 'border-emerald-500/40 bg-emerald-500/10' : warfarinAdj.color === 'inr-zone-critical' ? 'border-rose-500/40 bg-rose-500/10' : 'border-amber-500/40 bg-amber-500/10')}>
              <AlertTitle className="text-xs">{warfarinAdj.label}</AlertTitle>
              <AlertDescription className="text-[10px] mt-1">{warfarinAdj.action}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="doac" className="space-y-4 mt-3">
          <div className="flex gap-2 flex-wrap">
            {DOACS.map(d => <Button key={d.name} size="sm" variant={activeDoac === d.name.toLowerCase().replace(/\s/g, '') ? 'default' : 'outline'} onClick={() => setActiveDoac(d.name.toLowerCase().replace(/\s/g, ''))} className={cn('text-xs', activeDoac === d.name.toLowerCase().replace(/\s/g, '') && 'bg-primary/20 text-primary')}>{d.name}</Button>)}
          </div>
          <div><Label className="text-xs">CrCl (mL/min)</Label><Input type="number" value={crCl} onChange={e => setCrCl(parseInt(e.target.value) || 0)} className="h-8 text-sm w-1/3" /></div>
          <Card className="glass-card">
            <CardContent className="p-4 space-y-2">
              {DOACS.map(d => (
                <div key={d.name} className={cn('doac-card p-3 rounded-lg border', activeDoac === d.name.toLowerCase().replace(/\s/g, '') ? 'ring-1 ring-primary/30' : 'border-muted/30')}>
                  <div className="font-semibold text-xs">{d.name}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-[10px]">
                    <div><span className="text-muted-foreground">AF Dose:</span> {d.afDose}</div>
                    <div><span className="text-muted-foreground">VTE Dose:</span> {d.vteDose}</div>
                    <div><span className="text-muted-foreground">Renal Dose (CrCl {crCl}):</span> {crCl > 30 ? d.afRenal.normal : crCl > 25 ? d.afRenal.cr30 : crCl > 15 ? d.afRenal.cr25 : d.afRenal.cr15}</div>
                    <div><span className="text-muted-foreground">Reversal:</span> {d.reversal}</div>
                    <div><span className="text-muted-foreground">Half-life:</span> {d.halfLife}</div>
                    <div><span className="text-muted-foreground">Hold Pre-op:</span> {d.holdPeriop}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>Gate: {gate}</Badge>
    </div>
  );
}