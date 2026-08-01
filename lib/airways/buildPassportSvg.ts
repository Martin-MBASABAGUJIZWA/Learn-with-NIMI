// ══════════════════════════════════════════════════════════════
//  NIMIPIKO AIRWAYS — Passport SVG builders
//
//  Exports one function per passport page type:
//    buildPassportCoverSvg  → dark navy cover
//    buildPassportIdentitySvg → identity page (left spread)
//    buildPassportDestinationSvg → per-story destination page
// ══════════════════════════════════════════════════════════════

import type { AirwaysStory } from "./airwaysData";
import { svgFontStyle } from "./svgFont";

export const PAGE_W = 794;
export const PAGE_H = 1123;

const NAVY   = "#0D1B30";
const GOLD   = "#C9A84C";
const GREEN  = "#1A7A3E";
const CREAM  = "#F5EDDA";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Cover page ───────────────────────────────────────────────

export function buildPassportCoverSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
${svgFontStyle()}
<defs>
  <linearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#111D33"/>
    <stop offset="100%" stop-color="#0A1525"/>
  </linearGradient>
</defs>

<!-- Dark navy background -->
<rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#navyGrad)"/>

<!-- Gold border -->
<rect x="22" y="22" width="${PAGE_W - 44}" height="${PAGE_H - 44}" rx="10"
  fill="none" stroke="${GOLD}" stroke-width="2.5"/>
<rect x="30" y="30" width="${PAGE_W - 60}" height="${PAGE_H - 60}" rx="8"
  fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.4"/>

<!-- Top decoration: stars -->
<text x="${PAGE_W / 2}" y="100" text-anchor="middle" font-size="26" fill="${GOLD}">★ ★ ★</text>

<!-- PASSEPORT VOYAGE -->
<text x="${PAGE_W / 2}" y="168" text-anchor="middle"
  font-size="32" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GOLD}" letter-spacing="3">PASSEPORT VOYAGE</text>

<!-- NIMIPIKO large -->
<text x="${PAGE_W / 2}" y="240" text-anchor="middle"
  font-size="68" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GOLD}" letter-spacing="4">NIMIPIKO</text>

<!-- Divider -->
<line x1="160" y1="260" x2="${PAGE_W - 160}" y2="260"
  stroke="${GOLD}" stroke-width="1.5" opacity="0.6"/>

<!-- Camera / passport icon -->
<text x="${PAGE_W / 2}" y="310" text-anchor="middle" font-size="36">🎒</text>

<!-- Decorative globe and characters area -->
<circle cx="${PAGE_W / 2}" cy="500" r="160"
  fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.15"/>
<circle cx="${PAGE_W / 2}" cy="500" r="130"
  fill="${GOLD}" opacity="0.05"/>

<!-- Globe emoji placeholder -->
<text x="${PAGE_W / 2}" y="520" text-anchor="middle" font-size="80">🌍</text>

<!-- Leaf / nature decorations -->
<text x="160" y="520" font-size="32" fill="${GREEN}" opacity="0.8">🌿</text>
<text x="${PAGE_W - 160}" y="520" font-size="32" fill="${GREEN}" opacity="0.8">🌿</text>

<!-- Characters row (emoji stand-ins) -->
<text x="${PAGE_W / 2 - 100}" y="660" text-anchor="middle" font-size="52">🧒</text>
<text x="${PAGE_W / 2}" y="660" text-anchor="middle" font-size="52">🤖</text>
<text x="${PAGE_W / 2 + 100}" y="660" text-anchor="middle" font-size="52">🌿</text>
<text x="${PAGE_W / 2 - 100}" y="700" text-anchor="middle" font-size="13"
  font-family="DejaVu,sans-serif" fill="${GOLD}">NIMI</text>
<text x="${PAGE_W / 2}" y="700" text-anchor="middle" font-size="13"
  font-family="DejaVu,sans-serif" fill="${GOLD}">PIKO</text>
<text x="${PAGE_W / 2 + 100}" y="700" text-anchor="middle" font-size="13"
  font-family="DejaVu,sans-serif" fill="${GOLD}">ZILO</text>

<!-- Laurel decorations -->
<text x="${PAGE_W / 2 - 20}" y="780" text-anchor="middle" font-size="22" fill="${GOLD}">🏆</text>

<!-- NIMIPIKO brand bottom -->
<text x="${PAGE_W / 2}" y="850" text-anchor="middle"
  font-size="36" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GOLD}" letter-spacing="2">NIMIPIKO</text>

<!-- Tagline -->
<text x="${PAGE_W / 2}" y="890" text-anchor="middle"
  font-size="16" font-family="DejaVu,sans-serif" font-style="italic"
  fill="${GOLD}" opacity="0.8">Chaque histoire est une nouvelle destination.</text>

