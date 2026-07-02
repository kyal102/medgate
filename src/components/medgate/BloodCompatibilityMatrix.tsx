'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BLOOD_COMPATIBILITY } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const BLOOD_TYPES = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
const ABO_TYPES = ['O', 'A', 'B', 'AB'];

interface CellDetail {
  recipient: string;
  donor: string;
  compatible: boolean;
  rhIssue: boolean;
}

export function BloodCompatibilityMatrix() {
  const [recipient, setRecipient] = useState('');
  const [donor, setDonor] = useState('');
  const [result, setResult] = useState<{ compatible: boolean; rhIssue: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [highlightRecip, setHighlightRecip] = useState('');
  const [highlightDonor, setHighlightDonor] = useState('');
  const [showRhOnly, setShowRhOnly] = useState(false);
  const [cellDetail, setCellDetail] = useState<CellDetail | null>(null);

  const check = async () => {
    if (!recipient || !donor) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/blood-compat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient, donor }),
      });
      if (res.ok) { setResult(await res.json()); } else { setResult(localCheck(recipient, donor)); }
    } catch { setResult(localCheck(recipient, donor)); }
    setLoading(false);

    const check = localCheck(recipient, donor);
    if (check.compatible && !check.rhIssue) {
      toast.success(`${recipient} ← ${donor}: Compatible`, { description: 'Safe for transfusion.' });
    } else if (check.compatible && check.rhIssue) {
      toast.warning(`${recipient} ← ${donor}: Rh Caution`, { description: 'ABO compatible but Rh mismatch.' });
    } else {
      toast.error(`${recipient} ← ${donor}: INCOMPATIBLE`, { description: 'Hemolytic transfusion reaction risk.' });
    }
  };

  const handleCellClick = useCallback((recip: string, don: string) => {
    const compat = BLOOD_COMPATIBILITY[recip]?.includes(don) ?? false;
    const rhIssue = compat && recip.endsWith('+') && don.endsWith('-');
    setCellDetail({ recipient: recip, donor: don, compatible: compat, rhIssue });
    setHighlightRecip(recip);
    setHighlightDonor(don);
  }, []);

  const getCellColor = (recip: string, don: string) => {
    if (recip === highlightRecip && don === highlightDonor) {
      if (result?.compatible) return 'bg-emerald-500/40 border-emerald-400';
      if (result?.rhIssue) return 'bg-amber-500/40 border-amber-400';
      return 'bg-red-500/40 border-red-400';
    }
    const compat = BLOOD_COMPATIBILITY[recip]?.includes(don);
    if (!compat) {
      return 'bg-red-500/15 border-red-500/20';
    }
    const recipRh = recip.includes('+');
    const donRh = don.includes('+');
    if (recipRh && !donRh) return 'bg-amber-500/15 border-amber-500/20';
    return 'bg-emerald-500/15 border-emerald-500/20';
  };

  const filteredTypes = showRhOnly
    ? BLOOD_TYPES.filter((t) => t.endsWith(showRhOnly === 'pos' ? '+' : '-'))
    : BLOOD_TYPES;

  return (
    <section className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Recipient Blood Type</label>
              <Select value={recipient} onValueChange={(v) => { setRecipient(v); setHighlightRecip(v); }}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Recipient" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Donor Blood Type</label>
              <Select value={donor} onValueChange={(v) => { setDonor(v); setHighlightDonor(v); }}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Donor" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Button onClick={check} disabled={loading || !recipient || !donor} className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
              {loading ? 'Checking...' : 'Check Compatibility'}
            </Button>
            <div className="flex items-center gap-2">
              <Switch
                checked={showRhOnly === 'pos'}
                onCheckedChange={(v) => setShowRhOnly(v ? 'pos' : false)}
              />
              <Label className="text-xs text-slate-400">Rh (+) only</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={showRhOnly === 'neg'}
                onCheckedChange={(v) => setShowRhOnly(v ? 'neg' : false)}
              />
              <Label className="text-xs text-slate-400">Rh (−) only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cell detail popup */}
      <AnimatePresence>
        {cellDetail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <Card className={cn('glass-card border', cellDetail.compatible
              ? (cellDetail.rhIssue ? 'border-amber-500/40' : 'border-emerald-500/40')
              : 'border-red-500/40'
            )}>
              <CardContent className="p-4 flex items-center gap-3">
                {cellDetail.compatible
                  ? (cellDetail.rhIssue
                    ? <AlertTriangle className="w-5 h-5 text-amber-400" />
                    : <Check className="w-5 h-5 text-emerald-400" />)
                  : <X className="w-5 h-5 text-red-400" />}
                <div className="flex-1">
                  <p className={cn('font-bold',
                    cellDetail.compatible
                      ? (cellDetail.rhIssue ? 'text-amber-400' : 'text-emerald-400')
                      : 'text-red-400'
                  )}>
                    {cellDetail.recipient} ← {cellDetail.donor}: {cellDetail.compatible
                      ? (cellDetail.rhIssue ? 'Rh Caution' : 'Compatible')
                      : 'INCOMPATIBLE'}
                  </p>
                  <p className="text-sm text-slate-300">
                    {cellDetail.compatible
                      ? (cellDetail.rhIssue
                        ? 'ABO compatible but Rh(D) negative donor to Rh(D) positive recipient.'
                        : `${cellDetail.recipient} can safely receive ${cellDetail.donor} blood products.`)
                      : `${cellDetail.recipient} CANNOT receive ${cellDetail.donor}. ABO or Rh incompatibility detected.`}
                  </p>
                </div>
                <button onClick={() => setCellDetail(null)} className="text-slate-500 hover:text-slate-300 text-xs">✕</button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && !cellDetail && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className={cn('glass-card border', result.compatible ? (result.rhIssue ? 'border-amber-500/30' : 'border-emerald-500/30') : 'border-red-500/30')}>
              <CardContent className="p-4 flex items-center gap-3">
                {result.compatible ? (result.rhIssue ? <AlertTriangle className="w-5 h-5 text-amber-400" /> : <Check className="w-5 h-5 text-emerald-400" />) : <X className="w-5 h-5 text-red-400" />}
                <div>
                  <p className={cn('font-bold', result.compatible ? (result.rhIssue ? 'text-amber-400' : 'text-emerald-400') : 'text-red-400')}>
                    {result.compatible ? (result.rhIssue ? 'Rh Factor Caution' : 'Compatible') : 'INCOMPATIBLE'}
                  </p>
                  <p className="text-sm text-slate-300">
                    {result.compatible
                      ? (result.rhIssue ? `${recipient} recipient receiving ${donor}: ABO compatible but Rh(D) negative donor to Rh(D) positive recipient. Generally acceptable for plasma/platelets.` : `${recipient} can safely receive ${donor} blood products.`)
                      : `${recipient} CANNOT receive ${donor}. ABO or Rh incompatibility detected. Hemolytic transfusion reaction risk.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="glass-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-xs text-slate-400 text-left min-w-[60px]">Recipient ↓ / Donor →</th>
                  {filteredTypes.map((t) => (
                    <th key={t} className="p-2 text-xs text-slate-400 text-center">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTypes.map((recip, rowIdx) => (
                  <tr key={recip}>
                    <td className="p-2 text-xs text-cyan-400 font-semibold">{recip}</td>
                    {filteredTypes.map((don, colIdx) => {
                      const compat = BLOOD_COMPATIBILITY[recip]?.includes(don);
                      const isHighlighted = recip === highlightRecip && don === highlightDonor;
                      const isCompatCell = compat && !(recip.includes('+') && don.endsWith('-'));
                      return (
                        <td key={don} className="p-1 text-center">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleCellClick(recip, don)}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (rowIdx * filteredTypes.length + colIdx) * 0.012, type: 'spring', stiffness: 400, damping: 25 }}
                            className={cn(
                              'w-8 h-8 mx-auto rounded-md border flex items-center justify-center text-xs cursor-pointer transition-shadow',
                              getCellColor(recip, don),
                              isHighlighted && 'ring-2 ring-cyan-400/50',
                              isCompatCell && !isHighlighted && 'hover:shadow-[0_0_8px_rgba(52,211,153,0.4)]',
                              !compat && !isHighlighted && 'hover:shadow-[0_0_8px_rgba(244,63,94,0.4)]',
                            )}
                          >
                            {compat ? (
                              <motion.div
                                animate={isHighlighted ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ repeat: isHighlighted ? Infinity : 0, duration: 1.5 }}
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              </motion.div>
                            ) : (
                              <motion.div
                                animate={isHighlighted ? { scale: [1, 1.2, 1], opacity: [1, 0.5, 1] } : {}}
                                transition={{ repeat: isHighlighted ? Infinity : 0, duration: 1 }}
                              >
                                <X className="w-3.5 h-3.5 text-red-400/60" />
                              </motion.div>
                            )}
                          </motion.button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/40" /> Compatible</div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/40" /> Rh Caution</div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><div className="w-3 h-3 rounded bg-red-500/30 border border-red-500/40" /> Incompatible</div>
            <span className="text-xs text-slate-500 ml-auto">Click any cell for details</span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function localCheck(recipient: string, donor: string) {
  const compat = BLOOD_COMPATIBILITY[recipient]?.includes(donor) ?? false;
  const rhIssue = compat && recipient.endsWith('+') && donor.endsWith('-');
  return { compatible: compat, rhIssue };
}