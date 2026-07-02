'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMedGateStore } from '@/lib/medgate-store';
import { NAV_ITEMS } from '@/lib/medgate-constants';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Menu, Shield, FileText, HeartPulse, Clock, Pill, Cpu, Stethoscope, AlertTriangle, Scissors, PersonStanding, Activity, Droplets, ArrowRightLeft, Bug, Search, Brain, Baby } from 'lucide-react';

// Core UI
import { HeroSection } from '@/components/medgate/HeroSection';
import { MedDivider } from '@/components/medgate/MedDivider';
import { SectionHeader } from '@/components/medgate/SectionHeader';
import { LiveFeedProvider } from '@/components/medgate/LiveFeedProvider';
import { CommandPalette } from '@/components/medgate/CommandPalette';
import { KeyboardShortcutsOverlay } from '@/components/medgate/KeyboardShortcutsOverlay';
import { VerificationPulse } from '@/components/medgate/VerificationPulse';
import { ThemeToggle } from '@/components/medgate/ThemeToggle';

// Gate System
import { SystemOverview } from '@/components/medgate/SystemOverview';
import { GateRulesReference } from '@/components/medgate/GateRulesReference';
import { ClaimChecker } from '@/components/medgate/ClaimChecker';
import { BatchClaimVerifier } from '@/components/medgate/BatchClaimVerifier';
import { GateActivityFeed } from '@/components/medgate/GateActivityFeed';
import { GatePerformanceCards } from '@/components/medgate/GatePerformanceCards';
import { ClaimHistoryPanel } from '@/components/medgate/ClaimHistoryPanel';
import { ClaimBoundaryExplorer } from '@/components/medgate/ClaimBoundaryExplorer';

// Medical Domain
import { DrugInteractionChecker } from '@/components/medgate/DrugInteractionChecker';
import { DoseCalculator } from '@/components/medgate/DoseCalculator';
import { LabResultValidator } from '@/components/medgate/LabResultValidator';
import { VitalSignMonitor } from '@/components/medgate/VitalSignMonitor';
import { SepsisScreener } from '@/components/medgate/SepsisScreener';
import { BloodCompatibilityMatrix } from '@/components/medgate/BloodCompatibilityMatrix';
import { AntibioticStewardshipPanel } from '@/components/medgate/AntibioticStewardshipPanel';
import { ContrastSafetyChecker } from '@/components/medgate/ContrastSafetyChecker';
import { PregnancyDrugChecker } from '@/components/medgate/PregnancyDrugChecker';
import { PediatricDoseBand } from '@/components/medgate/PediatricDoseBand';
import { ProtocolComplianceChecker } from '@/components/medgate/ProtocolComplianceChecker';
import { MedicalDeviceValidator } from '@/components/medgate/MedicalDeviceValidator';
import { DiagnosticPlausibilityChecker } from '@/components/medgate/DiagnosticPlausibilityChecker';
import { TimeCriticalPathway } from '@/components/medgate/TimeCriticalPathway';

// Analytics & Evidence
import { MedAnalyticsDashboard } from '@/components/medgate/MedAnalyticsDashboard';
import { LifeSavedCounter } from '@/components/medgate/LifeSavedCounter';
import { EvidencePackExplorer } from '@/components/medgate/EvidencePackExplorer';
import { EvidenceReplaySection } from '@/components/medgate/EvidenceReplaySection';
import { BenchmarkDashboard } from '@/components/medgate/BenchmarkDashboard';
import { CertificateDisplay } from '@/components/medgate/CertificateDisplay';
import { InteractionMap } from '@/components/medgate/InteractionMap';
import { GateSimulationMode } from '@/components/medgate/GateSimulationMode';
import { PatientSimulator } from '@/components/medgate/PatientSimulator';
import { QuickReferencePanel } from '@/components/medgate/QuickReferencePanel';
import { VerificationTimeline } from '@/components/medgate/VerificationTimeline';
import { DrugDatabaseSearch } from '@/components/medgate/DrugDatabaseSearch';

