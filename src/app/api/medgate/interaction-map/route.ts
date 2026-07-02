import { NextResponse } from 'next/server';
import { DRUG_INTERACTIONS } from '@/lib/medgate-constants';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { drugs = [] } = body;

    if (!Array.isArray(drugs) || drugs.length === 0) {
      return NextResponse.json(
        { error: 'drugs must be a non-empty array of drug names' },
        { status: 400 }
      );
    }

    const drugSet = new Set(drugs.map((d: string) => d.toLowerCase().trim()));
    const found = DRUG_INTERACTIONS.filter(
      (i) => drugSet.has(i.drugA.toLowerCase()) || drugSet.has(i.drugB.toLowerCase())
    );

    const nodes = new Set<string>();
    found.forEach((i) => { nodes.add(i.drugA); nodes.add(i.drugB); });

    return NextResponse.json({
      nodes: [...nodes],
      edges: found,
      total: found.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON with drugs array.' },
      { status: 400 }
    );
  }
}
