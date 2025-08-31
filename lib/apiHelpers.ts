// /lib/apiHelpers.ts
import { NextResponse } from "next/server";

export function handleError(error: unknown, message = "Unexpected error") {
  let errorMessage = message;

  if (error instanceof Error) {
    errorMessage = `${message}: ${error.message}`;
  } else if (typeof error === "string") {
    errorMessage = `${message}: ${error}`;
  }

  console.error(error); // ✅ useful for debugging in logs

  return NextResponse.json({ error: errorMessage }, { status: 500 });
}
