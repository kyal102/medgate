'use client';

import { type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal } from './ScrollReveal';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

export function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  className,
}: SectionHeaderProps) {
  return (
    <ScrollReveal className={cn('glass-card flex items-start gap-4 mb-8', className)}>
      <div className="flex items-center justify-center w-13 h-13 rounded-full bg-cyan-500/10 border border-cyan-500/30 shrink-0 pulse-ring relative after:absolute after:inset-0 after:rounded-full after:border after:border-cyan-500/15 after:scale-125">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-[Orbitron] text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-wider relative">
            {title}
            <span className="absolute -bottom-1.5 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-400 to-emerald-400 animate-gradient-underline" />
          </h2>
          {badge && (
            <Badge variant="outline" className={cn('text-xs', badgeColor)}>
              {badge}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-sm max-w-2xl bg-gradient-to-r from-muted-foreground to-muted-foreground/70 bg-clip-text text-transparent">{subtitle}</p>
        )}
      </div>
      <style jsx>{`
        @keyframes gradient-underline {
          0% { width: 0; }
          100% { width: 100%; }
        }
        .animate-gradient-underline {
          animation: gradient-underline 0.8s ease-out 0.3s forwards;
        }
      `}</style>
    </ScrollReveal>
  );
}