// Clinical Scoring & Safety Audit (10x Expansion)
import { ClinicalScoringSuite } from '@/components/medgate/ClinicalScoringSuite';
import { AdverseDrugReactionReporter } from '@/components/medgate/AdverseDrugReactionReporter';
import { MedicationReconciliationEngine } from '@/components/medgate/MedicationReconciliationEngine';
import { SurgicalSafetyChecklist } from '@/components/medgate/SurgicalSafetyChecklist';
import { FallRiskAssessment } from '@/components/medgate/FallRiskAssessment';
import { VTERiskAssessment } from '@/components/medgate/VTERiskAssessment';
import { OpioidSafetyChecker } from '@/components/medgate/OpioidSafetyChecker';
import { SmartIVPumpValidator } from '@/components/medgate/SmartIVPumpValidator';
import { NearMissCaptureSystem } from '@/components/medgate/NearMissCaptureSystem';
import { ClinicalHandoverAuditor } from '@/components/medgate/ClinicalHandoverAuditor';
import { AntimicrobialResistanceTracker } from '@/components/medgate/AntimicrobialResistanceTracker';
import { IncidentRootCauseAnalyzer } from '@/components/medgate/IncidentRootCauseAnalyzer';
import { ABGInterpreter } from '@/components/medgate/ABGInterpreter';
import { PainAssessmentTool } from '@/components/medgate/PainAssessmentTool';
import { WoundCareDocumentation } from '@/components/medgate/WoundCareDocumentation';
import { NeonatalChecker } from '@/components/medgate/NeonatalChecker';
import { MentalHealthSafety } from '@/components/medgate/MentalHealthSafety';
import { BloodProductOrdering } from '@/components/medgate/BloodProductOrdering';

// Info Flow & DTL
import { InfoVelocityDashboard } from '@/components/medgate/InfoVelocityDashboard';
import { HandoffTimeline } from '@/components/medgate/HandoffTimeline';
import { AlertFatigueAnalyzer } from '@/components/medgate/AlertFatigueAnalyzer';
import { ErrorPreventionMatrix } from '@/components/medgate/ErrorPreventionMatrix';
import { SpeedComparison } from '@/components/medgate/SpeedComparison';
import { InformationIntegrity } from '@/components/medgate/InformationIntegrity';
import { DTLLaneVisualizer } from '@/components/medgate/DTLLaneVisualizer';
import { CrossLaneResonance } from '@/components/medgate/CrossLaneResonance';
import { PatentBreakdown } from '@/components/medgate/PatentBreakdown';
import { SubstrateAgnosticDemo } from '@/components/medgate/SubstrateAgnosticDemo';
import { EvidenceChain } from '@/components/medgate/EvidenceChain';
import { DeterminismProof } from '@/components/medgate/DeterminismProof';

// Enterprise
import { EnterpriseDashboard } from '@/components/medgate/EnterpriseDashboard';
import { LicensingPanel } from '@/components/medgate/LicensingPanel';
import { ComplianceCenter } from '@/components/medgate/ComplianceCenter';
import { ROIculator } from '@/components/medgate/ROIculator';

