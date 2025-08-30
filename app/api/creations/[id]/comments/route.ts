// api/creation/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

interface Comment {
  id: string;
  creationId: string;
  author: string;
  content: string;
  createdAt: string;
}

// Persistent in-memory storage for dev session
if (!global.comments) {
  global.comments = [] as Comment[];
}
const comments: Comment[] = global.comments;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const creationComments = comments
    .filter(c => c.creationId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return NextResponse.json(creationComments);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { content } = await request.json();

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
