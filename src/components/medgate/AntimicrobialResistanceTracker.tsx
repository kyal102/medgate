'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Bug, Search, Filter, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, Eye, Activity, Shield, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatedCounter } from './AnimatedCounter';
import { cn } from '@/lib/utils';

type ResistanceLevel = 'susceptible' | 'intermediate' | 'resistant' | 'xdr' | 'pdr';
type SpreadRisk = 'low' | 'moderate' | 'high' | 'critical';

interface Organism {
  id: string;
  name: string;
  shortName: string;
  mechanism: string;
  resistanceLevel: ResistanceLevel;
  spreadRisk: SpreadRisk;
  firstLine: string[];
  isolationType: string;
  surveillancePriority: 'routine' | 'enhanced' | 'critical';
  susceptibility: Record<string, string>;
  empiricTherapy: string;
  trend: number[];
}

const RESISTANCE_CONFIG: Record<ResistanceLevel, { label: string; color: string; bg: string; badge: string }> = {
  susceptible: { label: 'Susceptible', color: 'text-emerald-400', bg: 'bg-emerald-500/20', badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  intermediate: { label: 'Intermediate', color: 'text-amber-400', bg: 'bg-amber-500/20', badge: 'border-amber-500/40 bg-amber-500/10 text-amber-400' },
  resistant: { label: 'Resistant', color: 'text-rose-400', bg: 'bg-rose-500/20', badge: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
  xdr: { label: 'XDR', color: 'text-purple-400', bg: 'bg-purple-500/20', badge: 'border-purple-500/40 bg-purple-500/10 text-purple-400' },
  pdr: { label: 'PDR', color: 'text-rose-300', bg: 'bg-rose-600/30', badge: 'border-rose-500/60 bg-rose-500/20 text-rose-300' },
};

const SPREAD_CONFIG: Record<SpreadRisk, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-emerald-400' },
  moderate: { label: 'Moderate', color: 'text-amber-400' },
  high: { label: 'High', color: 'text-rose-400' },
  critical: { label: 'Critical', color: 'text-rose-300' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ORGANISMS: Organism[] = [
  {
    id: 'mrsa', name: 'Methicillin-Resistant S. aureus', shortName: 'MRSA',
    mechanism: 'mecA gene → PBP2a alteration',
    resistanceLevel: 'resistant', spreadRisk: 'high', firstLine: ['Vancomycin', 'Linezolid'],
    isolationType: 'Contact Precautions', surveillancePriority: 'enhanced',
    susceptibility: { Vancomycin: 'S', Linezolid: 'S', Daptomycin: 'S', Clindamycin: 'R', Ciprofloxacin: 'R', Erythromycin: 'R', 'TMP-SMX': 'S', Doxycycline: 'S' },
    empiricTherapy: 'Vancomycin 15-20 mg/kg q8-12h (target trough 15-20 mcg/mL)',
    trend: [18, 20, 22, 19, 21, 24, 22, 25, 23, 26, 24, 27],
  },
  {
    id: 'vre', name: 'Vancomycin-Resistant Enterococcus', shortName: 'VRE',
    mechanism: 'vanA/vanB genes → D-Ala-D-Lac',
    resistanceLevel: 'resistant', spreadRisk: 'high', firstLine: ['Linezolid', 'Daptomycin'],
    isolationType: 'Contact Precautions', surveillancePriority: 'enhanced',
    susceptibility: { Linezolid: 'S', Daptomycin: 'S', Ampicillin: 'R', Vancomycin: 'R', Teicoplanin: 'R', Nitrofurantoin: 'S', Fosfomycin: 'S' },
    empiricTherapy: 'Linezolid 600mg q12h',
    trend: [12, 14, 13, 16, 18, 17, 19, 21, 20, 22, 23, 25],
  },
  {
    id: 'esbl', name: 'ESBL-Producing E. coli', shortName: 'ESBL E. coli',
    mechanism: 'CTX-M, TEM, SHV β-lactamases',
    resistanceLevel: 'intermediate', spreadRisk: 'moderate', firstLine: ['Carbapenem', 'Piperacillin-Tazobactam (if susceptible)'],
    isolationType: 'Contact Precautions', surveillancePriority: 'routine',
    susceptibility: { Meropenem: 'S', Ertapenem: 'S', Ceftriaxone: 'R', Ciprofloxacin: 'R', 'TMP-SMX': 'R', Gentamicin: 'I', Amikacin: 'S', Nitrofurantoin: 'S' },
    empiricTherapy: 'Meropenem 1g q8h or Ertapenem 1g q24h',
    trend: [30, 32, 35, 33, 36, 38, 40, 39, 42, 41, 44, 46],
  },
  {
    id: 'cre', name: 'Carbapenem-Resistant Enterobacterales', shortName: 'CRE (KPC)',
    mechanism: 'KPC carbapenemase (blaKPC)',
    resistanceLevel: 'xdr', spreadRisk: 'critical', firstLine: ['Ceftazidime-Avibactam', 'Colistin (last resort)'],
    isolationType: 'Contact + Private Room', surveillancePriority: 'critical',
    susceptibility: { 'Ceftazidime-Avibactam': 'S', Colistin: 'S', Meropenem: 'R', Ertapenem: 'R', Cefepime: 'R', 'Piperacillin-Tazobactam': 'R', Tigecycline: 'I', Fosfomycin: 'I' },
    empiricTherapy: 'Ceftazidime-Avibactam 2.5g q8h + consider Colistin loading dose',
    trend: [5, 6, 7, 8, 9, 10, 11, 13, 14, 16, 17, 19],
  },
  {
    id: 'mdr-pa', name: 'MDR Pseudomonas aeruginosa', shortName: 'MDR P. aeruginosa',
    mechanism: 'Efflux pumps, porin loss, AmpC hyperproduction',
    resistanceLevel: 'xdr', spreadRisk: 'high', firstLine: ['Ceftolozane-Tazobactam', 'Cefiderocol'],
    isolationType: 'Contact Precautions', surveillancePriority: 'critical',
    susceptibility: { 'Ceftolozane-Tazobactam': 'S', Cefiderocol: 'S', Colistin: 'S', Meropenem: 'R', 'Piperacillin-Tazobactam': 'R', Ciprofloxacin: 'R', Ceftazidime: 'R', Gentamicin: 'R' },
    empiricTherapy: 'Ceftolozane-Tazobactam 3g q8h',
    trend: [15, 16, 18, 17, 20, 22, 21, 24, 23, 25, 27, 28],
  },
  {
    id: 'mdr-ab', name: 'MDR Acinetobacter baumannii', shortName: 'MDR A. baumannii',
    mechanism: 'OXA-type carbapenemases (OXA-23, OXA-48)',
    resistanceLevel: 'xdr', spreadRisk: 'critical', firstLine: ['Colistin', 'Tigecycline'],
    isolationType: 'Contact + Private Room', surveillancePriority: 'critical',
    susceptibility: { Colistin: 'S', Tigecycline: 'S', Minocycline: 'I', Meropenem: 'R', 'Ampicillin-Sulbactam': 'R', Levofloxacin: 'R', Gentamicin: 'R', 'Trimethoprim-Sulfamethoxazole': 'R' },
    empiricTherapy: 'Colistin IV + Tigecycline 100mg q12h (high-dose)',
    trend: [8, 9, 10, 12, 14, 15, 17, 19, 21, 22, 24, 26],
  },
  {
    id: 'cdiff', name: 'Clostridioides difficile', shortName: 'C. difficile',
    mechanism: 'Toxin A/B production, spore formation',
    resistanceLevel: 'intermediate', spreadRisk: 'high', firstLine: ['Vancomycin PO', 'Fidaxomicin'],
    isolationType: 'Contact + Dedicated Equipment', surveillancePriority: 'enhanced',
    susceptibility: { 'Vancomycin PO': 'S', Fidaxomicin: 'S', Metronidazole: 'I', 'Fidaxomicin': 'S' },
    empiricTherapy: 'Vancomycin 125mg PO q6h (non-severe) or Fidaxomicin 200mg q12h',
    trend: [22, 20, 21, 19, 18, 20, 22, 21, 19, 18, 20, 19],
  },
  {
    id: 'cauris', name: 'Candida auris', shortName: 'C. auris',
    mechanism: 'Multiclass antifungal resistance, biofilm formation',
    resistanceLevel: 'pdr', spreadRisk: 'critical', firstLine: ['Echinocandins (first-line)', 'Investigational agents'],
    isolationType: 'Contact + Private Room + Dedicated Equipment', surveillancePriority: 'critical',
    susceptibility: { Echinocandins: 'S', Fluconazole: 'R', 'Amphotericin B': 'I', Voriconazole: 'R', Flucytosine: 'R', 'Ibrexafungerp (inv)': 'S' },
    empiricTherapy: 'Echinocandin (Micafungin/Caspofungin) pending susceptibility',
    trend: [2, 3, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16],
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } },
};

export function AntimicrobialResistanceTracker() {
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSpread, setFilterSpread] = useState<string>('all');
  const [selectedOrg, setSelectedOrg] = useState<Organism | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const filtered = useMemo(() => {
    return ORGANISMS.filter((org) => {
      const matchSearch = !search || org.name.toLowerCase().includes(search.toLowerCase()) || org.shortName.toLowerCase().includes(search.toLowerCase());
      const matchLevel = filterLevel === 'all' || org.resistanceLevel === filterLevel;
      const matchSpread = filterSpread === 'all' || org.spreadRisk === filterSpread;
      return matchSearch && matchLevel && matchSpread;
    });
  }, [search, filterLevel, filterSpread]);

  const stats = useMemo(() => ({
    total: ORGANISMS.length,
    highRisk: ORGANISMS.filter((o) => o.spreadRisk === 'high' || o.spreadRisk === 'critical').length,
    criticalAlerts: ORGANISMS.filter((o) => o.resistanceLevel === 'xdr' || o.resistanceLevel === 'pdr').length,
    coverageChanges: ORGANISMS.filter((o) => o.trend[11] > o.trend[0] * 1.1).length,
  }), []);

  const handleFetch = async () => {
    setIsFetching(true);
    try {
      await fetch('/api/medgate/antimicrobial-resistance');
    } catch { /* local fallback */ }
    setIsFetching(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: 'Organisms Tracked', value: stats.total, icon: Bug, color: 'text-primary', bg: 'bg-cyan-500/10' },
          { label: 'High-Risk Organisms', value: stats.highRisk, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Critical Spread Alerts', value: stats.criticalAlerts, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Coverage Changes Needed', value: stats.coverageChanges, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('p-1.5 rounded-lg', stat.bg)}>
                <stat.icon className={cn('w-4 h-4', stat.color)} />
              </div>
              <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
            </div>
            <p className={cn('text-2xl sm:text-3xl font-bold', stat.color)}>
              <AnimatedCounter target={stat.value} />
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-4 flex flex-wrap gap-3 items-center"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organisms..."
            className="glass-input pl-9 text-sm"
          />
        </div>
        <Select value={filterLevel} onValueChange={setFilterLevel}>
          <SelectTrigger className="glass-input w-[160px] text-sm">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            <SelectValue placeholder="Resistance Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {Object.entries(RESISTANCE_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSpread} onValueChange={setFilterSpread}>
          <SelectTrigger className="glass-input w-[140px] text-sm">
            <SelectValue placeholder="Spread Risk" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            {Object.entries(SPREAD_CONFIG).map(([key, cfg]) => (
              <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleFetch}
          disabled={isFetching}
          variant="outline"
          size="sm"
          className="border-slate-600 text-slate-300 hover:text-primary hover:border-primary/50"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          {isFetching ? 'Fetching...' : 'Fetch AMR Data'}
        </Button>
      </motion.div>

      {/* Organism Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {filtered.map((org) => {
            const resCfg = RESISTANCE_CONFIG[org.resistanceLevel];
            const spreadCfg = SPREAD_CONFIG[org.spreadRisk];
            const trendUp = org.trend[11] > org.trend[0];
            const trendPct = ((org.trend[11] - org.trend[0]) / org.trend[0] * 100).toFixed(0);

            return (
              <Dialog key={org.id}>
                <motion.div variants={itemVariants} layout>
                  <DialogTrigger asChild>
                    <Card className={cn(
                      'glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all group h-full',
                      org.spreadRisk === 'critical' && 'border-rose-500/30'
                    )}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{org.shortName}</p>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">{org.mechanism}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-[10px] shrink-0 ml-2', resCfg.badge)}>
                          {resCfg.label}
                        </Badge>
                      </div>

                      {/* Mini trend sparkline */}
                      <div className="flex items-end gap-[2px] h-10 my-2">
                        {org.trend.map((val, i) => {
                          const maxVal = Math.max(...org.trend);
                          const h = (val / maxVal) * 100;
                          return (
                            <div
                              key={i}
                              className="flex-1 rounded-sm min-w-[4px] transition-colors group-hover:opacity-90"
                              style={{
                                height: `${h}%`,
                                backgroundColor: org.resistanceLevel === 'pdr' ? '#f43f5e'
                                  : org.resistanceLevel === 'xdr' ? '#a855f7'
                                  : org.resistanceLevel === 'resistant' ? '#f59e0b'
                                  : '#10b981',
                                opacity: 0.4 + (i / 11) * 0.6,
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Spread Risk</span>
                        <span className={cn('font-medium', spreadCfg.color)}>{spreadCfg.label}</span>
                      </div>

                      {/* First-line */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {org.firstLine.slice(0, 2).map((tx) => (
                          <Badge key={tx} variant="outline" className="text-[9px] border-slate-700 text-slate-400">
                            {tx}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/30">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] text-slate-500">Click for details</span>
                        </div>
                        <div className={cn('flex items-center gap-0.5 text-[10px]', trendUp ? 'text-rose-400' : 'text-emerald-400')}>
                          <TrendingUp className={cn('w-3 h-3', !trendUp && 'rotate-180')} />
                          {trendUp ? '+' : ''}{trendPct}%
                        </div>
                      </div>
                    </Card>
                  </DialogTrigger>

                  {/* Detail Dialog */}
                  <DialogContent className="glass-card max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-white flex items-center gap-2">
                        <Bug className="w-5 h-5 text-primary" />
                        {org.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Resistance Mechanism</p>
                          <p className="text-sm text-white">{org.mechanism}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-slate-400">Isolation Requirement</p>
                          <p className="text-sm text-amber-400">{org.isolationType}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-400 uppercase mb-1">Resistance Level</p>
                          <Badge variant="outline" className={cn('text-xs', resCfg.badge)}>{resCfg.label}</Badge>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-400 uppercase mb-1">Spread Risk</p>
                          <span className={cn('text-sm font-semibold', spreadCfg.color)}>{spreadCfg.label}</span>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-[10px] text-slate-400 uppercase mb-1">Surveillance</p>
                          <Badge variant="outline" className={cn('text-xs',
                            org.surveillancePriority === 'critical' ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                              : org.surveillancePriority === 'enhanced' ? 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                              : 'border-slate-600 text-slate-400 bg-slate-800'
                          )}>
                            {org.surveillancePriority.charAt(0).toUpperCase() + org.surveillancePriority.slice(1)}
                          </Badge>
                        </div>
                      </div>

                      <Separator className="bg-slate-700/50" />

                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Susceptibility Profile</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {Object.entries(org.susceptibility).map(([drug, sus]) => (
                            <div key={drug} className={cn(
                              'flex items-center justify-between px-2 py-1.5 rounded-md text-xs border',
                              sus === 'S' ? 'bg-emerald-500/5 border-emerald-500/20'
                                : sus === 'I' ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-rose-500/5 border-rose-500/20'
                            )}>
                              <span className="text-slate-300 truncate mr-2">{drug}</span>
                              <span className={cn('font-bold shrink-0',
                                sus === 'S' ? 'text-emerald-400' : sus === 'I' ? 'text-amber-400' : 'text-rose-400'
                              )}>
                                {sus === 'S' ? <CheckCircle2 className="w-3.5 h-3.5" /> : sus === 'I' ? 'I' : <XCircle className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                        <p className="text-xs text-primary font-medium mb-1">Recommended Empiric Therapy</p>
                        <p className="text-sm text-slate-300">{org.empiricTherapy}</p>
                      </div>

                      {/* 12-month Trend */}
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">12-Month Resistance Trend (%)</p>
                        <div className="flex items-end gap-1 h-24">
                          {org.trend.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${val * 2.5}px` }}
                                transition={{ delay: i * 0.03 }}
                                className={cn('w-full rounded-t-sm',
                                  org.resistanceLevel === 'pdr' ? 'bg-rose-500/70'
                                    : org.resistanceLevel === 'xdr' ? 'bg-purple-500/70'
                                    : org.resistanceLevel === 'resistant' ? 'bg-amber-500/70'
                                    : 'bg-emerald-500/70'
                                )}
                              />
                              <span className="text-[8px] text-slate-600">{MONTHS[i]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </motion.div>
              </Dialog>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Trend Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-card rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-primary" />
          <p className="text-sm font-medium text-slate-300">Year-Over-Year Resistance Trends</p>
        </div>
        <div className="space-y-3">
          {ORGANISMS.map((org, idx) => {
            const change = ((org.trend[11] - org.trend[0]) / org.trend[0] * 100).toFixed(1);
            const isUp = Number(change) > 0;
            return (
              <motion.div
                key={org.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3"
              >
                <span className="text-xs text-slate-400 w-32 sm:w-40 shrink-0 truncate">{org.shortName}</span>
                <div className="flex-1 h-6 bg-slate-800/50 rounded-full overflow-hidden relative">
                  {org.trend.map((val, i) => {
                    const maxAll = Math.max(...ORGANISMS.flatMap((o) => o.trend));
                    const w = 100 / 12;
                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full"
                        style={{
                          left: `${i * w}%`,
                          width: `${w - 1}%`,
                          backgroundColor: org.resistanceLevel === 'pdr' ? 'rgba(244,63,94,0.5)'
                            : org.resistanceLevel === 'xdr' ? 'rgba(168,85,247,0.5)'
                            : org.resistanceLevel === 'resistant' ? 'rgba(245,158,11,0.4)'
                            : 'rgba(16,185,129,0.4)',
                          opacity: 0.3 + (val / maxAll) * 0.7,
                        }}
                      />
                    );
                  })}
                  {/* SVG line */}
                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <polyline
                      fill="none"
                      stroke={isUp ? '#f43f5e' : '#10b981'}
                      strokeWidth="2"
                      points={org.trend.map((val, i) => {
                        const x = (i / 11) * 100;
                        const maxAll = Math.max(...ORGANISMS.flatMap((o) => o.trend));
                        const y = 100 - (val / maxAll) * 85 - 5;
                        return `${x},${y}`;
                      }).join(' ')}
                    />
                  </svg>
                </div>
                <div className={cn('text-xs font-mono w-16 text-right shrink-0', isUp ? 'text-rose-400' : 'text-emerald-400')}>
                  {isUp ? '+' : ''}{change}%
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Stewardship Alert */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3"
      >
        <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-amber-300">Antibiotic Stewardship Alert</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Local resistance patterns show rising ESBL E. coli ({ORGANISMS[2].trend[11]}%) and CRE ({ORGANISMS[3].trend[11]}%) rates.
            Consider adjusting empiric therapy guidelines. C. auris has increased <span className="text-rose-400 font-medium">{((ORGANISMS[7].trend[11] - ORGANISMS[7].trend[0]) / ORGANISMS[7].trend[0] * 100).toFixed(0)}%</span> year-over-year — enhanced surveillance recommended.
          </p>
        </div>
      </motion.div>
    </div>
  );
}