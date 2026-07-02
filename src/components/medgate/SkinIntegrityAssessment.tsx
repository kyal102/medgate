'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Shield, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

const SUBSCALES = [
  { id: 'sensory', label: 'Sensory Perception', options: [
    { v: 1, l: 'Completely Limited: Unresponsive (does not moan, flinch, or grasp) to painful stimuli' },
    { v: 2, l: 'Very Limited: Responds only to painful stimuli (moaning, restlessness)' },
    { v: 3, l: 'Slightly Limited: Responds to verbal commands but not always' },
    { v: 4, l: 'No Impairment: Responds to verbal commands, intact sensation' },
  ]},
  { id: 'moisture', label: 'Moisture', options: [
    { v: 1, l: 'Constantly Moist: Skin is almost always moist' },
    { v: 2, l: 'Very Moist: Skin is often but not always moist' },
    { v: 3, l: 'Occasionally Moist: Skin is occasionally moist' },
    { v: 4, l: 'Rarely Moist: Skin is usually dry' },
  ]},
  { id: 'activity', label: 'Activity', options: [
    { v: 1, l: 'Bedfast: Confined to bed' },
    { v: 2, l: 'Chairfast: Severely limited walking' },
    { v: 3, l: 'Walks Occasionally: During day but short distances' },
    { v: 4, l: 'Walks Frequently: Outside room at least twice/day' },
  ]},
  { id: 'mobility', label: 'Mobility', options: [
    { v: 1, l: 'Completely Immobile: Cannot make even slight body position changes' },
    { v: 2, l: 'Very Limited: Makes occasional slight changes' },
    { v: 3, l: 'Slightly Limited: Makes frequent slight position changes independently' },
    { v: 4, l: 'No Limitations: Makes major/frequent position changes' },
  ]},
  { id: 'nutrition', label: 'Nutrition', options: [
    { v: 1, l: 'Very Poor: Never eats complete meal, <2 servings protein/day' },
    { v: 2, l: 'Probably Inadequate: Rarely eats complete meal, about 3 servings protein/day' },
    { v: 3, l: 'Adequate: Eats >50% of most meals, 4 servings protein/day' },
    { v: 4, l: 'Excellent: Eats most of every meal, ≥4 servings protein/day' },
  ]},
  { id: 'friction', label: 'Friction & Shear', options: [
    { v: 1, l: 'Problem: Requires moderate-maximum assistance in moving, complete lifting impossible without skin sliding' },
    { v: 2, l: 'Potential Problem: Moves feebly or requires minimum assistance' },
    { v: 3, l: 'No Apparent Problem: Moves in bed/chair independently, good muscle strength' },
  ]},
];

const RISK_ZONES = [
  { min: 6, max: 9, label: 'Very High Risk', color: 'rose', interventions: ['Turn q1-2h around the clock', 'Pressure redistribution surface (alternating)', 'Nutritional optimization — dietitian consult', 'Moisture barrier creams', 'Heel suspension devices', 'Consider specialty bed (low-air-loss)', 'Strict skin inspection q shift'] },
  { min: 10, max: 12, label: 'High Risk', color: 'orange', interventions: ['Turn q2h minimum', 'Pressure redistribution mattress', 'Skin assessment q shift', 'Moisture management', 'Nutrition supplement', 'Heel protection'] },
  { min: 13, max: 14, label: 'Moderate Risk', color: 'amber', interventions: ['Turn q2-3h', 'Standard pressure-reducing mattress', 'Skin inspection daily', 'Moisture management', 'Encourage nutrition/fluids'] },
  { min: 15, max: 18, label: 'Mild Risk', color: 'emerald', interventions: ['Turn q3-4h', 'Encourage mobility', 'Daily skin check', 'Adequate nutrition'] },
  { min: 19, max: 23, label: 'No Risk', color: 'emerald', interventions: ['Standard nursing care', 'Encourage activity'] },
];

