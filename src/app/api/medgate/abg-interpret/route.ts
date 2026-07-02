import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

type GateDecision = 'ALLOW' | 'NEEDS_REVIEW' | 'BLOCK';

interface ABGInput {
  pH: number;
  paCO2: number;
  paO2: number;
  hco3: number;
  sao2?: number;
  baseExcess?: number;
  lactate?: number;
  fio2?: number;
  na?: number;
  cl?: number;
}

interface ABGResult {
  interpretation: string;
  primaryDisorder: string;
  compensation: string;
  severity: string;
  ardsClass: string | null;
  aaGradient: number | null;
  recommendations: string[];
  gateDecision: GateDecision;
}

function interpretABG(input: ABGInput): ABGResult {
  const { pH, paCO2, paO2, hco3, sao2, baseExcess, lactate, fio2, na, cl } = input;

  const phNormal = pH >= 7.35 && pH <= 7.45;
  const pco2Normal = paCO2 >= 35 && paCO2 <= 45;
  const hco3Normal = hco3 >= 22 && hco3 <= 26;

  let primaryDisorder = 'Normal';
  let compensation = 'None';
  let severity = 'Normal';
  const recommendations: string[] = [];
  let ardsClass: string | null = null;
  let aaGradient: number | null = null;
  let gateDecision: GateDecision = 'ALLOW';

  const isAcidemic = pH < 7.35;
  const isAlkalemic = pH > 7.45;
  const isRespiratoryAcidosis = paCO2 > 45;
  const isRespiratoryAlkalosis = paCO2 < 35;
  const isMetabolicAcidosis = hco3 < 22;
  const isMetabolicAlkalosis = hco3 > 26;

  if (phNormal && pco2Normal && hco3Normal) {
    primaryDisorder = 'Normal acid-base status';
    severity = 'Normal';
    recommendations.push('No acid-base disturbance detected', 'Continue current management');
  } else if (isAcidemic) {
    const pco2Deviation = paCO2 - 40;
    const hco3Deviation = hco3 - 24;

    if (isRespiratoryAcidosis && (!isMetabolicAcidosis || Math.abs(pco2Deviation) > Math.abs(hco3Deviation))) {
      if (isMetabolicAcidosis) {
        primaryDisorder = 'Mixed respiratory and metabolic acidosis';
        severity = 'Severe';
        gateDecision = 'BLOCK';
        recommendations.push(
          'Mixed acidosis — critical condition',
          'Urgent ventilatory support',
          'Evaluate for sepsis, cardiac arrest, or severe hypoperfusion',
          'Check lactate and consider bicarbonate therapy',
        );
      } else {
        primaryDisorder = 'Respiratory acidosis';
        const expectedAcuteHco3 = 24 + (paCO2 - 40) * 0.1;
        const expectedChronicHco3 = 24 + (paCO2 - 40) * 0.35;

        if (hco3 <= expectedAcuteHco3 + 2) {
          compensation = 'Acute (uncompensated or minimally compensated)';
          severity = pH < 7.25 ? 'Severe' : pH < 7.30 ? 'Moderate' : 'Mild';
          recommendations.push(
            'Acute respiratory acidosis — consider: airway obstruction, CNS depression, respiratory muscle fatigue',
            'Assess for need of intubation/ventilation',
            'Repeat ABG in 30-60 minutes',
          );
        } else if (hco3 <= expectedChronicHco3 + 2) {
          compensation = 'Chronic (renal compensation present)';
          severity = pH < 7.30 ? 'Moderate' : 'Mild';
          recommendations.push(
            'Chronic respiratory acidosis — likely COPD',
            'Assess oxygen therapy targets (avoid overcorrection)',
            'Consider NIV/CPAP if acute on chronic',
          );
        } else {
          compensation = 'Partially compensated';
          severity = 'Moderate';
          recommendations.push('Partially compensated respiratory acidosis', 'Monitor trend', 'Evaluate for acute exacerbation of chronic condition');
        }
      }
    } else if (isMetabolicAcidosis) {
      primaryDisorder = 'Metabolic acidosis';

      if (na !== undefined && cl !== undefined) {
        const ag = na - cl - hco3;
        if (ag > 12) {
          primaryDisorder += ' with elevated anion gap';
          compensation = `Anion gap = ${ag.toFixed(1)} (normal 8-12)`;
          if (ag > 20) {
            severity = 'Severe';
            recommendations.push(
              'High anion gap metabolic acidosis — consider: DKA, lactic acidosis, uremia, toxins',
              'Calculate delta-delta ratio',
              'Urgent evaluation for underlying cause',
              'Consider dialysis if refractory',
            );
          } else {
            severity = 'Moderate';
            recommendations.push(
              'Elevated anion gap — evaluate for DKA, lactic acidosis, renal failure, or toxin ingestion',
              'Check ketones, lactate, BUN/creatinine',
              'Calculate osmolar gap if toxin suspected',
            );
          }
        } else {
          primaryDisorder += ' with normal anion gap (hyperchloremic)';
          compensation = `Anion gap = ${ag.toFixed(1)} (normal)`;
          severity = 'Moderate';
          recommendations.push(
            'Normal anion gap (hyperchloremic) metabolic acidosis — consider: diarrhea, RTA, ureteral diversion',
            'Check urine pH and anion gap',
            'Evaluate for bicarbonate losses',
          );
        }
      } else {
        severity = pH < 7.20 ? 'Severe' : pH < 7.30 ? 'Moderate' : 'Mild';
        recommendations.push(
          'Metabolic acidosis — provide Na/Cl for anion gap calculation',
          'Assess volume status and tissue perfusion',
          'Consider underlying cause',
        );
      }

      const expectedPaCO2 = 1.5 * hco3 + 8;
      if (paCO2 >= expectedPaCO2 - 2 && paCO2 <= expectedPaCO2 + 2) {
        compensation += '; adequate respiratory compensation (Winter\'s formula)';
      } else if (paCO2 < expectedPaCO2 - 2) {
        compensation += '; concurrent respiratory alkalosis (overcompensation)';
        primaryDisorder += ' + concurrent respiratory alkalosis';
      } else {
        compensation += '; concurrent respiratory acidosis (undercompensation)';
        primaryDisorder += ' + concurrent respiratory acidosis';
      }
    }
  } else if (isAlkalemic) {
    const pco2Deviation = 40 - paCO2;
    const hco3Deviation = hco3 - 24;

    if (isRespiratoryAlkalosis && (!isMetabolicAlkalosis || pco2Deviation > hco3Deviation)) {
      if (isMetabolicAlkalosis) {
        primaryDisorder = 'Mixed respiratory and metabolic alkalosis';
        severity = 'Severe';
        recommendations.push(
          'Mixed alkalosis — high risk of arrhythmias and seizures',
          'Evaluate volume status',
          'Correct electrolyte abnormalities',
          'Consider underlying cause (vomiting, diuretics, hyperventilation)',
        );
      } else {
        primaryDisorder = 'Respiratory alkalosis';
        const expectedHco3 = 24 - (40 - paCO2) * 0.2;
        const expectedChronicHco3 = 24 - (40 - paCO2) * 0.5;

        if (hco3 >= expectedHco3 - 1) {
          compensation = 'Acute (minimal compensation)';
          severity = pH > 7.55 ? 'Severe' : pH > 7.50 ? 'Moderate' : 'Mild';
          recommendations.push(
            'Acute respiratory alkalosis — consider: anxiety, pain, fever, PE, early sepsis',
            'Evaluate for underlying cause',
            'Consider PE if sudden onset with hypoxia',
          );
        } else if (hco3 >= expectedChronicHco3 - 2) {
          compensation = 'Chronic (renal compensation present)';
          severity = 'Mild to Moderate';
          recommendations.push(
            'Chronic respiratory alkalosis — consider: chronic liver disease, pulmonary disease, CNS disorder',
            'Evaluate for chronic hyperventilation',
          );
        } else {
          compensation = 'Overcompensated — consider mixed disorder';
          severity = 'Moderate';
          recommendations.push('HCO3 lower than expected — may represent concurrent metabolic acidosis', 'Evaluate for mixed disorder');
        }
      }
    } else if (isMetabolicAlkalosis) {
      primaryDisorder = 'Metabolic alkalosis';
      const hco3Increase = hco3 - 24;
      const expectedPaCO2 = 40 + 0.7 * hco3Increase;
      if (paCO2 >= expectedPaCO2 - 2 && paCO2 <= expectedPaCO2 + 2) {
        compensation = 'Adequate respiratory compensation';
      } else if (paCO2 > expectedPaCO2 + 2) {
        compensation = 'Concurrent respiratory acidosis';
        primaryDisorder += ' + concurrent respiratory acidosis';
      } else {
        compensation = 'Concurrent respiratory alkalosis';
        primaryDisorder += ' + concurrent respiratory alkalosis';
      }
      severity = pH > 7.60 ? 'Severe' : pH > 7.55 ? 'Moderate' : 'Mild';
      recommendations.push(
        'Metabolic alkalosis — evaluate for vomiting, NG suction, diuretics, hypokalemia',
        'Check urinary chloride to classify (chloride-responsive vs resistant)',
        'Volume repletion with NS typically first-line for chloride-responsive',
        'Correct hypokalemia before correcting alkalosis',
      );
    }
  } else {
    if (isRespiratoryAcidosis && isMetabolicAlkalosis) {
      primaryDisorder = 'Fully compensated respiratory acidosis with metabolic alkalosis';
      compensation = 'Full compensation';
      severity = 'Mild';
      recommendations.push('Fully compensated — monitor for decompensation', 'Likely chronic CO2 retention with metabolic compensation');
    } else if (isRespiratoryAlkalosis && isMetabolicAcidosis) {
      primaryDisorder = 'Fully compensated respiratory alkalosis with metabolic acidosis';
      compensation = 'Full compensation';
      severity = 'Mild to Moderate';
      recommendations.push('Fully compensated mixed disorder', 'Evaluate for underlying condition (e.g., salicylate toxicity, sepsis, liver failure)');
    } else {
      primaryDisorder = 'Compensated acid-base disturbance';
      compensation = 'Compensated';
      severity = 'Mild';
      recommendations.push('Compensated disturbance — continue monitoring');
    }
  }

  // PaO2/FiO2 ratio for ARDS classification
  if (fio2 && fio2 > 0.21) {
    const pfRatio = paO2 / fio2;
    if (pfRatio < 100) {
      ardsClass = 'Severe ARDS (Berlin: <100)';
      severity = 'Critical';
      gateDecision = 'BLOCK';
      recommendations.push('Severe ARDS — consider prone positioning, neuromuscular blockade, ECMO evaluation', 'Lung-protective ventilation: VT 4-6 mL/kg IBW', 'Target SpO2 88-95%, PaO2 55-80 mmHg');
    } else if (pfRatio < 200) {
      ardsClass = 'Moderate ARDS (Berlin: 100-200)';
      severity = 'Severe';
      gateDecision = 'BLOCK';
      recommendations.push('Moderate ARDS — lung-protective ventilation mandatory', 'Consider prone positioning (16+ hours/day)', 'Conservative fluid strategy', 'PEEP optimization');
    } else if (pfRatio < 300) {
      ardsClass = 'Mild ARDS (Berlin: 200-300)';
      severity = 'Moderate';
      gateDecision = 'NEEDS_REVIEW';
      recommendations.push('Mild ARDS — lung-protective ventilation', 'Treat underlying cause', 'Monitor for progression', 'Avoid high tidal volumes');
    } else {
      ardsClass = 'No ARDS (P/F ratio normal)';
    }

    aaGradient = fio2 * 713 - paCO2 / 0.8 - paO2;
    const expectedAA = 40 / 4 + 4; // default age 40
    if (aaGradient > expectedAA + 10) {
      recommendations.push(`Elevated A-a gradient: ${aaGradient.toFixed(0)} mmHg — suggests V/Q mismatch, shunt, or diffusion impairment`);
    }
  }

  // Lactate
  if (lactate !== undefined) {
    if (lactate > 4) {
      severity = severity === 'Normal' ? 'Severe' : 'Critical';
      gateDecision = 'BLOCK';
      recommendations.push(`Severe lactic acidosis (${lactate} mmol/L) — tissue hypoperfusion likely`, 'Aggressive fluid resuscitation', 'Assess for sepsis (qSOFA)', 'Reassess lactate in 2-4 hours');
    } else if (lactate > 2) {
      if (severity === 'Normal' || severity === 'Mild') severity = 'Moderate';
      if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
      recommendations.push(`Elevated lactate (${lactate} mmol/L) — monitor for tissue perfusion`, 'Reassess lactate in 2-4 hours', 'Evaluate hemodynamic status');
    }
  }

  // Base excess
  if (baseExcess !== undefined && baseExcess < -10) {
    if (gateDecision === 'ALLOW') gateDecision = 'NEEDS_REVIEW';
    recommendations.push(`Significant base deficit (BE: ${baseExcess}) — suggests severe metabolic acidosis`);
  }

  // Gate escalation
  if (gateDecision === 'ALLOW') {
    if (severity === 'Severe' || severity === 'Critical') gateDecision = 'BLOCK';
    else if (severity === 'Moderate') gateDecision = 'NEEDS_REVIEW';
  }

  const interpretation = `${primaryDisorder}. ${compensation}. Severity: ${severity}.`;
  return { interpretation, primaryDisorder, compensation, severity, ardsClass, aaGradient, recommendations, gateDecision };
}

