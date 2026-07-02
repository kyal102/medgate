'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Device = 'Ventilator' | 'Infusion Pump' | 'PCA' | 'Defibrillator';

interface DeviceField {
  key: string;
  label: string;
  unit: string;
  placeholder: string;
  min?: number;
  max?: number;
  recommended?: string;
}

interface ValidationResult {
  field: string;
  status: 'ok' | 'warning' | 'danger';
  message: string;
  recommendation: string;
}

const DEVICE_FIELDS: Record<Device, DeviceField[]> = {
  Ventilator: [
    { key: 'tidalVolume', label: 'Tidal Volume', unit: 'mL/kg IBW', placeholder: 'e.g. 6', min: 4, max: 10, recommended: '6-8 mL/kg IBW (ARDS: ≤6)' },
    { key: 'peep', label: 'PEEP', unit: 'cmH2O', placeholder: 'e.g. 5', min: 0, max: 30, recommended: '5-20 cmH2O (ARDS: titrate to FiO2)' },
    { key: 'fiO2', label: 'FiO2', unit: '%', placeholder: 'e.g. 40', min: 21, max: 100, recommended: 'Maintain SpO2 92-98% with lowest FiO2' },
    { key: 'rate', label: 'Respiratory Rate', unit: '/min', placeholder: 'e.g. 14', min: 4, max: 40, recommended: '12-20 /min (ARDS: up to 35)' },
    { key: 'pip', label: 'Peak Inspiratory Pressure', unit: 'cmH2O', placeholder: 'e.g. 25', min: 0, max: 50, recommended: '≤30 cmH2O (ARDS)' },
  ],
  'Infusion Pump': [
    { key: 'rate', label: 'Infusion Rate', unit: 'mL/hr', placeholder: 'e.g. 100', min: 0.1, max: 2000, recommended: 'Verify concentration and rate match order' },
    { key: 'doseLimit', label: 'Dose Limit', unit: 'mg/hr', placeholder: 'e.g. 50', min: 0, max: 9999, recommended: 'Set maximum dose limit for high-alert medications' },
    { key: 'vtbi', label: 'Volume to Be Infused', unit: 'mL', placeholder: 'e.g. 500', min: 0, max: 5000, recommended: 'Verify volume matches prescription' },
    { key: 'drugConc', label: 'Drug Concentration', unit: 'mcg/mL', placeholder: 'e.g. 4', min: 0, max: 9999, recommended: 'Standard concentrations only; label pump' },
  ],
  PCA: [
    { key: 'demandDose', label: 'Demand Dose', unit: 'mg', placeholder: 'e.g. 1', min: 0.1, max: 10, recommended: 'Morphine: 1-2 mg; Fentanyl: 10-25 mcg' },
    { key: 'lockout', label: 'Lockout Interval', unit: 'min', placeholder: 'e.g. 10', min: 5, max: 60, recommended: 'Minimum 5-10 min (morphine), 6-10 min (fentanyl)' },
    { key: 'basalRate', label: 'Basal Rate', unit: 'mg/hr', placeholder: 'e.g. 0', min: 0, max: 10, recommended: 'Avoid in opioid-naive patients. Use 0-2 mg/hr if needed.' },
    { key: 'fourHourLimit', label: '4-Hour Limit', unit: 'mg', placeholder: 'e.g. 30', min: 0, max: 100, recommended: 'Prevents accidental overdose. Set based on patient factors.' },
  ],
  Defibrillator: [
    { key: 'energyBiphasic', label: 'Biphasic Energy', unit: 'J', placeholder: 'e.g. 200', min: 50, max: 360, recommended: '200J first shock (biphasic), escalate to 300J, 360J' },
    { key: 'energyMonophasic', label: 'Monophasic Energy', unit: 'J', placeholder: 'e.g. 360', min: 100, max: 360, recommended: '360J for all shocks (monophasic)' },
    { key: 'impedance', label: 'Impedance', unit: 'Ohms', placeholder: 'e.g. 75', min: 10, max: 200, recommended: '50-100 Ohms typical. Check pad contact if >150.' },
  ],
};

