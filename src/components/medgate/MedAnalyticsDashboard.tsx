'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMedGateStore } from '@/lib/medgate-store';
import { MED_GATES } from '@/lib/medgate-constants';
import { AnimatedCounter } from './AnimatedCounter';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { Activity, ShieldAlert, Clock, TrendingUp } from 'lucide-react';

const DECISION_COLORS = { ALLOW: '#10b981', BLOCK: '#f43f5e', NEEDS_REVIEW: '#f59e0b', EVIDENCE_REQUIRED: '#06b6d4' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export function MedAnalyticsDashboard() {
  const gatePerformance = useMedGateStore((s) => s.gatePerformance);

  const stats = useMemo(() => {
    let totalProcessed = 0;
    let totalBlocked = 0;
    let totalLatency = 0;
    let gateCount = 0;
    for (const stats of Object.values(gatePerformance)) {
      totalProcessed += stats.processed;
      totalBlocked += stats.blocked;
      totalLatency += stats.avgLatencyMs;
      gateCount++;
    }
    return {
      totalVerified: totalProcessed,
      blockedRate: totalProcessed > 0 ? ((totalBlocked / totalProcessed) * 100) : 0,
      avgLatency: gateCount > 0 ? totalLatency / gateCount : 0,
      uptime: 99.97,
    };
  }, [gatePerformance]);

  const barData = useMemo(() => {
    return MED_GATES.map((gate) => {
      const perf = gatePerformance[gate.id];
      return {
        name: gate.name.replace(' Gate', '').substring(0, 16),
        Allowed: perf?.allowed ?? 0,
        Blocked: perf?.blocked ?? 0,
        Review: perf?.needsReview ?? 0,
      };
    });
  }, [gatePerformance]);

  const pieData = useMemo(() => {
    let allowed = 0, blocked = 0, review = 0;
    for (const s of Object.values(gatePerformance)) {
      allowed += s.allowed;
      blocked += s.blocked;
      review += s.needsReview;
    }
    return [
      { name: 'ALLOW', value: allowed },
      { name: 'BLOCK', value: blocked },
      { name: 'NEEDS_REVIEW', value: review },
    ];
  }, [gatePerformance]);

  const trendData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      day,
      verifications: Math.floor(800 + Math.sin(i * 0.8) * 300 + Math.random() * 200),
      blocked: Math.floor(30 + Math.sin(i * 1.2) * 15 + Math.random() * 10),
    }));
  }, []);

  const statCards = [
    { label: 'Total Verified', value: stats.totalVerified, icon: Activity, color: 'text-cyan-400', decimals: 0 },
    { label: 'Blocked Rate', value: stats.blockedRate, icon: ShieldAlert, color: 'text-rose-400', decimals: 1, suffix: '%' },
    { label: 'Avg Latency', value: stats.avgLatency, icon: Clock, color: 'text-amber-400', decimals: 2, suffix: 'ms' },
    { label: 'Uptime', value: stats.uptime, icon: TrendingUp, color: 'text-emerald-400', decimals: 2, suffix: '%' },
  ];

  return (
    <div className="space-y-6 glow-cyan">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        {statCards.map((card) => (
          <motion.div key={card.label} variants={cardVariants} className="glass-card">
            <div className="p-4 flex items-center gap-4">
              <div className={`p-2.5 rounded-lg bg-accent/30 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
                  <AnimatedCounter
                    target={card.value}
                    duration={1500}
                    decimals={card.decimals}
                    suffix={card.suffix || ''}
                  />
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-cyan">Claims by Gate</h3>
          </div>
          <div className="h-56 sm:h-72 px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 10 }}>
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Allowed" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Blocked" stackId="a" fill="#f43f5e" />
                <Bar dataKey="Review" stackId="a" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card">
          <div className="p-4 pb-2">
            <h3 className="text-sm font-medium gradient-text-cyan">Decision Distribution</h3>
          </div>
          <div className="h-56 sm:h-72 flex items-center justify-center px-2 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} labelLine={{ stroke: '#475569' }}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={DECISION_COLORS[entry.name as keyof typeof DECISION_COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium gradient-text-cyan">Daily Verification Trend</h3>
        </div>
        <div className="h-48 sm:h-64 px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="verifications" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
              <Line type="monotone" dataKey="blocked" stroke="#f43f5e" strokeWidth={2} dot={{ fill: '#f43f5e', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}