const WOUND_STAGES = [
  { stage: 'Stage 1', desc: 'Intact skin with non-blanchable erythema', color: 'text-rose-400' },
  { stage: 'Stage 2', desc: 'Partial-thickness skin loss (dermis exposed)', color: 'text-orange-400' },
  { stage: 'Stage 3', desc: 'Full-thickness skin loss (fat visible)', color: 'text-orange-500' },
  { stage: 'Stage 4', desc: 'Full-thickness tissue loss (muscle/bone visible)', color: 'text-rose-500' },
  { stage: 'Unstageable', desc: 'Obscured full-thickness (eschar/slough)', color: 'text-amber-400' },
  { stage: 'DTI', desc: 'Deep Tissue Injury — purple/maroon localized area', color: 'text-purple-400' },
];

export function SkinIntegrityAssessment() {
  const [scores, setScores] = useState<Record<string, number>>({ sensory: 0, moisture: 0, activity: 0, mobility: 0, nutrition: 0, friction: 0 });

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const allAnswered = Object.values(scores).every(v => v > 0);
  const riskZone = allAnswered ? RISK_ZONES.find(z => total >= z.min && total <= z.max) : null;

  const gate = useMemo(() => {
    if (!allAnswered) return 'PENDING';
    if (total <= 12) return 'BLOCK';
    if (total <= 14) return 'NEEDS_REVIEW';
    return 'ALLOW';
  }, [total, allAnswered]);

  return (
    <div className="space-y-4">
      {/* Braden Scale */}
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> Braden Scale</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {SUBSCALES.map(ss => (
            <div key={ss.id} className="space-y-1.5">
              <Label className="text-xs font-semibold">{ss.label} <Badge variant="outline" className="text-[9px] ml-1">{scores[ss.id] || '—'}/4</Badge></Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {ss.options.map(opt => (
                  <button key={opt.v} onClick={() => setScores(prev => ({ ...prev, [ss.id]: opt.v }))}
                    className={cn('text-left text-[10px] p-2 rounded-lg border transition-all', scores[ss.id] === opt.v ? (opt.v <= 2 ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400') : 'border-muted/30 hover:bg-muted/20 text-muted-foreground')}>
                    <span className="font-bold mr-1">({opt.v})</span>{opt.l}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Total Score */}
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Braden Score</h4>
            <div className={cn('text-3xl font-bold', total <= 9 ? 'text-rose-400' : total <= 14 ? 'text-amber-400' : 'text-emerald-400')}>{allAnswered ? total : '—'}/23</div>
          </div>
          <div className="h-4 rounded-full bg-gradient-to-r overflow-hidden">
            <div className="braden-scale-bar" style={{ width: allAnswered ? `${(total / 23) * 100}%` : '0%' }} />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground"><span>6 (Very High)</span><span>12 (High)</span><span>14 (Mod)</span><span>18 (Mild)</span><span>23 (None)</span></div>
        </CardContent>
      </Card>

      {/* Risk & Interventions */}
      {riskZone && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className={cn(riskZone.color === 'rose' || riskZone.color === 'orange' ? 'border-rose-500/40 bg-rose-500/10' : riskZone.color === 'amber' ? 'border-amber-500/40 bg-amber-500/10' : 'border-emerald-500/40 bg-emerald-500/10')}>
            <AlertTitle className="flex items-center gap-2 text-xs">
              {riskZone.color === 'rose' || riskZone.color === 'orange' ? <AlertTriangle className="w-3 h-3 text-rose-400" /> : <ShieldCheck className="w-3 h-3 text-emerald-400" />}
              {riskZone.label}
            </AlertTitle>
            <AlertDescription className="text-[11px] mt-1 space-y-1">
              {riskZone.interventions.map((int, i) => <div key={i}>• {int}</div>)}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <Badge variant="outline" className={cn('text-xs px-3 py-1', gate === 'BLOCK' ? 'border-rose-500/40 text-rose-400' : gate === 'NEEDS_REVIEW' ? 'border-amber-500/40 text-amber-400' : gate === 'ALLOW' ? 'border-emerald-500/40 text-emerald-400' : 'text-muted-foreground')}>Gate: {gate}</Badge>

      {/* Wound Staging Reference */}
      <Card className="glass-card">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Wound Staging Reference</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {WOUND_STAGES.map(ws => (
            <div key={ws.stage} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-muted/20">
              <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div><span className={cn('font-semibold', ws.color)}>{ws.stage}:</span> <span className="text-muted-foreground">{ws.desc}</span></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}