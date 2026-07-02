'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Shield, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AntibioticInfo {
  name: string;
  spectrum: 'narrow' | 'broad';
  duration: string;
  alternatives: string[];
  coverage: string;
  renalAdj: string;
  notes: string;
}

const INFECTIONS: Record<string, AntibioticInfo> = {
  'CAP (mild)': { name: 'Amoxicillin', spectrum: 'narrow', duration: '5 days', alternatives: ['Doxycycline', 'Macrolide'], coverage: 'S. pneumoniae, H. influenzae, M. catarrhalis', renalAdj: 'No adjustment', notes: 'First-line for outpatient CAP' },
  'CAP (moderate)': { name: 'Ceftriaxone + Azithromycin', spectrum: 'broad', duration: '5-7 days', alternatives: ['Levofloxacin monotherapy'], coverage: 'Atypicals + typical pathogens', renalAdj: 'Ceftriaxone: none; Azithro: extend interval if eGFR < 10', notes: 'CURB-65 ≥ 2 or comorbidities' },
  'UTI (uncomplicated)': { name: 'Nitrofurantoin', spectrum: 'narrow', duration: '5 days (F) / 7 days (M)', alternatives: ['Trimethoprim-Sulfamethoxazole', 'Fosfomycin'], coverage: 'E. coli, S. saprophyticus', renalAdj: 'Avoid if eGFR < 30', notes: 'Not for pyelonephritis' },
  'UTI (complicated)': { name: 'Ciprofloxacin', spectrum: 'broad', duration: '7-14 days', alternatives: ['Ceftriaxone', 'Piperacillin-Tazobactam'], coverage: 'Gram negatives incl. Pseudomonas', renalAdj: 'Extend interval if eGFR < 30', notes: 'Fluoroquinolone — reserve for resistance' },
  'Skin/Soft Tissue (MSSA)': { name: 'Flucloxacillin', spectrum: 'narrow', duration: '5-7 days', alternatives: ['Cephalexin', 'Clindamycin (penicillin allergy)'], coverage: 'Staphylococcus, Streptococcus', renalAdj: 'Reduce dose if eGFR < 10', notes: 'First-line for MSSA' },
  'Skin/Soft Tissue (MRSA)': { name: 'Vancomycin', spectrum: 'broad', duration: '7-14 days', alternatives: ['Linezolid', 'Daptomycin'], coverage: 'MRSA, VRSA', renalAdj: 'Trough-guided dosing; reduce if eGFR < 50', notes: 'Monitor troughs 15-20 mcg/mL' },
  'Intra-abdominal': { name: 'Piperacillin-Tazobactam', spectrum: 'broad', duration: '4-7 days', alternatives: ['Meropenem', 'Ceftriaxone + Metronidazole'], coverage: 'Aerobes + anaerobes, Enterococcus', renalAdj: 'Extend interval based on eGFR', notes: 'Source control essential' },
  'Meningitis (empiric)': { name: 'Ceftriaxone + Vancomycin + Ampicillin', spectrum: 'broad', duration: '10-14 days (bacterial)', alternatives: ['Meropenem (penicillin allergy)'], coverage: 'S. pneumoniae, N. meningitidis, L. monocytogenes (>50yr)', renalAdj: 'Adjust Vanc based on eGFR', notes: 'Add dexamethasone for pneumococcal' },
};

const COMPARISON_TABLE = [
  { name: 'Amoxicillin', spectrum: 'Narrow', target: 'Gram+', duration: '5-10d', resistance: 'Low', renal: 'None', cost: '$' },
  { name: 'Ceftriaxone', spectrum: 'Broad', target: 'Gram+/−', duration: '5-14d', resistance: 'Moderate', renal: 'None', cost: '$$' },
  { name: 'Ciprofloxacin', spectrum: 'Broad', target: 'Gram−', duration: '7-14d', resistance: 'Rising', renal: 'eGFR adj', cost: '$' },
  { name: 'Vancomycin', spectrum: 'Broad', target: 'MRSA/Gram+', duration: '7-21d', resistance: 'VISA/VRSA', renal: 'Trough-based', cost: '$$$' },
  { name: 'Meropenem', spectrum: 'Very Broad', target: 'MDR GNR', duration: '7-14d', resistance: 'Low (CRE ↑)', renal: 'eGFR adj', cost: '$$$' },
  { name: 'Azithromycin', spectrum: 'Narrow', target: 'Atypicals', duration: '3-5d', resistance: 'Moderate', renal: 'None', cost: '$' },
  { name: 'Piperacillin-Tazobactam', spectrum: 'Broad', target: 'Gram+/−/Anaerobe', duration: '4-14d', resistance: 'Low', renal: 'eGFR adj', cost: '$$' },
  { name: 'Doxycycline', spectrum: 'Narrow', target: 'Atypicals/Std', duration: '7-14d', resistance: 'Low', renal: 'None', cost: '$' },
];

const SPECTRUM_LEVELS = [
  { label: 'Narrow', key: 'narrow', pct: 20, color: 'bg-emerald-500', textColor: 'text-emerald-400', bgAlpha: 'bg-emerald-500/20' },
  { label: 'Moderate', key: 'moderate', pct: 45, color: 'bg-cyan-500', textColor: 'text-cyan-400', bgAlpha: 'bg-cyan-500/20' },
  { label: 'Broad', key: 'broad', pct: 75, color: 'bg-amber-500', textColor: 'text-amber-400', bgAlpha: 'bg-amber-500/20' },
  { label: 'Ultra-Broad', key: 'ultra-broad', pct: 100, color: 'bg-rose-500', textColor: 'text-rose-400', bgAlpha: 'bg-rose-500/20' },
];

