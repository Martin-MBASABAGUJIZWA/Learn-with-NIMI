import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 8_192;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return new NextResponse(null, { status: 413 });
    }
    const body = await request.text();
    if (body.length <= MAX_BODY_BYTES) {
      // L2: Log only the violated-directive field, not the raw body (which may contain
      // sensitive URL fragments or PII from the blocked-uri / document-uri fields).
      try {
        const report = JSON.parse(body) as Record<string, unknown>;
        const directive =
          (report["csp-report"] as Record<string, unknown> | undefined)?.["violated-directive"] ??
          report["violated-directive"] ??
          "(unknown)";
        console.error("[CSP]", new Date().toISOString(), "violated-directive:", directive);
      } catch {
        console.error("[CSP]", new Date().toISOString(), "violated-directive: (unparseable report)");
      }
    }
  } catch {
    // ignore parse errors — always 204 so browsers don't retry
  }
  return new NextResponse(null, { status: 204 });
}
