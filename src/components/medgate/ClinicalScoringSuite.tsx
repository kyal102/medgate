'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion } from 'framer-motion';
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Zap,
  Activity,
  Brain,
  Heart,
  Stethoscope,
  Shield,
  GitCompareArrows,
  Gauge,
  Thermometer,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface ScoreField {
  id: string;
  label: string;
  type: 'select' | 'number' | 'checkbox';
  options?: { label: string; value: string; weight: number }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface ScoringSystem {
  id: string;
  tab: string;
  fullName: string;
  description: string;
  icon: typeof Calculator;
  fields: ScoreField[];
  maxScore: number;
  thresholds: { low: number; moderate: number; high: number };
  riskLabels: Record<RiskLevel, string>;
  recommendations: Record<RiskLevel, string[]>;
  presets: { label: string; icon: string; values: Record<string, string | boolean | number> }[];
}

interface ScoreResult {
  score: number;
  risk: RiskLevel;
  gate: GateDecision;
  recommendations: string[];
}

/* ------------------------------------------------------------------ */
/*  Scoring Systems Data                                               */
/* ------------------------------------------------------------------ */

const SCORING_SYSTEMS: ScoringSystem[] = [
  {
    id: 'news2',
    tab: 'NEWS2',
    fullName: 'National Early Warning Score 2',
    description: 'Standardized track-and-trigger system for acute deterioration',
    icon: Activity,
    fields: [
      { id: 'resp_rate', label: 'Respiratory Rate (/min)', type: 'select', options: [
        { label: '≤ 8', value: '3', weight: 3 }, { label: '9–11', value: '1', weight: 1 },
        { label: '12–20', value: '0', weight: 0 }, { label: '21–24', value: '2', weight: 2 },
        { label: '≥ 25', value: '3', weight: 3 },
      ]},
      { id: 'spo2_scale', label: 'SpO₂ Scale 1 (%)', type: 'select', options: [
        { label: '≤ 91', value: '3', weight: 3 }, { label: '92–93', value: '2', weight: 2 },
        { label: '94–95', value: '1', weight: 1 }, { label: '≥ 96', value: '0', weight: 0 },
      ]},
      { id: 'air_or_oxygen', label: 'Supplemental O₂', type: 'select', options: [
        { label: 'Yes', value: '2', weight: 2 }, { label: 'No', value: '0', weight: 0 },
      ]},
      { id: 'systolic_bp', label: 'Systolic BP (mmHg)', type: 'select', options: [
        { label: '≤ 90', value: '3', weight: 3 }, { label: '91–100', value: '2', weight: 2 },
        { label: '101–110', value: '1', weight: 1 }, { label: '111–219', value: '0', weight: 0 },
        { label: '≥ 220', value: '3', weight: 3 },
      ]},
      { id: 'pulse', label: 'Heart Rate (/min)', type: 'select', options: [
        { label: '≤ 40', value: '3', weight: 3 }, { label: '41–50', value: '1', weight: 1 },
        { label: '51–90', value: '0', weight: 0 }, { label: '91–110', value: '1', weight: 1 },
        { label: '111–130', value: '2', weight: 2 }, { label: '≥ 131', value: '3', weight: 3 },
      ]},
      { id: 'consciousness', label: 'Consciousness (ACVPU)', type: 'select', options: [
        { label: 'Alert', value: '0', weight: 0 }, { label: 'Confusion/New', value: '3', weight: 3 },
        { label: 'Voice', value: '3', weight: 3 }, { label: 'Pain', value: '3', weight: 3 },
        { label: 'Unresponsive', value: '3', weight: 3 },
      ]},
      { id: 'temperature', label: 'Temperature (°C)', type: 'select', options: [
        { label: '≤ 35.0', value: '3', weight: 3 }, { label: '35.1–36.0', value: '1', weight: 1 },
        { label: '36.1–38.0', value: '0', weight: 0 }, { label: '38.1–39.0', value: '1', weight: 1 },
        { label: '≥ 39.1', value: '2', weight: 2 },
      ]},
    ],
    maxScore: 20,
    thresholds: { low: 4, moderate: 6, high: 7 },
    riskLabels: { low: 'Low Risk', moderate: 'Medium Risk', high: 'High Risk', critical: 'Critical Risk' },
    recommendations: {
      low: ['Ward-based response', 'Routine monitoring (4–12 hourly)', 'Inform bedside nurse'],
      moderate: ['Urgent ward-based review', 'Increase monitoring to at least hourly', 'Consider outreach team review', 'Escalate to bedside nurse in charge'],
      high: ['Emergency assessment by critical care team', 'Continuous monitoring required', 'Transfer to higher level of care likely', 'Inform senior clinician immediately'],
      critical: ['Immediate critical care admission', 'Full resuscitation protocol', 'Continuous vital sign monitoring', 'Call MET / rapid response team NOW'],
    },
    presets: [
      { label: 'Severe Sepsis Patient', icon: '🔥', values: { resp_rate: '3', spo2_scale: '3', air_or_oxygen: '2', systolic_bp: '3', pulse: '3', consciousness: '3', temperature: '2' } },
      { label: 'Stable Post-Op', icon: '✅', values: { resp_rate: '0', spo2_scale: '0', air_or_oxygen: '0', systolic_bp: '0', pulse: '0', consciousness: '0', temperature: '0' } },
      { label: 'COPD Exacerbation', icon: '🫁', values: { resp_rate: '3', spo2_scale: '1', air_or_oxygen: '2', systolic_bp: '1', pulse: '2', consciousness: '0', temperature: '1' } },
    ],
  },
  {
    id: 'chads2vasc',
    tab: 'CHA₂DS₂',
    fullName: 'CHA₂DS₂-VASc Score',
    description: 'Stroke risk assessment in non-valvular atrial fibrillation',
    icon: Heart,
    fields: [
      { id: 'chf', label: 'CHF / LV Dysfunction', type: 'checkbox' },
      { id: 'hypertension', label: 'Hypertension', type: 'checkbox' },
      { id: 'age_75', label: 'Age ≥ 75', type: 'checkbox' },
      { id: 'diabetes', label: 'Diabetes', type: 'checkbox' },
      { id: 'stroke_tia', label: 'Prior Stroke / TIA / Thromboembolism', type: 'checkbox' },
      { id: 'vascular', label: 'Vascular Disease', type: 'checkbox' },
      { id: 'age_65_74', label: 'Age 65–74', type: 'checkbox' },
      { id: 'sex_female', label: 'Sex Category (Female)', type: 'checkbox' },
    ],
    maxScore: 9,
    thresholds: { low: 1, moderate: 2, high: 3 },
    riskLabels: { low: 'Low Stroke Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Very High Risk' },
    recommendations: {
      low: ['Consider aspirin or no antithrombotic therapy', 'Annual reassessment of risk factors', 'Address modifiable risk factors'],
      moderate: ['Oral anticoagulation recommended (DOAC preferred)', 'Assess bleeding risk with HAS-BLED', 'Patient education on AF management'],
      high: ['Oral anticoagulation strongly recommended', 'DOAC preferred over warfarin (unless mechanical valve)', 'Regular INR monitoring if on warfarin', 'Consider cardiology referral'],
      critical: ['Mandatory anticoagulation', 'DOAC or warfarin with strict monitoring', 'Multidisciplinary review recommended', 'Evaluate for rhythm control strategy'],
    },
    presets: [
      { label: 'Elderly AF', icon: '👴', values: { chf: true, hypertension: true, age_75: true, diabetes: false, stroke_tia: false, vascular: true, age_65_74: false, sex_female: false } },
      { label: 'Young AF (No Risk)', icon: '🧑', values: { chf: false, hypertension: false, age_75: false, diabetes: false, stroke_tia: false, vascular: false, age_65_74: false, sex_female: false } },
      { label: 'Post-Stroke AF', icon: '🧠', values: { chf: true, hypertension: true, age_75: true, diabetes: true, stroke_tia: true, vascular: true, age_65_74: false, sex_female: false } },
    ],
  },
  {
    id: 'hasbled',
    tab: 'HAS-BLED',
    fullName: 'HAS-BLED Bleeding Risk Score',
    description: 'Bleeding risk assessment in patients on anticoagulation',
    icon: AlertTriangle,
    fields: [
      { id: 'hb_hypertension', label: 'Hypertension (uncontrolled)', type: 'checkbox' },
      { id: 'abnormal_liver', label: 'Abnormal Liver Function', type: 'checkbox' },
      { id: 'abnormal_renal', label: 'Abnormal Renal Function', type: 'checkbox' },
      { id: 'hb_stroke', label: 'Prior Stroke', type: 'checkbox' },
      { id: 'hb_bleeding', label: 'Prior Major Bleeding', type: 'checkbox' },
      { id: 'labile_inr', label: 'Labile INR', type: 'checkbox' },
      { id: 'elderly_65', label: 'Age > 65', type: 'checkbox' },
      { id: 'hb_drugs_alcohol', label: 'Drugs / Alcohol Concomitantly', type: 'checkbox' },
    ],
    maxScore: 9,
    thresholds: { low: 1, moderate: 2, high: 3 },
    riskLabels: { low: 'Low Bleeding Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Very High Risk' },
    recommendations: {
      low: ['Anticoagulation can be safely initiated', 'Standard monitoring', 'Review at 3-month intervals'],
      moderate: ['Correct reversible risk factors before anticoagulation', 'More frequent monitoring', 'BP control optimization', 'Consider gastroprotection'],
      high: ['Careful benefit-risk assessment', 'Address all correctable factors', 'DOAC may be preferred over warfarin', 'Close outpatient monitoring'],
      critical: ['Anticoagulation may still be warranted if CHA₂DS₂-VASc is high', 'Intensive risk factor modification', 'Consider gastroprotection (PPI)', 'Multidisciplinary bleeding risk review'],
    },
    presets: [
      { label: 'Low Risk Patient', icon: '✅', values: { hb_hypertension: false, abnormal_liver: false, abnormal_renal: false, hb_stroke: false, hb_bleeding: false, labile_inr: false, elderly_65: false, hb_drugs_alcohol: false } },
      { label: 'High Risk Elderly', icon: '⚠️', values: { hb_hypertension: true, abnormal_liver: false, abnormal_renal: true, hb_stroke: true, hb_bleeding: true, labile_inr: false, elderly_65: true, hb_drugs_alcohol: true } },
    ],
  },
  {
    id: 'curb65',
    tab: 'CURB-65',
    fullName: 'CURB-65 Pneumonia Severity',
    description: 'Mortality risk assessment in community-acquired pneumonia',
    icon: Thermometer,
    fields: [
      { id: 'confusion', label: 'New Confusion (AMTS < 8)', type: 'checkbox' },
      { id: 'urea', label: 'BUN > 7 mmol/L (19 mg/dL)', type: 'checkbox' },
      { id: 'resp_rate_30', label: 'Respiratory Rate ≥ 30/min', type: 'checkbox' },
      { id: 'bp_low', label: 'SBP < 90 or DBP ≤ 60 mmHg', type: 'checkbox' },
      { id: 'age_65', label: 'Age ≥ 65 years', type: 'checkbox' },
    ],
    maxScore: 5,
    thresholds: { low: 1, moderate: 2, high: 3 },
    riskLabels: { low: 'Low Mortality Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Very High Risk' },
    recommendations: {
      low: ['Outpatient management appropriate', 'Oral antibiotics', 'Reassess if worsening', 'Safety netting advice'],
      moderate: ['Consider short hospital admission', 'IV antibiotics initially', 'Monitor vital signs closely', 'Chest X-ray follow-up in 6 weeks'],
      high: ['Hospital admission required', 'IV antibiotics with broad spectrum cover', 'Consider ICU assessment', 'Septic screen, blood cultures'],
      critical: ['ICU admission likely required', 'IV antibiotics + organ support', 'Involve respiratory / ICU team', 'Consider atypical pathogens'],
    },
    presets: [
      { label: 'Young Healthy', icon: '🧑', values: { confusion: false, urea: false, resp_rate_30: false, bp_low: false, age_65: false } },
      { label: 'Severe CAP', icon: '🚨', values: { confusion: true, urea: true, resp_rate_30: true, bp_low: true, age_65: true } },
    ],
  },
  {
    id: 'wells',
    tab: 'Wells',
    fullName: 'Wells Score for DVT / PE',
    description: 'Pre-test probability of deep vein thrombosis or pulmonary embolism',
    icon: GitCompareArrows,
    fields: [
      { id: 'dvt_symptoms', label: 'DVT Symptoms (leg swelling, pain)', type: 'checkbox' },
      { id: 'pe_most_likely', label: 'PE is #1 Diagnosis (or equally likely)', type: 'checkbox' },
      { id: 'hr_gt_100', label: 'Heart Rate > 100 bpm', type: 'checkbox' },
      { id: 'immobilization', label: 'Immobilization (≥ 3 days) or Surgery in 4 weeks', type: 'checkbox' },
      { id: 'prior_dvt_pe', label: 'Prior DVT / PE', type: 'checkbox' },
      { id: 'hemoptysis', label: 'Hemoptysis', type: 'checkbox' },
      { id: 'cancer', label: 'Active Malignancy (treated within 6 mo or palliative)', type: 'checkbox' },
    ],
    maxScore: 12,
    thresholds: { low: 4, moderate: 6, high: 7 },
    riskLabels: { low: 'Low Probability (PE Unlikely)', moderate: 'Moderate Probability', high: 'High Probability (PE Likely)', critical: 'Very High Probability' },
    recommendations: {
      low: ['PE unlikely — obtain D-dimer', 'If D-dimer negative, PE effectively ruled out', 'Consider alternative diagnosis'],
      moderate: ['Obtain D-dimer and CT pulmonary angiography', 'Start anticoagulation if clinical suspicion remains high', 'Consider lower extremity dopplers'],
      high: ['PE likely — proceed to CTPA', 'Consider empiric anticoagulation pending imaging', 'Cardiology / pulmonology consult', 'Assess for thrombolysis eligibility'],
      critical: ['High probability PE — immediate anticoagulation', 'CTPA urgently', 'Assess hemodynamic stability', 'Consider thrombolytic therapy if unstable'],
    },
    presets: [
      { label: 'Classic PE', icon: '🫀', values: { dvt_symptoms: true, pe_most_likely: true, hr_gt_100: true, immobilization: false, prior_dvt_pe: false, hemoptysis: true, cancer: false } },
      { label: 'Low Risk', icon: '✅', values: { dvt_symptoms: false, pe_most_likely: false, hr_gt_100: false, immobilization: false, prior_dvt_pe: false, hemoptysis: false, cancer: false } },
    ],
  },
  {
    id: 'gcs',
    tab: 'GCS',
    fullName: 'Glasgow Coma Scale',
    description: 'Assessment of level of consciousness after brain injury',
    icon: Brain,
    fields: [
      { id: 'eye_opening', label: 'Eye Opening', type: 'select', options: [
        { label: 'None (1)', value: '1', weight: 1 }, { label: 'To Pain (2)', value: '2', weight: 2 },
        { label: 'To Voice (3)', value: '3', weight: 3 }, { label: 'Spontaneous (4)', value: '4', weight: 4 },
      ]},
      { id: 'verbal_response', label: 'Verbal Response', type: 'select', options: [
        { label: 'None (1)', value: '1', weight: 1 }, { label: 'Incomprehensible Sounds (2)', value: '2', weight: 2 },
        { label: 'Inappropriate Words (3)', value: '3', weight: 3 }, { label: 'Confused (4)', value: '4', weight: 4 },
        { label: 'Oriented (5)', value: '5', weight: 5 },
      ]},
      { id: 'motor_response', label: 'Motor Response', type: 'select', options: [
        { label: 'None (1)', value: '1', weight: 1 }, { label: 'Extension (2)', value: '2', weight: 2 },
        { label: 'Abnormal Flexion (3)', value: '3', weight: 3 }, { label: 'Withdrawal (4)', value: '4', weight: 4 },
        { label: 'Localizes Pain (5)', value: '5', weight: 5 }, { label: 'Obeys Commands (6)', value: '6', weight: 6 },
      ]},
    ],
    maxScore: 15,
    thresholds: { low: 8, moderate: 9, high: 12 },
    riskLabels: { low: 'Mild TBI', moderate: 'Moderate TBI', high: 'Severe TBI', critical: 'Coma' },
    recommendations: {
      low: ['GCS 13–15: Mild injury', 'Observe for at least 4–6 hours', 'CT head if any high-risk feature', 'Discharge with head injury instructions'],
      moderate: ['GCS 9–12: Moderate injury', 'CT head urgently', 'Neurosurgery consult', 'Admit for observation', 'Consider ICP monitoring'],
      high: ['GCS ≤ 8: Severe injury', 'Secure airway (intubation likely)', 'Immediate CT head', 'Neurosurgery emergency consult', 'ICU admission'],
      critical: ['GCS 3–4: Critical', 'Full trauma protocol activation', 'Intubation and ventilation', 'Emergent neurosurgical intervention', 'Prepare for potential decompressive craniectomy'],
    },
    presets: [
      { label: 'Alert & Oriented', icon: '✅', values: { eye_opening: '4', verbal_response: '5', motor_response: '6' } },
      { label: 'Comatose Patient', icon: '🚨', values: { eye_opening: '1', verbal_response: '1', motor_response: '1' } },
      { label: 'Confused Post-Trauma', icon: '🤕', values: { eye_opening: '3', verbal_response: '4', motor_response: '5' } },
    ],
  },
  {
    id: 'morse',
    tab: 'Morse',
    fullName: 'Morse Fall Scale',
    description: 'Fall risk assessment for hospitalized patients',
    icon: Shield,
    fields: [
      { id: 'morse_history', label: 'History of Falling (within 3 months)', type: 'select', options: [
        { label: 'No (0)', value: '0', weight: 0 }, { label: 'Yes (25)', value: '25', weight: 25 },
      ]},
      { id: 'secondary_dx', label: 'Secondary Diagnosis (> 2 medical dx)', type: 'select', options: [
        { label: 'No (0)', value: '0', weight: 0 }, { label: 'Yes (15)', value: '15', weight: 15 },
      ]},
      { id: 'ambulatory_aid', label: 'Ambulatory Aid', type: 'select', options: [
        { label: 'None / Bed Rest / Nurse Assist (0)', value: '0', weight: 0 },
        { label: 'Crutches / Cane / Walker (15)', value: '15', weight: 15 },
        { label: 'Furniture (30)', value: '30', weight: 30 },
      ]},
      { id: 'iv_heparin', label: 'IV Therapy / Heparin Lock', type: 'select', options: [
        { label: 'No (0)', value: '0', weight: 0 }, { label: 'Yes (20)', value: '20', weight: 20 },
      ]},
      { id: 'gait', label: 'Gait', type: 'select', options: [
        { label: 'Normal / Bed Rest / Wheelchair (0)', value: '0', weight: 0 },
        { label: 'Weak (10)', value: '10', weight: 10 },
        { label: 'Impaired (20)', value: '20', weight: 20 },
      ]},
      { id: 'mental_status', label: 'Mental Status', type: 'select', options: [
        { label: 'Knows Own Limitations (0)', value: '0', weight: 0 },
        { label: 'Overestimates / Forgets Limitations (15)', value: '15', weight: 15 },
      ]},
    ],
    maxScore: 125,
    thresholds: { low: 24, moderate: 44, high: 45 },
    riskLabels: { low: 'Low Fall Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Very High Risk' },
    recommendations: {
      low: ['Standard fall prevention protocol', 'Routine nursing care', 'Educate patient on call bell use'],
      moderate: ['Yellow fall risk armband', 'Bed in lowest position', 'Call bell within reach', 'Non-slip footwear', 'Frequent rounding'],
      high: ['High fall risk interventions', 'One-to-one sitter may be needed', 'Bed alarm activated', 'Fall prevention care plan', 'Physical therapy consult'],
      critical: ['Immediate fall precautions', 'Continuous supervision required', 'Consider restraint only as last resort', 'Multidisciplinary safety huddle', 'Family education and involvement'],
    },
    presets: [
      { label: 'Young Healthy', icon: '✅', values: { morse_history: '0', secondary_dx: '0', ambulatory_aid: '0', iv_heparin: '0', gait: '0', mental_status: '0' } },
      { label: 'Elderly with Cane', icon: '🦯', values: { morse_history: '25', secondary_dx: '15', ambulatory_aid: '15', iv_heparin: '20', gait: '10', mental_status: '0' } },
      { label: 'Post-Op Confused', icon: '🏥', values: { morse_history: '25', secondary_dx: '15', ambulatory_aid: '30', iv_heparin: '20', gait: '20', mental_status: '15' } },
    ],
  },
  {
    id: 'caprini',
    tab: 'Caprini',
    fullName: 'Caprini Risk Assessment (VTE)',
    description: 'Venous thromboembolism risk assessment model',
    icon: Gauge,
    fields: [
      { id: 'caprini_age_41_60', label: 'Age 41–60', type: 'checkbox' },
      { id: 'caprini_age_61_74', label: 'Age 61–74', type: 'checkbox' },
      { id: 'caprini_age_75', label: 'Age ≥ 75', type: 'checkbox' },
      { id: 'caprini_bmi_40', label: 'BMI > 40', type: 'checkbox' },
      { id: 'caprini_surgery', label: 'Minor / Major Surgery (< 45 min / > 45 min)', type: 'select', options: [
        { label: 'None (0)', value: '0', weight: 0 }, { label: 'Minor (1)', value: '1', weight: 1 },
        { label: 'Major, < 45 min (2)', value: '2', weight: 2 }, { label: 'Major, ≥ 45 min (3)', value: '3', weight: 3 },
        { label: 'Major, Laparoscopic (4)', value: '4', weight: 4 },
      ]},
      { id: 'caprini_vte', label: 'Prior VTE', type: 'checkbox' },
      { id: 'caprini_malignancy', label: 'Active Malignancy', type: 'checkbox' },
      { id: 'caprini_immobility', label: 'Bed Rest / Immobility > 72h', type: 'checkbox' },
      { id: 'caprini_icu', label: 'ICU Admission', type: 'checkbox' },
      { id: 'caprini_varicose', label: 'Varicose Veins', type: 'checkbox' },
      { id: 'caprini_pregnancy', label: 'Pregnancy / Postpartum (< 1 month)', type: 'checkbox' },
      { id: 'caprini_oral_contraceptives', label: 'Oral Contraceptives / HRT', type: 'checkbox' },
    ],
    maxScore: 18,
    thresholds: { low: 4, moderate: 5, high: 8 },
    riskLabels: { low: 'Low VTE Risk', moderate: 'Moderate Risk', high: 'High Risk', critical: 'Very High Risk' },
    recommendations: {
      low: ['Early ambulation', 'Pneumatic compression devices (optional)', 'No pharmacological prophylaxis needed'],
      moderate: ['Pharmacological prophylaxis (LMWH or fondaparinux)', 'Pneumatic compression devices', 'Early ambulation encouraged'],
      high: ['Aggressive pharmacological prophylaxis', 'Dual prophylaxis (mechanical + pharmacological)', 'Consider extended prophylaxis post-discharge', 'Monitor for bleeding complications'],
      critical: ['ICU-level VTE prevention protocol', 'Full-dose anticoagulation prophylaxis', 'IVC filter consideration in selected cases', 'Daily VTE risk reassessment'],
    },
    presets: [
      { label: 'Low Risk (Young)', icon: '✅', values: { caprini_age_41_60: false, caprini_age_61_74: false, caprini_age_75: false, caprini_bmi_40: false, caprini_surgery: '0', caprini_vte: false, caprini_malignancy: false, caprini_immobility: false, caprini_icu: false, caprini_varicose: false, caprini_pregnancy: false, caprini_oral_contraceptives: false } },
      { label: 'Post-Surgical Elderly', icon: '🏥', values: { caprini_age_41_60: false, caprini_age_61_74: true, caprini_age_75: false, caprini_bmi_40: false, caprini_surgery: '3', caprini_vte: true, caprini_malignancy: false, caprini_immobility: true, caprini_icu: false, caprini_varicose: false, caprini_pregnancy: false, caprini_oral_contraceptives: false } },
    ],
  },
  {
    id: 'childpugh',
    tab: 'Child-Pugh',
    fullName: 'Child-Pugh Classification',
    description: 'Assessment of liver disease severity and cirrhosis prognosis',
    icon: Stethoscope,
    fields: [
      { id: 'cp_bilirubin', label: 'Bilirubin (μmol/L)', type: 'select', options: [
        { label: '< 34 (1 pt)', value: '1', weight: 1 }, { label: '34–50 (2 pts)', value: '2', weight: 2 },
        { label: '> 50 (3 pts)', value: '3', weight: 3 },
      ]},
      { id: 'cp_albumin', label: 'Serum Albumin (g/L)', type: 'select', options: [
        { label: '> 35 (1 pt)', value: '1', weight: 1 }, { label: '28–35 (2 pts)', value: '2', weight: 2 },
        { label: '< 28 (3 pts)', value: '3', weight: 3 },
      ]},
      { id: 'cp_inr', label: 'INR', type: 'select', options: [
        { label: '< 1.7 (1 pt)', value: '1', weight: 1 }, { label: '1.7–2.3 (2 pts)', value: '2', weight: 2 },
        { label: '> 2.3 (3 pts)', value: '3', weight: 3 },
      ]},
      { id: 'cp_ascites', label: 'Ascites', type: 'select', options: [
        { label: 'None (1 pt)', value: '1', weight: 1 }, { label: 'Mild (2 pts)', value: '2', weight: 2 },
        { label: 'Moderate/Severe (3 pts)', value: '3', weight: 3 },
      ]},
      { id: 'cp_encephalopathy', label: 'Hepatic Encephalopathy', type: 'select', options: [
        { label: 'None (1 pt)', value: '1', weight: 1 }, { label: 'Grade I–II (2 pts)', value: '2', weight: 2 },
        { label: 'Grade III–IV (3 pts)', value: '3', weight: 3 },
      ]},
    ],
    maxScore: 15,
    thresholds: { low: 6, moderate: 9, high: 10 },
    riskLabels: { low: 'Child-Pugh A (Mild)', moderate: 'Child-Pugh B (Moderate)', high: 'Child-Pugh C (Severe)', critical: 'End-Stage Liver Disease' },
    recommendations: {
      low: ['1-year survival ~100%', 'Most medications at standard doses', 'Monitor liver function every 6–12 months', 'Vaccinate against hepatitis A & B if not immune'],
      moderate: ['1-year survival ~80%', 'Dose reduction for hepatically metabolized drugs', 'Consider hepatology referral', 'Monitor for complications (ascites, varices)', 'Nutritional optimization'],
      high: ['1-year survival ~45%', 'Significant dose adjustments required', 'Urgent hepatology / transplant evaluation', 'Screen for varices, HCC', 'Avoid hepatotoxic medications'],
      critical: ['Critical liver function', 'Liver transplant evaluation urgent', 'ICU-level monitoring', 'Review ALL medications for hepatic dosing', 'Palliative care discussion'],
    },
    presets: [
      { label: 'Compensated Cirrhosis', icon: '✅', values: { cp_bilirubin: '1', cp_albumin: '1', cp_inr: '1', cp_ascites: '1', cp_encephalopathy: '1' } },
      { label: 'Decompensated Cirrhosis', icon: '⚠️', values: { cp_bilirubin: '2', cp_albumin: '2', cp_inr: '2', cp_ascites: '3', cp_encephalopathy: '2' } },
      { label: 'End-Stage', icon: '🚨', values: { cp_bilirubin: '3', cp_albumin: '3', cp_inr: '3', cp_ascites: '3', cp_encephalopathy: '3' } },
    ],
  },
  {
    id: 'apache2',
    tab: 'APACHE II',
    fullName: 'APACHE II Score',
    description: 'ICU mortality prediction based on acute physiology and chronic health',
    icon: Zap,
    fields: [
      { id: 'ap_temp', label: 'Temperature (°C)', type: 'select', options: [
        { label: '≥ 41.0 (0)', value: '0', weight: 0 }, { label: '39.0–40.9 (1)', value: '1', weight: 1 },
        { label: '38.5–38.9 (1)', value: '1', weight: 1 }, { label: '36.0–38.4 (0)', value: '0', weight: 0 },
        { label: '34.0–35.9 (2)', value: '2', weight: 2 }, { label: '32.0–33.9 (3)', value: '3', weight: 3 },
        { label: '30.0–31.9 (4)', value: '4', weight: 4 }, { label: '≤ 29.9 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_map', label: 'Mean Arterial Pressure (mmHg)', type: 'select', options: [
        { label: '≥ 160 (4)', value: '4', weight: 4 }, { label: '130–159 (3)', value: '3', weight: 3 },
        { label: '110–129 (2)', value: '2', weight: 2 }, { label: '70–109 (0)', value: '0', weight: 0 },
        { label: '50–69 (2)', value: '2', weight: 2 }, { label: '< 50 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_hr', label: 'Heart Rate (/min)', type: 'select', options: [
        { label: '≥ 180 (4)', value: '4', weight: 4 }, { label: '140–179 (3)', value: '3', weight: 3 },
        { label: '110–139 (2)', value: '2', weight: 2 }, { label: '70–109 (0)', value: '0', weight: 0 },
        { label: '55–69 (2)', value: '2', weight: 2 }, { label: '40–54 (3)', value: '3', weight: 3 },
        { label: '< 40 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_rr', label: 'Respiratory Rate (/min)', type: 'select', options: [
        { label: '≥ 50 (4)', value: '4', weight: 4 }, { label: '35–49 (3)', value: '3', weight: 3 },
        { label: '25–34 (1)', value: '1', weight: 1 }, { label: '12–24 (0)', value: '0', weight: 0 },
        { label: '10–11 (1)', value: '1', weight: 1 }, { label: '6–9 (2)', value: '2', weight: 2 },
        { label: '< 6 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_fio2_aado2', label: 'A-aDO₂ or PaO₂ (FiO₂ ≥ 0.5 / < 0.5)', type: 'select', options: [
        { label: 'PaO₂ ≥ 80 / A-aDO₂ < 200 (0)', value: '0', weight: 0 },
        { label: 'PaO₂ 60–79 / A-aDO₂ 200–349 (1)', value: '1', weight: 1 },
        { label: 'PaO₂ 55–59 / A-aDO₂ 350–499 (3)', value: '3', weight: 3 },
        { label: 'PaO₂ < 55 / A-aDO₂ ≥ 500 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_ph', label: 'Arterial pH', type: 'select', options: [
        { label: '≥ 7.70 (4)', value: '4', weight: 4 }, { label: '7.60–7.69 (3)', value: '3', weight: 3 },
        { label: '7.50–7.59 (1)', value: '1', weight: 1 }, { label: '7.33–7.49 (0)', value: '0', weight: 0 },
        { label: '7.25–7.32 (2)', value: '2', weight: 2 }, { label: '7.15–7.24 (3)', value: '3', weight: 3 },
        { label: '< 7.15 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_sodium', label: 'Serum Sodium (mmol/L)', type: 'select', options: [
        { label: '≥ 180 (4)', value: '4', weight: 4 }, { label: '160–179 (3)', value: '3', weight: 3 },
        { label: '155–159 (2)', value: '2', weight: 2 }, { label: '150–154 (1)', value: '1', weight: 1 },
        { label: '130–149 (0)', value: '0', weight: 0 }, { label: '120–129 (2)', value: '2', weight: 2 },
        { label: '111–119 (3)', value: '3', weight: 3 }, { label: '≤ 110 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_potassium', label: 'Serum Potassium (mmol/L)', type: 'select', options: [
        { label: '≥ 7.0 (4)', value: '4', weight: 4 }, { label: '6.0–6.9 (3)', value: '3', weight: 3 },
        { label: '5.5–5.9 (1)', value: '1', weight: 1 }, { label: '3.5–5.4 (0)', value: '0', weight: 0 },
        { label: '3.0–3.4 (1)', value: '1', weight: 1 }, { label: '2.5–2.9 (2)', value: '2', weight: 2 },
        { label: '< 2.5 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_creatinine', label: 'Creatinine (mg/dL) / BUN', type: 'select', options: [
        { label: 'Cr ≥ 3.5 / BUN ≥ 100 (4)', value: '4', weight: 4 },
        { label: 'Cr 2.0–3.4 / BUN 28–99 (3)', value: '3', weight: 3 },
        { label: 'Cr 1.5–1.9 / BUN 23–27 (2)', value: '2', weight: 2 },
        { label: 'Cr 0.6–1.4 / BUN 7–22 (0)', value: '0', weight: 0 },
        { label: 'Cr < 0.6 / BUN < 7 (2)', value: '2', weight: 2 },
      ]},
      { id: 'ap_hematocrit', label: 'Hematocrit (%)', type: 'select', options: [
        { label: '≥ 60 (4)', value: '4', weight: 4 }, { label: '50–59.9 (2)', value: '2', weight: 2 },
        { label: '46–49.9 (1)', value: '1', weight: 1 }, { label: '30–45.9 (0)', value: '0', weight: 0 },
        { label: '20–29.9 (2)', value: '2', weight: 2 }, { label: '< 20 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_wbc', label: 'WBC (×10³/μL)', type: 'select', options: [
        { label: '≥ 40 (4)', value: '4', weight: 4 }, { label: '20–39.9 (2)', value: '2', weight: 2 },
        { label: '15–19.9 (1)', value: '1', weight: 1 }, { label: '3–14.9 (0)', value: '0', weight: 0 },
        { label: '1–2.9 (2)', value: '2', weight: 2 }, { label: '< 1 (4)', value: '4', weight: 4 },
      ]},
      { id: 'ap_age', label: 'Age Points', type: 'select', options: [
        { label: '< 44 (0)', value: '0', weight: 0 }, { label: '45–54 (2)', value: '2', weight: 2 },
        { label: '55–64 (3)', value: '3', weight: 3 }, { label: '65–74 (5)', value: '5', weight: 5 },
        { label: '≥ 75 (6)', value: '6', weight: 6 },
      ]},
      { id: 'ap_chronic', label: 'Chronic Health Points', type: 'select', options: [
        { label: 'None (0)', value: '0', weight: 0 }, { label: 'Non-operative / Post-op emergency (5)', value: '5', weight: 5 },
        { label: 'Post-op elective (2)', value: '2', weight: 2 },
      ]},
    ],
    maxScore: 71,
    thresholds: { low: 9, moderate: 14, high: 24 },
    riskLabels: { low: 'Low ICU Mortality (~10%)', moderate: 'Moderate Risk (~25%)', high: 'High Risk (~55%)', critical: 'Very High Risk (> 80%)' },
    recommendations: {
      low: ['Standard ICU monitoring', 'Goal-directed therapy', 'Reassess q12–24h'],
      moderate: ['Enhanced monitoring protocol', 'Early goal-directed therapy', 'Consider specialty consults', 'Daily APACHE reassessment'],
      high: ['Intensive monitoring and interventions', 'Full organ support assessment', 'Family conference regarding prognosis', 'Consider clinical trial enrollment'],
      critical: ['Maximum level of care', 'All organ systems support', 'Goals-of-care discussion urgent', 'Palliative care involvement', 'Mortality risk communication'],
    },
    presets: [
      { label: 'Stable ICU', icon: '✅', values: { ap_temp: '0', ap_map: '0', ap_hr: '0', ap_rr: '0', ap_fio2_aado2: '0', ap_ph: '0', ap_sodium: '0', ap_potassium: '0', ap_creatinine: '0', ap_hematocrit: '0', ap_wbc: '0', ap_age: '0', ap_chronic: '0' } },
      { label: 'Septic Shock', icon: '🚨', values: { ap_temp: '1', ap_map: '4', ap_hr: '2', ap_rr: '3', ap_fio2_aado2: '3', ap_ph: '2', ap_sodium: '0', ap_potassium: '1', ap_creatinine: '3', ap_hematocrit: '2', ap_wbc: '2', ap_age: '5', ap_chronic: '5' } },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getRiskLevel(score: number, sys: ScoringSystem): RiskLevel {
  if (score >= sys.thresholds.high) return score > sys.maxScore * 0.85 ? 'critical' : 'high';
  if (score >= sys.thresholds.moderate) return 'moderate';
  return 'low';
}

function getGateDecision(risk: RiskLevel): GateDecision {
  if (risk === 'low') return 'ALLOW';
  if (risk === 'moderate') return 'NEEDS_REVIEW';
  return 'BLOCK';
}

function riskColor(risk: RiskLevel): string {
  if (risk === 'low') return 'text-emerald-400';
  if (risk === 'moderate') return 'text-amber-400';
  if (risk === 'high') return 'text-rose-400';
  return 'text-red-400';
}

function riskBadgeClass(risk: RiskLevel): string {
  if (risk === 'low') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  if (risk === 'moderate') return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  if (risk === 'high') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  return 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
}

function gaugeColor(risk: RiskLevel): string {
  if (risk === 'low') return 'bg-emerald-500';
  if (risk === 'moderate') return 'bg-amber-500';
  if (risk === 'high') return 'bg-rose-500';
  return 'bg-red-500';
}

function gateColor(gate: GateDecision): string {
  if (gate === 'ALLOW') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (gate === 'NEEDS_REVIEW') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
}

function gateIcon(gate: GateDecision): typeof CheckCircle2 {
  if (gate === 'ALLOW') return CheckCircle2;
  if (gate === 'NEEDS_REVIEW') return Info;
  return XCircle;
}

function calculateScore(sys: ScoringSystem, values: Record<string, string | boolean | number>): number {
  let score = 0;
  for (const field of sys.fields) {
    if (field.type === 'checkbox') {
      if (values[field.id]) {
        // Special weights for specific checkboxes
        if (sys.id === 'chads2vasc') {
          if (field.id === 'age_75' || field.id === 'stroke_tia') score += 2;
          else score += 1;
        } else {
          score += 1;
        }
      }
    } else if (field.type === 'select') {
      const val = values[field.id] as string;
      if (val) {
        const opt = field.options?.find(o => o.value === val);
        if (opt) score += opt.weight;
      }
    } else if (field.type === 'number') {
      const val = values[field.id] as number;
      if (!isNaN(val)) score += val;
    }
  }
  return score;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ClinicalScoringSuite() {
  const [activeTab, setActiveTab] = useState('news2');
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string | boolean | number>>>({});
  const [loading, setLoading] = useState(false);
  const [gateResult, setGateResult] = useState<{ gate: GateDecision; reportId: string } | null>(null);

  const activeSystem = SCORING_SYSTEMS.find(s => s.id === activeTab)!;
  const currentValues = fieldValues[activeTab] || {};
  const currentScore = useMemo(() => calculateScore(activeSystem, currentValues), [activeSystem, currentValues]);
  const risk = useMemo(() => getRiskLevel(currentScore, activeSystem), [currentScore, activeSystem]);
  const gate = useMemo(() => getGateDecision(risk), [risk]);
  const scorePct = Math.min((currentScore / activeSystem.maxScore) * 100, 100);
  const recommendations = activeSystem.recommendations[risk];

  const updateField = (fieldId: string, value: string | boolean | number) => {
    setFieldValues(prev => ({
      ...prev,
      [activeTab]: { ...(prev[activeTab] || {}), [fieldId]: value },
    }));
    setGateResult(null);
  };

  const applyPreset = (preset: ScoringSystem['presets'][0]) => {
    setFieldValues(prev => ({
      ...prev,
      [activeTab]: { ...preset.values },
    }));
    setGateResult(null);
    toast.success('Preset applied', { description: preset.label });
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/clinical-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoringSystem: activeSystem.id,
          score: currentScore,
          risk,
          values: currentValues,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGateResult({ gate: data.gateDecision || gate, reportId: data.reportId || `CS-${Date.now()}` });
        toast.success('Score verified', { description: `Gate decision: ${data.gateDecision || gate}` });
      } else {
        setGateResult({ gate, reportId: `CS-${Date.now()}` });
      }
    } catch {
      setGateResult({ gate, reportId: `CS-${Date.now()}` });
    }
    setLoading(false);
  };

  const GateIcon = gateIcon(gateResult?.gate || gate);

  return (
    <div className="space-y-6">
      <SectionHeader
        icon={Calculator}
        title="Clinical Scoring Suite"
        subtitle="Evidence-based risk stratification across 10 validated scoring systems"
        badge="10 Scores"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="glass-card rounded-xl p-2 overflow-x-auto">
          <TabsList className="bg-slate-800/50 border border-slate-700/50 h-auto flex-wrap gap-1 p-1 w-max min-w-full">
            {SCORING_SYSTEMS.map(sys => {
              const Icon = sys.icon;
              return (
                <TabsTrigger
                  key={sys.id}
                  value={sys.id}
                  className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-slate-400 text-xs sm:text-sm px-3 py-1.5 shrink-0"
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {sys.tab}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {SCORING_SYSTEMS.map(sys => (
          <TabsContent key={sys.id} value={sys.id} className="mt-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Form Panel */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="glass-card border-0">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          <sys.icon className="w-5 h-5 text-cyan-400" />
                          {sys.fullName}
                        </CardTitle>
                        <p className="text-sm text-slate-400 mt-1">{sys.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Max: {sys.maxScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Quick Presets */}
                    {sys.presets.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-xs text-slate-500 self-center mr-1">Quick Presets:</span>
                        {sys.presets.map((p, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs border-slate-700 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400"
                            onClick={() => applyPreset(p)}
                          >
                            {p.icon} {p.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    <Separator className="bg-slate-700/50" />

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sys.fields.map(field => {
                        const val = (fieldValues[sys.id] || {})[field.id];
                        return (
                          <div key={field.id} className="space-y-2">
                            <Label className="text-sm text-slate-300">{field.label}</Label>
                            {field.type === 'select' && (
                              <Select
                                value={(val as string) || ''}
                                onValueChange={v => updateField(field.id, v)}
                              >
                                <SelectTrigger className="bg-slate-800/50 border-slate-600 text-white">
                                  <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {field.type === 'checkbox' && (
                              <div className="flex items-center gap-3 pt-1">
                                <Checkbox
                                  checked={!!val}
                                  onCheckedChange={v => updateField(field.id, !!v)}
                                  className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                />
                                <span className="text-sm text-slate-400">
                                  {val ? 'Yes — included' : 'No — not present'}
                                </span>
                              </div>
                            )}
                            {field.type === 'number' && (
                              <Input
                                type="number"
                                placeholder={field.placeholder || '0'}
                                min={field.min}
                                max={field.max}
                                step={field.step || 1}
                                value={(val as string) || ''}
                                onChange={e => updateField(field.id, parseFloat(e.target.value) || 0)}
                                className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Score / Risk Panel */}
              <div className="space-y-4">
                {/* Score Display */}
                <Card className="glass-card border-0">
                  <CardContent className="p-6 text-center space-y-4">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Current Score</p>
                    <div className={cn('text-6xl font-bold', riskColor(risk))}>
                      <AnimatedCounter target={currentScore} duration={800} />
                      <span className="text-2xl text-slate-500">/{sys.maxScore}</span>
                    </div>
                    <Badge variant="outline" className={cn('text-sm px-4 py-1', riskBadgeClass(risk))}>
                      {sys.riskLabels[risk]}
                    </Badge>

                    {/* Visual Gauge */}
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', gaugeColor(risk))}
                          initial={{ width: 0 }}
                          animate={{ width: `${scorePct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>0</span>
                        <span className="text-emerald-500">Low</span>
                        <span className="text-amber-500">Mod</span>
                        <span className="text-rose-500">High</span>
                        <span>{sys.maxScore}</span>
                      </div>
                    </div>

                    {/* Gate Decision Preview */}
                    <div className={cn('mt-4 p-3 rounded-lg border', gateColor(gate))}>
                      <div className="flex items-center justify-center gap-2">
                        <GateIcon className="w-4 h-4" />
                        <span className="text-sm font-bold">{gateResult?.gate || gate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Calculate & Verify */}
                <Button
                  onClick={verify}
                  disabled={loading}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {loading ? 'Verifying...' : 'Calculate & Verify'}
                  <Zap className="w-4 h-4 ml-2" />
                </Button>

                {gateResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Alert className={cn('border', gateColor(gateResult.gate))}>
                      <GateIcon className="w-4 h-4" />
                      <AlertTitle className="text-sm font-bold">Gate Decision: {gateResult.gate}</AlertTitle>
                      <AlertDescription className="text-xs text-slate-400">
                        Report ID: {gateResult.reportId}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Card className="glass-card border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-2 px-3 py-2 rounded-md text-sm',
                          risk === 'low' ? 'bg-emerald-500/5 text-emerald-300' :
                          risk === 'moderate' ? 'bg-amber-500/5 text-amber-300' :
                          risk === 'high' ? 'bg-rose-500/5 text-rose-300' :
                          'bg-red-500/5 text-red-300'
                        )}
                      >
                        <span className="text-xs mt-0.5 opacity-60">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Threshold Reference */}
            <Card className="glass-card border-0">
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 mb-2 font-semibold uppercase tracking-wider">Threshold Reference</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Low', range: `0 – ${sys.thresholds.low}`, color: 'border-emerald-500/40 bg-emerald-500/5' },
                    { label: 'Moderate', range: `${sys.thresholds.low + 1} – ${sys.thresholds.moderate}`, color: 'border-amber-500/40 bg-amber-500/5' },
                    { label: 'High', range: `${sys.thresholds.moderate + 1} – ${sys.thresholds.high}`, color: 'border-rose-500/40 bg-rose-500/5' },
                    { label: 'Critical', range: `> ${sys.thresholds.high}`, color: 'border-red-500/40 bg-red-500/5' },
                  ].map(t => (
                    <div key={t.label} className={cn('border rounded-lg px-3 py-2', t.color)}>
                      <p className="text-xs font-semibold text-slate-300">{t.label}</p>
                      <p className="text-[10px] text-slate-500">{t.range}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}