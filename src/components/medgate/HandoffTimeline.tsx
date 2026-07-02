'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Clock, User, Pill, FileText, Activity, Droplets, Baby, Heart, ShieldAlert } from 'lucide-react';
import { AnimatedCounter } from './AnimatedCounter';

const HANDOFF_ITEMS = [
  { time: '06:45', icon: User, label: 'Patient: Maria Garcia, 72F', detail: 'Room 412, Admitted for CHF exacerbation', status: 'verified' as const },
  { time: '06:46', icon: Pill, label: 'Medications verified', detail: 'Furosemide 40mg IV BID, Metoprolol 25mg PO BID, Warfarin 5mg PO daily — all doses confirmed appropriate', status: 'verified' as const },
  { time: '06:47', icon: Activity, label: 'Vital signs reviewed', detail: 'BP 128/78, HR 88 (irregular), RR 18, SpO2 95% on 2L NC, Temp 37.1°C — NEWS2 score: 2 (low risk)', status: 'verified' as const },
  { time: '06:48', icon: FileText, label: 'Lab results pending', detail: 'BNP, BMP, INR, TSH drawn at 05:00 — awaiting results. K+ critical threshold watch active.', status: 'review' as const },
  { time: '06:49', icon: Droplets, label: 'IV access & fluids', detail: '18G PIV right forearm, NS at 75 mL/hr. Contrast study scheduled 14:00 — eGFR 42, metformin hold verified.', status: 'verified' as const },
  { time: '06:50', icon: Heart, label: 'Cardiology consult pending', detail: 'A-fib with RVR episode overnight. Rate controlled. Warfarin bridge discussed with cardiology.', status: 'review' as const },
  { time: '06:51', icon: ShieldAlert, label: 'Allergy alert addressed', detail: 'Documented PCN allergy (rash). Ceftriaxone ordered for pneumonia — cross-reactivity risk: LOW. MedGate verified safe.', status: 'verified' as const },
  { time: '06:52', icon: Pill, label: 'Antibiotic stewardship', detail: 'Ceftriaxone 1g IV daily for HCAP — spectrum appropriate per guidelines. De-escalation in 48h if cultures negative.', status: 'verified' as const },
  { time: '06:53', icon: Baby, label: 'Fall risk assessment', detail: 'Morse Fall Scale: 65 (high risk). Bed alarm active, non-slip socks, assistance for mobility.', status: 'verified' as const },
  { time: '06:54', icon: FileText, label: 'Code status confirmed', detail: 'Full code. Family notified of admission. Goals-of-care discussion planned for tomorrow.', status: 'review' as const },
];

const verifiedCount = HANDOFF_ITEMS.filter(i => i.status === 'verified').length;
const reviewCount = HANDOFF_ITEMS.filter(i => i.status === 'review').length;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

export function HandoffTimeline() {
  return (
    <div className="space-y-4">
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-4 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              Shift Handoff Timeline
            </h3>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                <AnimatedCounter target={verifiedCount} /> Verified
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                <AnimatedCounter target={reviewCount} /> Review
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-0">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-30px' }}
          >
            {HANDOFF_ITEMS.map((item, idx) => {
              const IconComp = item.icon;
              const isVerified = item.status === 'verified';
              const isLast = idx === HANDOFF_ITEMS.length - 1;
              return (
                <motion.div key={idx} variants={itemVariants} className="flex gap-3">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      isVerified ? 'bg-emerald-500/15 border border-emerald-500/30' : 'bg-amber-500/15 border border-amber-500/30'
                    }`}>
                      {isVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 glow-cyan data-flow my-0.5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`glass-card-hover rounded-lg px-3 py-2 flex-1 ${isLast ? 'mb-0' : 'mb-2'}`}>
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <IconComp className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] font-mono text-muted-foreground">{item.time}</span>
                      <span className="text-xs font-medium text-foreground">{item.label}</span>
                      <Badge variant="outline" className={`text-[8px] px-1.5 py-0 ${
                        isVerified ? 'gate-allow' : 'gate-review'
                      }`}>
                        {isVerified ? 'MedGate ✓' : 'Review'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground ml-5.5 leading-relaxed">{item.detail}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}