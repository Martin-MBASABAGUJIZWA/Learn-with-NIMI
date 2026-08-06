// ══════════════════════════════════════════════════════════════
//  NIMIPIKO AIRWAYS — Stamp collection SVG builder
//
//  Generates the "Collection Officielle des Timbres de Voyage"
//  page — 12 stamps in a 4×3 grid, matching the reference design.
// ══════════════════════════════════════════════════════════════

import type { AirwaysStory } from "./airwaysData";
import { svgFontStyle } from "./svgFont";

const W = 1080;
const H = 1400;

const CREAM  = "#F5EDDA";
const GOLD   = "#C9A84C";
const NAVY   = "#0D1B35";
const GREEN  = "#1A7A3E";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Renders one stamp cell */
function stampCell(opts: {
  x: number;
  y: number;
  bookNum: number;
  title: string;
  coverDataUri: string | null;
  dateStr: string;
  isComplete: boolean;
}) {
  const { x, y, bookNum, title, coverDataUri, dateStr, isComplete } = opts;
  const W_CELL = 220, H_CELL = 270;

  const innerBorder = isComplete
    ? `<rect x="${x + 6}" y="${y + 6}" width="${W_CELL - 12}" height="${H_CELL - 12}" rx="8"
        fill="none" stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="6,3" opacity="0.7"/>`
    : `<rect x="${x + 6}" y="${y + 6}" width="${W_CELL - 12}" height="${H_CELL - 12}" rx="8"
        fill="none" stroke="#CCCCCC" stroke-width="1" stroke-dasharray="4,4" opacity="0.5"/>`;

  const coverBlock = coverDataUri
    ? `<image href="${coverDataUri}" x="${x + 18}" y="${y + 36}" width="${W_CELL - 36}" height="130"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#cc${bookNum})"/>`
    : `<!-- Trophy placeholder -->
      <text x="${x + W_CELL / 2}" y="${y + 110}" text-anchor="middle" font-size="52">🏆</text>`;

  const clipPath = coverDataUri
    ? `<clipPath id="cc${bookNum}"><rect x="${x + 18}" y="${y + 36}" width="${W_CELL - 36}" height="130" rx="4"/></clipPath>`
    : "";

  const seal = isComplete
    ? `<circle cx="${x + W_CELL - 26}" cy="${y + H_CELL - 26}" r="22"
        fill="${GREEN}" opacity="0.9"/>
      <text x="${x + W_CELL - 26}" y="${y + H_CELL - 21}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" fill="white" font-weight="900">✓</text>`
    : "";

  const dateBlock = isComplete
    ? `<text x="${x + W_CELL / 2}" y="${y + H_CELL - 22}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" fill="${GOLD}">${esc(dateStr)}</text>`
    : `<text x="${x + W_CELL / 2}" y="${y + H_CELL - 28}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" fill="#AAAAAA">DATE :</text>
      <text x="${x + W_CELL / 2}" y="${y + H_CELL - 14}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" fill="#AAAAAA">__ /__ /____</text>`;

  const bookNumBadge = `
    <circle cx="${x + 24}" cy="${y + 24}" r="16" fill="${isComplete ? GOLD : "#CCCCCC"}"/>
    <text x="${x + 24}" y="${y + 29}" text-anchor="middle"
      font-size="14" font-family="DejaVu,sans-serif" font-weight="900"
      fill="${isComplete ? NAVY : "white"}">${bookNum}</text>`;

  const titleText = isComplete
    ? `<text x="${x + W_CELL / 2}" y="${y + 188}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" font-weight="900"
        fill="${NAVY}">${esc(title.length > 16 ? title.slice(0, 14) + "…" : title)}</text>`
    : `<text x="${x + W_CELL / 2}" y="${y + 188}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" font-style="italic"
        fill="#AAAAAA">À découvrir !</text>`;

  const livreLine = `<text x="${x + 44}" y="${y + 22}" font-size="10"
    font-family="DejaVu,sans-serif" fill="${isComplete ? GOLD : "#AAAAAA"}" letter-spacing="1">LIVRE ${bookNum}</text>`;

  return `
  <defs>${clipPath}</defs>
  <!-- Stamp ${bookNum} -->
  <rect x="${x}" y="${y}" width="${W_CELL}" height="${H_CELL}" rx="10"
    fill="${isComplete ? "#FFFDF5" : "#F5F5F5"}"
    stroke="${isComplete ? GOLD : "#DDDDDD"}" stroke-width="2.5"
    filter="url(#stampShadow)"/>
  ${innerBorder}
  ${bookNumBadge}
  ${livreLine}
  ${coverBlock}
  ${titleText}
  ${dateBlock}
  ${seal}`;
}

export interface StampsOptions {
  childName: string;
  stories: AirwaysStory[];
  /** covers as base64 data URIs, keyed by story id */
  coverUris: Map<string, string>;
  pageNum?: number;
  totalPages?: number;
}