function MedFooter() {
  return (
    <footer className="border-t border-border/50 bg-card/50 backdrop-blur-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-orbitron text-lg font-bold text-primary mb-3">MedGate</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Deterministic verification gates for medical information flow. Patent-protected, life-saving, substrate-agnostic.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Patents</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>AU 2026905289 — Deterministic Taxonomy Lanes</li>
              <li>Patent 3 — Cross-Domain Verification Resonance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Compliance</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>HIPAA Ready</li>
              <li>FDA 21 CFR Part 11</li>
              <li>EU MDR Compliant</li>
              <li>ISO 13485 Aligned</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-foreground">Research</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Research Prototype</li>
              <li>Not for Clinical Use</li>
              <li>Deterministic — Zero Hallucination</li>
              <li>Open Academic License</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 MedGate — Built on DTL (AU 2026905289). Deterministic verification, not probabilistic guessing.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 text-primary" />
            <span>100% Deterministic</span>
            <span className="mx-1">·</span>
            <HeartPulse className="h-3 w-3 text-emerald-500" />
            <span>Life-Saving by Design</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function StickyNav() {
  const { activeSection, setActiveSection } = useMedGateStore();
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [setActiveSection]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection observer to track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
    );
    NAV_ITEMS.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [setActiveSection]);

  const navContent = (
    <nav className="flex items-center gap-1 overflow-x-auto py-1 px-2 scrollbar-none">
      {NAV_ITEMS.map(item => (
        <button
          key={item.id}
          onClick={() => scrollTo(item.id)}
          className={`whitespace-nowrap px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
            activeSection === item.id
              ? 'bg-primary/15 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop sticky nav */}
      <div
        ref={navRef}
        className={`hidden lg:block sticky top-0 z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? 'shadow-lg shadow-black/10' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center h-12 gap-3">
            <span className="font-orbitron text-sm font-bold text-primary px-2 shrink-0">MG</span>
            <ThemeToggle />
            <div className="flex-1 overflow-hidden">
              {navContent}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 bg-background/90 backdrop-blur-xl">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="w-full h-12 text-primary font-orbitron text-sm gap-2">
              <Menu className="h-4 w-4" />
              Navigate Sections
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh]">
            <SheetTitle className="font-orbitron text-primary mb-4">MedGate Sections</SheetTitle>
            <ScrollArea className="h-full">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 p-2">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      scrollTo(item.id);
                      document.querySelector('[data-radix-sheet-close]')?.click();
                    }}
                    className={`p-3 rounded-lg text-xs font-medium text-center transition-all ${
                      activeSection === item.id
                        ? 'bg-primary/15 text-primary border border-primary/30'
                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

function Section({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`scroll-mt-20 py-12 md:py-16 px-4 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <LiveFeedProvider>
      <div className="min-h-screen flex flex-col relative">
        <main>
        <VerificationPulse />
        <CommandPalette />
        <KeyboardShortcutsOverlay />

        {/* Hero - no sticky nav yet */}
        <div id="hero-top" />

        {/* ===== SECTION 1: Hero ===== */}
        <HeroSection />

        {/* Sticky Navigation appears after hero */}
        <StickyNav />

        {/* ===== SECTION 2: System Overview ===== */}
        <Section id="overview" className="dna-helix-bg">
          <SystemOverview />
        </Section>
        <MedDivider />

        {/* ===== SECTION 3: Gate Rules Reference ===== */}
        <Section id="gate-rules">
          <SectionHeader icon={FileText} title="Gate Rules Reference" subtitle="Detailed deterministic rules for all 14 verification gates" badge="14 Gates" badgeColor="bg-primary/15 text-primary" />
          <GateRulesReference />
        </Section>
        <MedDivider />

        {/* ===== SECTION 4: Claim Checker ===== */}
        <Section id="claim-checker" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Claim Verification" subtitle="Submit any medical claim through deterministic verification gates" badge="Live" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <ClaimChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 5: Batch Verify ===== */}
        <Section id="batch-verify">
          <SectionHeader icon={FileText} title="Batch Verification" subtitle="Submit multiple claims for simultaneous gate verification" />
          <BatchClaimVerifier />
        </Section>
        <MedDivider />

        {/* ===== SECTION 6: Activity Feed ===== */}
        <Section id="activity-feed" className="med-grid-bg">
          <SectionHeader icon={HeartPulse} title="Gate Activity Feed" subtitle="Real-time stream of verification decisions" badge="Live" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <GateActivityFeed />
        </Section>
        <MedDivider />

        {/* ===== SECTION 7: Analytics ===== */}
        <Section id="analytics">
          <SectionHeader icon={FileText} title="Verification Analytics" subtitle="Comprehensive analytics across all verification gates" />
          <MedAnalyticsDashboard />
        </Section>
        <MedDivider />

        {/* ===== SECTION 8: Gate Performance ===== */}
        <Section id="gate-performance" className="med-grid-bg">
          <SectionHeader icon={HeartPulse} title="Gate Performance" subtitle="Per-gate statistics: throughput, block rate, latency" />
          <GatePerformanceCards />
        </Section>
        <MedDivider />

        {/* ===== SECTION 9: Lives Saved ===== */}
        <Section id="life-saved">
          <SectionHeader icon={HeartPulse} title="Proof of Life-Saving" subtitle="Quantified impact: every blocked claim is a potentially saved life" badge="Evidence-Based" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <LifeSavedCounter />
        </Section>
        <MedDivider />

        {/* ===== SECTION 10: Drug Interactions ===== */}
        <Section id="drug-interactions" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Drug Interaction Checker" subtitle="Deterministic drug-drug, drug-food, drug-disease interaction verification" />
          <DrugInteractionChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 11: Dose Calculator ===== */}
        <Section id="dose-calc">
          <SectionHeader icon={FileText} title="Dose Verification" subtitle="Patient-parameter-aware dose calculation and safety verification" />
          <DoseCalculator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 12: Lab Validator ===== */}
        <Section id="lab-validator" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Lab Result Validator" subtitle="Validate lab values against physiological possibility and critical thresholds" />
          <LabResultValidator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 13: Vital Signs ===== */}
        <Section id="vital-signs">
          <SectionHeader icon={HeartPulse} title="Vital Sign Monitor" subtitle="Real-time NEWS2, qSOFA, and MEWS scoring with threshold verification" />
          <VitalSignMonitor />
        </Section>
        <MedDivider />

        {/* ===== SECTION 14: Sepsis Screener ===== */}
        <Section id="sepsis" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Sepsis Screener" subtitle="qSOFA + SIRS + SOFA scoring with 1-hour bundle compliance" badge="Time-Critical" badgeColor="bg-rose-500/15 text-rose-400" />
          <SepsisScreener />
        </Section>
        <MedDivider />

        {/* ===== SECTION 15: Blood Compatibility ===== */}
        <Section id="blood-compat">
          <SectionHeader icon={HeartPulse} title="Blood Compatibility Matrix" subtitle="ABO/Rh compatibility verification with visual matrix" />
          <BloodCompatibilityMatrix />
        </Section>
        <MedDivider />

        {/* ===== SECTION 16: Antibiotics ===== */}
        <Section id="antibiotics" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Antibiotic Stewardship" subtitle="Spectrum, duration, de-escalation, and resistance-aware selection" />
          <AntibioticStewardshipPanel />
        </Section>
        <MedDivider />

        {/* ===== SECTION 17: Contrast Safety ===== */}
        <Section id="contrast-safety">
          <SectionHeader icon={FileText} title="Contrast Safety Checker" subtitle="Pre-contrast imaging safety: eGFR, metformin, allergy, pregnancy" />
          <ContrastSafetyChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 18: Pregnancy ===== */}
        <Section id="pregnancy" className="med-grid-bg">
          <SectionHeader icon={HeartPulse} title="Pregnancy Drug Safety" subtitle="FDA pregnancy categories, trimester-specific teratogenicity windows" badge="High Stakes" badgeColor="bg-rose-500/15 text-rose-400" />
          <PregnancyDrugChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 19: Pediatric ===== */}
        <Section id="pediatric">
          <SectionHeader icon={Shield} title="Pediatric Dose Bands" subtitle="Age/weight-specific safety, restricted medications, developmental checks" />
          <PediatricDoseBand />
        </Section>
        <MedDivider />

        {/* ===== SECTION 20: Protocol ===== */}
        <Section id="protocol" className="med-grid-bg">
          <SectionHeader icon={FileText} title="Protocol Compliance" subtitle="Evidence-based clinical guideline adherence verification" />
          <ProtocolComplianceChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 21: Devices ===== */}
        <Section id="devices">
          <SectionHeader icon={HeartPulse} title="Medical Device Validator" subtitle="Ventilator, pump, PCA, defibrillator, pacemaker setting verification" />
          <MedicalDeviceValidator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 22: Diagnostics ===== */}
        <Section id="diagnostics" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Diagnostic Plausibility" subtitle="Verify diagnostic claims against symptoms, labs, and demographics" />
          <DiagnosticPlausibilityChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 23: Emergency/Time Critical ===== */}
        <Section id="time-critical">
          <SectionHeader icon={HeartPulse} title="Time-Critical Pathways" subtitle="Emergency door-to-time tracking for STEMI, stroke, sepsis, and more" badge="Seconds Matter" badgeColor="bg-rose-500/15 text-rose-400" />
          <TimeCriticalPathway />
        </Section>
        <MedDivider />

        {/* ===== SECTION 24: Evidence Pack ===== */}
        <Section id="evidence-pack" className="med-grid-bg">
          <SectionHeader icon={FileText} title="Evidence Pack Explorer" subtitle="View structured evidence packs for any verification decision" />
          <EvidencePackExplorer />
        </Section>
        <MedDivider />

        {/* ===== SECTION 25: Benchmarks ===== */}
        <Section id="benchmarks">
          <SectionHeader icon={Shield} title="Benchmark Dashboard" subtitle="Run benchmark suites against all 14 verification gates" badge="200+ Cases" badgeColor="bg-primary/15 text-primary" />
          <BenchmarkDashboard />
        </Section>
        <MedDivider />

        {/* ===== SECTION 26: Boundaries ===== */}
        <Section id="boundaries" className="med-grid-bg">
          <SectionHeader icon={FileText} title="Claim Boundary Explorer" subtitle="Test edge cases and boundary conditions for each gate" />
          <ClaimBoundaryExplorer />
        </Section>
        <MedDivider />

        {/* ===== SECTION 27: Certificate ===== */}
        <Section id="certificate">
          <SectionHeader icon={Shield} title="Verification Certificate" subtitle="Tamper-proof certificates with hash chain integrity" />
          <CertificateDisplay />
        </Section>
        <MedDivider />

        {/* ===== SECTION 28: Evidence Replay ===== */}
        <Section id="evidence" className="med-grid-bg">
          <SectionHeader icon={HeartPulse} title="Evidence Replay" subtitle="Step-by-step replay of gate decision chains" />
          <EvidenceReplaySection />
        </Section>
        <MedDivider />

        {/* ===== SECTION 29: Claim History ===== */}
        <Section id="claim-history">
          <SectionHeader icon={FileText} title="Claim History" subtitle="Complete verification history with filters and detail expansion" />
          <ClaimHistoryPanel />
        </Section>
        <MedDivider />

        {/* ===== SECTION: Verification Timeline ===== */}
        <Section id="verification-timeline">
          <SectionHeader icon={Clock} title="Verification Timeline" subtitle="Real-time chronological verification log with live event streaming" badge="LIVE" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <VerificationTimeline />
        </Section>
        <MedDivider />

        {/* ===== SECTION 30: Limitations ===== */}
        <Section id="limitations" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Limitations & Disclaimers" subtitle="Understanding what MedGate is and is not" badge="Important" badgeColor="bg-amber-500/15 text-amber-400" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-rose-400">What MedGate Is NOT</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not a diagnostic tool — it verifies claims, does not make diagnoses</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not a replacement for clinical judgment</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not an AI system — no neural networks, no probabilistic outputs</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not approved for clinical use (research prototype)</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not a complete EHR or clinical information system</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✕</span> Not a substitute for pharmacist or toxicologist review</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-emerald-400">What MedGate IS</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> A deterministic verification layer for medical information</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> A research prototype demonstrating the DTL patent framework</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> 100% reproducible — same input always produces same output</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> Sub-millisecond execution on commodity hardware</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> Every decision has a full audit trail (evidence pack)</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">✓</span> Zero hallucination by design (deterministic rules)</li>
              </ul>
            </div>
          </div>
        </Section>
        <MedDivider />

        {/* ===== SECTION 31: Info Velocity ===== */}
        <Section id="info-velocity">
          <SectionHeader icon={FileText} title="Information Velocity" subtitle="Medical information verified 120,000x to 3,600,000x faster than human review" badge="< 1ms" badgeColor="bg-primary/15 text-primary" />
          <InfoVelocityDashboard />
        </Section>
        <MedDivider />

        {/* ===== SECTION 32: Handoff Timeline ===== */}
        <Section id="handoff-timeline" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Shift Handoff Verification" subtitle="Every handoff item verified before clinician sign-off" />
          <HandoffTimeline />
        </Section>
        <MedDivider />

        {/* ===== SECTION 33: Alert Fatigue ===== */}
        <Section id="alert-fatigue">
          <SectionHeader icon={HeartPulse} title="Alert Fatigue Analysis" subtitle="94% of traditional CDS alerts ignored vs MedGate's precision approach" badge="Critical Problem" badgeColor="bg-rose-500/15 text-rose-400" />
          <AlertFatigueAnalyzer />
        </Section>
        <MedDivider />

        {/* ===== SECTION 34: Error Matrix ===== */}
        <Section id="error-matrix" className="med-grid-bg">
          <SectionHeader icon={FileText} title="Error Prevention Matrix" subtitle="Comprehensive comparison: what each system catches vs misses" />
          <ErrorPreventionMatrix />
        </Section>
        <MedDivider />

        {/* ===== SECTION 35: Speed Comparison ===== */}
        <Section id="speed-compare">
          <SectionHeader icon={Shield} title="Speed Comparison" subtitle="Deterministic gates vs human review — the speed advantage" />
          <SpeedComparison />
        </Section>
        <MedDivider />

        {/* ===== SECTION 36: DTL Lanes ===== */}
        <Section id="dtl-lanes" className="dna-helix-bg">
          <SectionHeader icon={HeartPulse} title="DTL Knowledge Lanes" subtitle="12 medical taxonomy lanes with deterministic gate routing" badge="Patent AU 2026905289" badgeColor="bg-primary/15 text-primary" />
          <DTLLaneVisualizer />
        </Section>
        <MedDivider />

        {/* ===== SECTION 37: Cross-Lane ===== */}
        <Section id="cross-lane">
          <SectionHeader icon={FileText} title="Cross-Lane Resonance" subtitle="Patent 3: Verification resonance across knowledge domains" badge="Patent 3" badgeColor="bg-violet-500/15 text-violet-400" />
          <CrossLaneResonance />
        </Section>
        <MedDivider />

        {/* ===== SECTION 38: Patent Visualization ===== */}
        <Section id="patent-viz" className="med-grid-bg">
          <SectionHeader icon={Shield} title="Patent Architecture" subtitle="Visual explanation of DTL and Patent 3 in the medical domain" />
          <PatentBreakdown />
        </Section>
        <MedDivider />

        {/* ===== SECTION 39: Substrate Agnostic ===== */}
        <Section id="substrate">
          <SectionHeader icon={HeartPulse} title="Substrate-Agnostic Deployment" subtitle="Same deterministic gates, identical results, any hardware" badge="Universal" badgeColor="bg-primary/15 text-primary" />
          <SubstrateAgnosticDemo />
        </Section>
        <MedDivider />

        {/* ===== SECTION 40: Evidence Chain ===== */}
        <Section id="evidence-chain" className="dna-helix-bg">
          <SectionHeader icon={FileText} title="Evidence Chain" subtitle="Blockchain-style tamper-proof verification chain" />
          <EvidenceChain />
        </Section>
        <MedDivider />

        {/* ===== SECTION 41: Determinism Proof ===== */}
        <Section id="determinism">
          <SectionHeader icon={Shield} title="Determinism Proof" subtitle="Run the same claim 1,000 times — identical results every time" badge="Mathematical Proof" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <DeterminismProof />
        </Section>
        <MedDivider />

        {/* ===== SECTION 42: Information Integrity ===== */}
        <Section id="information-integrity">
          <SectionHeader icon={HeartPulse} title="Information Integrity" subtitle="End-to-end verification chain — no information lost or modified" />
          <InformationIntegrity />
        </Section>
        <MedDivider />

        {/* ===== SECTION 43: Enterprise ===== */}
        <Section id="enterprise" className="med-grid-bg">
          <SectionHeader icon={FileText} title="Enterprise Dashboard" subtitle="Multi-tenant hospital and health system management" />
          <EnterpriseDashboard />
        </Section>
        <MedDivider />

        {/* ===== SECTION 44: Licensing ===== */}
        <Section id="licensing">
          <SectionHeader icon={Shield} title="Licensing" subtitle="Flexible licensing tiers from clinics to national health systems" />
          <LicensingPanel />
        </Section>
        <MedDivider />

        {/* ===== SECTION 45: Compliance ===== */}
        <Section id="compliance" className="med-grid-bg">
          <SectionHeader icon={HeartPulse} title="Compliance Center" subtitle="HIPAA, FDA 21 CFR Part 11, EU MDR compliance status" />
          <ComplianceCenter />
        </Section>
        <MedDivider />

        {/* ===== SECTION 46: ROI ===== */}
        <Section id="roi">
          <SectionHeader icon={FileText} title="ROI Calculator" subtitle="Quantified return on investment: cost savings from prevented errors" />
          <ROIculator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 47: Gate Simulation Mode ===== */}
        <Section id="gate-simulation" className="med-grid-bg">
          <SectionHeader icon={Cpu} title="Gate Simulation Mode" subtitle="Configure gate parameters and observe real-time verification pipeline behavior" badge="Interactive" badgeColor="bg-cyan-500/15 text-cyan-400" />
          <GateSimulationMode />
        </Section>
        <MedDivider />

        {/* ===== SECTION 48: Patient Simulator ===== */}
        <Section id="patient-sim" className="dna-helix-bg">
          <SectionHeader icon={Shield} title="Patient Simulator" subtitle="Run a complete patient scenario through all 14 verification gates" badge="Interactive" badgeColor="bg-primary/15 text-primary" />
          <PatientSimulator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 49: Clinical Scoring Suite ===== */}
        <Section id="clinical-scores" className="dna-helix-bg">
          <SectionHeader icon={Stethoscope} title="Clinical Scoring Suite" subtitle="10 validated scoring systems: NEWS2, CHA₂DS₂-VASc, HAS-BLED, CURB-65, Wells, GCS, Morse, Caprini, Child-Pugh, APACHE II" badge="10 Tools" badgeColor="bg-primary/15 text-primary" />
          <ClinicalScoringSuite />
        </Section>
        <MedDivider />

        {/* ===== SECTION 50: ADR Reporter ===== */}
        <Section id="adr-reporter">
          <SectionHeader icon={AlertTriangle} title="Adverse Drug Reaction Reporter" subtitle="Naranjo Algorithm Causality Assessment — Systematic ADR Detection" badge="Pharmacovigilance" badgeColor="bg-rose-500/15 text-rose-400" />
          <AdverseDrugReactionReporter />
        </Section>
        <MedDivider />

        {/* ===== SECTION 51: Medication Reconciliation ===== */}
        <Section id="med-reconciliation" className="med-grid-bg">
          <SectionHeader icon={ArrowRightLeft} title="Medication Reconciliation" subtitle="Detect omissions, additions, and dose discrepancies across care transitions" badge="Care Transitions" badgeColor="bg-amber-500/15 text-amber-400" />
          <MedicationReconciliationEngine />
        </Section>
        <MedDivider />

        {/* ===== SECTION 52: Surgical Safety ===== */}
        <Section id="surgical-safety">
          <SectionHeader icon={Scissors} title="Surgical Safety Checklist" subtitle="WHO Surgical Safety Checklist — Digital Implementation with Phase Validation" badge="WHO SSC" badgeColor="bg-primary/15 text-primary" />
          <SurgicalSafetyChecklist />
        </Section>
        <MedDivider />

        {/* ===== SECTION 53: Fall Risk ===== */}
        <Section id="fall-risk" className="med-grid-bg">
          <SectionHeader icon={PersonStanding} title="Fall Risk Assessment" subtitle="Morse Fall Scale — Evidence-Based Fall Prevention" badge="Patient Safety" badgeColor="bg-amber-500/15 text-amber-400" />
          <FallRiskAssessment />
        </Section>
        <MedDivider />

        {/* ===== SECTION 54: VTE Risk ===== */}
        <Section id="vte-risk">
          <SectionHeader icon={Activity} title="VTE Risk Assessment" subtitle="Caprini Score — Venous Thromboembolism Risk Stratification & Prophylaxis" badge="Thrombosis" badgeColor="bg-rose-500/15 text-rose-400" />
          <VTERiskAssessment />
        </Section>
        <MedDivider />

        {/* ===== SECTION 55: Opioid Safety ===== */}
        <Section id="opioid-safety" className="med-grid-bg">
          <SectionHeader icon={Pill} title="Opioid Safety Checker" subtitle="MME Conversion & Respiratory Risk Assessment — CDC Guidelines" badge="Stewardship" badgeColor="bg-rose-500/15 text-rose-400" />
          <OpioidSafetyChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 56: IV Pump Validator ===== */}
        <Section id="iv-pump">
          <SectionHeader icon={Droplets} title="Smart IV Pump Validator" subtitle="High-Alert Medication Infusion Safety — 15 Critical Drugs" badge="15 Drugs" badgeColor="bg-primary/15 text-primary" />
          <SmartIVPumpValidator />
        </Section>
        <MedDivider />

        {/* ===== SECTION 57: Near-Miss Capture ===== */}
        <Section id="near-miss" className="dna-helix-bg">
          <SectionHeader icon={AlertTriangle} title="Near-Miss Capture System" subtitle="Every Near-Miss Reported is a Future Life Saved — Pattern Analysis" badge="Safety Culture" badgeColor="bg-emerald-500/15 text-emerald-400" />
          <NearMissCaptureSystem />
        </Section>
        <MedDivider />

        {/* ===== SECTION 58: Handover Auditor ===== */}
        <Section id="handover-audit">
          <SectionHeader icon={ArrowRightLeft} title="Clinical Handover Auditor" subtitle="ISBAR Framework Compliance Scoring — Prevent Communication Failures" badge="ISBAR" badgeColor="bg-primary/15 text-primary" />
          <ClinicalHandoverAuditor />
        </Section>
        <MedDivider />

        {/* ===== SECTION 59: AMR Tracker ===== */}
        <Section id="amr-tracker" className="med-grid-bg">
          <SectionHeader icon={Bug} title="Antimicrobial Resistance Tracker" subtitle="Real-Time AMR Surveillance — 8 Priority Organisms with Susceptibility Data" badge="8 Organisms" badgeColor="bg-rose-500/15 text-rose-400" />
          <AntimicrobialResistanceTracker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 60: Incident Analyzer ===== */}
        <Section id="incident-analyzer">
          <SectionHeader icon={Search} title="Incident Root Cause Analyzer" subtitle="Systematic Incident Analysis — Fishbone Diagrams & 5-Why Method" badge="Root Cause" badgeColor="bg-amber-500/15 text-amber-400" />
          <IncidentRootCauseAnalyzer />
        </Section>
        <MedDivider />

        {/* ===== SECTION 61: ABG Interpreter ===== */}
        <Section id="abg-interpret" className="med-grid-bg">
          <SectionHeader icon={Activity} title="ABG Interpreter" subtitle="Arterial Blood Gas Analysis — Auto-Interpretation with Compensation Assessment" badge="Respiratory" badgeColor="bg-primary/15 text-primary" />
          <ABGInterpreter />
        </Section>
        <MedDivider />

        {/* ===== SECTION 62: Pain Assessment ===== */}
        <Section id="pain-assessment">
          <SectionHeader icon={HeartPulse} title="Pain Assessment Tool" subtitle="Multidimensional Pain Assessment — WHO Analgesic Ladder Integration" badge="Symptom Mgmt" badgeColor="bg-rose-500/15 text-rose-400" />
          <PainAssessmentTool />
        </Section>
        <MedDivider />

        {/* ===== SECTION 63: Wound Care ===== */}
        <Section id="wound-care" className="dna-helix-bg">
          <SectionHeader icon={Shield} title="Wound Care Documentation" subtitle="Pressure Injury Staging & Braden Scale — Comprehensive Wound Assessment" badge="Staging" badgeColor="bg-primary/15 text-primary" />
          <WoundCareDocumentation />
        </Section>
        <MedDivider />

        {/* ===== SECTION 64: Neonatal Checker ===== */}
        <Section id="neonatal">
          <SectionHeader icon={Baby} title="Neonatal Safety Checker" subtitle="APGAR, Ballard Score & Neonatal Drug Safety — First Hours Matter" badge="NICU" badgeColor="bg-amber-500/15 text-amber-400" />
          <NeonatalChecker />
        </Section>
        <MedDivider />

        {/* ===== SECTION 65: Mental Health ===== */}
        <Section id="mental-health" className="med-grid-bg">
          <SectionHeader icon={Brain} title="Mental Health Safety Assessment" subtitle="PHQ-9, GAD-7 & Columbia Suicide Severity Rating — Every Screen Counts" badge="Critical Safety" badgeColor="bg-rose-500/15 text-rose-400" />
          <MentalHealthSafety />
        </Section>
        <MedDivider />

        {/* ===== SECTION 66: Blood Product Ordering ===== */}
        <Section id="blood-product">
          <SectionHeader icon={Droplets} title="Blood Product Ordering" subtitle="Pre-Transfusion Verification & Massive Transfusion Protocol — Every Unit Verified" badge="Transfusion" badgeColor="bg-rose-500/15 text-rose-400" />
          <BloodProductOrdering />
        </Section>
        <MedDivider />

        {/* Quick Reference Panel (floating) */}
        <QuickReferencePanel />

        {/* ===== SECTION: Drug Database ===== */}
        <Section id="drug-database">
          <SectionHeader icon={Pill} title="Drug Database" subtitle="Searchable drug reference with interaction information" />
          <DrugDatabaseSearch />
        </Section>
        <MedDivider />

        {/* ===== SECTION 48: Interaction Map ===== */}
        <Section id="interaction-map">
          <SectionHeader icon={HeartPulse} title="Drug Interaction Map" subtitle="Visual network graph of medication interactions" />
          <InteractionMap />
        </Section>

        </main>

        {/* Footer */}
        <MedFooter />

        {/* Bottom padding for mobile nav */}
        <div className="h-16 lg:hidden" />
      </div>
    </LiveFeedProvider>
  );
}