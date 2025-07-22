import { NextRequest, NextResponse } from 'next/server';

interface PikoPal {
  id: string;
  name: string;
  age: number;
  achievements: number;
  streak: number;
  avatar: string;
  title: string;
}

// Mock data - replace with your actual data source
const pikopals: PikoPal[] = [
  {
    id: '1',
    name: 'Emma',
    age: 3,
    achievements: 12,
    streak: 7,
    avatar: '👧',
    title: 'Creative Genius'
  },
  {
    id: '2',
    name: 'Liam',
    age: 4,
    achievements: 15,
    streak: 10,
    avatar: '👦',
    title: 'Master Builder'
  },
  {
    id: '3',
    name: 'Martin',
    age: 3,
    achievements: 8,
    streak: 5,
    avatar: '👧',
    title: 'Color Wizard'
  }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Age filters
  const ageMin = parseInt(searchParams.get('ageMin') || '2');
  const ageMax = parseInt(searchParams.get('ageMax') || '4');
  
  // Filter by age range (2-4 years old)
  const filteredPals = pikopals.filter(p => p.age >= ageMin && p.age <= ageMax);
  
  return NextResponse.json({ pikopals: filteredPals });
}