export function buildStampsSvg(opts: StampsOptions): string {
  const { childName, stories, coverUris, pageNum, totalPages } = opts;

  // Always show 12 slots
  const TOTAL = 12;
  const COLS = 4;
  const CELL_W = 220, CELL_H = 270;
  const GAP_X = 18, GAP_Y = 22;
  const START_X = (W - (COLS * CELL_W + (COLS - 1) * GAP_X)) / 2;
  const START_Y = 250;

  const completedCount = stories.filter((s) => s.is_complete).length;

  // Completion badge at bottom
  const allDone = completedCount === TOTAL;
  const completionBadge = allDone
    ? `<rect x="${W / 2 - 250}" y="${H - 170}" width="500" height="80" rx="12"
        fill="${GOLD}" opacity="0.95"/>
      <text x="${W / 2}" y="${H - 125}" text-anchor="middle"
        font-size="20" font-family="DejaVu,sans-serif" font-weight="900"
        fill="${NAVY}">🎉 FÉLICITATIONS GRAND CHAMPION ! 🎉</text>`
    : `<text x="${W / 2}" y="${H - 125}" text-anchor="middle"
        font-size="16" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.5">
        ${completedCount} / ${TOTAL} histoires terminées
      </text>`;

  // Stars at bottom
  const starsRow = Array.from({ length: TOTAL }).map((_, i) => {
    const filled = i < completedCount;
    return `<text x="${W / 2 - 5.5 * 36 + i * 36 + 18}" y="${H - 55}"
      text-anchor="middle" font-size="22">${filled ? "⭐" : "☆"}</text>`;
  }).join("\n");

  const stamps = Array.from({ length: TOTAL }).map((_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = START_X + col * (CELL_W + GAP_X);
    const y = START_Y + row * (CELL_H + GAP_Y);
    const story = stories[i];

    if (!story) {
      // Empty placeholder slot
      return `
      <rect x="${x}" y="${y}" width="${CELL_W}" height="${CELL_H}" rx="10"
        fill="#F0F0F0" stroke="#DDDDDD" stroke-width="1.5" opacity="0.5"/>
      <circle cx="${x + 24}" cy="${y + 24}" r="16" fill="#DDDDDD"/>
      <text x="${x + 24}" y="${y + 29}" text-anchor="middle"
        font-size="14" font-family="DejaVu,sans-serif" fill="white">${i + 1}</text>
      <text x="${x + CELL_W / 2}" y="${y + 145}" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" font-style="italic" fill="#AAAAAA">À découvrir !</text>`;
    }

    const cover = coverUris.get(story.id) ?? null;
    const dateStr = story.completed_at
      ? new Date(story.completed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "__/__/____";

    return stampCell({
      x, y,
      bookNum: i + 1,
      title: story.title,
      coverDataUri: cover,
      dateStr,
      isComplete: story.is_complete,
    });
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${svgFontStyle()}
<defs>
  <filter id="stampShadow" x="-8%" y="-8%" width="116%" height="116%">
    <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#00000020"/>
  </filter>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${CREAM}"/>
    <stop offset="100%" stop-color="#EDE0C4"/>
  </linearGradient>
</defs>

<!-- Background -->
<rect width="${W}" height="${H}" fill="url(#bgGrad)"/>

<!-- Gold border frame -->
<rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="18"
  fill="none" stroke="${GOLD}" stroke-width="3"/>
<rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="14"
  fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.4"/>

<!-- Stars row header -->
<text x="50" y="58" font-size="22" fill="${GOLD}">★</text>
<text x="86" y="58" font-size="22" fill="${GOLD}">★</text>
<text x="122" y="58" font-size="22" fill="${GOLD}">★</text>

<!-- RÉPUBLIQUE DES CHAMPIONS header -->
<text x="${W / 2}" y="62" text-anchor="middle"
  font-size="18" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${NAVY}" letter-spacing="2">RÉPUBLIQUE DES CHAMPIONS</text>

<text x="${W - 50}" y="58" font-size="22" fill="${GOLD}" text-anchor="middle">★</text>
<text x="${W - 86}" y="58" font-size="22" fill="${GOLD}" text-anchor="middle">★</text>
<text x="${W - 122}" y="58" font-size="22" fill="${GOLD}" text-anchor="middle">★</text>

<!-- COLLECTION OFFICIELLE large title -->
<text x="${W / 2}" y="108" text-anchor="middle"
  font-size="44" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${NAVY}">COLLECTION OFFICIELLE</text>

<text x="${W / 2}" y="152" text-anchor="middle"
  font-size="26" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GOLD}">DES TIMBRES DE VOYAGE NIMIPIKO</text>

<!-- Subtitle: champion name + stats -->
<text x="${W / 2}" y="188" text-anchor="middle"
  font-size="16" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.7">
  🌿 ${completedCount} HISTOIRE${completedCount !== 1 ? "S" : ""} · ${completedCount} DESTINATION${completedCount !== 1 ? "S" : ""} · ${completedCount} SOUVENIR${completedCount !== 1 ? "S" : ""} INOUBLIABLE${completedCount !== 1 ? "S" : ""} 🌿
</text>

<text x="${W / 2}" y="215" text-anchor="middle"
  font-size="14" font-family="DejaVu,sans-serif" fill="${GOLD}">
  Champion : ${esc(childName.toUpperCase())}
</text>

<!-- Stamp grid -->
${stamps}

<!-- Stars progress row -->
<text x="${W / 2 - 5.5 * 36 - 18}" y="${H - 55}" font-size="16"
  font-family="DejaVu,sans-serif" fill="${NAVY}">1</text>
${starsRow}
<text x="${W / 2 + 6.5 * 36}" y="${H - 55}" font-size="16"
  font-family="DejaVu,sans-serif" fill="${NAVY}">${TOTAL}</text>

<!-- Completion badge or progress -->
${completionBadge}

<!-- Bottom watermark -->
<text x="${W / 2}" y="${H - 18}" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${GOLD}" opacity="0.5">
  ${pageNum && totalPages ? `p. ${pageNum} / ${totalPages} ★ ` : ''}nimipiko.com
</text>
</svg>`;
}
