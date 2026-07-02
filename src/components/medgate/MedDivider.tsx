'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MedDividerProps {
  className?: string;
}

export function MedDivider({ className }: MedDividerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={cn('relative flex items-center w-full py-8 group/divider', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Wide ambient glow behind center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-16 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none transition-all duration-700 group-hover/divider:w-64 group-hover/divider:bg-cyan-400/10" />

      {/* Shimmer overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent divider-shimmer" />
      </div>

      {/* Left line with multiple data-flow particles */}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-cyan-500/40 relative">
        {/* Primary flow particle */}
        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full flow-particle flow-particle-1" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.5), 0 0 16px rgba(6,182,212,0.2)' }} />
        {/* Secondary flow particle (offset) */}
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent rounded-full flow-particle flow-particle-2" style={{ boxShadow: '0 0 6px rgba(34,211,238,0.3)' }} />
        {/* Subtle tertiary particle */}
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-px bg-cyan-500/40 rounded-full flow-particle flow-particle-3" />
      </div>

      {/* Left junction dot - larger with ring */}
      <div className="relative shrink-0 -mr-1">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full bg-cyan-400 transition-all duration-300',
          'dark:shadow-[0_0_8px_3px_rgba(34,211,238,0.4)] shadow-[0_0_8px_3px_rgba(6,182,212,0.3)]',
          hovered && 'scale-125 dark:shadow-[0_0_14px_6px_rgba(34,211,238,0.6)] shadow-[0_0_14px_6px_rgba(6,182,212,0.5)]'
        )} />
        {/* Pulse ring on hover */}
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-cyan-400/40 transition-all duration-300',
          hovered ? 'animate-ping scale-150 opacity-0' : 'scale-100 opacity-0'
        )} />
      </div>

      {/* ECG pulse center */}
      <div className={cn(
        'mx-2 relative w-32 sm:w-40 h-6 flex items-center justify-center overflow-hidden transition-all duration-500',
        hovered && 'w-40 sm:w-48'
      )}>
        <svg
          viewBox="0 0 120 24"
          className="w-full h-full ecg-line-anim"
          preserveAspectRatio="none"
          style={{ filter: 'drop-shadow(0 0 4px rgba(34,211,238,0.5)) drop-shadow(0 0 8px rgba(6,182,212,0.2))' }}
        >
          <polyline
            points="0,12 20,12 30,12 35,4 40,20 45,8 50,16 55,12 75,12 85,12 90,4 95,20 100,8 105,16 110,12 120,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="text-cyan-400 dark:text-cyan-300"
          />
        </svg>
        {/* Glow layer */}
        <svg
          viewBox="0 0 120 24"
          className="absolute inset-0 w-full h-full ecg-line-anim"
          preserveAspectRatio="none"
          style={{ filter: 'blur(2px) drop-shadow(0 0 6px rgba(34,211,238,0.4))' }}
        >
          <polyline
            points="0,12 20,12 30,12 35,4 40,20 45,8 50,16 55,12 75,12 85,12 90,4 95,20 100,8 105,16 110,12 120,12"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinejoin="round"
            className="text-cyan-400/30"
          />
        </svg>
      </div>

      {/* Right junction dot */}
      <div className="relative shrink-0 -ml-1">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full bg-cyan-400 transition-all duration-300',
          'dark:shadow-[0_0_8px_3px_rgba(34,211,238,0.4)] shadow-[0_0_8px_3px_rgba(6,182,212,0.3)]',
          hovered && 'scale-125 dark:shadow-[0_0_14px_6px_rgba(34,211,238,0.6)] shadow-[0_0_14px_6px_rgba(6,182,212,0.5)]'
        )} />
        <div className={cn(
          'absolute inset-0 rounded-full border-2 border-cyan-400/40 transition-all duration-300',
          hovered ? 'animate-ping scale-150 opacity-0' : 'scale-100 opacity-0'
        )} />
      </div>

      {/* Right line with multiple data-flow particles */}
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-cyan-500/30 to-cyan-500/40 relative">
        <div className="absolute top-1/2 -translate-y-1/2 w-6 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full flow-particle flow-particle-1" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.5), 0 0 16px rgba(6,182,212,0.2)' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent rounded-full flow-particle flow-particle-2" style={{ boxShadow: '0 0 6px rgba(34,211,238,0.3)' }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-px bg-cyan-500/40 rounded-full flow-particle flow-particle-3" />
      </div>

      <style jsx>{`
        .ecg-line-anim {
          animation: ecg-breathe 3s ease-in-out infinite;
        }
        @keyframes ecg-breathe {
          0% { opacity: 0.35; transform: scaleX(1); }
          15% { opacity: 1; transform: scaleX(1.01); }
          30% { opacity: 0.35; transform: scaleX(1); }
          45% { opacity: 0.35; transform: scaleX(1); }
          60% { opacity: 1; transform: scaleX(1.01); }
          75% { opacity: 0.35; transform: scaleX(1); }
          100% { opacity: 0.35; transform: scaleX(1); }
        }

        .flow-particle-1 {
          animation: flow-1 2.5s ease-in-out infinite;
        }
        .flow-particle-2 {
          animation: flow-2 2.5s ease-in-out infinite;
        }
        .flow-particle-3 {
          animation: flow-3 2.5s ease-in-out infinite;
        }
        @keyframes flow-1 {
          0% { left: -8%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }
        @keyframes flow-2 {
          0% { left: 100%; opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { left: -8%; opacity: 0; }
        }
        @keyframes flow-3 {
          0% { left: 20%; opacity: 0; }
          15% { opacity: 0.5; }
          85% { opacity: 0.5; }
          100% { left: 80%; opacity: 0; }
        }

        .divider-shimmer {
          animation: divider-shimmer-move 5s ease-in-out infinite;
        }
        @keyframes divider-shimmer-move {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}