<!-- Bottom border accent -->
<rect x="22" y="${PAGE_H - 100}" width="${PAGE_W - 44}" height="2" fill="${GOLD}" opacity="0.3"/>

<!-- Page indicator -->
<text x="${PAGE_W / 2}" y="${PAGE_H - 50}" text-anchor="middle"
  font-size="14" font-family="DejaVu,sans-serif" fill="${GOLD}" opacity="0.5">
  GROW WITH EVERY STORY
</text>
<text x="${PAGE_W / 2}" y="${PAGE_H - 28}" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${GOLD}" opacity="0.35">
  nimipiko.com
</text>
</svg>`;
}

// ── Identity page ────────────────────────────────────────────

export function buildPassportIdentitySvg(opts: {
  childName: string;
  championNumber: string;
  createdAt: string;
  photoDataUri: string | null;
  qrDataUri: string;
}): string {
  const { childName, championNumber, createdAt, photoDataUri, qrDataUri } = opts;

  const createdFmt = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  }).replace(/\//g, " / ");

  const photoBlock = photoDataUri
    ? `<image href="${photoDataUri}" x="52" y="235" width="150" height="175"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#idPhotoClip)"/>`
    : `<rect x="52" y="235" width="150" height="175" rx="8"
        fill="#E5E7EB"/>
      <text x="127" y="330" text-anchor="middle" font-size="48">👤</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
${svgFontStyle()}
<defs>
  <clipPath id="idPhotoClip">
    <rect x="52" y="235" width="150" height="175" rx="10"/>
  </clipPath>
  <linearGradient id="pageBg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${CREAM}"/>
    <stop offset="100%" stop-color="#EDE0C4"/>
  </linearGradient>
</defs>

<!-- Background -->
<rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#pageBg)"/>

<!-- Top header bar -->
<rect x="0" y="0" width="${PAGE_W}" height="80" fill="${GREEN}" opacity="0.12"/>
<text x="${PAGE_W / 2}" y="32" text-anchor="middle"
  font-size="18" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GREEN}" letter-spacing="2">🌿 PASSEPORT VOYAGE NIMIPIKO 🌿</text>
<text x="${PAGE_W / 2}" y="62" text-anchor="middle"
  font-size="28" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${NAVY}" letter-spacing="1">IDENTITÉ DU CHAMPION</text>

<!-- Divider -->
<line x1="40" y1="88" x2="${PAGE_W - 40}" y2="88" stroke="${GOLD}" stroke-width="1.5" opacity="0.6"/>

<!-- Identity box border -->
<rect x="36" y="100" width="${PAGE_W - 72}" height="300" rx="12"
  fill="white" fill-opacity="0.5" stroke="${GREEN}" stroke-width="2"/>

<!-- Photo placeholder box -->
<rect x="48" y="220" width="178" height="162" rx="10"
  fill="none" stroke="${GOLD}" stroke-width="2.5"/>
${photoBlock}

<!-- Name and details -->
<text x="250" y="155" font-size="12" font-family="DejaVu,sans-serif"
  fill="${GOLD}" font-weight="700" letter-spacing="2">NOM DU CHAMPION :</text>
<text x="250" y="185" font-size="26" font-family="DejaVu,sans-serif"
  font-weight="900" fill="${NAVY}">${esc(childName)}</text>

<line x1="248" y1="195" x2="${PAGE_W - 48}" y2="195" stroke="#D1D5DB" stroke-width="1"/>

<text x="250" y="230" font-size="12" font-family="DejaVu,sans-serif"
  fill="${GOLD}" font-weight="700" letter-spacing="2">NUMÉRO DU CHAMPION :</text>
<text x="250" y="258" font-size="22" font-family="DejaVu,sans-serif"
  font-weight="900" fill="${NAVY}">${esc(championNumber)}</text>

<text x="250" y="300" font-size="12" font-family="DejaVu,sans-serif"
  fill="${GOLD}" font-weight="700" letter-spacing="2">DATE DE CRÉATION :</text>
<text x="250" y="328" font-size="18" font-family="DejaVu,sans-serif"
  font-weight="700" fill="${GREEN}">${esc(createdFmt)}</text>

<!-- QR code -->
<image href="${qrDataUri}" x="${PAGE_W - 180}" y="220" width="140" height="140"/>
<text x="${PAGE_W - 110}" y="372" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.6">
  SCANNE POUR VOIR
</text>
<text x="${PAGE_W - 110}" y="387" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.6">
  TON PROFIL NIMIPIKO
</text>

<!-- Nimipiko seal bottom right -->
<circle cx="${PAGE_W - 80}" cy="${PAGE_H - 100}" r="55"
  fill="none" stroke="${GREEN}" stroke-width="2"/>
<circle cx="${PAGE_W - 80}" cy="${PAGE_H - 100}" r="44"
  fill="none" stroke="${GREEN}" stroke-width="1" opacity="0.5"/>
<text x="${PAGE_W - 80}" y="${PAGE_H - 116}" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${GREEN}" letter-spacing="0.5">NIMIPIKO</text>
<text x="${PAGE_W - 80}" y="${PAGE_H - 100}" text-anchor="middle" font-size="22">🌿</text>
<text x="${PAGE_W - 80}" y="${PAGE_H - 82}" text-anchor="middle"
  font-size="9" font-family="DejaVu,sans-serif" fill="${GREEN}" letter-spacing="0.5">OFFICIELLEMENT VALIDÉ</text>

<!-- Tagline at bottom -->
<text x="${PAGE_W / 2}" y="${PAGE_H - 30}" text-anchor="middle"
  font-size="13" font-family="DejaVu,sans-serif" font-style="italic"
  fill="${NAVY}" opacity="0.6">Chaque histoire est une nouvelle destination.</text>
</svg>`;
}