export async function POST(req: NextRequest) {
  try {
    const start = performance.now();
    const body = (await req.json()) as ABGInput;
    const { pH, paCO2, paO2, hco3 } = body;

    if (pH === undefined || paCO2 === undefined || paO2 === undefined || hco3 === undefined) {
      return NextResponse.json({ error: 'pH, paCO2, paO2, and hco3 are required' }, { status: 400 });
    }

    const result = interpretABG(body);
    const latencyMs = Math.round((performance.now() - start) * 100) / 100;

    const severityScore: Record<string, number> = { Normal: 0, Mild: 1, 'Mild to Moderate': 2, Moderate: 3, Severe: 4, Critical: 5 };
    const rawScore = severityScore[result.severity] ?? 0;

    await db.clinicalScore.create({
      data: {
        scoreType: 'abg-interpretation',
        rawScore,
        totalPossible: 5,
        riskLevel: result.severity,
        components: JSON.stringify(body),
        recommendation: result.recommendations.join('; '),
        gateDecision: result.gateDecision,
      },
    });

    return NextResponse.json({
      interpretation: result.interpretation,
      primaryDisorder: result.primaryDisorder,
      compensation: result.compensation,
      severity: result.severity,
      ardsClass: result.ardsClass,
      aaGradient: result.aaGradient,
      recommendations: result.recommendations,
      gateDecision: result.gateDecision,
      latencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: 'ABG interpretation failed', details: String(error) }, { status: 500 });
  }
}