'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Pill, Syringe, FlaskConical, Skull, AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const DRUG_PAIRS = [
  {
    pair: 'Warfarin + Trimethoprim-SMX',
    severity: 'CRITICAL',
    mechanism: 'CYP2C9 inhibition → ↑ INR',
    effect: 'Major bleeding risk',
    management: 'Switch to alternative antibiotic; monitor INR q2-3 days',
  },
  {
    pair: 'SSRI + Tramadol',
    severity: 'CRITICAL',
    mechanism: 'Serotonin reuptake inhibition (additive)',
    effect: 'Serotonin syndrome',
    management: 'Avoid combination; use alternative analgesic',
  },
  {
    pair: 'Warfarin + Amiodarone',
    severity: 'CRITICAL',
    mechanism: 'CYP2C9/3A4 inhibition → ↑ INR',
    effect: 'Major bleeding, high INR',
    management: 'Reduce warfarin 30-50%; frequent INR monitoring',
  },
  {
    pair: 'Metformin + Iodinated Contrast',
    severity: 'CRITICAL',
    mechanism: 'Acute kidney injury → metformin accumulation',
    effect: 'Lactic acidosis',
    management: 'Hold metformin 48h before/after; check eGFR',
  },
  {
    pair: 'Digoxin + Amiodarone',
    severity: 'CRITICAL',
    mechanism: 'P-gp inhibition → ↑ digoxin levels',
    effect: 'Fatal arrhythmia, dig toxicity',
    management: 'Reduce digoxin 50%; monitor levels closely',
  },
];

const EMERGENCY_DOSES = [
  { drug: 'Epinephrine', indication: 'Anaphylaxis', dose: '0.3-0.5 mg IM (1:1,000)', repeat: 'Every 5 min', max: 'N/A', notes: 'Antecubital fossa preferred' },
  { drug: 'Epinephrine', indication: 'Cardiac Arrest', dose: '1 mg IV/IO (1:10,000)', repeat: 'Every 3-5 min', max: 'N/A', notes: 'Push during CPR' },
  { drug: 'Atropine', indication: 'Symptomatic Bradycardia', dose: '1 mg IV', repeat: 'Every 3-5 min', max: '3 mg total', notes: 'Not for AV block type II or III' },
  { drug: 'Naloxone', indication: 'Opioid Overdose', dose: '0.04-0.4 mg IV/IM/IN', repeat: 'Every 2-3 min', max: '10 mg', notes: 'Start low; titrate to response' },
  { drug: 'Adenosine', indication: 'SVT (stable)', dose: '6 mg rapid IV push', repeat: '12 mg if no response', max: '12 mg x2', notes: 'Follow with 20mL saline flush, rapid push' },
  { drug: 'Amiodarone', indication: 'VF/pVT Arrest', dose: '300 mg IV/IO bolus', repeat: '150 mg', max: '2.2g/24h', notes: 'Dilute in D5W, may cause hypotension' },
];

const CRITICAL_LABS = [
  { name: 'Potassium', critical: '< 2.5 or > 6.5 mmol/L', unit: 'mmol/L', normal: '3.5 - 5.0', icon: ShieldAlert, color: 'text-red-400' },
  { name: 'Sodium', critical: '< 120 or > 160 mmol/L', unit: 'mmol/L', normal: '135 - 145', icon: AlertTriangle, color: 'text-rose-400' },
  { name: 'Calcium (ionized)', critical: '< 0.9 or > 1.5 mmol/L', unit: 'mmol/L', normal: '1.1 - 1.35', icon: ShieldAlert, color: 'text-red-400' },
  { name: 'Glucose', critical: '< 2.2 or > 27.8 mmol/L', unit: 'mmol/L', normal: '3.9 - 6.1', icon: AlertTriangle, color: 'text-amber-400' },
  { name: 'Hemoglobin', critical: '< 50 or > 200 g/L', unit: 'g/L', normal: '130 - 175 (M), 120 - 150 (F)', icon: Info, color: 'text-amber-400' },
  { name: 'Platelets', critical: '< 20 or > 1000 x10⁹/L', unit: 'x10⁹/L', normal: '150 - 400', icon: ShieldAlert, color: 'text-red-400' },
  { name: 'INR', critical: '> 5.0', unit: '', normal: '0.8 - 1.2', icon: Skull, color: 'text-red-400' },
  { name: 'Troponin', critical: '> 10x URL', unit: 'ng/L', normal: '< 14 (hs-cTnI)', icon: AlertTriangle, color: 'text-rose-400' },
  { name: 'Lactate', critical: '> 4.0 mmol/L', unit: 'mmol/L', normal: '< 2.0', icon: ShieldAlert, color: 'text-red-400' },
  { name: 'Creatinine', critical: '> 500 μmol/L', unit: 'μmol/L', normal: '60 - 110', icon: Info, color: 'text-amber-400' },
];