// ── Destination page (per completed story) ───────────────────

export function buildPassportDestinationSvg(opts: {
  story: AirwaysStory;
  bookNum: number;
  nextStory: AirwaysStory | null;
  coverDataUri: string | null;
  nextCoverDataUri: string | null;
  badgeDataUri: string | null;
}): string {
  const { story, bookNum, nextStory, coverDataUri, nextCoverDataUri, badgeDataUri } = opts;

  const validatedFmt = story.completed_at
    ? new Date(story.completed_at).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "2-digit", year: "numeric",
      }).replace(/\//g, " / ")
    : "__  /  __  /  ____";

  const bookCoverBlock = coverDataUri
    ? `<image href="${coverDataUri}" x="60" y="150" width="160" height="200"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#covClip${bookNum})"/>`
    : `<text x="140" y="265" text-anchor="middle" font-size="52">📗</text>`;

  const coverClip = coverDataUri
    ? `<clipPath id="covClip${bookNum}"><rect x="60" y="150" width="160" height="200" rx="8"/></clipPath>`
    : "";

  const badgeBlock = badgeDataUri
    ? `<image href="${badgeDataUri}" x="340" y="145" width="200" height="200"
        preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="440" y="260" text-anchor="middle" font-size="52">🏅</text>`;

  const nextCoverBlock = nextCoverDataUri
    ? `<image href="${nextCoverDataUri}" x="60" y="830" width="80" height="100"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#nextClip${bookNum})"/>`
    : `<rect x="60" y="830" width="80" height="100" rx="6" fill="${GREEN}" opacity="0.2"/>
      <text x="100" y="890" text-anchor="middle" font-size="30">📗</text>`;

  const nextClip = nextCoverDataUri
    ? `<clipPath id="nextClip${bookNum}"><rect x="60" y="830" width="80" height="100" rx="6"/></clipPath>`
    : "";

  const nextStoryBlock = nextStory
    ? `<!-- VISA for next story -->
      <rect x="36" y="808" width="${PAGE_W - 72}" height="130" rx="10"
        fill="none" stroke="${GREEN}" stroke-width="1.5" stroke-dasharray="8,4"/>
      <text x="50" y="802" font-size="11" font-family="DejaVu,sans-serif"
        fill="${GREEN}" font-weight="700" letter-spacing="1">
        VISA D'ENTRÉE AUTORISÉ POUR LE LIVRE ${bookNum + 1}
      </text>
      <defs>${nextClip}</defs>
      ${nextCoverBlock}
      <!-- Arrow -->
      <text x="165" y="893" font-size="32" fill="${GREEN}">→</text>
      <!-- Next destination card -->
      <rect x="205" y="830" width="260" height="100" rx="8"
        fill="none" stroke="${NAVY}" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="335" y="863" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.5">
        DESTINATION SUIVANTE :
      </text>
      <text x="335" y="883" text-anchor="middle"
        font-size="13" font-family="DejaVu,sans-serif" font-weight="900"
        fill="${NAVY}">LIVRE ${bookNum + 1}</text>
      <text x="335" y="903" text-anchor="middle"
        font-size="11" font-family="DejaVu,sans-serif"
        fill="${NAVY}">${esc(nextStory.title.length > 24 ? nextStory.title.slice(0, 22) + "…" : nextStory.title)}</text>`
    : `<!-- All stories complete -->
      <rect x="36" y="808" width="${PAGE_W - 72}" height="100" rx="10"
        fill="${GOLD}" opacity="0.15"/>
      <text x="${PAGE_W / 2}" y="860" text-anchor="middle"
        font-size="18" font-family="DejaVu,sans-serif" font-weight="900"
        fill="${NAVY}">🎉 GRAND CHAMPION DU NIMIPIKO ! 🎉</text>
      <text x="${PAGE_W / 2}" y="888" text-anchor="middle"
        font-size="14" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.7">
        Tu as terminé toutes les histoires !
      </text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${PAGE_W}" height="${PAGE_H}" viewBox="0 0 ${PAGE_W} ${PAGE_H}">
${svgFontStyle()}
<defs>
  <linearGradient id="pageBg${bookNum}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${CREAM}"/>
    <stop offset="100%" stop-color="#EDE0C4"/>
  </linearGradient>
  ${coverClip}
</defs>

<!-- Background -->
<rect width="${PAGE_W}" height="${PAGE_H}" fill="url(#pageBg${bookNum})"/>

<!-- Destination pill header -->
<rect x="${PAGE_W / 2 - 120}" y="20" width="240" height="36" rx="18"
  fill="${GREEN}" opacity="0.15"/>
<text x="${PAGE_W / 2}" y="44" text-anchor="middle"
  font-size="13" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${GREEN}" letter-spacing="1">★  DESTINATION ${bookNum}  ★</text>

<!-- Story title -->
<text x="${PAGE_W / 2}" y="100" text-anchor="middle"
  font-size="34" font-family="DejaVu,sans-serif" font-weight="900"
  fill="${NAVY}">${esc(story.title.toUpperCase())}</text>

<!-- Divider -->
<line x1="40" y1="116" x2="${PAGE_W - 40}" y2="116" stroke="${GOLD}" stroke-width="1.5" opacity="0.5"/>

<!-- Book cover -->
<text x="140" y="148" text-anchor="middle" font-size="12"
  font-family="DejaVu,sans-serif" fill="${GOLD}" font-weight="700" letter-spacing="2">LIVRE ${bookNum}</text>
<rect x="56" y="152" width="168" height="196" rx="10"
  fill="none" stroke="${GOLD}" stroke-width="2"/>
${bookCoverBlock}

<!-- Badge d'attitude -->
<text x="440" y="148" text-anchor="middle" font-size="12"
  font-family="DejaVu,sans-serif" fill="${GOLD}" font-weight="700" letter-spacing="2">BADGE D'ATTITUDE</text>
${badgeBlock}

<!-- DATE DE VALIDATION -->
<rect x="36" y="380" width="${PAGE_W - 72}" height="120" rx="10"
  fill="white" fill-opacity="0.5"/>
<text x="${PAGE_W / 2 - 110}" y="420" font-size="12"
  font-family="DejaVu,sans-serif" fill="${GOLD}" font-weight="700" letter-spacing="1">DATE DE VALIDATION</text>
<text x="${PAGE_W / 2 - 80}" y="450" font-size="22" text-anchor="middle">📅</text>
<text x="${PAGE_W / 2}" y="460" font-size="22" font-family="DejaVu,sans-serif"
  font-weight="700" fill="${GREEN}">${esc(validatedFmt)}</text>

<!-- Nimipiko seal -->
<circle cx="${PAGE_W - 80}" cy="470" r="44"
  fill="none" stroke="${GREEN}" stroke-width="2"/>
<text x="${PAGE_W - 80}" y="458" text-anchor="middle"
  font-size="9" font-family="DejaVu,sans-serif" fill="${GREEN}" letter-spacing="0.5">NIMIPIKO</text>
<text x="${PAGE_W - 80}" y="475" text-anchor="middle" font-size="16">🌿</text>
<text x="${PAGE_W - 80}" y="490" text-anchor="middle"
  font-size="8" font-family="DejaVu,sans-serif" fill="${GREEN}" letter-spacing="0.3">OFFICIELLEMENT VALIDÉ</text>

<!-- Travel stamp effect -->
<circle cx="120" cy="480" r="50" fill="none" stroke="${GREEN}" stroke-width="3" opacity="0.3"/>
<text x="120" y="488" text-anchor="middle" font-size="11"
  font-family="DejaVu,sans-serif" fill="${GREEN}" opacity="0.4" letter-spacing="0.5">NIMIPIKO</text>

<!-- Signature line -->
<line x1="${PAGE_W / 2 - 100}" y1="770" x2="${PAGE_W / 2 + 100}" y2="770"
  stroke="${NAVY}" stroke-width="1" opacity="0.3"/>
<text x="${PAGE_W / 2}" y="790" text-anchor="middle"
  font-size="11" font-family="DejaVu,sans-serif" fill="${NAVY}" opacity="0.4">
  SIGNATURE DU CHAMPION
</text>

<!-- Next story visa or completion badge -->
${nextStoryBlock}

<!-- Page number -->
<text x="${PAGE_W / 2}" y="${PAGE_H - 18}" text-anchor="middle"
  font-size="10" font-family="DejaVu,sans-serif" fill="${GOLD}" opacity="0.4">
  p. ${bookNum + 1} / 13
</text>
</svg>`;
}
