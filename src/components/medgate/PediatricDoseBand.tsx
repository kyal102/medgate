'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PEDIATRIC_RESTRICTED } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';

interface DoseBand {
  weightRange: string;
  dose: string;
  maxDaily: string;
}

const COMMON_PEDIATRIC: Record<string, { bands: DoseBand[]; maxDailyTotal: string; notes: string }> = {
  'Amoxicillin': {
    bands: [
      { weightRange: '5-10 kg', dose: '125 mg TID', maxDaily: '500 mg' },
      { weightRange: '10-20 kg', dose: '250 mg TID', maxDaily: '1 g' },
      { weightRange: '20-40 kg', dose: '500 mg TID', maxDaily: '2 g' },
    ],
    maxDailyTotal: '2 g/day',
    notes: '25-50 mg/kg/day divided Q8H',
  },
  'Paracetamol': {
    bands: [
      { weightRange: '5-10 kg', dose: '120 mg Q6H', maxDaily: '480 mg' },
      { weightRange: '10-20 kg', dose: '250 mg Q6H', maxDaily: '1 g' },
      { weightRange: '20-40 kg', dose: '500 mg Q6H', maxDaily: '2 g' },
    ],
    maxDailyTotal: '60 mg/kg/day (max 4g)',
    notes: '10-15 mg/kg/dose Q4-6H. Rectal: 20 mg/kg PR.',
  },
  'Ibuprofen': {
    bands: [
      { weightRange: '5-10 kg', dose: '50 mg TID', maxDaily: '200 mg' },
      { weightRange: '10-20 kg', dose: '100 mg TID', maxDaily: '400 mg' },
      { weightRange: '20-40 kg', dose: '200 mg TID', maxDaily: '800 mg' },
    ],
    maxDailyTotal: '40 mg/kg/day',
    notes: '5-10 mg/kg/dose Q6-8H. Avoid if dehydrated.',
  },
  'Gentamicin': {
    bands: [
      { weightRange: '3-7 kg', dose: '5 mg/kg OD', maxDaily: '—' },
      { weightRange: '7-20 kg', dose: '7 mg/kg OD', maxDaily: '—' },
      { weightRange: '20-40 kg', dose: '7 mg/kg OD', maxDaily: '—' },
    ],
    maxDailyTotal: 'Single daily dose; monitor troughs',
    notes: 'Once daily dosing. Trough <1 mcg/mL (OD dosing). Extended interval in neonates.',
  },
  'Ceftriaxone': {
    bands: [
      { weightRange: '5-10 kg', dose: '500 mg OD', maxDaily: '1 g' },
      { weightRange: '10-20 kg', dose: '750 mg OD', maxDaily: '1.5 g' },
      { weightRange: '20-40 kg', dose: '1 g OD', maxDaily: '2 g' },
    ],
    maxDailyTotal: '50-75 mg/kg/day',
    notes: 'Avoid in neonates with hyperbilirubinemia (displaces bilirubin).',
  },
};

export function PediatricDoseBand() {
  const [drug, setDrug] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  const drugInfo = drug ? COMMON_PEDIATRIC[drug] : null;
  const ageNum = age ? parseFloat(age) : null;

  const restriction = drug && ageNum !== null ? PEDIATRIC_RESTRICTED[drug.toLowerCase()] : null;
  const isRestricted = restriction !== undefined && ageNum !== null && ageNum < restriction.minAge;

  const getWeightBand = () => {
    if (!weight || !drugInfo) return null;
    const w = parseFloat(weight);
    return drugInfo.bands.find((b) => {
      const [lo, hi] = b.weightRange.split('-').map(Number);
      return w >= lo && w <= hi;
    }) || null;
  };

  const band = getWeightBand();

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Drug</label>
              <select
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/50 px-3 text-sm text-white"
              >
                <option value="">Select drug</option>
                {Object.keys(COMMON_PEDIATRIC).map((d) => (<option key={d} value={d}>{d}</option>))}
                {Object.keys(PEDIATRIC_RESTRICTED).map((d) => (<option key={d} value={d.charAt(0).toUpperCase() + d.slice(1)}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Weight (kg)</label>
              <Input type="number" placeholder="e.g. 15" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Age (years)</label>
              <Input type="number" step="0.1" placeholder="e.g. 5" value={age} onChange={(e) => setAge(e.target.value)} className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {isRestricted && (
        <Card className="bg-red-500/10 border-red-500/40 animate-pulse">
          <CardContent className="p-4 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <p className="text-red-400 font-bold">AGE RESTRICTION VIOLATION</p>
              <p className="text-sm text-red-300 mt-1">
                {drug} is contraindicated in patients under {restriction.minAge} years.
                {ageNum !== null && ` Current age: ${ageNum} years.`}
              </p>
              <p className="text-sm text-red-200 mt-1 font-medium">{restriction.risk}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {restriction && !isRestricted && (
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-400 font-semibold">Age Restriction Noted</p>
              <p className="text-sm text-slate-300 mt-1">{drug}: restricted below {restriction.minAge} years. Current age OK.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {band && (
        <Card className="bg-emerald-500/10 border-emerald-500/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-emerald-400 font-semibold">
                Weight Band: {band.weightRange} — {band.dose}
              </p>
              <p className="text-sm text-slate-300 mt-1">Max per dose: {band.maxDaily}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {drugInfo && (
        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">{drug} — Dosing Table</CardTitle>
              <Badge variant="outline" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/40 text-xs">
                Max daily: {drugInfo.maxDailyTotal}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">Weight Range</TableHead>
                  <TableHead className="text-slate-400">Dose</TableHead>
                  <TableHead className="text-slate-400">Max Daily</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drugInfo.bands.map((b, i) => {
                  const isActive = band && b.weightRange === band.weightRange;
                  return (
                    <TableRow key={i} className={cn('border-slate-700/50', isActive && 'bg-cyan-500/10')}>
                      <TableCell className="text-white font-medium">{b.weightRange}</TableCell>
                      <TableCell className="text-slate-300">{b.dose}</TableCell>
                      <TableCell className="text-slate-300">{b.maxDaily}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
          {drugInfo.notes && (
            <div className="px-4 py-3 border-t border-slate-700/50">
              <p className="text-xs text-slate-400"><span className="text-cyan-400 font-medium">Note:</span> {drugInfo.notes}</p>
            </div>
          )}
        </Card>
      )}
    </section>
  );
}