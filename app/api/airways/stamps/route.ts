export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fetchAirwaysData } from "@/lib/airways/airwaysData";
import { buildStampsSvg } from "@/lib/airways/buildStampsSvg";
import { safeFilename } from "@/lib/airways/safeFilename";

async function fetchCoverUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buf).resize(200, 250, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${resized.toString("base64")}`;
  } catch {
    return null;
  }
}

async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer();
}

async function pngToPdf(png: Buffer): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const img = await doc.embedPng(png);
  const pw = 842, ph = 1092;
  const scale = Math.min(pw / img.width, ph / img.height);
  const page = doc.addPage([pw, ph]);
  page.drawImage(img, {
    x: (pw - img.width * scale) / 2,
    y: (ph - img.height * scale) / 2,
    width: img.width * scale,
    height: img.height * scale,
  });
  return doc.save();
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId");
  const format = searchParams.get("format") === "png" ? "png" : "pdf";

  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from("children").select("parent_id").eq("id", childId).single(),
    supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
  ]);
  if (!adminRow && child?.parent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!adminRow) {
    const { data: sub } = await supabase
      .from("nimipiko_subscriptions")
      .select("id")
      .eq("parent_id", user.id)
      .in("status", ["active", "trial"])
      .maybeSingle();
    if (!sub) return NextResponse.json({ error: "Subscription required" }, { status: 402 });
  }

  const data = await fetchAirwaysData(supabase, childId);
  if (!data) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  // Load story cover images in parallel
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const coverUris = new Map<string, string>();
  await Promise.all(
    data.stories.map(async (s) => {
      if (!s.cover_url) return;
      const url = s.cover_url.startsWith("http")
        ? s.cover_url
        : `${supaUrl}/storage/v1/object/public/${s.cover_url}`;
      const uri = await fetchCoverUri(url);
      if (uri) coverUris.set(s.id, uri);
    })
  );

  const svg = buildStampsSvg({ childName: data.name, stories: data.stories, coverUris });
  const png = await svgToPng(svg);

  const safeName = safeFilename(data.name)

  if (format === "png") {
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${safeName}_stamps.png"`,
      },
    });
  }

  const pdf = await pngToPdf(png);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_stamp_collection.pdf"`,
    },
  });
}
