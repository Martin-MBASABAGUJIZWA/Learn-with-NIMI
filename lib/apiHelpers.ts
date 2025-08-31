import { NextResponse } from "next/server";

export function handleError(err: unknown, msg = "Internal server error") {
  const message = err instanceof Error ? err.message : String(err);
  console.error(msg, err);
  return NextResponse.json({ error: msg, details: message }, { status: 500 });
}
