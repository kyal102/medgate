'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useMedGateStore } from '@/lib/medgate-store';
import { MED_GATES, ICON_MAP } from '@/lib/medgate-constants';
import type { Decision } from '@/lib/medgate-constants';

const MOCK_CLAIMS = [
  'Prescribe warfarin and trimethoprim-sulfamethoxazole for AFib patient',
  'Potassium 7.8 mEq/L reported from floor nurse',
  'Patient with penicillin allergy: prescribe amoxicillin for UTI',
  'STEMI patient: door-to-balloon time at 95 minutes',
  'Prescribe isotretinoin to 28-year-old pregnant patient',
  'Type A+ patient: administer Type B- packed RBCs',
  'Acetaminophen 1000mg QID for 15kg 3-year-old',
  'Prescribe tetracycline to 6-year-old child',
  'CT with contrast: patient on metformin, eGFR 35',
  'ARDS patient: set tidal volume 12 mL/kg IBW on ventilator',
  'CAP with CURB-65 score 3: ceftriaxone + azithromycin',
  'Gentamicin 7mg/kg IV once daily for 70kg patient',
  'Sodium 120 mEq/L — SIADH suspected',
  'Prescribe clopidogrel and omeprazole post-MI',
  'Prescribe methotrexate and ibuprofen for RA',
  'Stroke patient: door-to-needle time at 45 min for tPA',
  'Patient: HR 120, RR 24, Temp 38.9, Lactate 4.2',
  'Prescribe cephalexin to pregnant patient with UTI',
  'Digoxin 0.5mg IV for 85-year-old, eGFR 20',
  'Vancomycin 2g IV q12h for 120kg patient, eGFR 15',
  'Prescribe amoxicillin and probenecid for infection',
  'Prescribe SSRIs and tramadol for chronic pain',
  'Sepsis bundle: 1-hour window approaching',
  'Blood product: Type O- for AB+ patient',
];

const NOTIFICATION_TEMPLATES = [
  (gate: string, claim: string, decision: Decision) => ({
    title: `${gate} triggered`,
    message: `${decision}: ${claim.slice(0, 80)}`,
    type: (decision === 'BLOCK' ? 'error' : decision === 'NEEDS_REVIEW' ? 'warning' : 'success') as 'success' | 'warning' | 'error' | 'info',
  }),
  (gate: string) => ({
    title: 'Gate activity',
    message: `${gate} processed a new verification request`,
    type: 'info' as const,
  }),
];

interface LiveFeedProviderProps {
  children: ReactNode;
}

export function LiveFeedProvider({ children }: LiveFeedProviderProps) {
  const addNotification = useMedGateStore((s) => s.addNotification);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const generateEvent = () => {
      const gate = MED_GATES[Math.floor(Math.random() * MED_GATES.length)];
      const claim = MOCK_CLAIMS[Math.floor(Math.random() * MOCK_CLAIMS.length)];
      const rand = Math.random();
      const decision: Decision =
        rand < 0.55 ? 'ALLOW' : rand < 0.8 ? 'NEEDS_REVIEW' : 'BLOCK';

      const templateIndex = Math.random() < 0.7 ? 0 : 1;
      const template = NOTIFICATION_TEMPLATES[templateIndex];
      const notif = template(gate.name, claim, decision);

      addNotification(notif);
    };

    // Generate first event immediately
    generateEvent();

    // Then generate every 2-3 seconds
    intervalRef.current = setInterval(() => {
      generateEvent();
    }, 2000 + Math.random() * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [addNotification]);

  return <>{children}</>;
}