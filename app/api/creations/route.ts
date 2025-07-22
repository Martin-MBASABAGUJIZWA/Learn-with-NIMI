// app/api/creations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { creations, Creation } from './data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  const mission = searchParams.get('mission');
  const sortBy = searchParams.get('sortBy');
  const isPublic = searchParams.get('isPublic');
  const ageMin = parseInt(searchParams.get('ageMin') || '2');
  const ageMax = parseInt(searchParams.get('ageMax') || '4');

  let filteredCreations = [...creations];
  if (mission) filteredCreations = filteredCreations.filter(c => c.mission === mission);
  if (isPublic) filteredCreations = filteredCreations.filter(c => c.isPublic === (isPublic === 'true'));
  filteredCreations = filteredCreations.filter(c => c.age >= ageMin && c.age <= ageMax);

  if (sortBy === 'likes') {
    filteredCreations.sort((a, b) => b.likes - a.likes);
  } else if (sortBy === 'recency') {
    filteredCreations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const paginatedCreations = filteredCreations.slice(offset, offset + limit);
  const totalPages = Math.ceil(filteredCreations.length / limit);

  return NextResponse.json({
    creations: paginatedCreations,
    totalPages,
    currentPage: page
  });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const creation: Creation = {
    id: uuidv4(),
    childName: formData.get('childName') as string,
    age: parseInt(formData.get('age') as string) || 3,
    creation: formData.get('description') as string,
    type: 'art',
    likes: 0,
    image: '/placeholder.svg',
    mission: formData.get('mission') as string || 'General Creativity',
    emoji: '🎨',
    isPublic: formData.get('isPublic') === 'true',
    createdAt: new Date().toISOString(),
    sharedWith: []
  };

  const imageFile = formData.get('image') as File;
  if (imageFile) {
    creation.image = `/uploads/${creation.id}.jpg`;
  }

  creations.unshift(creation);

  return NextResponse.json(creation, { status: 201 });
}
