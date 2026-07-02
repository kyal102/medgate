'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AnimatedCounter } from './AnimatedCounter';
import { DRUG_INTERACTIONS } from '@/lib/medgate-constants';
import { toast } from 'sonner';
import { Search, Pill, ChevronDown, ChevronUp, AlertTriangle, ShieldAlert, ShieldCheck, FlaskConical } from 'lucide-react';

const ADDITIONAL_DRUGS = [
  { name: 'Metformin', category: 'GI', uses: ['Type 2 Diabetes', 'PCOS', 'Metabolic Syndrome'], riskLevel: 'LOW' },
  { name: 'Lisinopril', category: 'Cardiac', uses: ['Hypertension', 'Heart Failure', 'CKD'], riskLevel: 'LOW' },
  { name: 'Omeprazole', category: 'GI', uses: ['GERD', 'PUD', 'H. pylori'], riskLevel: 'MODERATE' },
  { name: 'Prednisone', category: 'Anti-inflammatory', uses: ['Asthma', 'Rheumatoid Arthritis', 'Allergic Reactions'], riskLevel: 'MODERATE' },
  { name: 'Insulin Glargine', category: 'Other', uses: ['Diabetes Mellitus', 'DKA'], riskLevel: 'LOW' },
];

interface DrugCard {
  name: string;
  category: string;
  uses: string[];
  riskLevel: string;
  interactions: {
    partner: string;
    severity: string;
    mechanism: string;
    clinicalEffect: string;
    management: string;
  }[];
}

const CATEGORY_MAP: Record<string, string> = {
  warfarin: 'Anticoagulants',
  methotrexate: 'Antibiotics',
  ssri: 'Psychiatric',
  clopidogrel: 'Cardiac',
  amoxicillin: 'Antibiotics',
  metformin: 'GI',
  statins: 'Cardiac',
  'ace inhibitors': 'Cardiac',
  digoxin: 'Cardiac',
  levodopa: 'Psychiatric',
  'trimethoprim-sulfamethoxazole': 'Antibiotics',
  ibuprofen: 'Analgesics',
  tramadol: 'Analgesics',
  probenecid: 'Other',
  'contrast (iodinated)': 'Other',
  clarithromycin: 'Antibiotics',
  'potassium supplements': 'Other',
  amiodarone: 'Cardiac',
  maois: 'Psychiatric',
  Metformin: 'GI',
  Lisinopril: 'Cardiac',
  Omeprazole: 'GI',
  Prednisone: 'Other',
  'Insulin Glargine': 'Other',
};

function getRiskColor(level: string): { badge: string; text: string; icon: typeof ShieldCheck } {
  switch (level) {
    case 'FATAL':
    case 'HIGH':
      return { badge: 'gate-block', text: 'text-rose-400', icon: ShieldAlert };
    case 'SEVERE':
      return { badge: 'gate-block', text: 'text-rose-400', icon: ShieldAlert };
    case 'MODERATE':
      return { badge: 'gate-review', text: 'text-amber-400', icon: AlertTriangle };
    case 'LOW':
    case 'MINOR':
      return { badge: 'gate-allow', text: 'text-emerald-400', icon: ShieldCheck };
    default:
      return { badge: 'gate-allow', text: 'text-emerald-400', icon: ShieldCheck };
  }
}

function normalizeKey(name: string): string {
  return name.toLowerCase().trim();
}

// Build drug database from DRUG_INTERACTIONS + ADDITIONAL_DRUGS
function buildDrugDatabase(): DrugCard[] {
  const drugMap = new Map<string, DrugCard>();

  // Process DRUG_INTERACTIONS
  for (const interaction of DRUG_INTERACTIONS) {
    const keyA = normalizeKey(interaction.drugA);
    const keyB = normalizeKey(interaction.drugB);

    if (!drugMap.has(keyA)) {
      drugMap.set(keyA, {
        name: interaction.drugA,
        category: CATEGORY_MAP[keyA] || 'Other',
        uses: [],
        riskLevel: interaction.severity,
        interactions: [],
      });
    }
    if (!drugMap.has(keyB)) {
      drugMap.set(keyB, {
        name: interaction.drugB,
        category: CATEGORY_MAP[keyB] || 'Other',
        uses: [],
        riskLevel: interaction.severity,
        interactions: [],
      });
    }

    // Update risk level to highest
    const severityRank: Record<string, number> = { MINOR: 1, MODERATE: 2, SEVERE: 3, FATAL: 4 };
    const drugA = drugMap.get(keyA)!;
    const drugB = drugMap.get(keyB)!;

    if ((severityRank[interaction.severity] || 0) > (severityRank[drugA.riskLevel] || 0)) {
      drugA.riskLevel = interaction.severity;
    }
    if ((severityRank[interaction.severity] || 0) > (severityRank[drugB.riskLevel] || 0)) {
      drugB.riskLevel = interaction.severity;
    }

    drugA.interactions.push({
      partner: interaction.drugB,
      severity: interaction.severity,
      mechanism: interaction.mechanism,
      clinicalEffect: interaction.clinicalEffect,
      management: interaction.management,
    });

    drugB.interactions.push({
      partner: interaction.drugA,
      severity: interaction.severity,
      mechanism: interaction.mechanism,
      clinicalEffect: interaction.clinicalEffect,
      management: interaction.management,
    });
  }

  // Add additional drugs
  for (const drug of ADDITIONAL_DRUGS) {
    const key = normalizeKey(drug.name);
    if (!drugMap.has(key)) {
      drugMap.set(key, {
        name: drug.name,
        category: drug.category,
        uses: drug.uses,
        riskLevel: drug.riskLevel,
        interactions: [],
      });
    } else {
      // Merge uses if exists
      const existing = drugMap.get(key)!;
      existing.uses = drug.uses;
      if (drug.category !== 'Other') {
        existing.category = drug.category;
      }
    }
  }

  return Array.from(drugMap.values());
}

