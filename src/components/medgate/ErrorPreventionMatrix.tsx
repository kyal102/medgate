'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Table2 } from 'lucide-react';

type DetectionLevel = 'none' | 'partial' | 'full';
const CELL_STYLES: Record<DetectionLevel, string> = {
  none: 'bg-slate-800 text-slate-500',
  partial: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  full: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

const CELL_LABELS: Record<DetectionLevel, string> = {
  none: '✗',
  partial: '~',
  full: '✓',
};

interface ErrorRow {
  errorType: string;
  ehr: DetectionLevel;
  drugDb: DetectionLevel;
  cds: DetectionLevel;
  medgate: DetectionLevel;
  note?: string;
}

const ERROR_ROWS: ErrorRow[] = [
  { errorType: 'Drug-drug interactions (SEVERE)', ehr: 'none', drugDb: 'partial', cds: 'partial', medgate: 'full', note: 'CDS fires but 94% ignored' },
  { errorType: 'Dosing errors (weight-based)', ehr: 'none', drugDb: 'none', cds: 'partial', medgate: 'full' },
  { errorType: 'Allergy cross-reactivity', ehr: 'partial', drugDb: 'none', cds: 'partial', medgate: 'full' },
  { errorType: 'Lab result impossibility', ehr: 'none', drugDb: 'none', cds: 'none', medgate: 'full' },
  { errorType: 'Physiological impossibility', ehr: 'none', drugDb: 'none', cds: 'none', medgate: 'full' },
  { errorType: 'Protocol non-compliance', ehr: 'partial', drugDb: 'none', cds: 'partial', medgate: 'full' },
  { errorType: 'Contrast agent safety', ehr: 'partial', drugDb: 'none', cds: 'partial', medgate: 'full' },
  { errorType: 'Blood type incompatibility', ehr: 'partial', drugDb: 'none', cds: 'none', medgate: 'full' },
  { errorType: 'Pediatric dosing errors', ehr: 'none', drugDb: 'none', cds: 'partial', medgate: 'full' },
  { errorType: 'Pregnancy teratogen exposure', ehr: 'partial', drugDb: 'partial', cds: 'partial', medgate: 'full' },
];

const COLUMNS: { key: string; label: string }[] = [
  { key: 'ehr', label: 'EHR Alert' },
  { key: 'drugDb', label: 'Drug DB' },
  { key: 'cds', label: 'Traditional CDS' },
  { key: 'medgate', label: 'MedGate' },
];

export function ErrorPreventionMatrix() {
  return (
    <div className="space-y-4">
      <Card className="border-slate-700/50 bg-slate-900/80">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Table2 className="h-4 w-4 text-cyan-400" />
              Error Prevention Matrix
            </CardTitle>
            <div className="flex gap-2 text-[10px]">
              {(['none', 'partial', 'full'] as DetectionLevel[]).map((level) => (
                <span key={level} className={`px-2 py-0.5 rounded border ${CELL_STYLES[level]}`}>
                  {CELL_LABELS[level]} {level === 'none' ? 'Not Caught' : level === 'partial' ? 'Partial' : 'Full'}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 pr-4 text-slate-400 font-medium min-w-[140px] sm:min-w-[200px]">Error Type</th>
                {COLUMNS.map((col) => (
                  <th key={col.key} className={`text-center py-2 px-3 text-slate-400 font-medium min-w-[80px] sm:min-w-[100px] ${col.key === 'medgate' ? 'text-cyan-400' : ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ERROR_ROWS.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="py-2 pr-4 text-slate-300">
                    {row.errorType}
                    {row.note && <span className="text-[10px] text-slate-500 block ml-2">({row.note})</span>}
                  </td>
                  {COLUMNS.map((col) => {
                    const level = row[col.key as keyof ErrorRow] as DetectionLevel;
                    return (
                      <td key={col.key} className="py-2 px-3 text-center">
                        <span className={`inline-flex items-center justify-center h-7 w-7 rounded-md border text-xs font-bold ${CELL_STYLES[level]}`}>
                          {CELL_LABELS[level]}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-emerald-300">MedGate catches 100% of these error types</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Traditional systems leave gaps: EHR alerts lack clinical intelligence, Drug databases don't consider patient context, and CDS alerts are ignored 94% of the time. MedGate deterministically verifies every claim through all applicable gates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
