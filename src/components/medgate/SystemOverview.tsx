'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Layers } from 'lucide-react';
import { ScrollReveal } from './ScrollReveal';
import { MedDivider } from './MedDivider';
import { SectionHeader } from './SectionHeader';
import { GateCard } from './GateCard';
import { GateDetailDialog } from './GateDetailDialog';
import { MED_GATES } from '@/lib/medgate-constants';
import type { GateInfo } from '@/lib/medgate-constants';

const IS_ITEMS = [
  'Deterministic verification with zero false negatives',
  'Sub-millisecond processing for every medical claim',
  'Transparent, auditable decision chains',
  '14 specialized gates covering pharmacology, lab, imaging, and more',
  'Built-in evidence hashing for regulatory compliance',
  'Privacy-first: no patient data leaves the verification pipeline',
];

const IS_NOT_ITEMS = [
  'Not an AI/ML model — no probabilistic outputs',
  'Not a diagnostic system — does not diagnose patients',
  'Not a replacement for clinical judgment',
  'Not a electronic health record (EHR) system',
  'Not a treatment recommendation engine',
  'Not approved for direct clinical use',
];

const cardContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function SystemOverview() {
  const [selectedGate, setSelectedGate] = useState<GateInfo | null>(null);

  return (
    <section id="overview" className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionHeader
          icon={Layers}
          title="System Overview"
          subtitle="A deterministic medical verification pipeline with zero tolerance for false negatives."
          badge="Architecture"
        />

        {/* Two-column is / is-not */}
        <motion.div
          className="grid md:grid-cols-2 gap-6 mb-12"
          variants={cardContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {/* What MedGate Is */}
          <motion.div variants={cardItem}>
            <div className="glass-card glow-emerald hover-lift p-6">
              <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
                What MedGate Is
              </h3>
              <ul className="space-y-3">
                {IS_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* What MedGate Is Not */}
          <motion.div variants={cardItem}>
            <div className="glass-card glow-rose hover-lift p-6">
              <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-4">
                What MedGate Is Not
              </h3>
              <ul className="space-y-3">
                {IS_NOT_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                    <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </motion.div>

        <MedDivider />

        {/* Gate cards grid */}
        <ScrollReveal delay={0.2}>
          <h3 className="text-center text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-6">
            The 14 Verification Gates
          </h3>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MED_GATES.map((gate, i) => (
            <ScrollReveal key={gate.id} delay={0.05 * (i % 8)}>
              <GateCard
                gate={gate}
                onClick={() => setSelectedGate(gate)}
              />
            </ScrollReveal>
          ))}
        </div>

        {/* Gate detail dialog */}
        {selectedGate && (
          <GateDetailDialog
            gate={selectedGate}
            open={!!selectedGate}
            onOpenChange={(open) => {
              if (!open) setSelectedGate(null);
            }}
          />
        )}
      </div>
    </section>
  );
}