const DRUG_DB = buildDrugDatabase();

const CATEGORIES = ['All', 'Anticoagulants', 'Antibiotics', 'Cardiac', 'Analgesics', 'Psychiatric', 'GI', 'Other'];

type SortOption = 'name' | 'risk' | 'interactions';

const SORT_LABELS: Record<SortOption, string> = {
  name: 'Name A-Z',
  risk: 'Risk Level',
  interactions: 'Interaction Count',
};

export function DrugDatabaseSearch() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<SortOption>('name');
  const [expandedDrug, setExpandedDrug] = useState<string | null>(null);

  const filteredDrugs = useMemo(() => {
    let result = [...DRUG_DB];

    if (category !== 'All') {
      result = result.filter((d) => d.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.uses.some((u) => u.toLowerCase().includes(q))
      );
    }

    const severityRank: Record<string, number> = { LOW: 1, MINOR: 1, MODERATE: 2, SEVERE: 3, HIGH: 4, FATAL: 4 };

    switch (sort) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'risk':
        result.sort((a, b) => (severityRank[b.riskLevel] || 0) - (severityRank[a.riskLevel] || 0));
        break;
      case 'interactions':
        result.sort((a, b) => b.interactions.length - a.interactions.length);
        break;
    }

    return result;
  }, [search, category, sort]);

  const handleDrugClick = useCallback(
    (drug: DrugCard) => {
      const newExpanded = expandedDrug === drug.name ? null : drug.name;
      setExpandedDrug(newExpanded);
      if (newExpanded) {
        toast.info(`Viewing ${drug.name} — ${drug.interactions.length} known interactions`);
      }
    },
    [expandedDrug]
  );

  const cycleSort = useCallback(() => {
    const order: SortOption[] = ['name', 'risk', 'interactions'];
    const idx = order.indexOf(sort);
    setSort(order[(idx + 1) % order.length]);
  }, [sort]);

  return (
    <div className="space-y-4">
      {/* Search, Category Filter, Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drugs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCategory(cat)}
                className={
                  category === cat
                    ? 'bg-primary/20 text-primary border-primary/30 hover:bg-primary/30'
                    : 'glass-card-hover'
                }
              >
                {cat}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={cycleSort}
            className="glass-card-hover text-cyan-400 ml-1"
          >
            <FlaskConical className="h-4 w-4 mr-1" />
            {SORT_LABELS[sort]}
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Pill className="h-4 w-4" />
        <span>
          <AnimatedCounter target={filteredDrugs.length} duration={800} /> drug{filteredDrugs.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Drug Grid */}
      {filteredDrugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Pill className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm">No drugs match your search</p>
          <p className="text-xs mt-1 opacity-60">Try adjusting filters or search terms</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {filteredDrugs.map((drug) => {
            const riskConfig = getRiskColor(drug.riskLevel);
            const isExpanded = expandedDrug === drug.name;
            const RiskIcon = riskConfig.icon;

            return (
              <motion.div
                key={drug.name}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={`glass-card glass-card-hover rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}
                  onClick={() => handleDrugClick(drug)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <RiskIcon className={`h-5 w-5 flex-shrink-0 ${riskConfig.text}`} />
                      <h3 className="font-semibold text-foreground truncate">{drug.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge variant="outline" className={`${riskConfig.badge} text-[10px] font-semibold uppercase`}>
                        {drug.riskLevel}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {drug.interactions.length}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                      {drug.category}
                    </span>
                    {drug.uses.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate">
                        {drug.uses.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Expanded Interaction Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        {drug.interactions.length > 0 ? (
                          <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Known Interactions ({drug.interactions.length})
                            </p>
                            {drug.interactions.map((inter, idx) => {
                              const interRisk = getRiskColor(inter.severity);
                              return (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-muted/30 border border-border/20 p-3 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                      ↔ {inter.partner}
                                    </span>
                                    <Badge variant="outline" className={`${interRisk.badge} text-[10px] font-semibold`}>
                                      {inter.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/80">Mechanism:</span>{' '}
                                    {inter.mechanism}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/80">Effect:</span>{' '}
                                    {inter.clinicalEffect}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground/80">Management:</span>{' '}
                                    {inter.management}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-3 border-t border-border/30 pt-3">
                            <p className="text-xs text-muted-foreground text-center py-2">
                              No known interactions in database
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}