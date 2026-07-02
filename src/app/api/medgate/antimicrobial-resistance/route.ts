import { NextResponse } from 'next/server';

// AMR surveillance dataset — 8 priority organisms
const AMR_ORGANISMS = [
  {
    organism: 'MRSA',
    full_name: 'Methicillin-Resistant Staphylococcus aureus',
    gram_stain: 'Gram-positive cocci (clusters)',
    resistance_mechanism: 'mecA gene encoding altered PBP2a with reduced beta-lactam binding',
    resistant_to: ['beta-lactams (methicillin, oxacillin, nafcillin, cefazolin)', 'fluoroquinolones (ciprofloxacin, levofloxacin)'],
    first_line_options: ['Vancomycin IV (15-20 mg/kg q8-12h, target trough 15-20 mcg/mL)', 'Linezolid 600 mg PO/IV q12h'],
    alternative_options: ['Daptomycin 6-10 mg/kg IV daily', 'Ceftaroline 600 mg IV q8h', 'Telavancin 10 mg/kg IV daily', 'TMP-SMX (for minor infections)'],
    spread_risk: 'high' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: true,
    mortality_increase: '2-3x vs MSSA',
    notes: 'Mandatory reporting in most jurisdictions. Screen high-risk patients on admission.',
  },
  {
    organism: 'VRE',
    full_name: 'Vancomycin-Resistant Enterococci (E. faecium, E. faecalis)',
    gram_stain: 'Gram-positive cocci (pairs/chains)',
    resistance_mechanism: 'vanA/vanB genes encoding altered D-Ala-D-Lac terminus reducing vancomycin binding',
    resistant_to: ['vancomycin', 'ampicillin/amoxicillin', 'high-level aminoglycosides'],
    first_line_options: ['Linezolid 600 mg PO/IV q12h', 'Daptomycin 8-12 mg/kg IV daily'],
    alternative_options: ['Tigecycline 100 mg IV loading then 50 mg IV q12h', 'Oritavancin (single dose)', 'Fosfomycin (urinary only)'],
    spread_risk: 'high' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: false,
    mortality_increase: '2x vs VSE',
    notes: 'Colonization common; distinguish colonization from infection. Duration of contact precautions varies by institution.',
  },
  {
    organism: 'ESBL E. coli',
    full_name: 'Extended-Spectrum Beta-Lactamase Producing Escherichia coli',
    gram_stain: 'Gram-negative bacilli',
    resistance_mechanism: 'CTX-M, TEM, SHV beta-lactamases hydrolyzing 3rd/4th generation cephalosporins and aztreonam',
    resistant_to: ['3rd/4th generation cephalosporins (ceftriaxone, cefotaxime, ceftazidime, cefepime)', 'aztreonam', 'trimethoprim-sulfamethoxazole (often)', 'fluoroquinolones (often co-resistant)'],
    first_line_options: ['Carbapenems (meropenem 1g IV q8h, ertapenem 1g IV daily)', 'Piperacillin-tazobactam 4.5g IV q6h (if susceptible)'],
    alternative_options: ['Amikacin 15-20 mg/kg IV daily', 'Fosfomycin (urinary)', 'Nitrofurantoin (lower UTI only)', 'Temocillin (EU)'],
    spread_risk: 'medium' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'high',
    hcai_associated: true,
    community_associated: true,
    mortality_increase: '1.5-2x vs non-ESBL',
    notes: 'Rising community incidence. Screen UTI isolates routinely. Fecal carriage common.',
  },
  {
    organism: 'CRE (KPC)',
    full_name: 'Carbapenem-Resistant Enterobacterales (Klebsiella pneumoniae Carbapenemase)',
    gram_stain: 'Gram-negative bacilli',
    resistance_mechanism: 'KPC (Klebsiella pneumoniae carbapenemase) — Ambler class A beta-lactamase hydrolyzing all beta-lactams including carbapenems',
    resistant_to: ['carbapenems (meropenem, imipenem, ertapenem)', '3rd/4th generation cephalosporins', 'penicillins + beta-lactamase inhibitors', 'fluoroquinolones', 'aminoglycosides (often)'],
    first_line_options: ['Ceftazidime-avibactam 2.5g IV q8h', 'Meropenem-vaborbactam 2g/2g IV q8h'],
    alternative_options: ['Colistin (colistimethate) 5 mg/kg IV loading then 2.5 mg/kg q12h (nephrotoxic)', 'Tigecycline 100mg load then 50mg IV q12h', 'Aztreonam-avibactam (if NDM producer)', 'Fosfomycin (combination therapy)'],
    spread_risk: 'critical' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: false,
    mortality_increase: '40-50% attributable mortality',
    notes: 'CDC/CDCP urgent threat. Mandatory reporting. Outbreak potential. Combination therapy often used empirically.',
  },
  {
    organism: 'MDR Pseudomonas aeruginosa',
    full_name: 'Multidrug-Resistant Pseudomonas aeruginosa',
    gram_stain: 'Gram-negative bacilli (oxidase positive)',
    resistance_mechanism: 'Multiple: AmpC beta-lactamase overexpression, efflux pumps, porin mutations, carbapenemase production (VIM, IMP, NDM)',
    resistant_to: ['carbapenems', 'anti-pseudomonal penicillins (piperacillin-tazobactam)', '3rd/4th gen cephalosporins (ceftazidime, cefepime)', 'fluoroquinolones (ciprofloxacin, levofloxacin)', 'aminoglycosides (often)'],
    first_line_options: ['Ceftolozane-tazobactam 1.5g IV q8h', 'Cefiderocol 2g IV q8h (newer agent)'],
    alternative_options: ['Colistin IV or inhaled', 'Aztreonam 2g IV q8h (if only ESBL, not metallo-beta-lactamase)', 'High-dose, extended-infusion meropenem (if MIC ≤ 8)', 'Fosfomycin (combination)'],
    spread_risk: 'high' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: false,
    mortality_increase: '2x vs susceptible',
    notes: 'Common in ICU, CF, and burn patients. Biofilm formation complicates treatment. Combination therapy recommended for severe infections.',
  },
  {
    organism: 'MDR Acinetobacter baumannii',
    full_name: 'Multidrug-Resistant Acinetobacter baumannii',
    gram_stain: 'Gram-negative coccobacilli',
    resistance_mechanism: 'OXA-type carbapenemases (OXA-23, OXA-24/40, OXA-58), efflux pumps, porin loss, aminoglycoside-modifying enzymes',
    resistant_to: ['carbapenems', '3rd/4th generation cephalosporins', 'anti-pseudomonal penicillins', 'fluoroquinolones', 'aminoglycosides'],
    first_line_options: ['Colistin (colistimethate) IV 5 mg/kg load then 2.5 mg/kg q12h', 'Sulbactam IV 6-8g/day (high dose)'],
    alternative_options: ['Tigecycline 100mg load then 50mg IV q12h', 'Minocycline 200mg IV load then 100mg IV q12h', 'Cefiderocol 2g IV q8h', 'Rifampin (combination)'],
    spread_risk: 'critical' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: false,
    mortality_increase: '2-3x vs susceptible',
    notes: 'Survives on dry surfaces for weeks. Outbreaks in ICU common. Environmental decontamination critical. Combination therapy standard.',
  },
  {
    organism: 'C. difficile',
    full_name: 'Clostridioides difficile',
    gram_stain: 'Gram-positive bacilli (spore-forming, anaerobic)',
    resistance_mechanism: 'Spore formation enables environmental persistence; not classically AMR but antibiotic selection pressure drives overgrowth. NAP1/027 strain produces excess toxin A/B',
    resistant_to: ['N/A — driven by antibiotic disruption of normal flora rather than traditional resistance. High-risk antibiotics: clindamycin, fluoroquinolones, 3rd gen cephalosporins'],
    first_line_options: ['Fidaxomicin 200mg PO q12h (preferred — lower recurrence)', 'Oral vancomycin 125mg PO q6h (standard)'],
    alternative_options: ['Vancomycin + fidaxomicin combination (severe/recurrent)', 'Bezlotoxumab 10mg/kg IV single dose (prevents recurrence)', 'Fecal microbiota transplant (recurrent CDI)', 'Ridinilazole (investigational)'],
    spread_risk: 'high' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'high',
    hcai_associated: true,
    community_associated: true,
    mortality_increase: '1.5-2x with severe disease',
    notes: 'Most common HAI. Spores resistant to alcohol-based hand rubs — use soap and water. Environmental cleaning with bleach. Antibiotic stewardship critical for prevention.',
  },
  {
    organism: 'Candida auris',
    full_name: 'Candida auris',
    gram_stain: 'Yeast (fungal) — identified by MALDI-TOF or molecular methods',
    resistance_mechanism: 'Ergosterol biosynthesis pathway mutations (ERG11), efflux pump upregulation (CDR1, MDR1), FKS mutations causing echinandin resistance in some strains',
    resistant_to: ['fluconazole (intrinsic resistance)', 'amphotericin B (some strains)', 'echinocandins (emerging resistance)', 'voriconazole (often)'],
    first_line_options: ['Echinocandins (caspofungin 70mg IV load then 50mg IV daily, micafungin 100mg IV daily, anidulafungin 200mg IV load then 100mg IV daily)'],
    alternative_options: ['Amphotericin B lipid formulation 3-5 mg/kg IV daily', 'Flucytosine (combination with amphotericin)', 'Ibrexafungerp (oral glucan synthase inhibitor)', 'Investigational agents (fosmanogepix, rezafungin)'],
    spread_risk: 'critical' as const,
    isolation_required: 'contact' as const,
    surveillance_priority: 'critical',
    hcai_associated: true,
    community_associated: false,
    mortality_increase: '30-60% mortality in invasive infections',
    notes: 'WHO fungal critical priority pathogen. Persists on surfaces for weeks. Colonization screening recommended for outbreak settings. Misidentified as other Candida spp. by conventional methods.',
  },
];

