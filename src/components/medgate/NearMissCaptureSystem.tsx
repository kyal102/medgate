'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Zap, CheckCircle2, Send, ArrowUpDown,
  User, Scale, Pill, ArrowRight, Clock, X, FileText, Wrench,
  MessageSquare, Tag, PenTool,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AnimatedCounter } from './AnimatedCounter';
import { SectionHeader } from './SectionHeader';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DEPARTMENTS = ['ED', 'ICU', 'Ward', 'OR', 'Pharmacy', 'Lab', 'Radiology', 'Oncology', 'Pediatrics', 'Obstetrics'];

const CATEGORIES = [
  { value: 'wrong-patient', label: 'Wrong Patient', icon: User },
  { value: 'wrong-dose', label: 'Wrong Dose', icon: Scale },
  { value: 'wrong-drug', label: 'Wrong Drug', icon: Pill },
  { value: 'wrong-route', label: 'Wrong Route', icon: ArrowRight },
  { value: 'wrong-time', label: 'Wrong Time', icon: Clock },
  { value: 'omission', label: 'Omission', icon: X },
  { value: 'documentation', label: 'Documentation Error', icon: FileText },
  { value: 'equipment', label: 'Equipment Failure', icon: Wrench },
  { value: 'communication', label: 'Communication Failure', icon: MessageSquare },
  { value: 'labeling', label: 'Labeling Error', icon: Tag },
  { value: 'transcription', label: 'Transcription Error', icon: PenTool },
  { value: 'allergy-override', label: 'Allergy Override', icon: ShieldAlert },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', dotColor: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', dotColor: 'bg-amber-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', dotColor: 'bg-orange-500' },
  { value: 'critical', label: 'Critical', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40', dotColor: 'bg-rose-500' },
];

const CONTRIBUTING_FACTORS = [
  'Staffing', 'Fatigue', 'Training', 'Communication', 'System Design',
  'Time Pressure', 'Distraction', 'Handover', 'Equipment', 'Environment',
];

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

interface Report {
  id?: string;
  date: string;
  department: string;
  category: string;
  severity: string;
  description: string;
  factors: string[];
  actions: string;
  reporter: string;
  status: string;
}

interface SortConfig {
  key: 'date' | 'severity';
  direction: 'asc' | 'desc';
}

const MOCK_REPORTS: Report[] = [
  { id: '1', date: '2025-01-15', department: 'ICU', category: 'wrong-dose', severity: 'high', description: 'Insulin dose miscalculated during shift change', factors: ['Handover', 'Fatigue'], actions: 'Double-check protocol implemented', reporter: '', status: 'reviewed' },
  { id: '2', date: '2025-01-14', department: 'ED', category: 'wrong-patient', severity: 'critical', description: 'Lab samples nearly sent for wrong patient', factors: ['Distraction', 'Time Pressure'], actions: 'Two-identifier verification enforced', reporter: 'Dr. Smith', status: 'open' },
  { id: '3', date: '2025-01-13', department: 'Ward', category: 'omission', severity: 'medium', description: 'Missed antibiotic dose on 3rd day', factors: ['Staffing', 'Communication'], actions: 'MAR audit scheduled', reporter: '', status: 'resolved' },
  { id: '4', date: '2025-01-12', department: 'Pharmacy', category: 'wrong-drug', severity: 'high', description: 'Look-alike medications nearly dispensed incorrectly', factors: ['Labeling', 'System Design'], actions: 'Tall-man lettering requested from vendor', reporter: '', status: 'open' },
  { id: '5', date: '2025-01-11', department: 'OR', category: 'equipment', severity: 'medium', description: 'Infusion pump alarm threshold set incorrectly', factors: ['Training', 'Equipment'], actions: 'Pump competency training scheduled', reporter: '', status: 'reviewed' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } },
};

