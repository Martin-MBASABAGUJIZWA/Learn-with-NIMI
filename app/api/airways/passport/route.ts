export const runtime = "nodejs";
export const maxDuration = 120;

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
import {
  buildAttitudeBadge,
  removeBg,
  type AttitudeBadgeLayout,
} from "@/lib/airways/buildAttitudeBadge";
import { buildStampsSvg } from "@/lib/airways/buildStampsSvg";
import { buildGrandChampionPages } from "@/lib/airways/buildGrandChampion";
import { checkRateLimit } from "@/lib/airways/rateLimiter";
import { safeFilename } from "@/lib/airways/safeFilename";
import { getCachedPassport, setCachedPassport } from "@/lib/airways/passportCache";
import { fetchTemplate } from "@/lib/airways/templateFetcher";
import { qrDataUri as genQr } from "@/lib/airways/qrCode";
import { avatarUrlToBuffer } from "@/lib/airways/avatarToBuffer";
import { isAvatarConfig } from "@/lib/avatarConfig";

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

/** Embeds a PNG or JPEG buffer as a full-bleed PDF page. */
async function addImagePage(doc: PDFDocument, buf: Buffer, isJpeg = false) {
  try {
    const img = isJpeg ? await doc.embedJpg(buf) : await doc.embedPng(buf);
    const page = doc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
  } catch {
    // If PNG embed fails, try as JPEG
    if (!isJpeg) {
      try {
        const img = await doc.embedJpg(buf);
        const page = doc.addPage([img.width, img.height]);
        page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
      } catch { /* skip this page silently */ }
    }
  }
}

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await checkRateLimit(`passport:${user.id}`, 3)))
    return NextResponse.json({ error: "Too many requests — please wait a minute before generating another passport." }, { status: 429 });

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
  // Personalized = subscribed or admin. Free users get the same document but
  // without personal identity: name → "PETIT CHAMPION", photo → none.
  let isPersonalized = !!adminRow
  if (!adminRow) {
    const { data: sub } = await supabase
      .from("nimipiko_subscriptions")
      .select("id")
      .eq("parent_id", user.id)
      .in("status", ["active", "trial"])
      .maybeSingle();
    isPersonalized = !!sub
  }

  const [data, passportCoverBuf] = await Promise.all([
    fetchAirwaysData(supabase, childId),
    fetchTemplate("passport-cover"),
  ]);
  if (!data) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  // ── Cache check ────────────────────────────────────────────────────────────
  // Only cache personalized versions — free users get a faster but non-cached build.
  // Skip cache for admins (they preview layout changes that need fresh output).
  if (!adminRow && isPersonalized) {
    const cached = await getCachedPassport(supabase, childId);
    if (cached) {
      const safeName = safeFilename(data.name);
      console.log(`[passport] cache HIT | child=${childId}`);
      return new NextResponse(new Uint8Array(cached), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${safeName}_passport_nimipiko.pdf"`,
          "X-Cache": "HIT",
        },
      });
    }
  }

  const spreadKey = isPersonalized ? "passport-interior" : "passport-interior-free"
  const badgeKey  = isPersonalized ? "badge-template"    : "badge-template-free"

  const { data: allLayoutRows } = await supabase
    .from("template_layout")
    .select("field,x,y,w,h,font_size,color,template")
    .in("template", [spreadKey, badgeKey]);

  const layout: PassportSpreadLayout = {};
  const badgeLayout: AttitudeBadgeLayout = {};
  for (const row of allLayoutRows ?? []) {
    const target = row.template === badgeKey ? badgeLayout : layout;
    (target as Record<string, unknown>)[row.field] = {
      x: row.x, y: row.y, w: row.w, h: row.h,
      font_size: row.font_size, color: row.color ?? undefined,
    };
  }

  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  // ── Fetch all assets in parallel ───────────────────────────────────────────
  // Photo is only fetched for personalized (subscribed) users.
  const avatarPhotoPromise: Promise<string | null> = (async () => {
    if (!isPersonalized || !data.avatar_url) return null
    if (isAvatarConfig(data.avatar_url)) {
      const buf = await avatarUrlToBuffer(data.avatar_url, 210)
      return buf ? `data:image/png;base64,${buf.toString("base64")}` : null
    }
    const url = data.avatar_url.startsWith("http")
      ? data.avatar_url
      : `${supaUrl}/storage/v1/object/public/${data.avatar_url}`
    return fetchImageAsDataUri(url, 210, 265)
  })()

  const [photoUri, qr, ...coverResults] = await Promise.all([
    avatarPhotoPromise,
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

  // ── Stories to render: all completed + current (if still in progress) ──────
  const storiesToShow = data.stories.filter((s) => s.is_complete);
  if (data.current_story && !data.current_story.is_complete) {
    storiesToShow.push(data.current_story);
  }
  if (storiesToShow.length === 0 && data.stories.length > 0) {
    storiesToShow.push(data.stories[0]);
  }

  const t0 = Date.now()
  try {
    const displayName = isPersonalized ? data.name : 'PETIT CHAMPION'

    // ── Run background removal on child photo ONCE (personalized only) ─────
    let cleanPhotoDataUri: string | null = null;
    if (photoUri && isPersonalized) {
      cleanPhotoDataUri = await removeBg(photoUri).catch(() => null);
    }
    console.log(`[passport] removeBg ${Date.now() - t0}ms | bgOk=${cleanPhotoDataUri !== null}`);

    // ── Generate attitude badge per story in parallel ──────────────────────
    const t1 = Date.now()
    const badgeUris: (string | null)[] = await Promise.all(
      storiesToShow.map(async (story) => {
        const attitude = story.attitude ?? data.attitude ?? null;
        if (!attitude) return data.attitude_badge_url
          ? fetchImageAsDataUri(
              data.attitude_badge_url.startsWith("http")
                ? data.attitude_badge_url
                : `${supaUrl}/storage/v1/object/public/${data.attitude_badge_url}`,
              300, 300
            )
          : null;
        try {
          const buf = await buildAttitudeBadge({
            attitude,
            storyTitle:        story.title,
            bookNumber:        story.sort_order,
            childPhotoDataUri: photoUri ?? null,
            cleanPhotoDataUri,
            isPersonalized,
            layout:            badgeLayout,
          });
          return `data:image/png;base64,${buf.toString("base64")}`;
        } catch { return null; }
      })
    );
    console.log(`[passport] badges ×${storiesToShow.length} ${Date.now() - t1}ms`);

    // ── Generate one spread per story in parallel ──────────────────────────
    const t2 = Date.now()
    const spreadPngs: Buffer[] = await Promise.all(
      storiesToShow.map(async (story, i) => {
        const bookNum   = story.sort_order;
        const nextStory = data.stories.find((s) => s.sort_order === bookNum + 1) ?? null;
        const coverIdx  = data.stories.findIndex((s) => s.id === story.id);
        const nextIdx   = nextStory
          ? data.stories.findIndex((s) => s.id === nextStory.id)
          : -1;

        // Champion number reflects the current story letter (A, B, C…)
        const champNum = championNumber(data.name, bookNum, data.sibling_rank);

        return buildPassportSpread({
          childName:           displayName,
          championNumber:      isPersonalized ? champNum : '',
          createdAt:           isPersonalized ? data.created_at : '',
          photoDataUri:        photoUri ?? null,
          attitudeBadgeDataUri: badgeUris[i],
          qrDataUri:           isPersonalized ? qr : null,
          story,
          bookNum,
          coverDataUri:        coverUriByIndex.get(coverIdx) ?? null,
          nextStory,
          nextCoverDataUri:    nextIdx >= 0 ? (coverUriByIndex.get(nextIdx) ?? null) : null,
          isPersonalized,
          layout,
        });
      })
    );

    console.log(`[passport] spreads ×${storiesToShow.length} ${Date.now() - t2}ms`);

    // ── Stamp collection page (always last before grand champion) ─────────
    const allComplete = data.stories.length > 0 && data.stories.every(s => s.is_complete);
    const coverPages    = passportCoverBuf ? 1 : 0;
    const stampsPageNum = coverPages + spreadPngs.length + 1;
    const totalPages    = stampsPageNum + (allComplete ? 2 : 0);

    const stampsSvg = buildStampsSvg({
      childName:  displayName,
      stories:    data.stories,
      coverUris:  coverUriMap,
      pageNum:    stampsPageNum,
      totalPages,
    });
    const stampsPng = await sharp(Buffer.from(stampsSvg))
      .png({ quality: 95 })
      .toBuffer();

    // ── Assemble PDF ────────────────────────────────────────────────────────
    const doc = await PDFDocument.create();

    // Page 1: passport cover (static template image)
    if (passportCoverBuf) {
      await addImagePage(doc, passportCoverBuf);
    }

    // Pages 2…N: one spread per story
    for (const png of spreadPngs) {
      await addImagePage(doc, png);
    }

    // Last page: stamp collection
    await addImagePage(doc, stampsPng);

    // Grand Champion bonus pages — only when every story is complete
    if (allComplete) {
      const lastStory = data.stories.at(-1);
      const grandChampPages = await buildGrandChampionPages({
        childName:      displayName,
        championNumber: isPersonalized ? championNumber(data.name, lastStory?.sort_order ?? data.stories.length, data.sibling_rank) : '',
        completedAt:    isPersonalized ? (lastStory?.completed_at ?? null) : null,
        photoDataUri:   isPersonalized ? (cleanPhotoDataUri ?? photoUri ?? null) : null,
        stories:        data.stories,
      });
      for (const pg of grandChampPages) await addImagePage(doc, pg);
    }

    const pdfBytes = await doc.save();
    const safeName = safeFilename(displayName)
    console.log(`[passport] total ${Date.now() - t0}ms | pages=${doc.getPageCount()} | size=${(pdfBytes.length / 1024).toFixed(0)}kb | child=${childId}`);

    // Cache write is fire-and-forget — only cache personalized versions
    if (!adminRow && isPersonalized) {
      void setCachedPassport(supabase, childId, pdfBytes)
    }

    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}_passport_nimipiko.pdf"`,
      },
    });
  } catch (err) {
    console.error("[passport] build error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Passport generation failed. Please try again." }, { status: 500 });
  }
}
