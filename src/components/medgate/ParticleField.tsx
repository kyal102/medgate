'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface Particle {
  id: number;
  left: string;
  top: string;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

function generateParticles(seed: number): Particle[] {
  // Simple seeded random for SSR consistency (seed=0 means "not yet mounted")
  if (seed === 0) return [];
  let s = seed;
  const rand = () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${rand() * 100}%`,
    top: `${rand() * 100}%`,
    size: 2 + rand() * 4,
    duration: 15 + rand() * 25,
    delay: rand() * 10,
    opacity: 0.1 + rand() * 0.25,
  }));
}

export function ParticleField() {
  const [mounted, setMounted] = useState(false);
  const seedRef = useRef(Math.floor(Math.random() * 2147483646) + 1);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => generateParticles(mounted ? seedRef.current : 0), [mounted]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-400 particle-float"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        .particle-float {
          animation: float-molecule linear infinite;
        }
        @keyframes float-molecule {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: var(--particle-opacity, 0.15);
          }
          25% {
            transform: translate(30px, -40px) scale(1.2);
          }
          50% {
            transform: translate(-20px, -80px) scale(0.8);
          }
          75% {
            transform: translate(40px, -40px) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(1);
            opacity: var(--particle-opacity, 0.15);
          }
        }
      `}</style>
    </div>
  );
}