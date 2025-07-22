import { NextRequest, NextResponse } from 'next/server';

// Mock database - in a real app, use a database
let creations: Creation[] = [];

interface Creation {
  id: string;
  sharedWith: string[];
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const { contacts } = await request.json();
  
  const creation = creations.find(c => c.id === id);
  if (!creation) {
    return NextResponse.json({ error: 'Creation not found' }, { status: 404 });
  }
  
  // Add new contacts, avoiding duplicates
  contacts.forEach((contact: string) => {
    if (!creation.sharedWith.includes(contact)) {
      creation.sharedWith.push(contact);
    }
  });
  
  return NextResponse.json(creation);
}