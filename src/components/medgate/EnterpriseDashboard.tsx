'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Building2, Activity, ShieldCheck, TrendingUp, Server } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

// Simple sparkline SVG generator
function MiniSparkline({ data, color, className = '' }: { data: number[]; color: string; className?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 20;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} className={className} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.8" />
    </svg>
  );
}

const HOSPITALS = [
  {
    name: 'Metro General Hospital',
    location: 'New York, NY',
    beds: 850,
    gatesUsed: 14,
    claimsProcessed: 48720,
    blockedRate: 8.2,
    uptime: '99.97%',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    glow: 'glow-cyan',
    gradient: 'gradient-text-cyan',
    sparkData: [40, 42, 44, 43, 47, 48.7],
  },
  {
    name: "St. Mary's Regional",
    location: 'Chicago, IL',
    beds: 420,
    gatesUsed: 10,
    claimsProcessed: 23145,
    blockedRate: 6.8,
    uptime: '99.95%',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'glow-emerald',
    gradient: 'gradient-text-emerald',
    sparkData: [18, 19, 20, 21, 22, 23.1],
  },
  {
    name: 'Pacific Coast Medical Center',
    location: 'San Francisco, CA',
    beds: 1200,
    gatesUsed: 14,
    claimsProcessed: 72300,
    blockedRate: 7.5,
    uptime: '99.99%',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'glow-amber',
    gradient: 'gradient-text-amber',
    sparkData: [60, 62, 65, 68, 70, 72.3],
  },
  {
    name: 'Rural Health Network',
    location: 'Boise, ID',
    beds: 150,
    gatesUsed: 7,
    claimsProcessed: 8420,
    blockedRate: 5.1,
    uptime: '99.90%',
    color: 'text-rose-400',
    border: 'border-rose-500/20',
    glow: 'glow-rose',
    gradient: 'gradient-text-rose',
    sparkData: [6, 6.5, 7, 7.5, 8, 8.4],
  },
];

export function EnterpriseDashboard() {
  const totalClaims = HOSPITALS.reduce((s, h) => s + h.claimsProcessed, 0);
  const avgBlocked = (HOSPITALS.reduce((s, h) => s + h.blockedRate, 0) / HOSPITALS.length).toFixed(1);
  const totalBeds = HOSPITALS.reduce((s, h) => s + h.beds, 0);

  const summaryStats = [
    { label: 'Total Facilities', value: HOSPITALS.length, icon: Building2, color: 'text-cyan-400', gradient: 'gradient-text-cyan', sparkData: [2, 2.5, 3, 3, 3.5, 4] },
    { label: 'Combined Beds', value: totalBeds, icon: Server, color: 'text-emerald-400', gradient: 'gradient-text-emerald', sparkData: [1800, 2000, 2200, 2400, 2500, 2620] },
    { label: 'Total Claims', value: totalClaims, icon: Activity, color: 'text-amber-400', gradient: 'gradient-text-amber', sparkData: [100000, 115000, 125000, 135000, 145000, 152585] },
    { label: 'Avg Block Rate', value: parseFloat(avgBlocked), icon: ShieldCheck, color: 'text-rose-400', gradient: 'gradient-text-rose', sparkData: [9.5, 9.0, 8.8, 8.5, 7.5, 6.9] },
  ];

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {summaryStats.map((stat) => (
          <motion.div key={stat.label} variants={itemVariants} className="glass-card-hover rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-800/80 ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.gradient}`}>
                {stat.label === 'Avg Block Rate' ? (
                  <AnimatedCounter target={stat.value} suffix="%" decimals={1} />
                ) : stat.label === 'Combined Beds' || stat.label === 'Total Claims' ? (
                  <AnimatedCounter target={stat.value} />
                ) : (
                  <AnimatedCounter target={stat.value} />
                )}
              </p>
            </div>
            <MiniSparkline data={stat.sparkData} color={stat.color.replace('text-', '')} className="opacity-60 shrink-0" />
          </motion.div>
        ))}
      </motion.div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Network Facilities</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>

      {/* Hospital cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {HOSPITALS.map((hospital) => (
          <motion.div key={hospital.name} variants={itemVariants} className={`glass-card-hover rounded-xl border ${hospital.border}`}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{hospital.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{hospital.location} · <AnimatedCounter target={hospital.beds} /> beds</p>
                </div>
                <Badge variant="outline" className={`${hospital.color} border-current/30 text-[10px]`}>{hospital.uptime}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className={`text-lg font-bold ${hospital.gradient}`}><AnimatedCounter target={hospital.gatesUsed} /></p>
                  <p className="text-[10px] text-slate-500">Gates Active</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className="text-lg font-bold text-slate-200"><AnimatedCounter target={hospital.claimsProcessed} suffix="k" decimals={1} duration={1500} /></p>
                  <p className="text-[10px] text-slate-500">Claims (k)</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-slate-800/50">
                  <p className="text-lg font-bold text-rose-400"><AnimatedCounter target={hospital.blockedRate} suffix="%" decimals={1} /></p>
                  <p className="text-[10px] text-slate-500">Blocked</p>
                </div>
              </div>
              <div className="mt-3">
                <MiniSparkline data={hospital.sparkData} color={hospital.color.replace('text-', '')} className="opacity-50" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>

      {/* Network insight */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 24 }}
        className="glass-card rounded-xl border border-cyan-500/20 p-4 flex items-center gap-3"
      >
        <div className="p-2 rounded-lg bg-cyan-500/10">
          <TrendingUp className="h-5 w-5 text-cyan-400 shrink-0" />
        </div>
        <p className="text-xs text-cyan-300">
          Across all facilities, MedGate processes <span className="font-bold gradient-text-cyan"><AnimatedCounter target={totalClaims} /></span> verification claims
          with a network-wide block rate of <span className="font-bold gradient-text-rose"><AnimatedCounter target={parseFloat(avgBlocked)} suffix="%" decimals={1} /></span> — catching dangerous errors before they reach patients.
        </p>
      </motion.div>
    </div>
  );
}