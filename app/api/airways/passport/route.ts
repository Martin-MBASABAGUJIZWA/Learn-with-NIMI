export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fetchAirwaysData, championNumber } from "@/lib/airways/airwaysData";
import {
  buildPassportCoverCanvas,
  buildPassportIdentityCanvas,
  buildPassportDestinationCanvas,
  buildStampsCanvas,
  PAGE_W,
  PAGE_H,
} from "@/lib/airways/buildPassportCanvas";
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

async function addPngPage(doc: PDFDocument, png: Buffer) {
  const img = await doc.embedPng(png);
  const scale = Math.min(PAGE_W / img.width, PAGE_H / img.height);
  const page = doc.addPage([PAGE_W, PAGE_H]);
  page.drawImage(img, {
    x: (PAGE_W - img.width * scale) / 2,
    y: (PAGE_H - img.height * scale) / 2,
    width: img.width * scale,
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

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // Load all assets in parallel
  const [photoUri, qr, ...coverResults] = await Promise.all([
    data.avatar_url
      ? fetchImageAsDataUri(
          data.avatar_url.startsWith("http")
            ? data.avatar_url
            : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`,
          150, 175
        )
      : Promise.resolve(null),
    genQr(`${appUrl}/user-profile`, 140),
    ...data.stories.map(async (s) => {
      if (!s.cover_url) return null;
      const url = s.cover_url.startsWith("http")
        ? s.cover_url
        : `${supaUrl}/storage/v1/object/public/${s.cover_url}`;
      return fetchImageAsDataUri(url, 168, 200);
    }),
  ]);

  const coverUriByIndex = new Map<number, string | null>();
  data.stories.forEach((_, i) => coverUriByIndex.set(i, coverResults[i] ?? null));

  const coverUriMap = new Map<string, string>();
  data.stories.forEach((s, i) => {
    const uri = coverResults[i];
    if (uri) coverUriMap.set(s.id, uri);
  });

  try {
    const doc = await PDFDocument.create();

    await addPngPage(doc, await buildPassportCoverCanvas());

    await addPngPage(doc, await buildPassportIdentityCanvas({
      childName: data.name,
      championNumber: championNumber(data.name, data.current_story?.sort_order ?? 1, data.sibling_rank),
      createdAt: data.created_at,
      photoDataUri: photoUri ?? null,
      qrDataUri: qr,
    }));

    const storiesToShow = data.stories.filter((s) => s.is_complete);
    if (data.current_story && !data.current_story.is_complete) {
      storiesToShow.push(data.current_story);
    }

    for (let i = 0; i < storiesToShow.length; i++) {
      const story = storiesToShow[i];
      const bookNum      = story.sort_order;
      const nextStory    = data.stories.find((s) => s.sort_order === bookNum + 1) ?? null;
      const coverIdx     = data.stories.findIndex((s) => s.id === story.id);
      const nextCoverIdx = nextStory ? data.stories.findIndex((s) => s.id === nextStory.id) : -1;

      await addPngPage(doc, await buildPassportDestinationCanvas({
        story, bookNum, nextStory,
        coverDataUri:     coverUriByIndex.get(coverIdx) ?? null,
        nextCoverDataUri: nextCoverIdx >= 0 ? (coverUriByIndex.get(nextCoverIdx) ?? null) : null,
        badgeDataUri: null,
      }));
    }

    await addPngPage(doc, await buildStampsCanvas({
      childName: data.name,
      stories: data.stories,
      coverUris: coverUriMap,
    }));

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
