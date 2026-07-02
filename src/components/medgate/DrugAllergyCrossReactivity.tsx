'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { ShieldAlert, AlertTriangle, ShieldCheck, Search } from 'lucide-react';

const ALLERGIES: Record<string, { label: string; agents: { name: string; crossReactivity: string; safe: boolean; rate: string }[] }> = {
  penicillin: {
    label: 'Penicillin Allergy',
    agents: [
      { name: 'Amoxicillin', crossReactivity: 'High', safe: false, rate: '~1%' },
      { name: 'Ampicillin', crossReactivity: 'High', safe: false, rate: '~1%' },
      { name: 'Piperacillin-Tazobactam', crossReactivity: 'Low', safe: false, rate: '<1%' },
      { name: 'Cefazolin (1st gen)', crossReactivity: 'Low', safe: false, rate: '1-2%' },
      { name: 'Ceftriaxone (3rd gen)', crossReactivity: 'Very Low', safe: false, rate: '<1%' },
      { name: 'Cefepime (4th gen)', crossReactivity: 'Very Low', safe: false, rate: '<1%' },
      { name: 'Aztreonam (Monobactam)', crossReactivity: 'None', safe: true, rate: '0%' },
      { name: 'Meropenem (Carbapenem)', crossReactivity: 'Very Low', safe: false, rate: '<1%' },
      { name: 'Azithromycin', crossReactivity: 'None (different class)', safe: true, rate: '0%' },
      { name: 'Clindamycin', crossReactivity: 'None (different class)', safe: true, rate: '0%' },
      { name: 'Vancomycin', crossReactivity: 'None (different class)', safe: true, rate: '0%' },
      { name: 'Doxycycline', crossReactivity: 'None (different class)', safe: true, rate: '0%' },
    ],
  },
  nsaid: {
    label: 'NSAID Allergy / AERD (Samter\'s Triad)',
    agents: [
      { name: 'Ibuprofen', crossReactivity: 'High (COX-1)', safe: false, rate: 'High' },
      { name: 'Naproxen', crossReactivity: 'High (COX-1)', safe: false, rate: 'High' },
      { name: 'Aspirin', crossReactivity: 'High (COX-1)', safe: false, rate: 'High' },
      { name: 'Diclofenac', crossReactivity: 'High (COX-1)', safe: false, rate: 'High' },
      { name: 'Celecoxib (COX-2 selective)', crossReactivity: 'Low', safe: true, rate: '~2% (AERD: ~5%)' },
      { name: 'Acetaminophen', crossReactivity: 'None', safe: true, rate: '0%' },
      { name: 'Tramadol', crossReactivity: 'None', safe: true, rate: '0%' },
    ],
  },
  sulfonamide: {
    label: 'Sulfonamide Antibiotic Allergy',
    agents: [
      { name: 'Sulfamethoxazole', crossReactivity: 'Same class', safe: false, rate: 'High' },
      { name: 'Sulfasalazine', crossReactivity: 'Same class', safe: false, rate: 'High' },
      { name: 'Furosemide (non-antibiotic)', crossReactivity: 'Very Low', safe: true, rate: '<1%' },
      { name: 'Hydrochlorothiazide', crossReactivity: 'Very Low', safe: true, rate: '<1%' },
      { name: 'Celecoxib (contains sulfonamide)', crossReactivity: 'Low', safe: true, rate: '<1%' },
      { name: 'Glipizide (sulfonylurea)', crossReactivity: 'Very Low', safe: true, rate: '<1%' },
    ],
  },
};

export function DrugAllergyCrossReactivity() {
  const [selectedAllergy, setSelectedAllergy] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const currentAllergy = selectedAllergy ? ALLERGIES[selectedAllergy] : null;
  const filteredAgents = currentAllergy?.agents.filter(a => a.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-400" /> Drug Allergy Cross-Reactivity</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {Object.entries(ALLERGIES).map(([id, allergy]) => (
              <button key={id} onClick={() => { setSelectedAllergy(id); setSearch(''); }}
                className={cn('p-3 rounded-lg border text-left transition-all', selectedAllergy === id ? 'border-primary/40 bg-primary/10 ring-2 ring-primary/30' : 'border-muted/30 hover:bg-muted/20')}>
                <div className="text-xs font-semibold">{allergy.label}</div>
                <div className="text-[10px] text-muted-foreground">{allergy.agents.length} agents analyzed</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {currentAllergy && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <Input placeholder="Filter agents..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
          <div className="grid gap-2">
            {filteredAgents.map(agent => (
              <Card key={agent.name} className={cn('glass-card border', agent.safe ? 'cross-reactivity-none' : agent.crossReactivity === 'High' ? 'cross-reactivity-high' : 'cross-reactivity-low')}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold">{agent.name}</div>
                    <div className="text-[10px] text-muted-foreground">Cross-reactivity: {agent.crossReactivity} ({agent.rate})</div>
                  </div>
                  <Badge variant="outline" className={cn('text-[9px]', agent.safe ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400')}>
                    {agent.safe ? '✓ Safe Alternative' : '✗ Avoid'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Alert className="border-amber-500/40 bg-amber-500/10">
            <AlertTitle className="text-xs">⚠️ Clinical Note</AlertTitle>
            <AlertDescription className="text-[10px] mt-1">
              True penicillin allergy is over-reported. Only 10% of patients with reported penicillin allergy have true IgE-mediated allergy.
              {selectedAllergy === 'penicillin' && ' Skin testing can clarify. If negative, amoxicillin and most cephalosporins are safe.'}
              {selectedAllergy === 'nsaid' && ' For AERD, aspirin desensitization may be considered by allergist.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}