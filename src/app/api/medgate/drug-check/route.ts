import { NextRequest, NextResponse } from 'next/server';
import { DRUG_INTERACTIONS } from '@/lib/medgate-constants';

export async function POST(req: NextRequest) {
  try {
    const { drugs } = await req.json() as { drugs: string[] };
    const interactions = [];
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const a = drugs[i].toLowerCase(); const b = drugs[j].toLowerCase();
        for (const inter of DRUG_INTERACTIONS) {
          const aMatch = a.includes(inter.drugA) && b.includes(inter.drugB);
          const bMatch = a.includes(inter.drugB) && b.includes(inter.drugA);
          if (aMatch || bMatch) {
            interactions.push({ drugA: inter.drugA, drugB: inter.drugB, severity: inter.severity, mechanism: inter.mechanism, clinicalEffect: inter.clinicalEffect, management: inter.management });
          }
        }
      }
    }
    return NextResponse.json({ interactions, drugsChecked: drugs, pairsChecked: (drugs.length * (drugs.length - 1)) / 2 });
  } catch (error) { return NextResponse.json({ error: 'Drug check failed' }, { status: 500 }); }
}
