// app/api/creations/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  creationId: string;
  author: string;
  content: string;
  createdAt: string;
}

let comments: Comment[] = [];

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const creationComments = comments
    .filter(c => c.creationId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(creationComments);
}

export async function POST(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const { content } = await req.json();

  const newComment: Comment = {
    id: uuidv4(),
    creationId: id,
    author: 'User',
    content,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);

  return NextResponse.json(newComment, { status: 201 });
}
