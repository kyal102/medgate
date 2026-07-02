'use client';

import { motion } from 'framer-motion';
import { Bell, BellOff, DollarSign, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AnimatedCounter } from './AnimatedCounter';

const ALERT_BREAKDOWN = [
  { name: 'Critical', value: 2, color: '#f43f5e' },
  { name: 'Moderate', value: 49, color: '#f59e0b' },
  { name: 'Informational', value: 49, color: '#64748b' },
];

const VOLUME_DATA = [
  { system: 'Traditional CDS', alerts: 1000, fill: '#f43f5e' },
  { system: 'MedGate', alerts: 12, fill: '#10b981' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

export function AlertFatigueAnalyzer() {
  const ignoredCostTraditional = 1000 * 0.94 * 0.02;
  const medGateAlerts = 12;
  const medGateIgnored = 0;

  return (
    <div className="space-y-6">
      {/* Comparison stats */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Traditional CDS */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl border border-rose-500/20 overflow-hidden glow-rose">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-rose-500/10">
                <BellOff className="h-4 w-4 text-rose-400" />
              </div>
              <span className="text-sm font-medium text-rose-300">Traditional CDS</span>
            </div>
            <p className="text-3xl font-bold gradient-text-rose">
              <AnimatedCounter target={94} suffix="%" />
            </p>
            <p className="text-xs text-slate-400 mt-1">of all alerts are ignored by clinicians</p>
            {/* Animated comparison bar */}
            <div className="mt-3 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '94%' }}
                transition={{ delay: 0.4, duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        {/* MedGate */}
        <motion.div variants={itemVariants} className="glass-card rounded-xl border border-emerald-500/20 overflow-hidden glow-emerald">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Bell className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-emerald-300">MedGate</span>
            </div>
            <p className="text-3xl font-bold gradient-text-emerald">
              <AnimatedCounter target={0} suffix="%" />
            </p>
            <p className="text-xs text-slate-400 mt-1">of alerts are ignored — only critical, actionable alerts</p>
            {/* Animated comparison bar */}
            <div className="mt-3 h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Alert volume comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-4 pb-2">
          <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-cyan-400" />
            Daily Alert Volume
          </p>
        </div>
        <div className="px-4 pb-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={VOLUME_DATA} layout="vertical">
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis type="category" dataKey="system" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="alerts" radius={[0, 4, 4, 0]}>
                {VOLUME_DATA.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Traditional alert breakdown + cost */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4 pb-2">
            <p className="text-sm font-medium text-slate-300">Traditional CDS Alert Breakdown</p>
          </div>
          <div className="px-4 pb-4 h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ALERT_BREAKDOWN} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569' }}>
                  {ALERT_BREAKDOWN.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-xl overflow-hidden">
          <div className="p-4">
            <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-400" />
              Cost of Ignored Alerts
            </p>
            <div className="rounded-lg bg-slate-800/50 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Daily traditional alerts</span>
                <span className="text-slate-200 font-mono"><AnimatedCounter target={1000} /></span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Alerts ignored (94%)</span>
                <span className="text-rose-400 font-mono"><AnimatedCounter target={940} /></span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Serious outcomes from ignored alerts (~2%)</span>
                <span className="text-rose-300 font-mono">~<AnimatedCounter target={19} decimals={1} />/day</span>
              </div>
              <div className="h-px bg-slate-700 my-1" />
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Annual preventable harm events</span>
                <span className="text-rose-400 font-mono gradient-text-rose">
                  ~<AnimatedCounter target={6862} />
                </span>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-emerald-300">
                MedGate reduces alerts by <span className="font-bold gradient-text-emerald">98.8%</span> while catching <span className="font-bold gradient-text-emerald">100%</span> of critical events. Every alert is actionable.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}