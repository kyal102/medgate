import { create } from 'zustand';
import type {
  VerificationResult, PatientContext, GateStats, DrugInteraction,
  LabValue, VitalSignData, SepsisCriteria, MedNotification, ClaimHistoryEntry, LicenseTier,
} from './medgate-constants';
import { LICENSE_TIERS } from './medgate-constants';

interface SepsisResult {
  qsofa_score: number;
  sirs_score: number;
  sofa_score: number;
  sepsis_likelihood: 'low' | 'moderate' | 'high';
  septic_shock: boolean;
  recommendations: string[];
}

interface InteractionResult {
  drugA: string;
  drugB: string;
  severity: 'MINOR' | 'MODERATE' | 'SEVERE' | 'FATAL';
  mechanism: string;
  clinicalEffect: string;
  management: string;
}

interface LabValidationResult {
  analyte: string;
  value: number;
  unit: string;
  status: 'normal' | 'critical_low' | 'critical_high' | 'abnormal_low' | 'abnormal_high' | 'physiologically_impossible';
  message: string;
}

interface DrugEntry {
  name: string;
  dose?: string;
  route?: string;
}

interface MedGateState {
  claimInput: string;
  setClaimInput: (input: string) => void;
  claimResult: VerificationResult | null;
  setClaimResult: (result: VerificationResult | null) => void;
  isCheckingClaim: boolean;
  setIsCheckingClaim: (checking: boolean) => void;

  patientContext: PatientContext;
  setPatientContext: (ctx: PatientContext) => void;

  gatePerformance: Record<string, GateStats>;

  selectedDrugs: DrugEntry[];
  setSelectedDrugs: (drugs: DrugEntry[]) => void;
  interactionResults: InteractionResult[];
  setInteractionResults: (results: InteractionResult[]) => void;

  labValues: LabValue[];
  setLabValues: (values: LabValue[]) => void;
  labValidationResults: LabValidationResult[];
  setLabValidationResults: (results: LabValidationResult[]) => void;

  vitalSigns: VitalSignData[];
  setVitalSigns: (signs: VitalSignData[]) => void;
  news2Score: number;
  setNews2Score: (score: number) => void;
  qsofaScore: number;
  setQsofaScore: (score: number) => void;

  sepsisCriteria: SepsisCriteria;
  setSepsisCriteria: (criteria: SepsisCriteria) => void;
  sepsisResult: SepsisResult | null;
  setSepsisResult: (result: SepsisResult | null) => void;

  totalClaimsBlocked: number;
  incrementBlocked: () => void;
  estimatedLivesSaved: number;

  claimHistory: ClaimHistoryEntry[];
  setClaimHistory: (h: ClaimHistoryEntry[]) => void;
  mergeHistoryEntries: (entries: ClaimHistoryEntry[]) => void;

  activeSection: string;
  setActiveSection: (section: string) => void;

  notifications: MedNotification[];
  addNotification: (n: Omit<MedNotification, 'id' | 'timestamp' | 'read'>) => void;

  currentLicense: LicenseTier;
  setCurrentLicense: (tier: LicenseTier) => void;

  benchmarkResults: {
    totalCases: number;
    passed: number;
    blocked: number;
    needsReview: number;
    evidenceReq: number;
    failed: number;
    durationMs: number;
  } | null;
  setBenchmarkResults: (results: MedGateState['benchmarkResults']) => void;
}

const defaultPatientContext: PatientContext = {
  age: 65,
  weight_kg: 70,
  sex: 'male',
  allergies: [],
  current_medications: [],
  diagnoses: [],
};

