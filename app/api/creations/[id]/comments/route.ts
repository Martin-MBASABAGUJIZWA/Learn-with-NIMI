// app/api/creations/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

interface Comment {
  id: string;
  creationId: string;
  author: string;
  content: string;
  createdAt: string;
}

// Persistent in-memory storage for dev session
if (!(global as any).comments) {
  (global as any).comments = [] as Comment[];
}
const comments: Comment[] = (global as any).comments;

export async function GET(
  request: Request, // 👈 use Request instead of NextRequest
  context: { params: { id: string } }
) {
  const { id } = context.params;

  const creationComments = comments
    .filter((c) => c.creationId === id)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return NextResponse.json(creationComments);
}

export async function POST(
  request: Request, // 👈 same here
  context: { params: { id: string } }
) {
  const { id } = context.params;
  const { content } = await request.json();

  const newComment: Comment = {
    id: uuidv4(),
    creationId: id,
    author: "User",
    content,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);

  return NextResponse.json(newComment, { status: 201 });
}
