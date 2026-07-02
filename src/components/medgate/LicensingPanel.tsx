'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LICENSE_TIERS } from '@/lib/medgate-constants';
import { useMedGateStore } from '@/lib/medgate-store';
import { Star, CheckCircle2, Crown, Building2, GraduationCap, Zap, Code2 } from 'lucide-react';

const TIER_ICONS: Record<string, typeof Star> = {
  clinic: Star,
  hospital: Building2,
  'health-system': Crown,
  government: Building2,
  emergency: Zap,
  research: GraduationCap,
  developer: Code2,
};

const TIER_COLORS: Record<string, { border: string; glow: string; gradient: string; badge: string; btnClass: string }> = {
  clinic: {
    border: 'border-cyan-500/20',
    glow: 'glow-cyan',
    gradient: 'gradient-text-cyan',
    badge: 'text-cyan-400 border-cyan-400/30',
    btnClass: 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10',
  },
  hospital: {
    border: 'border-emerald-500/20',
    glow: 'glow-emerald',
    gradient: 'gradient-text-emerald',
    badge: 'text-emerald-400 border-emerald-400/30',
    btnClass: 'border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10',
  },
  'health-system': {
    border: 'border-cyan-500/30',
    glow: 'glow-cyan',
    gradient: 'gradient-text-cyan',
    badge: 'text-cyan-400 border-cyan-400/30',
    btnClass: 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10',
  },
  government: {
    border: 'border-amber-500/20',
    glow: 'glow-amber',
    gradient: 'gradient-text-amber',
    badge: 'text-amber-400 border-amber-400/30',
    btnClass: 'border-amber-500/50 text-amber-300 hover:bg-amber-500/10',
  },
  emergency: {
    border: 'border-rose-500/20',
    glow: 'glow-rose',
    gradient: 'gradient-text-rose',
    badge: 'text-rose-400 border-rose-400/30',
    btnClass: 'border-rose-500/50 text-rose-300 hover:bg-rose-500/10',
  },
  research: {
    border: 'border-violet-500/20',
    glow: '',
    gradient: '',
    badge: 'text-violet-400 border-violet-400/30',
    btnClass: 'border-violet-500/50 text-violet-300 hover:bg-violet-500/10',
  },
  developer: {
    border: 'border-slate-500/20',
    glow: '',
    gradient: '',
    badge: 'text-slate-400 border-slate-400/30',
    btnClass: 'border-slate-500/50 text-slate-400 hover:bg-slate-500/10',
  },
};

const FEATURE_MATRIX = [
  'Drug Interaction Gate',
  'Dose Verification Gate',
  'Allergy Cross-Ref Gate',
  'Lab Result Validity Gate',
  'Protocol Compliance Gate',
  'Contrast Agent Gate',
  'Time Critical Gate',
  'Pediatric Safety Gate',
  'Pregnancy Safety Gate',
  'Vital Sign Anomaly Gate',
  'Antibiotic Stewardship Gate',
  'Blood Product Gate',
  'Medical Device Gate',
  'Diagnostic Plausibility Gate',
  'HL7/FHIR Integration',
  'Custom Gate Builder',
  'White-Label Option',
  'Offline Mode',
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

const featureItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
};

export function LicensingPanel() {
  const currentLicense = useMedGateStore((s) => s.currentLicense);
  const setCurrentLicense = useMedGateStore((s) => s.setCurrentLicense);

  return (
    <div className="space-y-6">
      {/* Pricing cards */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {LICENSE_TIERS.map((tier) => {
          const Icon = TIER_ICONS[tier.id] || Star;
          const isPopular = tier.id === 'health-system';
          const isSelected = currentLicense.id === tier.id;
          const colors = TIER_COLORS[tier.id] || TIER_COLORS.developer;

          return (
            <motion.div key={tier.id} variants={itemVariants} className="relative">
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 shadow-lg shadow-cyan-500/30">Most Popular</Badge>
                </div>
              )}
              <div
                className={`h-full rounded-xl border p-4 space-y-3 transition-all duration-300 ${
                  isPopular
                    ? `animated-border border-cyan-500/50 bg-cyan-950/20`
                    : isSelected
                    ? `border-emerald-500/40 bg-emerald-950/10 ${colors.glow}`
                    : `glass-card-hover border ${colors.border}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${isPopular ? 'text-cyan-400' : colors.badge.split(' ')[0]}`} />
                  <p className="text-sm font-medium text-slate-200">{tier.name}</p>
                </div>
                <p className="text-[10px] text-slate-500">{tier.target}</p>

                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${isPopular ? 'gradient-text-cyan' : colors.gradient || 'text-slate-200'}`}>
                    {tier.price}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  <span className="font-bold text-slate-300">{tier.gates}</span> verification gates included
                </p>

                <motion.div
                  className="space-y-1 max-h-48 overflow-y-auto"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {tier.features.map((f) => (
                    <motion.div key={f} variants={featureItemVariants} className="flex items-start gap-1.5 text-[11px] text-slate-300">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400 mt-0.5 shrink-0" />
                      {f}
                    </motion.div>
                  ))}
                </motion.div>

                <Button
                  onClick={() => setCurrentLicense(tier)}
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  className={`w-full text-xs ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-700 btn-glow'
                      : isPopular
                      ? `${colors.btnClass} btn-glow`
                      : colors.btnClass
                  }`}
                >
                  {isSelected ? '✓ Selected' : 'Select Plan'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Section divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Feature Comparison</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
      </div>

      {/* Feature comparison table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 280, damping: 24 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-4 pb-3">
          <p className="text-sm font-medium text-slate-300">Feature Comparison</p>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-2 pr-4 text-slate-500 font-medium min-w-[120px] sm:min-w-[160px]">Feature</th>
                {LICENSE_TIERS.slice(0, 5).map((t) => {
                  const colors = TIER_COLORS[t.id];
                  return (
                    <th key={t.id} className={`text-center py-2 px-2 font-medium min-w-[60px] sm:min-w-[80px] ${colors?.badge.split(' ')[0] || 'text-slate-400'}`}>
                      {t.name.replace('MedGate ', '')}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {FEATURE_MATRIX.map((feature, idx) => (
                <motion.tr
                  key={feature}
                  className="border-b border-slate-800/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.45 + idx * 0.03 }}
                >
                  <td className="py-1.5 pr-4 text-slate-400">{feature}</td>
                  {LICENSE_TIERS.slice(0, 5).map((t) => {
                    const included = idx < t.gates || (idx >= 14 && t.gates >= 10);
                    return (
                      <td key={t.id} className="py-1.5 px-2 text-center">
                        {included ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}