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

// In-memory storage
if (!(global as any).comments) {
  console.warn("⚠️ Comments are ephemeral and reset on deploy/restart!");
  (global as any).comments = [] as Comment[];
}
const comments: Comment[] = (global as any).comments;

export async function GET(req: Request, context: any) {
  const { id } = context.params;

  const creationComments = comments
    .filter((c) => c.creationId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(creationComments);
}

export async function POST(req: Request, context: any) {
  const { id } = context.params;
  const { content } = await req.json();

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Content must be a non-empty string." }, { status: 400 });
  }

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
