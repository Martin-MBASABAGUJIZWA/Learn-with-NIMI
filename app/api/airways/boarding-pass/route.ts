export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { fetchAirwaysData, championNumber, flightNumber } from "@/lib/airways/airwaysData";
import { buildBoardingPassSvg } from "@/lib/airways/buildBoardingPassSvg";
import { qrDataUri as genQr } from "@/lib/airways/qrCode";

// ── helpers ──────────────────────────────────────────────────

async function fetchImageAsDataUri(url: string, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const resized = await sharp(buf)
      .resize(w, h, { fit: "cover", position: "centre" })
      .png()
      .toBuffer();
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
  // Boarding pass: portrait, fit to A4
  const pw = 595, ph = 842;
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

// ── Handler ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") === "png" ? "png" : "pdf";

  // ── Generic (non-personalized) boarding pass ───────────────
  if (searchParams.get("generic") === "true") {
    const qr = await genQr(`${process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com"}/`, 180);
    const svg = buildBoardingPassSvg({
      name: "Petit Champion",
      ageLabel: "__ ANS",
      statusLabel: "PETIT CHAMPION",
      vol: "NMP101",
      destination: "NIMI À L'ÉCOLE",
      livreNum: "1",
      siege: "3A",
      porte: "G1",
      embarquement: "OUVERT",
      photoDataUri: null,
      qrDataUri: qr,
    });
    const png = await svgToPng(svg);
    if (format === "png") {
      return new NextResponse(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": `attachment; filename="nimipiko_airways_boarding_pass.png"`,
        },
      });
    }
    const pdf = await pngToPdf(png);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="nimipiko_airways_boarding_pass.pdf"`,
      },
    });
  }

  // ── Personalized boarding pass ─────────────────────────────
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const childId = searchParams.get("childId");
  if (!childId) return NextResponse.json({ error: "childId required" }, { status: 400 });

  // Verify this child belongs to the authenticated parent
  const { data: child, error: ownerErr } = await supabase
    .from("children")
    .select("parent_id")
    .eq("id", childId)
    .single();
  if (ownerErr || child?.parent_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await fetchAirwaysData(supabase, childId);
  if (!data) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const currentStory = data.current_story;
  const bookNum = currentStory?.sort_order ?? 1;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nimipiko.com";

  // Fetch child's photo
  const photoUri = data.avatar_url
    ? await fetchImageAsDataUri(
        data.avatar_url.startsWith("http")
          ? data.avatar_url
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.avatar_url}`,
        152, 187
      )
    : null;

  // Generate QR linking to child's profile
  const qr = await genQr(`${appUrl}/user-profile`, 180);

  const svg = buildBoardingPassSvg({
    name: data.name,
    ageLabel: data.age != null ? `${data.age} ANS` : "__ ANS",
    statusLabel: currentStory?.is_complete ? "GRAND CHAMPION" : "PETIT CHAMPION",
    vol: flightNumber(bookNum),
    destination: (currentStory?.title ?? "Nimi à l'école").toUpperCase(),
    livreNum: String(bookNum),
    siege: data.age != null ? `${data.age}A` : "3A",
    porte: `G${bookNum}`,
    embarquement: "OUVERT",
    photoDataUri: photoUri,
    qrDataUri: qr,
  });

  const png = await svgToPng(svg);

  if (format === "png") {
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${data.name}_boarding_pass.png"`,
      },
    });
  }

  const pdf = await pngToPdf(png);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${data.name}_boarding_pass.pdf"`,
    },
  });
}
