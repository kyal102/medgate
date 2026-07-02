'use client';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Flame, AlertTriangle, ShieldCheck } from 'lucide-react';

const BODY_AREAS = [
  { id: 'head', label: 'Head', pct: 9 },
  { id: 'chest', label: 'Anterior Trunk', pct: 18 },
  { id: 'back', label: 'Posterior Trunk', pct: 18 },
  { id: 'l-arm', label: 'L Arm', pct: 9 },
  { id: 'r-arm', label: 'R Arm', pct: 9 },
  { id: 'l-leg', label: 'L Leg', pct: 18 },
  { id: 'r-leg', label: 'R Leg', pct: 18 },
  { id: 'perineum', label: 'Perineum', pct: 1 },
];

export function BurnAssessment() {
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set());
  const [weight, setWeight] = useState(70);
  const [age, setAge] = useState(35);
  const [inhalation, setInhalation] = useState(false);

  const toggleArea = (id: string) => setSelectedAreas(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const tbsa = useMemo(() => {
    return Array.from(selectedAreas).reduce((sum, id) => sum + (BODY_AREAS.find(a => a.id === id)?.pct || 0), 0);
  }, [selectedAreas]);

  const parkland = tbsa > 0 ? 4 * weight * tbsa : 0;
  const brooke = tbsa > 0 ? 2 * weight * tbsa : 0;

  const severity = tbsa >= 20 || age < 10 || age > 50 || inhalation ? 'major' : tbsa >= 10 ? 'moderate' : 'minor';
  const needsBurnCenter = severity === 'major' || tbsa >= 10 || inhalation || tbsa > 5 && involvesHandsFeetFacePerineum();

  const involvesHandsFeetFacePerineum = () => {
    const critical = ['head', 'perineum', 'l-arm', 'r-arm', 'l-leg', 'r-leg'];
    return critical.some(id => selectedAreas.has(id));
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[10px]">Weight (kg)</Label><Input type="number" value={weight} onChange={e => setWeight(parseFloat(e.target.value) || 0)} className="h-8 text-sm" /></div>
            <div><Label className="text-[10px]">Age</Label><Input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} className="h-8 text-sm" /></div>
          </div>
          <label className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" checked={inhalation} onChange={e => setInhalation(e.target.checked)} /> Suspected inhalation injury</label>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {BODY_AREAS.map(area => (
          <button key={area.id} onClick={() => toggleArea(area.id)} className={cn('body-diagram-area p-3 rounded-xl border text-center transition-all', selectedAreas.has(area.id) ? 'body-diagram-area-selected' : 'border-muted/30 hover:bg-muted/20')}>
            <div className="text-xs font-semibold">{area.label}</div>
            <div className="text-lg font-bold">{area.pct}%</div>
            {selectedAreas.has(area.id) && <div className="text-[9px] text-orange-400">Selected</div>}
          </button>
        ))}
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 text-center space-y-2">
          <div className="tbsa-display">{tbsa}%</div>
          <div className="text-xs text-muted-foreground">Total Body Surface Area (TBSA)</div>
          <Badge variant="outline" className={cn('text-xs', severity === 'major' ? 'border-rose-500/40 text-rose-400' : severity === 'moderate' ? 'border-amber-500/40 text-amber-400' : 'border-emerald-500/40 text-emerald-400')}>{severity.toUpperCase()}</Badge>
        </CardContent>
      </Card>

      {tbsa > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Parkland (4mL/kg/%)</div>
            <div className="text-xl font-bold text-orange-400">{parkland.toLocaleString()} mL</div>
            <div className="text-[9px]">1st 8h: {Math.round(parkland / 2)} mL ({Math.round(parkland / 16)} mL/hr)</div>
          </CardContent></Card>
          <Card className="glass-card"><CardContent className="p-3 text-center">
            <div className="text-[10px] text-muted-foreground">Modified Brooke (2mL/kg/%)</div>
            <div className="text-xl font-bold text-primary">{brooke.toLocaleString()} mL</div>
            <div className="text-[9px]">1st 8h: {Math.round(brooke / 2)} mL</div>
          </CardContent></Card>
        </div>
      )}

      {needsBurnCenter && (
        <Alert className="border-rose-500/40 bg-rose-500/10">
          <AlertTitle className="text-xs"><AlertTriangle className="w-3 h-3 text-rose-400 inline mr-1" />Burn Center Referral Indicated</AlertTitle>
          <AlertDescription className="text-[10px] mt-1">Tetanus prophylaxis required. Use LR (Lactated Ringer&apos;s) for resuscitation. Monitor UO target 0.5-1.0 mL/kg/hr.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}