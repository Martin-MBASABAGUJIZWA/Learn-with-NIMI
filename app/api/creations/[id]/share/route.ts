// app/api/creations/[id]/share/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { creations } from '../../data';

export async function POST(request: NextRequest, context: any) {
  const { id } = context.params; // ✅ safe

  const creation = creations.find(c => c.id === id);

  if (!creation) {
    return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
  }

  // Example share logic: increment a share count
  if (!('shares' in creation)) {
    (creation as any).shares = 0;
  }
  (creation as any).shares += 1;

  return NextResponse.json({ success: true, updated: creation });
}

// Optional GET to check shares
export async function GET(request: NextRequest, context: any) {
  const { id } = context.params;

  const creation = creations.find(c => c.id === id);

  if (!creation) {
    return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
  }

  return NextResponse.json({ id, shares: (creation as any).shares || 0 });
}

