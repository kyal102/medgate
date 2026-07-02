'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Download, Fingerprint, CheckCircle2, Clock, Hash } from 'lucide-react';
import { toast } from 'sonner';

export function CertificateDisplay() {
  const certData = {
    hash: '0xa7f3c9e2b8d1f4a6e5c7d8b9a0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8',
    timestamp: '2025-01-15T14:32:18.472Z',
    claim: 'Prescribe warfarin 5mg with trimethoprim-sulfamethoxazole',
    overallDecision: 'BLOCK',
    gateResults: [
      { gate: 'DrugInteractionGate', decision: 'BLOCK' },
      { gate: 'DoseVerificationGate', decision: 'ALLOW' },
      { gate: 'AllergyCrossRefGate', decision: 'ALLOW' },
    ],
  };

  return (
    <div className="flex justify-center">
      <motion.div
        className="glass-card animated-border max-w-lg w-full relative overflow-hidden p-0"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-cyan-400/40 rounded-br-lg" />

        <div className="p-8 flex flex-col items-center text-center space-y-5 relative z-10">
          {/* Seal icon */}
          <motion.div
            className="relative glow-cyan"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <div className="h-16 w-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400/40 flex items-center justify-center">
              <Shield className="h-8 w-8 text-cyan-400 pulse-ring" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-cyan-400/10" />
          </motion.div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold gradient-text-cyan tracking-wide">MedGate Verification Certificate</h2>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-widest uppercase">Deterministic Medical Claim Verification</p>
          </div>

          {/* Separator */}
          <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          {/* Claim summary */}
          <div className="w-full text-left space-y-3">
            <div className="flex items-start gap-2">
              <Fingerprint className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence Hash</p>
                <p className="text-[11px] font-mono text-cyan-300/70 break-all">{certData.hash}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Timestamp</p>
                <p className="text-xs text-foreground font-mono">{new Date(certData.timestamp).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Hash className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Verified Claim</p>
                <p className="text-xs text-foreground">{certData.claim}</p>
              </div>
            </div>
          </div>

          {/* Gate results */}
          <div className="w-full">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 text-center">Gate Results Summary</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {certData.gateResults.map((gr) => (
                <Badge
                  key={gr.gate}
                  variant="outline"
                  className={`text-[10px] ${
                    gr.decision === 'BLOCK'
                      ? 'gate-block'
                      : 'gate-allow'
                  }`}
                >
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  {gr.gate.replace('Gate', '')}: {gr.decision}
                </Badge>
              ))}
            </div>
          </div>

          {/* Determinism badge */}
          <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-400/30 border px-4 py-1.5 text-xs">
            <Shield className="h-3 w-3 mr-1.5" />
            Deterministic Verification — 100% Reproducible
          </Badge>

          {/* Download button */}
          <Button
            variant="outline"
            size="sm"
            className="btn-glow border-cyan-400/30 text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => toast.success('Certificate downloaded (demo)')}
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download Certificate
          </Button>
        </div>
      </motion.div>
    </div>
  );
}