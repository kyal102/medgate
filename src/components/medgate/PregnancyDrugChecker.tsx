'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, AlertTriangle, CheckCircle, Info, Baby, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { PREGNANCY_CATEGORIES } from '@/lib/medgate-constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DRUGS = Object.keys(PREGNANCY_CATEGORIES);
const TRIMESTERS = ['1', '2', '3'];

const COMMON_DRUGS = ['amoxicillin', 'cephalexin', 'paracetamol', 'azithromycin', 'warfarin', 'valproate', 'lithium', 'isotretinoin', 'methotrexate', 'tetracycline'];

const CATEGORY_STYLES: Record<string, string> = {
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 glow-emerald',
  B: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
  C: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  D: 'bg-rose-500/20 text-rose-400 border-rose-500/40 glow-rose',
  X: 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse',
};

const CATEGORY_ICONS: Record<string, typeof Info> = {
  A: CheckCircle, B: CheckCircle, C: AlertTriangle, D: Ban, X: Ban,
};

const TRIMESTER_RISK_COLOR: Record<string, { safe: string; risk: string; icon: typeof CheckCircle; riskIcon: typeof Ban }> = {
  A: { safe: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', risk: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40', icon: CheckCircle, riskIcon: CheckCircle },
  B: { safe: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', risk: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30', icon: CheckCircle, riskIcon: CheckCircle },
  C: { safe: 'text-amber-400 bg-amber-500/10 border-amber-500/30', risk: 'text-amber-400 bg-amber-500/10 border-amber-500/30', icon: CheckCircle, riskIcon: AlertTriangle },
  D: { safe: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', risk: 'text-rose-400 bg-rose-500/20 border-rose-500/40', icon: CheckCircle, riskIcon: Ban },
  X: { safe: 'text-rose-400 bg-rose-500/20 border-rose-500/40', risk: 'text-red-400 bg-red-500/20 border-red-500/40', icon: Ban, riskIcon: Ban },
};

export function PregnancyDrugChecker() {
  const [drug, setDrug] = useState('');
  const [trimester, setTrimester] = useState('1');

  const info = drug ? PREGNANCY_CATEGORIES[drug] : null;

  useEffect(() => {
    if (!info) return;
    const cat = info.category;
    const affected = info.trimesters?.includes(parseInt(trimester));
    if (cat === 'X') {
      toast.error(`${drug}: Category X — CONTRAINDICATED`, { description: info.risk });
    } else if (cat === 'D' && affected) {
      toast.warning(`${drug}: Category D — High risk in T${trimester}`, { description: info.risk });
    } else if (cat === 'C' && affected) {
      toast.warning(`${drug}: Category C — Risk in T${trimester}`, { description: info.risk });
    } else {
      toast.success(`${drug}: Category ${cat} — Generally safe in T${trimester}`, { description: info.risk });
    }
  }, [drug, trimester, info]);

  return (
    <section className="space-y-6">
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Drug</label>
              <Select value={drug} onValueChange={setDrug}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue placeholder="Select drug" />
                </SelectTrigger>
                <SelectContent>
                  {DRUGS.map((d) => (<SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-400">Trimester</label>
              <Select value={trimester} onValueChange={setTrimester}>
                <SelectTrigger className="glass-input w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIMESTERS.map((t) => (<SelectItem key={t} value={t}>Trimester {t}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Common Pregnancy Drugs quick select */}
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Common Pregnancy Drugs</p>
        <div className="flex flex-wrap gap-2">
          {COMMON_DRUGS.map((d) => {
            const catInfo = PREGNANCY_CATEGORIES[d];
            if (!catInfo) return null;
            const isSelected = drug === d;
            const cat = catInfo.category;
            return (
              <motion.button
                key={d}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDrug(d)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                  isSelected
                    ? cn(CATEGORY_STYLES[cat], 'ring-2 ring-current/30')
                    : 'bg-slate-800/60 border-slate-600/50 text-slate-300 hover:bg-slate-700/60'
                )}
              >
                {cat === 'X' && <Ban className="w-3 h-3" />}
                {cat === 'D' && <AlertTriangle className="w-3 h-3" />}
                {cat === 'C' && <AlertTriangle className="w-3 h-3" />}
                {(cat === 'A' || cat === 'B') && <CheckCircle className="w-3 h-3" />}
                {d.charAt(0).toUpperCase() + d.slice(1)}
                <span className="ml-0.5 opacity-70">{cat}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {info && (() => {
          const cat = info.category;
          const CatIcon = CATEGORY_ICONS[cat] || Info;
          const trimesterNum = parseInt(trimester);
          const affected = info.trimesters?.includes(trimesterNum);
          const triStyles = TRIMESTER_RISK_COLOR[cat] || TRIMESTER_RISK_COLOR.C;
          return (
            <motion.div
              key={`${drug}-${trimester}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="space-y-4"
            >
              <Card className={cn('glass-card-hover border', CATEGORY_STYLES[cat])}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-white">{drug.charAt(0).toUpperCase() + drug.slice(1)}</CardTitle>
                    <Badge variant="outline" className={cn('text-lg px-3 py-1', CATEGORY_STYLES[cat])}>
                      <CatIcon className="w-4 h-4 mr-1.5" />
                      Category {cat}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Risk Description</p>
                    <p className={cn('text-sm', cat === 'X' ? 'text-red-300 font-semibold' : cat === 'D' ? 'text-rose-300' : 'text-slate-200')}>
                      {info.risk}
                    </p>
                  </div>

                  {/* Trimester Visual Timeline */}
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Trimester Timeline</p>
                    <div className="flex gap-1 items-stretch">
                      {/* Connector line */}
                      <div className="flex-1 flex flex-col items-center gap-1.5">
                        {[1, 2, 3].map((t) => {
                          const triAffected = info.trimesters?.includes(t);
                          const isActive = t === trimesterNum;
                          const SafeIcon = triAffected ? triStyles.riskIcon : triStyles.icon;
                          const colorClass = triAffected ? triStyles.risk : triStyles.safe;
                          return (
                            <motion.div
                              key={t}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: t * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
                              className={cn(
                                'flex-1 rounded-lg p-3 text-center border transition-all',
                                colorClass,
                                isActive && 'ring-2 ring-cyan-400/50 scale-105',
                              )}
                            >
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {t === 1 && <Baby className="w-3.5 h-3.5" />}
                                {t === 2 && <ShieldCheck className="w-3.5 h-3.5" />}
                                {t === 3 && <ShieldAlert className="w-3.5 h-3.5" />}
                                <span className="text-xs font-semibold">T{t}</span>
                              </div>
                              <SafeIcon className={cn('w-5 h-5 mx-auto', triAffected ? 'text-red-400' : 'text-emerald-400')} />
                              <p className={cn('text-xs font-semibold mt-1', triAffected ? 'text-red-400' : 'text-emerald-400')}>
                                {triAffected ? '⚠ Risk' : '✓ OK'}
                              </p>
                              {isActive && (
                                <motion.div
                                  layoutId="trimester-indicator"
                                  className="w-1.5 h-1.5 rounded-full bg-cyan-400 mx-auto mt-1"
                                  animate={{ scale: [1, 1.4, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {affected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/10 border border-red-500/20 rounded-md p-3 flex items-start gap-2"
                    >
                      <Ban className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-400">Trimester {trimester} Warning</p>
                        <p className="text-sm text-red-300 mt-1">
                          {info.risk}
                          {cat === 'X' ? ' — ABSOLUTELY CONTRAINDICATED in pregnancy.' : cat === 'D' ? ' — Use only if benefit outweighs risk.' : ''}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </section>
  );
}