const DEVICE_RULES: Record<Device, (values: Record<string, string>) => ValidationResult[]> = {
  Ventilator: (v) => {
    const results: ValidationResult[] = [];
    const tv = parseFloat(v.tidalVolume);
    if (!isNaN(tv)) {
      if (tv > 8) results.push({ field: 'Tidal Volume', status: 'danger', message: `${tv} mL/kg exceeds ARDS protocol (6-8 mL/kg).`, recommendation: 'Reduce to 6 mL/kg IBW. High tidal volumes cause ventilator-induced lung injury (VILI).' });
      else if (tv > 6) results.push({ field: 'Tidal Volume', status: 'warning', message: `${tv} mL/kg is within range but at upper boundary for ARDS.`, recommendation: 'Consider reducing to 6 mL/kg IBW if ARDS suspected.' });
      else results.push({ field: 'Tidal Volume', status: 'ok', message: `${tv} mL/kg IBW is within ARDS-safe range.`, recommendation: 'Lung-protective ventilation. Target plateau pressure ≤ 30 cmH2O.' });
    }
    const pip = parseFloat(v.pip);
    if (!isNaN(pip) && pip > 30) results.push({ field: 'PIP', status: 'danger', message: `PIP ${pip} cmH2O exceeds safe limit.`, recommendation: 'Reduce tidal volume or PEEP. Target PIP ≤ 30 cmH2O.' });
    const fio2 = parseFloat(v.fiO2);
    if (!isNaN(fio2) && fio2 > 60) results.push({ field: 'FiO2', status: 'warning', message: `FiO2 ${fio2}% is high.`, recommendation: 'Titrate FiO2 down. Consider increasing PEEP to reduce FiO2 requirement.' });
    return results;
  },
  'Infusion Pump': (v) => {
    const results: ValidationResult[] = [];
    const rate = parseFloat(v.rate);
    if (!isNaN(rate) && rate > 999) results.push({ field: 'Rate', status: 'warning', message: `High infusion rate: ${rate} mL/hr.`, recommendation: 'Verify concentration and dose. Consider central line for rates > 200 mL/hr.' });
    const conc = parseFloat(v.drugConc);
    if (v.rate && !isNaN(conc) && !isNaN(rate)) {
      results.push({ field: 'Rate', status: 'ok', message: `Infusion set: ${rate} mL/hr at ${conc} mcg/mL.`, recommendation: 'Verify double-check for high-alert medications (insulin, heparin, vasopressors).' });
    }
    return results;
  },
  PCA: (v) => {
    const results: ValidationResult[] = [];
    const lockout = parseFloat(v.lockout);
    const basal = parseFloat(v.basalRate);
    if (!isNaN(lockout) && lockout < 5) results.push({ field: 'Lockout', status: 'danger', message: `Lockout ${lockout} min is too short.`, recommendation: 'Minimum 5-minute lockout to prevent respiratory depression.' });
    if (!isNaN(basal) && basal > 0) results.push({ field: 'Basal Rate', status: 'warning', message: `Basal rate ${basal} mg/hr set.`, recommendation: 'Avoid basal rates in opioid-naive patients. Continuous monitoring required.' });
    const limit = parseFloat(v.fourHourLimit);
    if (!isNaN(limit) && limit > 30) results.push({ field: '4-Hour Limit', status: 'warning', message: `4-hour limit ${limit} mg is high.`, recommendation: 'Consider lower limit. Ensure continuous pulse oximetry monitoring.' });
    if (results.length === 0) results.push({ field: 'PCA', status: 'ok', message: 'Settings appear appropriate.', recommendation: 'Ensure continuous monitoring, naloxone at bedside, and sedation scoring q1h.' });
    return results;
  },
  Defibrillator: (v) => {
    const results: ValidationResult[] = [];
    const energy = parseFloat(v.energyBiphasic);
    if (!isNaN(energy) && (energy < 120 || energy > 360)) results.push({ field: 'Energy', status: 'warning', message: `Biphasic energy ${energy}J is outside typical range.`, recommendation: 'Standard first shock: 200J biphasic. Escalate as needed.' });
    else if (!isNaN(energy)) results.push({ field: 'Energy', status: 'ok', message: `Biphasic ${energy}J — within standard range.`, recommendation: 'Escalate: 200J → 300J → 360J if needed.' });
    const impedance = parseFloat(v.impedance);
    if (!isNaN(impedance) && impedance > 150) results.push({ field: 'Impedance', status: 'warning', message: `High impedance: ${impedance} Ohms.`, recommendation: 'Check pad contact, apply firm pressure, ensure dry skin.' });
    return results;
  },
};

export function MedicalDeviceValidator() {
  const [device, setDevice] = useState<Device>('Ventilator');
  const [values, setValues] = useState<Record<string, string>>({});
  const [results, setResults] = useState<ValidationResult[]>([]);

  const fields = DEVICE_FIELDS[device];

  const update = (key: string, val: string) => setValues((p) => ({ ...p, [key]: val }));

  const validate = () => {
    const r = DEVICE_RULES[device](values);
    setResults(r);
  };

  return (
    <section className="space-y-6">
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardContent className="p-6">
          <div className="space-y-2 mb-4">
            <label className="text-sm text-slate-400">Device</label>
            <select
              value={device}
              onChange={(e) => { setDevice(e.target.value as Device); setValues({}); setResults([]); }}
              className="w-full h-9 rounded-md border border-slate-600 bg-slate-800/50 px-3 text-sm text-white"
            >
              {Object.keys(DEVICE_FIELDS).map((d) => (<option key={d} value={d}>{d}</option>))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1">
                <label className="text-xs text-slate-400">{f.label} ({f.unit})</label>
                <Input
                  type="number" step="any"
                  placeholder={f.placeholder}
                  value={values[f.key] || ''}
                  onChange={(e) => update(f.key, e.target.value)}
                  className="bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                />
                {f.recommended && <p className="text-[10px] text-slate-500">{f.recommended}</p>}
              </div>
            ))}
          </div>
          <button onClick={validate} className="mt-4 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            Validate Settings
          </button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <Card key={i} className={cn('border',
              r.status === 'ok' ? 'bg-emerald-500/10 border-emerald-500/30' :
              r.status === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
              'bg-rose-500/10 border-rose-500/30'
            )}>
              <CardContent className="p-4 flex items-start gap-3">
                {r.status === 'ok' ? <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> :
                 r.status === 'warning' ? <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> :
                 <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white">{r.field}</p>
                    <Badge variant="outline" className={cn('text-xs',
                      r.status === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                      r.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                      'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    )}>{r.status.toUpperCase()}</Badge>
                  </div>
                  <p className="text-sm text-slate-300">{r.message}</p>
                  <p className="text-xs text-cyan-400 mt-1">→ {r.recommendation}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
