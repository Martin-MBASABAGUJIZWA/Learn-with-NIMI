export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabaseRouteAuth";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { getServiceClient } from "@/lib/supabase/serviceClient";
import { safeFilename } from "@/lib/airways/safeFilename";

// ── Main handler ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Certificate download is a Club feature — free users can earn certs but not download them
  const { data: sub } = await supabase
    .from("nimipiko_subscriptions")
    .select("id")
    .eq("parent_id", user.id)
    .in("status", ["active", "trial"])
    .limit(1)
    .maybeSingle();

  if (!sub) {
    return NextResponse.json(
      { error: "club_required", message: "Certificate downloads require a NIMIPIKO Club subscription." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const childName  = searchParams.get("child") || "Explorer";
  const safeName   = safeFilename(childName);
  const storyId    = searchParams.get("storyId");
  const storyTitle = searchParams.get("story") || "Story Adventure";
  const lang       = searchParams.get("lang") || "en";
  const stars      = searchParams.get("stars") || "60";
  const format     = searchParams.get("format") === "png" ? "png" : "pdf";

  // Watermark token: truncated parent ID, low-visibility stamp for tracing
  const watermarkToken = `NMK-${user.id.slice(0, 8).toUpperCase()}`;

  // ── Template mode: use admin-configured certificate image ──
  if (storyId) {
    try {
      const { data: story } = await supabase
        .from("stories")
        .select("certificate_config")
        .eq("id", storyId)
        .single();

      type CertConfig = Record<string, { image_url?: string; nameX?: number; nameY?: number; fontSize?: number; nameSize?: number; color?: string; nameColor?: string } | undefined>;
      const config = story?.certificate_config as CertConfig | null;
      const langConfig = config?.[lang] || config?.en;

      if (langConfig?.image_url) {
        const url = langConfig.image_url.startsWith("http")
          ? langConfig.image_url
          : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${langConfig.image_url}`;

        const nameX    = langConfig.nameX    ?? 397;
        const nameY    = langConfig.nameY    ?? 1010;
        const nameSize = langConfig.nameSize ?? 40;
        const nameColor = langConfig.nameColor ?? "#1a2a6c";

        const imgRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (imgRes.ok) {
          const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
          const metadata  = await sharp(imgBuffer).metadata();
          const imgW = metadata.width || 794;
          const imgH = metadata.height || 1123;

          const hex2rgb = (h: string) => ({
            r: parseInt(h.replace("#","").slice(0,2),16),
            g: parseInt(h.replace("#","").slice(2,4),16),
            b: parseInt(h.replace("#","").slice(4,6),16),
          });
          const { r, g, b } = hex2rgb(nameColor);

          const textSvg = Buffer.from(`
            <svg width="${imgW}" height="${imgH}">
              <text x="${nameX}" y="${nameY}" text-anchor="middle"
                font-size="${nameSize}" fill="rgb(${r},${g},${b})"
                font-family="Arial Black,sans-serif" font-weight="900">
                ${childName.toUpperCase().replace(/&/g,"&amp;").replace(/</g,"&lt;")}
              </text>
              <text x="${imgW / 2}" y="${imgH - 8}" text-anchor="middle"
                font-size="11" fill="#D1D5DB" opacity="0.55"
                font-family="Arial,sans-serif">
                ${watermarkToken} · nimipiko.com
              </text>
            </svg>`);

          const composited = await sharp(imgBuffer)
            .composite([{ input: textSvg, top: 0, left: 0 }])
            .png().toBuffer();

          if (format === "png") {
            return new NextResponse(new Uint8Array(composited), {
              headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="${safeName}_certificate.png"`,
              },
            });
          }

          const pdfDoc  = await PDFDocument.create();
          const pdfImg  = await pdfDoc.embedPng(composited);
          const ar      = pdfImg.width / pdfImg.height;
          const pw      = ar > 1 ? 842 : 595;
          const ph      = ar > 1 ? 595 : 842;
          const page    = pdfDoc.addPage([pw, ph]);
          const scale   = Math.min(pw / pdfImg.width, ph / pdfImg.height);
          page.drawImage(pdfImg, {
            x: (pw - pdfImg.width * scale) / 2,
            y: (ph - pdfImg.height * scale) / 2,
            width: pdfImg.width * scale,
            height: pdfImg.height * scale,
          });
          const pdfBytes = await pdfDoc.save();
          return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${safeName}_certificate.pdf"`,
            },
          });
        }
      }
    } catch (err) {
      console.error("[Certificate template]", err);
    }
  }

  // ── Global template: check certificate_templates table for this language ──
  try {
    const { data: tmpl } = await supabase
      .from("certificate_templates")
      .select("image_url, name_x, name_y, name_size, name_color")
      .eq("lang", lang)
      .maybeSingle();

    if (tmpl?.image_url) {
      const imgRes = await fetch(tmpl.image_url, { signal: AbortSignal.timeout(8000) });
      if (imgRes.ok) {
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        const { width: imgW = 864, height: imgH = 1152 } = await sharp(imgBuffer).metadata();
        const nameX     = tmpl.name_x     ?? 438;
        const nameY     = tmpl.name_y     ?? 1089;
        const nameSize  = tmpl.name_size  ?? 50;
        const nameColor = tmpl.name_color ?? "#0d1b4b";

        const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const textSvg = Buffer.from(`
          <svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">
            <text x="${nameX}" y="${nameY}" text-anchor="middle"
              font-size="${nameSize}" fill="${nameColor}"
              font-family="Arial Black, sans-serif" font-weight="900">
              ${esc(childName.toUpperCase())}
            </text>
            <text x="${imgW / 2}" y="${imgH - 8}" text-anchor="middle"
              font-size="11" fill="#D1D5DB" opacity="0.55"
              font-family="Arial, sans-serif">
              ${esc(watermarkToken)} · nimipiko.com
            </text>
          </svg>`);

        const composited = await sharp(imgBuffer)
          .composite([{ input: textSvg, top: 0, left: 0 }])
          .jpeg({ quality: 97 })
          .toBuffer();

        if (format === "png") {
          const pngBuffer = await sharp(composited).png().toBuffer();
          return new NextResponse(new Uint8Array(pngBuffer), {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": `attachment; filename="${safeName}_certificate.png"`,
            },
          });
        }

        const pdfDoc = await PDFDocument.create();
        const pdfImg = await pdfDoc.embedJpg(composited);
        const page   = pdfDoc.addPage([595, 842]);
        const scale  = Math.min(595 / pdfImg.width, 842 / pdfImg.height);
        page.drawImage(pdfImg, {
          x: (595 - pdfImg.width * scale) / 2,
          y: (842 - pdfImg.height * scale) / 2,
          width: pdfImg.width * scale, height: pdfImg.height * scale,
        });
        const pdfBytes = await pdfDoc.save();
        return new NextResponse(Buffer.from(pdfBytes), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${safeName}_certificate.pdf"`,
          },
        });
      }
    }
  } catch (err) {
    console.error("[Certificate global template]", err);
  }

  // ── Default: stamp child name onto the real boss-designed certificate ──
  const certPath = path.join(process.cwd(), "public", "certs", "congz.jpeg");
  if (!fs.existsSync(certPath)) {
    return NextResponse.json({ error: "Certificate template not found." }, { status: 404 });
  }
  const certBuffer = fs.readFileSync(certPath);
  const { width: imgW = 864, height: imgH = 1152 } = await sharp(certBuffer).metadata();

  // Coordinates confirmed via preview tool against boss's congs.jpeg reference
  const nameX     = 438;
  const nameY     = 1089;
  const nameSize  = 50;
  const nameColor = "#0d1b4b";

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const textSvg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${imgW}" height="${imgH}">
      <text x="${nameX}" y="${nameY}"
        text-anchor="middle"
        font-size="${nameSize}"
        fill="${nameColor}"
        font-family="Arial Black, sans-serif"
        font-weight="900">
        ${esc(childName.toUpperCase())}
      </text>
      <text x="${imgW / 2}" y="${imgH - 8}"
        text-anchor="middle"
        font-size="11"
        fill="#D1D5DB"
        opacity="0.55"
        font-family="Arial, sans-serif">
        ${esc(watermarkToken)} · nimipiko.com
      </text>
    </svg>
  `);

  const composited = await sharp(certBuffer)
    .composite([{ input: textSvg, top: 0, left: 0 }])
    .jpeg({ quality: 97 })
    .toBuffer();

  if (format === "png") {
    const pngBuffer = await sharp(composited).png().toBuffer();
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${safeName}_certificate.png"`,
      },
    });
  }

  // Wrap in PDF (A4 portrait)
  const pdfDoc = await PDFDocument.create();
  const pdfImg = await pdfDoc.embedJpg(composited);
  const page   = pdfDoc.addPage([595, 842]);
  const scale  = Math.min(595 / pdfImg.width, 842 / pdfImg.height);
  page.drawImage(pdfImg, {
    x: (595 - pdfImg.width * scale) / 2,
    y: (842 - pdfImg.height * scale) / 2,
    width:  pdfImg.width * scale,
    height: pdfImg.height * scale,
  });

  const pdfBytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${safeName}_certificate.pdf"`,
    },
  });
}
