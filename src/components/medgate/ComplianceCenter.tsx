'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, FileCheck, Scale, Clock, CheckCircle2, AlertTriangle, History } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

interface ComplianceItem {
  id: string;
  label: string;
  checked: boolean;
}

const HIPAA_ITEMS: ComplianceItem[] = [
  { id: 'hipaa-1', label: 'PHI encryption at rest (AES-256)', checked: true },
  { id: 'hipaa-2', label: 'PHI encryption in transit (TLS 1.3)', checked: true },
  { id: 'hipaa-3', label: 'Access control (RBAC)', checked: true },
  { id: 'hipaa-4', label: 'Audit logging enabled', checked: true },
  { id: 'hipaa-5', label: 'Business Associate Agreements (BAA) in place', checked: true },
  { id: 'hipaa-6', label: 'Minimum necessary standard enforced', checked: true },
  { id: 'hipaa-7', label: 'Breach notification procedures documented', checked: false },
  { id: 'hipaa-8', label: 'Risk assessment completed (annual)', checked: false },
];

const FDA_ITEMS: ComplianceItem[] = [
  { id: 'fda-1', label: 'Electronic signatures compliant (21 CFR Part 11)', checked: true },
  { id: 'fda-2', label: 'Audit trail: immutable verification records', checked: true },
  { id: 'fda-3', label: 'System validation (IQ/OQ/PQ)', checked: true },
  { id: 'fda-4', label: 'User authentication requirements met', checked: true },
  { id: 'fda-5', label: 'Data integrity controls (ALCOA+)', checked: true },
  { id: 'fda-6', label: 'Change control procedures documented', checked: false },
];

const EU_MDR_ITEMS: ComplianceItem[] = [
  { id: 'eu-1', label: 'CE marking documentation', checked: true },
  { id: 'eu-2', label: 'Clinical evaluation report (CER)', checked: true },
  { id: 'eu-3', label: 'Post-market surveillance plan', checked: true },
  { id: 'eu-4', label: 'Unique Device Identification (UDI)', checked: true },
  { id: 'eu-5', label: 'Technical documentation (Annex II/III)', checked: false },
  { id: 'eu-6', label: 'Risk management (ISO 14971)', checked: true },
  { id: 'eu-7', label: 'Data protection (GDPR alignment)', checked: true },
];

const AUDIT_TRAIL = [
  { time: '2025-01-15 14:32:18', action: 'Verification completed', user: 'Dr. Chen', detail: 'DrugInteractionGate: BLOCK — Warfarin + TMP-SMX' },
  { time: '2025-01-15 14:31:05', action: 'System audit', user: 'System', detail: 'All gate rules verified current (v2.4.1)' },
  { time: '2025-01-15 14:28:42', action: 'Evidence pack generated', user: 'Nurse Williams', detail: 'Hash: 0xa7f3c9e2... immutable record stored' },
  { time: '2025-01-15 14:15:00', action: 'Compliance check passed', user: 'System', detail: 'HIPAA audit trail integrity verified' },
  { time: '2025-01-15 13:45:33', action: 'User access reviewed', user: 'Admin', detail: 'Quarterly access review — 0 unauthorized accesses' },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

function getGlowClass(rate: number): string {
  if (rate >= 90) return 'glow-emerald';
  if (rate >= 70) return 'glow-amber';
  return 'glow-rose';
}

function getGradientClass(rate: number): string {
  if (rate >= 90) return 'gradient-text-emerald';
  if (rate >= 70) return 'gradient-text-amber';
  return 'gradient-text-rose';
}

function getProgressGradient(rate: number): string {
  if (rate >= 90) return 'from-emerald-500 to-emerald-400';
  if (rate >= 70) return 'from-amber-500 to-amber-400';
  return 'from-rose-500 to-rose-400';
}

interface ComplianceCardProps {
  title: string;
  icon: typeof Shield;
  color: string;
  items: ComplianceItem[];
  index: number;
}

function ComplianceCard({ title, icon: Icon, color, items, index }: ComplianceCardProps) {
  const [checkedItems, setCheckedItems] = useState(items.map((i) => i.checked));
  const complianceRate = Math.round((checkedItems.filter(Boolean).length / items.length) * 100);
  const glowClass = getGlowClass(complianceRate);
  const gradientClass = getGradientClass(complianceRate);
  const progressGradient = getProgressGradient(complianceRate);

  const toggle = (idx: number) => {
    setCheckedItems((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`glass-card rounded-xl overflow-hidden ${complianceRate >= 90 ? glowClass : ''}`}
    >
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <p className="text-sm font-medium text-slate-200">{title}</p>
          </div>
          <Badge variant="outline" className={`${complianceRate === 100 ? 'text-emerald-400 border-emerald-400/30' : complianceRate >= 70 ? 'text-amber-400 border-amber-400/30' : 'text-rose-400 border-rose-400/30'} text-[10px]`}>
            <AnimatedCounter target={complianceRate} suffix="%" className={gradientClass} />
          </Badge>
        </div>

        {/* Animated progress bar */}
        <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${progressGradient} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${complianceRate}%` }}
            transition={{ delay: 0.3 + index * 0.1, duration: 1.2, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-2">
        {items.map((item, idx) => (
          <motion.div
            key={item.id}
            className="flex items-center gap-2.5 py-0.5"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + idx * 0.04 }}
          >
            <Checkbox
              id={item.id}
              checked={checkedItems[idx]}
              onCheckedChange={() => toggle(idx)}
              className={`data-[state=checked]:${color} border-slate-600`}
            />
            <label htmlFor={item.id} className={`text-xs cursor-pointer transition-colors duration-200 ${checkedItems[idx] ? 'text-slate-300' : 'text-slate-500'}`}>
              {item.label}
            </label>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function ComplianceCenter() {
  return (
    <div className="space-y-6">
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <ComplianceCard title="HIPAA" icon={Shield} color="text-cyan-400" items={HIPAA_ITEMS} index={0} />
        <ComplianceCard title="FDA 21 CFR Part 11" icon={Scale} color="text-emerald-400" items={FDA_ITEMS} index={1} />
        <ComplianceCard title="EU MDR 2017/745" icon={FileCheck} color="text-amber-400" items={EU_MDR_ITEMS} index={2} />
      </motion.div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Audit Trail</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
      </div>

      {/* Audit trail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <History className="h-4 w-4 text-cyan-400" />
            Audit Trail
          </p>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Timestamp</th>
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">Action</th>
                <th className="text-left py-2 pr-4 text-slate-500 font-medium">User</th>
                <th className="text-left py-2 text-slate-500 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {AUDIT_TRAIL.map((entry, idx) => (
                <motion.tr
                  key={idx}
                  className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.06 }}
                >
                  <td className="py-2 pr-4 text-slate-500 font-mono text-[10px] whitespace-nowrap">{entry.time}</td>
                  <td className="py-2 pr-4 text-slate-300 whitespace-nowrap">{entry.action}</td>
                  <td className="py-2 pr-4 text-slate-400 whitespace-nowrap">{entry.user}</td>
                  <td className="py-2 text-slate-400 max-w-xs truncate">{entry.detail}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Compliance status callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card rounded-xl border border-emerald-500/20 p-4 flex items-center gap-3 glow-emerald"
      >
        <div className="p-2 rounded-lg bg-emerald-500/10">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        </div>
        <div>
          <p className="text-xs font-medium text-emerald-300">MedGate maintains continuous compliance</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            All verification records are cryptographically hashed and stored immutably, satisfying HIPAA, FDA 21 CFR Part 11, and EU MDR audit trail requirements.
          </p>
        </div>
      </motion.div>
    </div>
  );
}