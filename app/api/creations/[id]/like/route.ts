// app/api/creations/[id]/like/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { creations } from '../../data';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const creation = creations.find(c => c.id === id);

  if (!creation) {
    return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
  }

  creation.likes += 1;

  return NextResponse.json({ success: true, updated: creation });
}
