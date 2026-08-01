export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fetchAirwaysData, championNumber } from "@/lib/airways/airwaysData";
import {
  buildPassportSpread,
  type PassportSpreadLayout,
} from "@/lib/airways/buildPassportSpread";
import { qrDataUri as genQr } from "@/lib/airways/qrCode";

async function fetchImageAsDataUri(url: string, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buf).resize(w, h, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${resized.toString("base64")}`;
  } catch {
    return null;
  }
}

async function addPngPage(doc: PDFDocument, png: Buffer, pageW?: number, pageH?: number) {
  const img = await doc.embedPng(png);
  const pw  = pageW ?? img.width;
  const ph  = pageH ?? img.height;
  const scale = Math.min(pw / img.width, ph / img.height);
  const page  = doc.addPage([pw, ph]);
  page.drawImage(img, {
    x: (pw - img.width  * scale) / 2,
    y: (ph - img.height * scale) / 2,
    width:  img.width  * scale,
    height: img.height * scale,
  });
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });

  const [{ data: child }, { data: adminRow }] = await Promise.all([
    supabase.from("children").select("parent_id").eq("id", childId).single(),
    supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
  ]);
  if (!adminRow && child?.parent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await fetchAirwaysData(supabase, childId);
  if (!data) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  // Load layout from DB
  const { data: layoutRows } = await supabase
    .from("template_layout")
    .select("field,x,y,w,h,font_size")
    .eq("template", "passport-interior");

  const layout: PassportSpreadLayout = {};
  for (const row of layoutRows ?? []) {
    (layout as Record<string, unknown>)[row.field] = {
      x: row.x, y: row.y, w: row.w, h: row.h, font_size: row.font_size,
    };
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Fetch all assets in parallel
  const [photoUri, qr, ...coverResults] = await Promise.all([
    data.avatar_url
      ? fetchImageAsDataUri(
          data.avatar_url.startsWith("http")
            ? data.avatar_url
            : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`,
          210, 265
        )
      : Promise.resolve(null),
    genQr(`${appUrl}/user-profile`, 148),
    ...data.stories.map(async (s) => {
      if (!s.cover_url) return null;
      const url = s.cover_url.startsWith("http")
        ? s.cover_url
        : `${supaUrl}/storage/v1/object/public/${s.cover_url}`;
      return fetchImageAsDataUri(url, 200, 310);
    }),
  ]);

  const coverUriByIndex = new Map<number, string | null>();
  data.stories.forEach((_, i) => coverUriByIndex.set(i, coverResults[i] ?? null));

  const coverUriMap = new Map<string, string>();
  data.stories.forEach((s, i) => {
    const uri = coverResults[i];
    if (uri) coverUriMap.set(s.id, uri);
  });

  const champNum = championNumber(data.name, data.current_story?.sort_order ?? 1, data.sibling_rank);

  // Stories to render (completed + current if not complete)
  const storiesToShow = data.stories.filter((s) => s.is_complete);
  if (data.current_story && !data.current_story.is_complete) {
    storiesToShow.push(data.current_story);
  }
  if (storiesToShow.length === 0 && data.stories.length > 0) {
    storiesToShow.push(data.stories[0]);
  }

  try {
    const doc = await PDFDocument.create();

    // Single spread page — current/latest story
    const story     = storiesToShow[storiesToShow.length - 1];
    const bookNum   = story.sort_order;
    const nextStory = data.stories.find((s) => s.sort_order === bookNum + 1) ?? null;
    const coverIdx  = data.stories.findIndex((s) => s.id === story.id);
    const nextIdx   = nextStory ? data.stories.findIndex((s) => s.id === nextStory.id) : -1;

    const spreadPng = await buildPassportSpread({
      childName:        data.name,
      championNumber:   champNum,
      createdAt:        data.created_at,
      photoDataUri:     photoUri ?? null,
      qrDataUri:        qr,
      story,
      bookNum,
      coverDataUri:     coverUriByIndex.get(coverIdx) ?? null,
      nextStory,
      nextCoverDataUri: nextIdx >= 0 ? (coverUriByIndex.get(nextIdx) ?? null) : null,
      layout,
    });

    await addPngPage(doc, spreadPng);

    const pdfBytes = await doc.save();
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${data.name}_passport_nimipiko.pdf"`,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[passport] build error:", msg);
    return NextResponse.json({ error: `Passport build failed: ${msg}` }, { status: 500 });
  }
}
