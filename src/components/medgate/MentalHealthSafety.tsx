'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from './SectionHeader';
import { AnimatedCounter } from './AnimatedCounter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  Info,
  Activity,
  Zap,
  Heart,
  Shield,
  ShieldAlert,
  ShieldCheck,
  FileWarning,
  Phone,
  Users,
  Lock,
  Unlock,
  Eye,
  MessageCircle,
  BookOpen,
  ClipboardList,
  ListChecks,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

const PHQ9_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead or of hurting yourself in some way',
];

const GAD7_QUESTIONS = [
  'Feeling nervous, anxious, or on edge',
  'Not being able to stop or control worrying',
  'Worrying too much about different things',
  'Trouble relaxing',
  'Being so restless that it is hard to sit still',
  'Becoming easily annoyed or irritable',
  'Feeling afraid something awful might happen',
];

const RATING_OPTIONS = ['Not at all (0)', 'Several days (1)', 'More than half the days (2)', 'Nearly every day (3)'];

interface CSSRSItem {
  id: string;
  question: string;
  category: 'ideation' | 'behavior';
}

const CSSRS_ITEMS: CSSRSItem[] = [
  { id: 'wish_dead', question: 'Have you wished you were dead or wished you could go to sleep and not wake up?', category: 'ideation' },
  { id: 'nonspecific', question: 'Have you actually had any thoughts of killing yourself?', category: 'ideation' },
  { id: 'method', question: 'Have you been thinking about how you might do this?', category: 'ideation' },
  { id: 'intent', question: 'Have you had these thoughts and had some intention of acting on them?', category: 'ideation' },
  { id: 'plan', question: 'Have you started to work out or worked out the details of how to kill yourself? Do you intend to carry out this plan?', category: 'ideation' },
  { id: 'aborted', question: 'Have you ever done anything, started to do anything, or prepared to do anything to end your life?', category: 'behavior' },
  { id: 'interrupted', question: 'Was there any time in the past month when you started to do something to end your life but someone or something stopped you?', category: 'behavior' },
  { id: 'actual', question: 'Have you done anything to harm yourself?', category: 'behavior' },
  { id: 'self_injury', question: 'Have you done anything to yourself with at least some intent to harm yourself (without intending to kill yourself)?', category: 'behavior' },
];