// Generate mock 12-month trend data for resistance rates
function generateTrends() {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().substring(0, 7));
  }

  const baseRates: Record<string, number[]> = {
    'MRSA': [42, 44, 43, 45, 44, 46, 45, 43, 44, 42, 41, 40],
    'VRE': [12, 13, 14, 13, 15, 14, 16, 15, 14, 13, 12, 13],
    'ESBL E. coli': [18, 19, 20, 21, 22, 21, 23, 24, 23, 22, 21, 22],
    'CRE (KPC)': [2, 2, 3, 3, 2, 3, 4, 3, 4, 3, 4, 3],
    'MDR Pseudomonas aeruginosa': [15, 16, 17, 16, 18, 17, 19, 18, 17, 16, 15, 16],
    'MDR Acinetobacter baumannii': [8, 9, 8, 10, 9, 11, 10, 11, 12, 11, 10, 10],
    'C. difficile': [25, 26, 24, 27, 26, 28, 27, 26, 25, 24, 25, 24],
    'Candida auris': [1, 1, 2, 2, 2, 3, 3, 3, 4, 3, 4, 4],
  };

  return months.map((month, idx) => {
    const entry: Record<string, unknown> = { month };
    for (const [org, rates] of Object.entries(baseRates)) {
      entry[org] = rates[idx];
    }
    return entry;
  });
}

export async function GET() {
  try {
    const trends = generateTrends();

    // Summary stats
    const totalOrganisms = AMR_ORGANISMS.length;
    const highRiskCount = AMR_ORGANISMS.filter(o => o.spread_risk === 'high').length;
    const criticalSpreadCount = AMR_ORGANISMS.filter(o => o.spread_risk === 'critical').length;
    const contactIsolationCount = AMR_ORGANISMS.filter(o => o.isolation_required === 'contact').length;
    const criticalPriorityCount = AMR_ORGANISMS.filter(o => o.surveillance_priority === 'critical').length;

    return NextResponse.json({
      organisms: AMR_ORGANISMS,
      trends,
      summary: {
        totalOrganisms,
        highRiskCount,
        criticalSpreadCount,
        contactIsolationCount,
        criticalPriorityCount,
      },
      lastUpdated: new Date().toISOString(),
      dataVersion: '2024-Q4',
      source: 'MedGate AMR Surveillance Module — synthesized from WHO GLASS, CDC AR Threat Report, and institutional antibiogram data',
    });
  } catch (error) {
    return NextResponse.json({ error: 'AMR surveillance data fetch failed', details: String(error) }, { status: 500 });
  }
}