function getSpectrumLevel(spectrum: string) {
  if (spectrum === 'narrow') return SPECTRUM_LEVELS[0];
  if (spectrum === 'Very Broad') return SPECTRUM_LEVELS[3];
  return SPECTRUM_LEVELS[2];
}

export function AntibioticStewardshipPanel() {
  const [infection, setInfection] = useState('');
  const info = infection ? INFECTIONS[infection] : null;

  useEffect(() => {
    if (!info) return;
    const spec = info.spectrum;
    if (spec === 'narrow') {
      toast.success(`${info.name}: Narrow spectrum — Good stewardship`, { description: 'Targeted therapy. Low collateral damage.' });
    } else {
      toast.warning(`${info.name}: Broad spectrum — Consider de-escalation`, { description: 'Review culture results in 48-72h to narrow therapy.' });
    }
  }, [infection, info]);

  const activeLevel = info ? getSpectrumLevel(info.spectrum) : null;

  return (
    <section className="space-y-6">
      <Card className="glass-card-hover">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Infection Type</label>
              <Select value={infection} onValueChange={setInfection}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Select infection" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(INFECTIONS).map((i) => (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Recommended Antibiotic</label>
              <div className="glass-input h-9 flex items-center px-3 rounded-md border border-slate-600 bg-slate-800/30 text-slate-300">
                {info ? info.name : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {info && (
          <motion.div
            key={infection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="space-y-4"
          >
            {/* Spectrum Visualizer */}
            <Card className="glass-card-hover">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Spectrum Visualizer</p>
                <div className="relative h-10 w-full rounded-full overflow-hidden bg-slate-800 border border-slate-700/50">
                  {/* Gradient background */}
                  <div className="absolute inset-0 flex">
                    <div className="bg-emerald-500/30 h-full" style={{ width: '20%' }} />
                    <div className="bg-cyan-500/30 h-full" style={{ width: '25%' }} />
                    <div className="bg-amber-500/30 h-full" style={{ width: '30%' }} />
                    <div className="bg-rose-500/30 h-full" style={{ width: '25%' }} />
                  </div>
                  {/* Level markers */}
                  {SPECTRUM_LEVELS.map((level) => (
                    <div
                      key={level.key}
                      className="absolute top-0 h-full border-r border-slate-600/30"
                      style={{ left: `${level.pct}%` }}
                    />
                  ))}
                  {/* Active indicator */}
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="absolute top-1/2 -translate-y-1/2 z-10"
                    style={{ left: `${(activeLevel?.pct ?? 0) - 2}%` }}
                  >
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-0 h-0"
                      style={{
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: `8px solid ${activeLevel?.pct === 20 ? '#10b981' : activeLevel?.pct === 100 ? '#f43f5e' : '#f59e0b'}`,
                      }}
                    />
                  </motion.div>
                </div>
                {/* Level labels */}
                <div className="flex justify-between mt-1.5">
                  {SPECTRUM_LEVELS.map((level) => (
                    <span key={level.key} className={cn('text-[10px]', activeLevel?.key === level.key ? level.textColor : 'text-slate-500')}>
                      {level.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card-hover"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {info.spectrum === 'narrow' ? <Leaf className="w-4 h-4 text-emerald-400" /> : <Zap className="w-4 h-4 text-amber-400" />}
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Spectrum</span>
                  </div>
                  <Badge variant="outline" className={cn('text-sm',
                    info.spectrum === 'narrow'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  )}>
                    {info.spectrum.toUpperCase()}
                  </Badge>
                  <p className="text-xs text-slate-400 mt-2">{info.coverage}</p>
                </CardContent>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass-card-hover"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Duration & Renal</span>
                  </div>
                  <p className="text-white font-semibold">{info.duration}</p>
                  <p className="text-xs text-slate-400 mt-1">{info.renalAdj}</p>
                </CardContent>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass-card-hover"
              >
                <CardContent className="p-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Alternatives</p>
                  <div className="space-y-1">
                    {info.alternatives.map((a, i) => (
                      <Badge key={i} variant="outline" className="bg-slate-800 text-slate-300 border-slate-600 mr-1">{a}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-3">{info.notes}</p>
                </CardContent>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm">Antibiotic Comparison Table</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">Antibiotic</TableHead>
                  <TableHead className="text-slate-400">Spectrum</TableHead>
                  <TableHead className="text-slate-400">Target</TableHead>
                  <TableHead className="text-slate-400">Duration</TableHead>
                  <TableHead className="text-slate-400">Resistance</TableHead>
                  <TableHead className="text-slate-400">Renal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARISON_TABLE.map((a) => {
                  const level = a.spectrum === 'Narrow'
                    ? SPECTRUM_LEVELS[0]
                    : a.spectrum === 'Very Broad'
                      ? SPECTRUM_LEVELS[3]
                      : SPECTRUM_LEVELS[2];
                  return (
                    <TableRow key={a.name} className="border-slate-700/50 hover:bg-slate-800/30">
                      <TableCell className="text-white font-medium">{a.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', `${level.bgAlpha} ${level.textColor} border-current/20`)}>
                          {a.spectrum}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{a.target}</TableCell>
                      <TableCell className="text-slate-300">{a.duration}</TableCell>
                      <TableCell className="text-slate-300">{a.resistance}</TableCell>
                      <TableCell className="text-slate-300">{a.renal}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}