'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useMedGateStore } from '@/lib/medgate-store';
import { cn } from '@/lib/utils';

export function VerificationPulse() {
  const claimResult = useMedGateStore((s) => s.claimResult);
  const isCheckingClaim = useMedGateStore((s) => s.isCheckingClaim);

  const overlayRef = useRef<HTMLDivElement>(null);
  const prevHashRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPulse = useCallback((decision: string) => {
    const el = overlayRef.current;
    if (!el) return;

    // Determine color
    const bgColor =
      decision === 'ALLOW' ? 'rgba(16,185,129,0.15)' :
      decision === 'BLOCK' ? 'rgba(244,63,94,0.2)' :
      'rgba(245,158,11,0.15)';

    const borderColor =
      decision === 'ALLOW' ? 'rgba(16,185,129,0.3)' :
      decision === 'BLOCK' ? 'rgba(244,63,94,0.3)' :
      'rgba(245,158,11,0.3)';

    // Apply styles directly to DOM (no setState)
    el.style.opacity = '1';
    el.style.background = `radial-gradient(ellipse at center, ${bgColor} 0%, transparent 70%)`;
    el.style.borderColor = borderColor;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (el) el.style.opacity = '0';
    }, 1500);
  }, []);

  useEffect(() => {
    if (isCheckingClaim) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const el = overlayRef.current;
      if (el) el.style.opacity = '0';
      prevHashRef.current = null;
      return;
    }

    if (claimResult) {
      const hash = claimResult.evidence_hash;
      if (hash === prevHashRef.current) return;
      prevHashRef.current = hash;
      // Schedule pulse via timeout callback (acceptable pattern)
      timerRef.current = setTimeout(() => {
        showPulse(claimResult.overall_decision);
      }, 50);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [claimResult, isCheckingClaim, showPulse]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-none border-4 border-transparent transition-opacity duration-500"
      style={{ opacity: 0 }}
      aria-hidden="true"
    />
  );
}