const defaultGatePerformance: Record<string, GateStats> = {
  DrugInteractionGate: { processed: 1247, blocked: 89, allowed: 1098, needsReview: 60, avgLatencyMs: 0.31 },
  DoseVerificationGate: { processed: 892, blocked: 45, allowed: 801, needsReview: 46, avgLatencyMs: 0.18 },
  AllergyCrossRefGate: { processed: 1056, blocked: 34, allowed: 987, needsReview: 35, avgLatencyMs: 0.12 },
  LabResultValidityGate: { processed: 2341, blocked: 156, allowed: 2034, needsReview: 151, avgLatencyMs: 0.22 },
  ProtocolComplianceGate: { processed: 567, blocked: 78, allowed: 412, needsReview: 77, avgLatencyMs: 0.45 },
  ContrastAgentGate: { processed: 234, blocked: 23, allowed: 189, needsReview: 22, avgLatencyMs: 0.28 },
  TimeCriticalGate: { processed: 456, blocked: 67, allowed: 334, needsReview: 55, avgLatencyMs: 0.15 },
  PediatricSafetyGate: { processed: 345, blocked: 29, allowed: 298, needsReview: 18, avgLatencyMs: 0.19 },
  PregnancySafetyGate: { processed: 289, blocked: 41, allowed: 231, needsReview: 17, avgLatencyMs: 0.21 },
  VitalSignAnomalyGate: { processed: 5678, blocked: 234, allowed: 5102, needsReview: 342, avgLatencyMs: 0.09 },
  AntibioticStewardshipGate: { processed: 678, blocked: 89, allowed: 512, needsReview: 77, avgLatencyMs: 0.34 },
  BloodProductGate: { processed: 123, blocked: 3, allowed: 118, needsReview: 2, avgLatencyMs: 0.11 },
  MedicalDeviceGate: { processed: 234, blocked: 12, allowed: 209, needsReview: 13, avgLatencyMs: 0.26 },
  DiagnosticPlausibilityGate: { processed: 456, blocked: 34, allowed: 389, needsReview: 33, avgLatencyMs: 0.41 },
};

let notifIdCounter = 0;

export const useMedGateStore = create<MedGateState>((set, get) => ({
  claimInput: '',
  setClaimInput: (input) => set({ claimInput: input }),
  claimResult: null,
  setClaimResult: (result) => set({ claimResult: result }),
  isCheckingClaim: false,
  setIsCheckingClaim: (checking) => set({ isCheckingClaim: checking }),

  patientContext: defaultPatientContext,
  setPatientContext: (ctx) => set({ patientContext: ctx }),

  gatePerformance: defaultGatePerformance,

  selectedDrugs: [],
  setSelectedDrugs: (drugs) => set({ selectedDrugs: drugs }),
  interactionResults: [],
  setInteractionResults: (results) => set({ interactionResults: results }),

  labValues: [],
  setLabValues: (values) => set({ labValues: values }),
  labValidationResults: [],
  setLabValidationResults: (results) => set({ labValidationResults: results }),

  vitalSigns: [],
  setVitalSigns: (signs) => set({ vitalSigns: signs }),
  news2Score: 0,
  setNews2Score: (score) => set({ news2Score: score }),
  qsofaScore: 0,
  setQsofaScore: (score) => set({ qsofaScore: score }),

  sepsisCriteria: { sirs_suspected_infection: false },
  setSepsisCriteria: (criteria) => set({ sepsisCriteria: criteria }),
  sepsisResult: null,
  setSepsisResult: (result) => set({ sepsisResult: result }),

  totalClaimsBlocked: 0,
  incrementBlocked: () => set((s) => {
    const newCount = s.totalClaimsBlocked + 1;
    return { totalClaimsBlocked: newCount, estimatedLivesSaved: Math.round(newCount * 0.034) };
  }),
  estimatedLivesSaved: 0,

  claimHistory: [],
  setClaimHistory: (h) => set({ claimHistory: h }),
  mergeHistoryEntries: (entries) => set((s) => ({ claimHistory: [...entries, ...s.claimHistory] })),

  activeSection: 'overview',
  setActiveSection: (section) => set({ activeSection: section }),

  notifications: [],
  addNotification: (n) => set((s) => ({
    notifications: [{
      ...n,
      id: `notif-${++notifIdCounter}`,
      timestamp: new Date().toISOString(),
      read: false,
    }, ...s.notifications].slice(0, 50),
  })),

  currentLicense: LICENSE_TIERS[0],
  setCurrentLicense: (tier) => set({ currentLicense: tier }),

  benchmarkResults: null,
  setBenchmarkResults: (results) => set({ benchmarkResults: results }),
}));