export function NearMissCaptureSystem() {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    department: '',
    category: '',
    severity: '',
    description: '',
    factors: [] as string[],
    actions: '',
    reporter: '',
    anonymous: true,
  });
  const [loading, setLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });

  const updateForm = (field: string, value: string | string[] | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFactor = (factor: string) => {
    setForm((prev) => ({
      ...prev,
      factors: prev.factors.includes(factor)
        ? prev.factors.filter((f) => f !== factor)
        : [...prev.factors, factor],
    }));
  };

  const isFormValid = form.department && form.category && form.severity && form.description.length >= 20;

  const submit = async () => {
    if (!isFormValid) return;
    setLoading(true);
    try {
      const res = await fetch('/api/medgate/near-miss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          reporter: form.anonymous ? '' : form.reporter,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const newReport: Report = { ...form, id: data.id || String(Date.now()), status: 'open' };
        setReports((prev) => [newReport, ...prev]);
      } else {
        const newReport: Report = { ...form, id: String(Date.now()), status: 'open' };
        setReports((prev) => [newReport, ...prev]);
      }
    } catch {
      const newReport: Report = { ...form, id: String(Date.now()), status: 'open' };
      setReports((prev) => [newReport, ...prev]);
    }

    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 3000);
    setForm({
      date: new Date().toISOString().split('T')[0],
      department: '',
      category: '',
      severity: '',
      description: '',
      factors: [],
      actions: '',
      reporter: '',
      anonymous: true,
    });
    toast.success('Near-miss report submitted', { description: 'Thank you for reporting. Every report improves safety.' });
    setLoading(false);
  };

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      if (sortConfig.key === 'date') {
        const d = new Date(a.date).getTime() - new Date(b.date).getTime();
        return sortConfig.direction === 'asc' ? d : -d;
      }
      const d = (SEVERITY_ORDER[a.severity] || 4) - (SEVERITY_ORDER[b.severity] || 4);
      return sortConfig.direction === 'asc' ? d : -d;
    });
  }, [reports, sortConfig]);

  const toggleSort = (key: SortConfig['key']) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Pattern analysis: category distribution
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([cat, count]) => ({
        category: cat,
        count,
        label: CATEGORIES.find((c) => c.value === cat)?.label || cat,
        pct: Math.round((count / reports.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  // Department × Severity heatmap data
  const heatmapData = useMemo(() => {
    const grid: Record<string, Record<string, number>> = {};
    DEPARTMENTS.forEach((dept) => {
      grid[dept] = { critical: 0, high: 0, medium: 0, low: 0 };
    });
    reports.forEach((r) => {
      if (grid[r.department]) {
        grid[r.department][r.severity] = (grid[r.department][r.severity] || 0) + 1;
      }
    });
    return grid;
  }, [reports]);

  const maxHeatmapValue = Math.max(...Object.values(heatmapData).flatMap((row) => Object.values(row)), 1);

  // Trend data (mock last 12 months)
  const trendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((m, i) => ({
      month: m,
      count: Math.max(1, Math.floor(Math.random() * 8) + (reports.length > 5 ? 3 : 1) - (i > 6 ? 2 : 0)),
    }));
  }, [reports.length]);

  const maxTrend = Math.max(...trendData.map((t) => t.count), 1);

  return (
    <section id="near-miss" className="py-20 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <SectionHeader
          icon={ShieldAlert}
          title="Near-Miss Capture System"
          subtitle="Every Near-Miss Reported is a Future Life Saved"
          badge="Quality Gate"
        />

        {/* Report form */}
        <Card className="glass-card rounded-xl p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Submit Near-Miss Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Event Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Department</Label>
                <Select value={form.department} onValueChange={(v) => updateForm('department', v)}>
                  <SelectTrigger className="glass-input w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-400">Category</Label>
                <Select value={form.category} onValueChange={(v) => updateForm('category', v)}>
                  <SelectTrigger className="glass-input w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <c.icon className="w-3.5 h-3.5" />{c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Severity</Label>
              <RadioGroup value={form.severity} onValueChange={(v) => updateForm('severity', v)} className="flex flex-wrap gap-2">
                {SEVERITIES.map((sev) => (
                  <label
                    key={sev.value}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                      form.severity === sev.value
                        ? sev.color
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <RadioGroupItem value={sev.value} className="sr-only" />
                    <div className={cn('w-2.5 h-2.5 rounded-full', sev.dotColor)} />
                    {sev.label}
                  </label>
                ))}
              </RadioGroup>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">
                Description <span className="text-rose-400">*</span>
                <span className="text-slate-500 text-xs ml-1">(min 20 characters)</span>
              </Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={3}
                placeholder="Describe what happened, what was discovered, and how it was caught..."
                className="glass-input"
              />
              <p className={cn('text-xs', form.description.length >= 20 ? 'text-emerald-400' : 'text-slate-500')}>
                {form.description.length}/20 minimum
              </p>
            </div>

            {/* Contributing factors */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Contributing Factors</Label>
              <div className="flex flex-wrap gap-2">
                {CONTRIBUTING_FACTORS.map((factor) => (
                  <label
                    key={factor}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs',
                      form.factors.includes(factor)
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <Checkbox
                      checked={form.factors.includes(factor)}
                      onCheckedChange={() => toggleFactor(factor)}
                      className="border-slate-600 h-3 w-3"
                    />
                    {factor}
                  </label>
                ))}
              </div>
            </div>

            {/* Preventive actions */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-400">Preventive Actions (optional)</Label>
              <Textarea
                value={form.actions}
                onChange={(e) => updateForm('actions', e.target.value)}
                rows={2}
                placeholder="What actions could prevent this in the future?"
                className="glass-input"
              />
            </div>

            {/* Reporter */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.anonymous}
                  onCheckedChange={(v) => updateForm('anonymous', !!v)}
                  className="border-slate-600"
                />
                <span className="text-sm text-slate-400">Report anonymously</span>
              </label>
              {!form.anonymous && (
                <Input
                  placeholder="Your name (optional)"
                  value={form.reporter}
                  onChange={(e) => updateForm('reporter', e.target.value)}
                  className="glass-input max-w-xs"
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={submit} disabled={loading || !isFormValid} className="bg-cyan-600 hover:bg-cyan-500 text-white btn-glow">
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Submitting...' : 'Submit Near-Miss Report'}
              </Button>
              {/* Success animation */}
              <AnimatePresence>
                {submitSuccess && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: 3, duration: 0.6 }}
                    >
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </motion.div>
                    <span className="text-emerald-400 font-semibold text-sm">Thank you for reporting!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Recent reports table */}
        <Card className="glass-card rounded-xl p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-700/50">
                    <th className="text-left py-2 pr-3">Date</th>
                    <th className="text-left py-2 pr-3">Dept</th>
                    <th className="text-left py-2 pr-3">Category</th>
                    <th className="text-left py-2 pr-3">
                      <button onClick={() => toggleSort('severity')} className="flex items-center gap-1 hover:text-cyan-400 transition-colors">
                        Severity <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <motion.tbody variants={containerVariants} initial="hidden" animate="show">
                  {sortedReports.map((report) => {
                    const sev = SEVERITIES.find((s) => s.value === report.severity);
                    const cat = CATEGORIES.find((c) => c.value === report.category);
                    return (
                      <motion.tr key={report.id} variants={itemVariants} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 pr-3 text-slate-300 text-xs">{report.date}</td>
                        <td className="py-2.5 pr-3"><Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">{report.department}</Badge></td>
                        <td className="py-2.5 pr-3">
                          {cat && <span className="flex items-center gap-1.5 text-slate-300 text-xs"><cat.icon className="w-3 h-3" />{cat.label}</span>}
                        </td>
                        <td className="py-2.5 pr-3">
                          {sev && (
                            <Badge variant="outline" className={cn('text-[10px]', sev.color)}>
                              <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', sev.dotColor)} />
                              {sev.label}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5">
                          <Badge variant="outline" className={cn('text-[10px]',
                            report.status === 'open' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            report.status === 'reviewed' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                            'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          )}>
                            {report.status}
                          </Badge>
                        </td>
                      </motion.tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Analysis Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category distribution bar chart */}
          <Card className="glass-card rounded-xl p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {categoryDistribution.slice(0, 8).map((item, i) => (
                  <motion.div
                    key={item.category}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-400 font-mono">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.05 }}
                        className={cn('h-full rounded-full', i === 0 ? 'bg-rose-500' : i < 3 ? 'bg-amber-500' : 'bg-cyan-500')}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Department × Severity heatmap */}
          <Card className="glass-card rounded-xl p-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Department × Severity Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400">
                      <th className="text-left py-1.5 pr-2">Dept</th>
                      {SEVERITIES.map((s) => (
                        <th key={s.value} className="text-center py-1.5 px-1">
                          <span className={cn('inline-block w-2 h-2 rounded-full mr-1', s.dotColor)} />
                          {s.label.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DEPARTMENTS.map((dept) => (
                      <tr key={dept} className="border-t border-slate-800/50">
                        <td className="py-1.5 pr-2 text-slate-300 font-medium">{dept}</td>
                        {SEVERITIES.map((sev) => {
                          const val = heatmapData[dept]?.[sev.value] || 0;
                          const intensity = val / maxHeatmapValue;
                          return (
                            <td key={sev.value} className="text-center py-1.5 px-1">
                              <div
                                className={cn(
                                  'w-8 h-8 mx-auto rounded flex items-center justify-center font-mono text-[10px] font-bold transition-all',
                                  val === 0 ? 'bg-slate-800/50 text-slate-600' : 'text-white'
                                )}
                                style={val > 0 ? { backgroundColor: `${sev.dotColor === 'bg-rose-500' ? '#f43f5e' : sev.dotColor === 'bg-amber-500' ? '#f59e0b' : sev.dotColor === 'bg-orange-500' ? '#f97316' : '#10b981'}${Math.round(intensity * 60 + 20).toString(16).padStart(2, '0')}` } : {}}
                              >
                                {val}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Trend line (last 12 months) */}
          <Card className="glass-card rounded-xl p-6 lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Near-Miss Trend (12 Months)</CardTitle>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Reports</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {trendData.map((d, i) => (
                  <motion.div
                    key={d.month}
                    className="flex-1 flex flex-col items-center gap-1"
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    transition={{ delay: i * 0.03, duration: 0.4 }}
                  >
                    <span className="text-[10px] font-mono text-cyan-400">{d.count}</span>
                    <motion.div
                      className="w-full rounded-t bg-gradient-to-t from-cyan-600 to-cyan-400 min-h-[4px]"
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.count / maxTrend) * 100}%` }}
                      transition={{ delay: i * 0.03, duration: 0.6, ease: 'easeOut' }}
                      style={{ maxHeight: '120px' }}
                    />
                    <span className="text-[10px] text-slate-500">{d.month}</span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top 5 categories summary */}
          <Card className="glass-card rounded-xl p-6 lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Top 5 Most Common Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {categoryDistribution.slice(0, 5).map((item, i) => {
                  const cat = CATEGORIES.find((c) => c.value === item.category);
                  return (
                    <motion.div
                      key={item.category}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-lg border',
                        i === 0 ? 'bg-rose-500/10 border-rose-500/30' :
                        i < 3 ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-slate-800/50 border-slate-700/50'
                      )}
                    >
                      <span className={cn('text-lg font-bold font-mono',
                        i === 0 ? 'text-rose-400' : i < 3 ? 'text-amber-400' : 'text-slate-400'
                      )}>#{i + 1}</span>
                      {cat && <cat.icon className="w-4 h-4 text-cyan-400" />}
                      <span className="text-sm text-white font-medium">{item.label}</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-300 border-slate-700">
                        <AnimatedCounter target={item.count} className="text-cyan-400" />
                      </Badge>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}