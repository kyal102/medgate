'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Cpu, Zap, Timer } from 'lucide-react';
import { ParticleField } from './ParticleField';
import { AnimatedCounter } from './AnimatedCounter';

const STATS = [
  { icon: Shield, label: 'Safety Tools', value: 32, suffix: '+', color: 'text-cyan-400', borderColor: 'rgba(34, 211, 238, 0.6)' },
  { icon: Cpu, label: 'Audit Modules', value: 18, suffix: '', color: 'text-emerald-400', borderColor: 'rgba(52, 211, 153, 0.6)' },
  { icon: Zap, label: 'Deterministic', value: 100, suffix: '%', color: 'text-amber-400', borderColor: 'rgba(251, 191, 36, 0.6)' },
  { icon: Timer, label: 'Latency', value: 0.8, suffix: 'ms', prefix: '<', color: 'text-rose-400', borderColor: 'rgba(251, 113, 133, 0.6)', decimals: 1 },
] as const;

export function HeroSection() {
  const scrollToOverview = () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Background layers */}
      <ParticleField />

      {/* DNA helix pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 40px,
            rgba(6, 182, 212, 0.5) 40px,
            rgba(6, 182, 212, 0.5) 41px
          ),
          repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(6, 182, 212, 0.5) 40px,
            rgba(6, 182, 212, 0.5) 41px
          )`,
        }}
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.8)_70%)]" />

      {/* Vignette effect */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-20 text-center">
        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-medium text-emerald-400">All 14 Gates Operational</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-[Orbitron] text-5xl sm:text-6xl md:text-7xl font-bold tracking-wider text-white mb-4"
          style={{ textShadow: '0 0 40px rgba(6, 182, 212, 0.15), 0 0 80px rgba(6, 182, 212, 0.05)' }}
        >
          <span className="gradient-text-cyan">Med</span><span className="gradient-text-emerald">Gate</span>
        </motion.h1>

        {/* Subtitle with typing cursor */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-3 typing-cursor"
        >
          Deterministic Verification Gates for Medical Information Flow
        </motion.p>

        {/* Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm italic text-slate-500 mb-10"
        >
          &ldquo;Every piece of medical information passes through a verification gate —
          deterministically, transparently, in sub-millisecond time.&rdquo;
        </motion.p>

        {/* ECG line animation with cyan glow */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7, duration: 1 }}
          className="w-full max-w-lg mx-auto mb-10 overflow-hidden"
        >
          <svg viewBox="0 0 400 40" className="w-full h-10 ecg-glow-filter" preserveAspectRatio="none">
            <polyline
              points="0,20 60,20 80,20 90,4 100,36 110,10 120,28 130,20 200,20 220,20 230,4 240,36 250,10 260,28 270,20 340,20 360,20 370,4 380,36 390,10 400,20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-cyan-500/40"
            />
          </svg>
        </motion.div>

        {/* CTA Button with glow and idle pulse */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mb-12"
        >
          <Button
            onClick={scrollToOverview}
            size="lg"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-8 py-3 text-sm tracking-wide transition-all btn-glow animate-idle-pulse hover:shadow-[0_0_20px_rgba(6,182,212,0.4),0_0_40px_rgba(6,182,212,0.15),0_0_60px_rgba(34,211,238,0.08)]"
          >
            Explore Verification Gates
          </Button>
        </motion.div>

        {/* Stat cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
        >
          {STATS.map((stat, index) => {
            const SIcon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.5 }}
              >
                <Card
                  className="glass-card-hover stat-card-border border-0"
                  style={{
                    '--stat-color': stat.borderColor,
                    '--border-delay': `${index * 100}ms`,
                  } as React.CSSProperties}
                >
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <SIcon className={`w-5 h-5 ${stat.color} mb-2`} />
                    <span className={`text-3xl font-bold text-white`}>
                      <AnimatedCounter
                        target={stat.value as number}
                        suffix={stat.suffix as string}
                        prefix={('prefix' in stat ? stat.prefix : '') as string}
                        decimals={('decimals' in stat ? stat.decimals : 0) as number}
                        duration={2500}
                      />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">{stat.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Research prototype badge with blink animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10"
        >
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-4 py-1.5 text-xs animate-research-blink"
            style={{ borderColor: 'rgba(245, 158, 11, 0.35)' }}
          >
            ⚠ Research Prototype — Not for Clinical Use
          </Badge>
        </motion.div>
      </div>
    </section>
  );
}