function PanelContent() {
  return (
    <Tabs defaultValue="drugs" className="flex-1 overflow-hidden flex flex-col">
      <TabsList className="bg-transparent border-b border-slate-700/50 rounded-none h-9 p-0 shrink-0">
        <TabsTrigger value="drugs" className="text-[10px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 text-slate-400 data-[state=active]:text-cyan-400 rounded-none h-full">
          <Pill className="w-3 h-3 mr-1 hidden sm:inline-block" />
          Drug Pairs
        </TabsTrigger>
        <TabsTrigger value="doses" className="text-[10px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 text-slate-400 data-[state=active]:text-cyan-400 rounded-none h-full">
          <Syringe className="w-3 h-3 mr-1 hidden sm:inline-block" />
          Emerge. Doses
        </TabsTrigger>
        <TabsTrigger value="labs" className="text-[10px] sm:text-xs px-2 sm:px-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 text-slate-400 data-[state=active]:text-cyan-400 rounded-none h-full">
          <FlaskConical className="w-3 h-3 mr-1 hidden sm:inline-block" />
          Crit. Labs
        </TabsTrigger>
      </TabsList>

      <div className="overflow-y-auto flex-1 p-3">
        <TabsContent value="drugs" className="mt-0 space-y-2">
          {DRUG_PAIRS.map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">{item.pair}</p>
                <Badge variant="outline" className="text-[9px] bg-red-500/15 text-red-400 border-red-500/30 shrink-0 ml-2">
                  {item.severity}
                </Badge>
              </div>
              <p className="text-[10px] text-slate-500">{item.mechanism}</p>
              <p className="text-[10px] text-rose-300">{item.effect}</p>
              <p className="text-[10px] text-amber-300/80">{item.management}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="doses" className="mt-0 space-y-2">
          {EMERGENCY_DOSES.map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/30 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-white">{item.drug}</p>
                <Badge variant="outline" className="text-[9px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shrink-0 ml-2">
                  {item.indication}
                </Badge>
              </div>
              <p className="text-xs text-emerald-400 font-mono">{item.dose}</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span>Repeat: {item.repeat}</span>
                {item.max !== 'N/A' && <span>Max: {item.max}</span>}
              </div>
              {item.notes && <p className="text-[10px] text-slate-600 italic">{item.notes}</p>}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="labs" className="mt-0 space-y-1.5">
          {CRITICAL_LABS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/30 border border-slate-700/20">
                <Icon className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', item.color)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-white">{item.name}</p>
                    {item.unit && <span className="text-[9px] text-slate-600">{item.unit}</span>}
                  </div>
                  <p className="text-[10px] text-rose-400 font-mono">Critical: {item.critical}</p>
                  <p className="text-[10px] text-slate-600">Normal: {item.normal}</p>
                </div>
              </div>
            );
          })}
        </TabsContent>
      </div>
    </Tabs>
  );
}

export function QuickReferencePanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Toggle button — positioned above mobile bottom nav */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center transition-colors"
            title="Quick Reference"
          >
            <Zap className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile: Bottom Sheet drawer (no overlap) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[75vh] sm:hidden rounded-t-2xl p-0 flex flex-col">
          <SheetTitle className="sr-only">Quick Reference</SheetTitle>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-700/50 shrink-0">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-white">Quick Reference</span>
            </div>
          </div>
          <PanelContent />
          {/* Footer */}
          <div className="p-2 border-t border-slate-700/50 shrink-0">
            <p className="text-[9px] text-slate-600 text-center">⚡ Quick Reference — Not for Clinical Use</p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Fixed floating panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden sm:block fixed bottom-6 right-6 z-40 w-[420px] max-h-[70vh] flex flex-col"
          >
            <Card className="glass-card border-0 shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-semibold text-white">Quick Reference</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 p-0 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <PanelContent />

              {/* Footer */}
              <div className="p-2 border-t border-slate-700/50 shrink-0">
                <p className="text-[9px] text-slate-600 text-center">⚡ Quick Reference — Not for Clinical Use</p>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}