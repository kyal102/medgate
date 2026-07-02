'use client';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

const OPTIONS = [
  { id: 'enoxaparin', name: 'Enoxaparin (LMWH)', type: 'pharmacologic', doses: { medical: '40mg daily', surgical: '40mg daily', ortho: '30mg BID', renal: 'Avoid if CrCl<30' }, duration: '7-14 days' },
  { id: 'heparin', name: 'UFH 5000 q8h', type: 'pharmacologic', doses: { medical: '5000 q8h', surgical: '5000 q8h', ortho: '5000 q8h', renal: 'No adjustment' }, duration: '7-14 days' },
  { id: 'rivaroxaban', name: 'Rivaroxaban (DOAC)', type: 'pharmacologic', doses: { medical: '10mg daily', surgical: '10mg daily', ortho: '10mg daily ×35 days', renal: 'Avoid if CrCl<30' }, duration: '14-35 days' },
  { id: 'warfarin', name: 'Warfarin', type: 'pharmacologic', doses: { medical: 'Target INR 2-3', surgical: 'Target INR 2-3', ortho: 'Bridge + warfarin', renal: 'No adjustment' }, duration: '28-35 days (orthopedic)' },
  { id: 'scd', name: 'Sequential Compression Devices', type: 'mechanical', doses: {}, duration: 'During admission' },
  { id: 'ted', name: 'TED Hose (GCS)', type: 'mechanical', doses: {}, duration: 'During admission' },
  { id: 'ivc', name: 'IVC Filter (Retrievable)', type: 'device', doses: {}, duration: 'Until contraindication resolves' },
];

const CONTRAINDICATIONS = [
  { id: 'active-bleed', label: 'Active bleeding', contraindicates: ['enoxaparin', 'heparin', 'rivaroxaban', 'warfarin'] },
  { id: 'hit', label: 'Heparin-induced thrombocytopenia', contraindicates: ['heparin', 'enoxaparin'] },
  { id: 'plt-50', label: 'Platelets <50K', contraindicates: ['enoxaparin', 'heparin', 'rivaroxaban', 'warfarin'] },
  { id: 'crcl-30', label: 'CrCl <30 mL/min', contraindicates: ['enoxaparin', 'rivaroxaban'] },
  { id: 'spinal', label: 'Recent spinal anesthesia (<4h)', contraindicates: ['enoxaparin', 'heparin', 'rivaroxaban'] },
];

export function VTEProphylaxisSelector() {
  const [patientType, setPatientType] = useState<'medical' | 'surgical' | 'orthopedic'>('medical');
  const [crCl, setCrCl] = useState(80);
  const [contras, setContras] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);

  const toggleContra = (id: string) => setContras(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const isContraindicated = (optionId: string) => {
    const allContras = Array.from(contras).flatMap(id => CONTRAINDICATIONS.find(c => c.id === id)?.contraindicates || []);
    return allContras.includes(optionId);
  };

  const recommendation = useMemo(() => {
    if (contras.has('active-bleed')) return { id: 'ivc', reason: 'Active bleeding — mechanical only + IVC filter consideration' };
    if (patientType === 'orthopedic' && !isContraindicated('rivaroxaban')) return { id: 'rivaroxaban', reason: 'Preferred for orthopedic surgery (extended duration)' };
    if (!isContraindicated('enoxaparin') && crCl >= 30) return { id: 'enoxaparin', reason: 'First-line LMWH prophylaxis' };
    if (!isContraindicated('heparin')) return { id: 'heparin', reason: 'UFH appropriate when LMWH contraindicated' };
    return { id: 'scd', reason: 'Mechanical prophylaxis only (all pharmacologic contraindicated)' };
  }, [patientType, crCl, contras]);

  const recOpt = OPTIONS.find(o => o.id === recommendation.id);

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex gap-2">
            {(['medical', 'surgical', 'orthopedic'] as const).map(t => (
              <button key={t} onClick={() => setPatientType(t)} className={cn('flex-1 text-xs p-2 rounded-lg border capitalize transition-all', patientType === t ? 'border-primary/40 bg-primary/10 text-primary' : 'border-muted/30 hover:bg-muted/20')}>{t}</button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Contraindications</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-1.5">
            {CONTRAINDICATIONS.map(c => (
              <label key={c.id} className={cn('flex items-center gap-2 text-xs cursor-pointer p-2 rounded-lg transition-colors', contras.has(c.id) ? 'bg-rose-500/10' : 'hover:bg-muted/20')}>
                <Checkbox checked={contras.has(c.id)} onCheckedChange={() => toggleContra(c.id)} />
                {c.label}
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Prophylaxis Options</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {OPTIONS.map(opt => {
            const contraindicated = isContraindicated(opt.id);
            const isRec = recommendation.id === opt.id;
            return (
              <div key={opt.id} className={cn('prophylaxis-option rounded-xl p-3 border', isRec ? 'prophylaxis-option-selected' : contraindicated ? 'prophylaxis-option-contraindicated' : 'border-muted/30 hover:bg-muted/20')} onClick={() => !contraindicated && setSelected(opt.id)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold">{opt.name}</div>
                    {isRec && <div className="text-[10px] text-primary mt-0.5">✓ Recommended — {recommendation.reason}</div>}
                    {opt.doses[patientType] && <div className="text-[10px] text-muted-foreground">Dose: {opt.doses[patientType]}</div>}
                    {opt.duration && <div className="text-[9px] text-muted-foreground">Duration: {opt.duration}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px]">{opt.type}</Badge>
                    {contraindicated && <Badge className="text-[9px] bg-rose-500/20 text-rose-400">Contraindicated</Badge>}
                    {isRec && <Badge className="text-[9px] bg-emerald-500/20 text-emerald-400">Recommended</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}