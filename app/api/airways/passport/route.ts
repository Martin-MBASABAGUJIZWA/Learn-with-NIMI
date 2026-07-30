export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fetchAirwaysData, championNumber } from "@/lib/airways/airwaysData";
import {
  buildPassportCoverSvg,
  buildPassportIdentitySvg,
  buildPassportDestinationSvg,
  PAGE_W,
  PAGE_H,
} from "@/lib/airways/buildPassportSvg";
import { buildStampsSvg } from "@/lib/airways/buildStampsSvg";
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

async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png({ quality: 95 }).toBuffer();
}

/** Add one PNG page to the PDF document, A4 portrait */
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

  const { data: child } = await supabase
    .from("children").select("parent_id").eq("id", childId).single();
  if (child?.parent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await fetchAirwaysData(supabase, childId);
  if (!data) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // ── Load assets in parallel ──────────────────────────────────
  const [photoUri, qr, ...coverResults] = await Promise.all([
    // Child photo
    data.avatar_url
      ? fetchImageAsDataUri(
          data.avatar_url.startsWith("http")
            ? data.avatar_url
            : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`,
          150, 175
        )
      : Promise.resolve(null),
    // QR code
    genQr(`${appUrl}/user-profile`, 140),
    // Story cover images
    ...data.stories.map(async (s) => {
      if (!s.cover_url) return null;
      const url = s.cover_url.startsWith("http")
        ? s.cover_url
        : `${supaUrl}/storage/v1/object/public/${s.cover_url}`;
      return fetchImageAsDataUri(url, 168, 200);
    }),
  ]);

  // Map cover URIs by story index
  const coverUriByIndex = new Map<number, string | null>();
  data.stories.forEach((_, i) => coverUriByIndex.set(i, coverResults[i] ?? null));

  const coverUriMap = new Map<string, string>();
  data.stories.forEach((s, i) => {
    const uri = coverResults[i];
    if (uri) coverUriMap.set(s.id, uri);
  });

  // ── Build multi-page PDF ─────────────────────────────────────
  const doc = await PDFDocument.create();

  // Page 1: Cover
  const coverSvg = buildPassportCoverSvg();
  await addPngPage(doc, await svgToPng(coverSvg));

  // Page 2: Identity
  const identitySvg = buildPassportIdentitySvg({
    childName: data.name,
    championNumber: championNumber(data.name, data.sibling_rank),
    createdAt: data.created_at,
    photoDataUri: photoUri ?? null,
    qrDataUri: qr,
  });
  await addPngPage(doc, await svgToPng(identitySvg));

  // Pages 3..N: One page per completed story + current story
  // Show all stories (completed ones with full data, incomplete ones as locked)
  const storiesToShow = data.stories.filter((s) => s.is_complete);
  // Also include current (first incomplete) if any
  if (data.current_story && !data.current_story.is_complete) {
    storiesToShow.push(data.current_story);
  }

  for (let i = 0; i < storiesToShow.length; i++) {
    const story = storiesToShow[i];
    const bookNum = story.sort_order;
    const nextStory = data.stories.find((s) => s.sort_order === bookNum + 1) ?? null;
    const coverIdx = data.stories.findIndex((s) => s.id === story.id);
    const nextCoverIdx = nextStory ? data.stories.findIndex((s) => s.id === nextStory.id) : -1;

    const destSvg = buildPassportDestinationSvg({
      story,
      bookNum,
      nextStory,
      coverDataUri: coverUriByIndex.get(coverIdx) ?? null,
      nextCoverDataUri: nextCoverIdx >= 0 ? (coverUriByIndex.get(nextCoverIdx) ?? null) : null,
      badgeDataUri: null, // badge images would be fetched from storage if available
    });
    await addPngPage(doc, await svgToPng(destSvg));
  }

  // Last page: Stamp collection
  const stampsSvg = buildStampsSvg({
    childName: data.name,
    stories: data.stories,
    coverUris: coverUriMap,
  });
  await addPngPage(doc, await svgToPng(stampsSvg));

  const pdfBytes = await doc.save();
  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.name}_passport_nimipiko.pdf"`,
    },
  });
}