const SAFETY_PLAN_SECTIONS = [
  { id: 'warning_signs', label: 'Warning Signs', icon: AlertTriangle, placeholder: 'What thoughts, feelings, or situations make you feel like you might be in danger?' },
  { id: 'coping', label: 'Internal Coping Strategies', icon: Brain, placeholder: 'What can I do on my own to take my mind off my problems? (activities, distractions)' },
  { id: 'social_distraction', label: 'Social Contacts for Distraction', icon: Users, placeholder: 'People or places that provide distraction (name, phone number)' },
  { id: 'help_contacts', label: 'People I Can Ask for Help', icon: Phone, placeholder: 'Family or friends I can reach out to in crisis (name, phone number)' },
  { id: 'safe_env', label: 'Making Environment Safe', icon: Shield, placeholder: 'Steps to make my environment safe (remove means, secure medications)' },
  { id: 'reasons', label: 'My Reasons for Living', icon: Heart, placeholder: 'What is most important to me? What are my reasons for living?' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getPHQ9Category(score: number): { label: string; color: string; bgColor: string } {
  if (score <= 4) return { label: 'None-Minimal', color: 'text-emerald-500', bgColor: 'bg-emerald-500/15' };
  if (score <= 9) return { label: 'Mild', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  if (score <= 14) return { label: 'Moderate', color: 'text-amber-500', bgColor: 'bg-amber-500/15' };
  if (score <= 19) return { label: 'Moderately Severe', color: 'text-rose-400', bgColor: 'bg-rose-500/10' };
  return { label: 'Severe', color: 'text-rose-500', bgColor: 'bg-rose-500/15' };
}

function getGAD7Category(score: number): { label: string; color: string; bgColor: string } {
  if (score <= 4) return { label: 'None-Minimal', color: 'text-emerald-500', bgColor: 'bg-emerald-500/15' };
  if (score <= 9) return { label: 'Mild', color: 'text-amber-400', bgColor: 'bg-amber-500/10' };
  if (score <= 14) return { label: 'Moderate', color: 'text-amber-500', bgColor: 'bg-amber-500/15' };
  return { label: 'Severe', color: 'text-rose-500', bgColor: 'bg-rose-500/15' };
}

function getCSRSSTriage(answers: Record<string, 'yes' | 'no' | 'NA'>): { level: string; color: string; bgColor: string; icon: typeof ShieldCheck; action: string } {
  const ideationYes = CSSRS_ITEMS.filter(i => i.category === 'ideation' && answers[i.id] === 'yes').length;
  const behaviorYes = CSSRS_ITEMS.filter(i => i.category === 'behavior' && answers[i.id] === 'yes').length;

  if (answers.plan === 'yes' || answers.intent === 'yes') {
    return { level: 'CRISIS', color: 'text-rose-500', bgColor: 'bg-rose-500/15', icon: ShieldAlert, action: 'IMMEDIATE 1:1 observation. Do NOT leave patient alone. Contact psychiatry STAT. Consider emergency hold.' };
  }
  if (ideationYes >= 3 || behaviorYes >= 1) {
    return { level: 'HIGH', color: 'text-rose-400', bgColor: 'bg-rose-500/10', icon: ShieldAlert, action: 'Urgent psychiatric evaluation within 1 hour. Continuous observation. Remove means.' };
  }
  if (ideationYes >= 1) {
    return { level: 'MEDIUM', color: 'text-amber-500', bgColor: 'bg-amber-500/15', icon: Shield, action: 'Psychiatric evaluation within 24 hours. Safety plan required. Increase observation frequency.' };
  }
  return { level: 'LOW', color: 'text-emerald-500', bgColor: 'bg-emerald-500/15', icon: ShieldCheck, action: 'Continue routine monitoring. Document negative screen. Provide crisis resources.' };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function MentalHealthSafety() {
  const [activeTab, setActiveTab] = useState('phq9');
  const [phq9, setPhq9] = useState<number[]>(new Array(9).fill(0));
  const [gad7, setGad7] = useState<number[]>(new Array(7).fill(0));
  const [cssrs, setCssrs] = useState<Record<string, 'yes' | 'no' | 'NA'>>({});
  const [safetyPlan, setSafetyPlan] = useState<Record<string, string>>({});
  const [showCSSRS, setShowCSSRS] = useState(false);
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [assessed, setAssessed] = useState(false);

  const phq9Total = useMemo(() => phq9.reduce((a, b) => a + b, 0), [phq9]);
  const gad7Total = useMemo(() => gad7.reduce((a, b) => a + b, 0), [gad7]);
  const phq9Cat = useMemo(() => getPHQ9Category(phq9Total), [phq9Total]);
  const gad7Cat = useMemo(() => getGAD7Category(gad7Total), [gad7Total]);
  const cssrsTriage = useMemo(() => getCSRSSTriage(cssrs), [cssrs]);

  // Show C-SSRS if PHQ-9 Q9 >= 1
  const q9Triggered = phq9[8] >= 1;
  if (q9Triggered && !showCSSRS) setShowCSSRS(true);
  if (cssrsTriage.level !== 'LOW' && !showSafetyPlan) setShowSafetyPlan(true);

  // Gate decision
  const isBlocked = cssrsTriage.level === 'CRISIS' && !Object.values(safetyPlan).some(v => v.trim().length > 0);
  const safetyPlanComplete = SAFETY_PLAN_SECTIONS.some(s => safetyPlan[s.id]?.trim().length > 0);

  const setCssrsAnswer = (id: string, answer: 'yes' | 'no' | 'NA') => {
    setCssrs(prev => ({ ...prev, [id]: answer }));
  };

  const assessPHQ9 = () => {
    setAssessed(true);
    if (q9Triggered) {
      setActiveTab('cssrs');
      toast.warning('PHQ-9 Question 9 positive — Columbia Scale required');
    } else {
      toast.success('PHQ-9 assessment complete');
    }
  };

  const assessGAD7 = () => {
    setAssessed(true);
    toast.success('GAD-7 assessment complete');
  };

  const assessCSSRS = () => {
    setAssessed(true);
    if (cssrsTriage.level === 'CRISIS' || cssrsTriage.level === 'HIGH') {
      setShowSafetyPlan(true);
      toast.error(`${cssrsTriage.level} risk — Safety plan required immediately`);
    } else {
      toast.success('Columbia assessment complete');
    }
  };

  const gateColor = isBlocked ? 'border-rose-500/50 bg-rose-500/10' : safetyPlanComplete ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5';

  return (
    <section className="space-y-6">
      <SectionHeader
        icon={Brain}
        title="Mental Health Safety Assessment"
        subtitle="PHQ-9, GAD-7 & Columbia Suicide Severity Rating — Every Screen Counts"
        badge="Critical Safety"
        badgeColor="bg-rose-500/15 text-rose-400 border-rose-500/30"
      />

      {/* Gate Status Banner */}
      <motion.div
        animate={isBlocked ? { borderColor: ['rgba(244,63,94,0.3)', 'rgba(244,63,94,0.7)', 'rgba(244,63,94,0.3)'] } : {}}
        transition={isBlocked ? { duration: 1.5, repeat: Infinity } : {}}
        className={cn('glass-card rounded-xl p-4 border-2 flex items-center justify-between flex-wrap gap-2', gateColor)}
      >
        <div className="flex items-center gap-3">
          {isBlocked ? (
            <>
              <Lock className="w-5 h-5 text-rose-500" />
              <div>
                <p className="text-sm font-bold text-rose-400">GATE: BLOCKED</p>
                <p className="text-xs text-rose-300/70">Crisis risk identified — Safety plan documentation required before proceeding</p>
              </div>
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-bold text-emerald-400">GATE: {safetyPlanComplete ? 'ALLOW' : 'NEEDS_REVIEW'}</p>
                <p className="text-xs text-muted-foreground">
                  {safetyPlanComplete ? 'Safety plan documented — may proceed' : 'Complete safety plan for positive screens'}
                </p>
              </div>
            </>
          )}
        </div>
        <Badge variant="outline" className={cn('text-xs',
          isBlocked ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
          safetyPlanComplete ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
          'bg-amber-500/20 text-amber-400 border-amber-500/30'
        )}>
          {isBlocked ? '⛔ BLOCKED' : safetyPlanComplete ? '✓ ALLOWED' : '⚠ REVIEW'}
        </Badge>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card flex-wrap">
          <TabsTrigger value="phq9" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ListChecks className="w-4 h-4 mr-1" /> PHQ-9
          </TabsTrigger>
          <TabsTrigger value="gad7" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Activity className="w-4 h-4 mr-1" /> GAD-7
          </TabsTrigger>
          <TabsTrigger value="cssrs" className={cn(
            'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400',
            showCSSRS && !Object.keys(cssrs).length && 'animate-pulse'
          )}>
            <ShieldAlert className="w-4 h-4 mr-1" /> C-SSRS {showCSSRS && <Badge className="ml-1 bg-rose-500 text-white text-[9px] h-4 px-1.5">REQUIRED</Badge>}
          </TabsTrigger>
          <TabsTrigger value="safety" className={cn(
            'data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400',
            showSafetyPlan && !safetyPlanComplete && 'animate-pulse'
          )}>
            <Shield className="w-4 h-4 mr-1" /> Safety Plan {showSafetyPlan && <Badge className="ml-1 bg-amber-500 text-white text-[9px] h-4 px-1.5">NEEDED</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* PHQ-9 Tab */}
        <TabsContent value="phq9" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Patient Health Questionnaire-9
                  <span className="text-xs text-muted-foreground font-normal">(Over the last 2 weeks)</span>
                </h3>
                <div className="space-y-4">
                  {PHQ9_QUESTIONS.map((q, qi) => (
                    <motion.div
                      key={qi}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: qi * 0.03 }}
                      className={cn(
                        'glass-card rounded-lg p-4 transition-all',
                        qi === 8 && phq9[8] >= 1 && 'border-rose-500/50 bg-rose-500/5'
                      )}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className={cn(
                          'text-xs font-bold mt-0.5',
                          qi === 8 ? 'text-rose-400' : 'text-muted-foreground'
                        )}>{qi + 1}.</span>
                        <p className={cn('text-sm', qi === 8 && 'text-rose-300 font-semibold')}>{q}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                        {RATING_OPTIONS.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setPhq9(prev => prev.map((v, i) => i === qi ? oi : v))}
                            className={cn(
                              'text-[10px] px-2 py-1.5 rounded-md border text-center transition-all',
                              phq9[qi] === oi
                                ? oi === 0 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                  : oi === 1 ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                                  : oi === 2 ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                  : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={assessPHQ9}>
                  <ClipboardList className="w-4 h-4 mr-2" /> Score PHQ-9
                </Button>
              </div>

              {/* PHQ-9 Results */}
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">PHQ-9 Total</p>
                  <span className={cn('text-4xl font-bold', phq9Cat.color)}>
                    <AnimatedCounter target={phq9Total} />
                  </span>
                  <span className="text-sm text-muted-foreground">/ 27</span>
                  <Badge variant="outline" className={cn('mt-2', phq9Cat.bgColor, phq9Cat.color, 'border-current/20')}>
                    {phq9Cat.label}
                  </Badge>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Score Categories</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { range: '0–4', label: 'None-Minimal', color: 'text-emerald-500' },
                      { range: '5–9', label: 'Mild', color: 'text-amber-400' },
                      { range: '10–14', label: 'Moderate', color: 'text-amber-500' },
                      { range: '15–19', label: 'Moderately Severe', color: 'text-rose-400' },
                      { range: '20–27', label: 'Severe', color: 'text-rose-500' },
                    ].map(c => (
                      <div key={c.label} className="flex justify-between">
                        <span className={c.color}>{c.label}</span>
                        <span className="text-muted-foreground">{c.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {phq9[8] >= 1 && (
                  <Alert className="border-rose-500/30 bg-rose-500/5 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <AlertTitle className="text-rose-400 text-sm">Suicidal Ideation Detected</AlertTitle>
                    <AlertDescription className="text-rose-300/80 text-xs">
                      PHQ-9 Question 9 score ≥1. Columbia Suicide Severity Rating Scale (C-SSRS) assessment is REQUIRED.
                    </AlertDescription>
                  </Alert>
                )}

                {assessed && phq9Total >= 15 && (
                  <Alert className="border-rose-500/30 bg-rose-500/5">
                    <FileWarning className="w-4 h-4 text-rose-500" />
                    <AlertTitle className="text-rose-400 text-sm">Severe Depression</AlertTitle>
                    <AlertDescription className="text-rose-300/80 text-xs">
                      Score ≥15 warrants urgent psychiatric evaluation. Consider pharmacotherapy + psychotherapy. Assess safety.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* GAD-7 Tab */}
        <TabsContent value="gad7" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Generalized Anxiety Disorder-7
                  <span className="text-xs text-muted-foreground font-normal">(Over the last 2 weeks)</span>
                </h3>
                <div className="space-y-4">
                  {GAD7_QUESTIONS.map((q, qi) => (
                    <motion.div key={qi} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.03 }} className="glass-card rounded-lg p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs font-bold text-muted-foreground mt-0.5">{qi + 1}.</span>
                        <p className="text-sm">{q}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-6">
                        {RATING_OPTIONS.map((opt, oi) => (
                          <button
                            key={oi}
                            onClick={() => setGad7(prev => prev.map((v, i) => i === qi ? oi : v))}
                            className={cn(
                              'text-[10px] px-2 py-1.5 rounded-md border text-center transition-all',
                              gad7[qi] === oi
                                ? oi === 0 ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                  : oi === 1 ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
                                  : oi === 2 ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                                  : 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={assessGAD7}>
                  <ClipboardList className="w-4 h-4 mr-2" /> Score GAD-7
                </Button>
              </div>

              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">GAD-7 Total</p>
                  <span className={cn('text-4xl font-bold', gad7Cat.color)}>
                    <AnimatedCounter target={gad7Total} />
                  </span>
                  <span className="text-sm text-muted-foreground">/ 21</span>
                  <Badge variant="outline" className={cn('mt-2', gad7Cat.bgColor, gad7Cat.color, 'border-current/20')}>
                    {gad7Cat.label}
                  </Badge>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">Score Categories</h4>
                  <div className="space-y-2 text-xs">
                    {[
                      { range: '0–4', label: 'None-Minimal', color: 'text-emerald-500' },
                      { range: '5–9', label: 'Mild', color: 'text-amber-400' },
                      { range: '10–14', label: 'Moderate', color: 'text-amber-500' },
                      { range: '15–21', label: 'Severe', color: 'text-rose-500' },
                    ].map(c => (
                      <div key={c.label} className="flex justify-between">
                        <span className={c.color}>{c.label}</span>
                        <span className="text-muted-foreground">{c.range}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {gad7Total >= 15 && (
                  <Alert className="border-rose-500/30 bg-rose-500/5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <AlertTitle className="text-rose-400 text-sm">Severe Anxiety</AlertTitle>
                    <AlertDescription className="text-rose-300/80 text-xs">
                      GAD-7 ≥15 indicates severe anxiety. Consider SSRI/SNRI, CBT, and psychiatric referral.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* C-SSRS Tab */}
        <TabsContent value="cssrs" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Columbia Suicide Severity Rating Scale
                </h3>

                {/* Ideation Section */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Suicidal Ideation
                  </h4>
                  <div className="space-y-3">
                    {CSSRS_ITEMS.filter(i => i.category === 'ideation').map((item, idx) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'glass-card rounded-lg p-4 transition-all',
                          cssrs[item.id] === 'yes' && 'border-rose-500/40 bg-rose-500/5'
                        )}
                      >
                        <p className="text-sm mb-2">{item.question}</p>
                        <div className="flex gap-2">
                          {(['yes', 'no', 'NA'] as const).map(ans => (
                            <button
                              key={ans}
                              onClick={() => setCssrsAnswer(item.id, ans)}
                              className={cn(
                                'text-xs px-4 py-1.5 rounded-md border transition-all',
                                cssrs[item.id] === ans
                                  ? ans === 'yes' ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                    : ans === 'no' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                    : 'border-muted-foreground/50 bg-muted/10 text-muted-foreground'
                                  : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                              )}
                            >
                              {ans.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Behavior Section */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Suicidal Behavior
                  </h4>
                  <div className="space-y-3">
                    {CSSRS_ITEMS.filter(i => i.category === 'behavior').map((item, idx) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                        className={cn(
                          'glass-card rounded-lg p-4 transition-all',
                          cssrs[item.id] === 'yes' && 'border-rose-500/40 bg-rose-500/5'
                        )}
                      >
                        <p className="text-sm mb-2">{item.question}</p>
                        <div className="flex gap-2">
                          {(['yes', 'no', 'NA'] as const).map(ans => (
                            <button
                              key={ans}
                              onClick={() => setCssrsAnswer(item.id, ans)}
                              className={cn(
                                'text-xs px-4 py-1.5 rounded-md border transition-all',
                                cssrs[item.id] === ans
                                  ? ans === 'yes' ? 'border-rose-500/50 bg-rose-500/10 text-rose-300'
                                    : ans === 'no' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                                    : 'border-muted-foreground/50 bg-muted/10 text-muted-foreground'
                                  : 'border-muted-foreground/10 text-muted-foreground hover:border-muted-foreground/30'
                              )}
                            >
                              {ans.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={assessCSSRS}>
                  <ClipboardList className="w-4 h-4 mr-2" /> Assess Risk
                </Button>
              </div>

              {/* Triage Results */}
              <div className="space-y-4">
                <div className="glass-card rounded-xl p-6 flex flex-col items-center">
                  <p className="text-xs text-muted-foreground mb-2">Risk Triage</p>
                  <cssrsTriage.icon className={cn('w-8 h-8 mb-2', cssrsTriage.color)} />
                  <Badge variant="outline" className={cn('text-lg', cssrsTriage.bgColor, cssrsTriage.color, 'border-current/20')}>
                    {cssrsTriage.level}
                  </Badge>
                </div>

                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">Required Actions</h4>
                  <p className={cn('text-sm', cssrsTriage.color)}>{cssrsTriage.action}</p>
                </div>

                {/* Crisis Resources */}
                <div className="glass-card rounded-xl p-6">
                  <h4 className="text-xs font-semibold text-rose-400 mb-3 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Crisis Resources
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between"><span className="text-foreground font-semibold">988 Suicide & Crisis Lifeline</span><span className="text-primary">988</span></div>
                    <div className="flex justify-between"><span className="text-foreground font-semibold">Crisis Text Line</span><span className="text-primary">Text HOME to 741741</span></div>
                    <div className="flex justify-between"><span className="text-foreground font-semibold">Emergency</span><span className="text-rose-400">911</span></div>
                  </div>
                </div>

                {Object.keys(cssrs).length > 0 && cssrsTriage.level !== 'LOW' && (
                  <Button
                    variant="outline"
                    className="w-full border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => { setActiveTab('safety'); setShowSafetyPlan(true); }}
                  >
                    <Shield className="w-4 h-4 mr-2" /> Complete Safety Plan
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Safety Plan Tab */}
        <TabsContent value="safety" className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Safety Plan
                </h3>
                <Badge variant="outline" className={cn('text-xs',
                  safetyPlanComplete ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                )}>
                  {safetyPlanComplete ? '✓ Partially Documented' : '⚠ Not Started'}
                </Badge>
              </div>

              <div className="space-y-6">
                {SAFETY_PLAN_SECTIONS.map((section, si) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: si * 0.05 }}
                    className="glass-card rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <section.icon className={cn('w-4 h-4', safetyPlan[section.id] ? 'text-emerald-400' : 'text-muted-foreground')} />
                      <Label className="text-sm font-semibold">{section.label}</Label>
                      {safetyPlan[section.id] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <Textarea
                      placeholder={section.placeholder}
                      value={safetyPlan[section.id] || ''}
                      onChange={(e) => setSafetyPlan(prev => ({ ...prev, [section.id]: e.target.value }))}
                      className="text-sm min-h-[60px]"
                    />
                  </motion.div>
                ))}
              </div>

              <Button className="w-full bg-cyan-600 hover:bg-cyan-500" onClick={() => {
                if (!safetyPlanComplete) {
                  toast.error('Complete at least one safety plan section');
                  return;
                }
                toast.success('Safety plan saved');
              }}>
                <Shield className="w-4 h-4 mr-2" /> Save Safety Plan
              </Button>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </section>
  );
}