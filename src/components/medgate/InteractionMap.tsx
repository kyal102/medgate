'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Loader2 } from 'lucide-react';
import { DRUG_INTERACTIONS } from '@/lib/medgate-constants';
import { AnimatedCounter } from './AnimatedCounter';

const SEVERITY_COLORS: Record<string, string> = {
  MINOR: '#f59e0b',
  MODERATE: '#f97316',
  SEVERE: '#ef4444',
  FATAL: '#f43f5e',
};

const SEVERITY_BG: Record<string, string> = {
  MINOR: 'bg-amber-500/20 text-amber-300',
  MODERATE: 'bg-orange-500/20 text-orange-300',
  SEVERE: 'bg-red-500/20 text-red-300',
  FATAL: 'bg-rose-500/20 text-rose-300',
};

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  drugA: string;
  drugB: string;
  severity: string;
  mechanism: string;
  clinicalEffect: string;
}

export function InteractionMap() {
  const [drugInput, setDrugInput] = useState('warfarin\ntrimethoprim-sulfamethoxazole\nssri\ntramadol\nomeprazole\nclopidogrel\nstatins\nclarithromycin\nmethotrexate\nibuprofen');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const drugs = useMemo(() => {
    return [...new Set(drugInput.split('\n').map((d) => d.trim().toLowerCase()).filter(Boolean))];
  }, [drugInput]);

  const { nodes, edges, interactions } = useMemo(() => {
    const drugSet = new Set(drugs);
    const foundInteractions = DRUG_INTERACTIONS.filter(
      (i) => drugSet.has(i.drugA) || drugSet.has(i.drugB)
    );

    const allDrugNames = new Set<string>();
    foundInteractions.forEach((i) => {
      allDrugNames.add(i.drugA);
      allDrugNames.add(i.drugB);
    });
    const drugList = [...allDrugNames];

    // Layout nodes in a circle
    const centerX = 250;
    const centerY = 200;
    const radius = 140;
    const nodeMap: Node[] = drugList.map((drug, idx) => ({
      id: drug,
      x: centerX + radius * Math.cos((2 * Math.PI * idx) / drugList.length - Math.PI / 2),
      y: centerY + radius * Math.sin((2 * Math.PI * idx) / drugList.length - Math.PI / 2),
      label: drug,
    }));

    return { nodes: nodeMap, edges: foundInteractions, interactions: foundInteractions };
  }, [drugs]);

  const checkMap = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/medgate/interaction-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drugs }),
      });
    } catch { /* use client data */ }
    setTimeout(() => setIsLoading(false), 600);
  };

  const connectedNodes = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const connected = new Set<string>();
    edges.forEach((e) => {
      if (e.drugA === hoveredNode || e.drugB === hoveredNode) {
        connected.add(e.drugA);
        connected.add(e.drugB);
      }
    });
    return connected;
  }, [hoveredNode, edges]);

  return (
    <div className="space-y-4">
      <div className="glass-card p-0 overflow-hidden">
        <div className="p-4 pb-3 border-b border-border/30">
          <div className="text-sm font-medium text-foreground flex items-center gap-2">
            <Network className="h-4 w-4 text-cyan-400" />
            Drug Interaction Network
          </div>
        </div>
        <div className="p-4 space-y-3">
          <textarea
            value={drugInput}
            onChange={(e) => setDrugInput(e.target.value)}
            placeholder="Enter medications, one per line"
            className="glass-input w-full text-xs font-mono min-h-[80px] resize-none"
            rows={4}
          />
          <Button
            onClick={checkMap}
            disabled={isLoading}
            size="sm"
            className="btn-glow bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isLoading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Network className="h-3 w-3 mr-1" />}
            Check Interactions
          </Button>
        </div>
      </div>

      {/* SVG Network */}
      <div className="glass-card p-4">
        {nodes.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Add medications to visualize the interaction network.</p>
        ) : (
          <motion.div
            className="glow-cyan rounded-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <svg viewBox="0 0 500 400" className="w-full h-auto">
              {/* Edges */}
              {edges.map((e, idx) => {
                const nA = nodes.find((n) => n.id === e.drugA);
                const nB = nodes.find((n) => n.id === e.drugB);
                if (!nA || !nB) return null;
                const isHighlighted = hoveredNode && (e.drugA === hoveredNode || e.drugB === hoveredNode);
                const opacity = hoveredNode ? (isHighlighted ? 1 : 0.15) : 0.6;
                return (
                  <line
                    key={idx}
                    x1={nA.x} y1={nA.y} x2={nB.x} y2={nB.y}
                    stroke={SEVERITY_COLORS[e.severity]}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    opacity={opacity}
                  />
                );
              })}
              {/* Nodes */}
              {nodes.map((n) => {
                const isHovered = hoveredNode === n.id;
                const isConnected = connectedNodes.has(n.id);
                const opacity = hoveredNode ? (isConnected || isHovered ? 1 : 0.2) : 1;
                return (
                  <g key={n.id} opacity={opacity}>
                    <circle
                      cx={n.x} cy={n.y}
                      r={isHovered ? 28 : 22}
                      fill={isHovered ? '#0e7490' : '#164e63'}
                      stroke={isHovered ? '#06b6d4' : '#0e7490'}
                      strokeWidth={2}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredNode(n.id)}
                      onMouseLeave={() => setHoveredNode(null)}
                    />
                    <text
                      x={n.x} y={n.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={n.label.length > 12 ? 7 : 8}
                      fontFamily="monospace"
                      pointerEvents="none"
                    >
                      {n.label.length > 16 ? n.label.substring(0, 14) + '...' : n.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-xs text-muted-foreground mr-1">
          <AnimatedCounter target={interactions.length} className="text-cyan-400 font-bold" /> interactions found
        </span>
        <span className="text-border/50">|</span>
        {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
          <div key={severity} className="flex items-center gap-1.5 text-[10px]">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-muted-foreground">{severity}</span>
          </div>
        ))}
      </div>

      {/* Interaction details on hover */}
      {hoveredNode && (
        <motion.div
          className="glass-card p-4 space-y-2 border-cyan-500/20"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-xs font-medium text-cyan-300">Interactions for: {hoveredNode}</p>
          {interactions
            .filter((i) => i.drugA === hoveredNode || i.drugB === hoveredNode)
            .map((i, idx) => {
              const otherDrug = i.drugA === hoveredNode ? i.drugB : i.drugA;
              return (
                <div key={idx} className="rounded-lg bg-accent/30 p-2.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground">{hoveredNode} ↔ {otherDrug}</span>
                    <Badge className={SEVERITY_BG[i.severity]}>{i.severity}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{i.clinicalEffect}</p>
                </div>
              );
            })}
        </motion.div>
      )}
    </div>
  );
}