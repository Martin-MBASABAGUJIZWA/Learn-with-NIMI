// ══════════════════════════════════════════════════════════════
//  NIMIPIKO AIRWAYS — Boarding-Pass SVG builder
//
//  Generates an SVG that matches the Nimipiko Airways boarding-
//  pass design (white / navy / gold, CARTE D'EMBARQUEMENT).
//
//  Personalized:  child name + age + photo + current destination
//  Generic:       "PETIT CHAMPION" placeholder, no photo
// ══════════════════════════════════════════════════════════════

const W = 900;
const H = 1120;

const GOLD   = "#C9A84C";
const NAVY   = "#0D1B35";
const GREEN  = "#1A7A3E";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Small leaf SVG element */
function leaf(x: number, y: number, rot = 0) {
  return `<ellipse cx="${x}" cy="${y}" rx="10" ry="5" fill="${GREEN}" opacity="0.8"
    transform="rotate(${rot} ${x} ${y})"/>`;
}

/** Row of a boarding-pass field.
 *  icon  = emoji or text used as icon
 *  label = left label (small caps)
 *  value = right bold value
 *  valueColor = optional color for value */
function fieldRow(opts: {
  icon: string;
  label: string;
  value: string;
  y: number;
  valueColor?: string;
}) {
  const { icon, label, value, y, valueColor = NAVY } = opts;
  return `
  <text x="110" y="${y}" font-size="22" font-family="Arial,sans-serif">${icon}</text>
  <text x="145" y="${y}" font-size="13" font-family="Arial,sans-serif"
    fill="${GOLD}" font-weight="700" letter-spacing="1">${esc(label)}</text>
  <text x="145" y="${y + 22}" font-size="19" font-family="Arial Black,sans-serif"
    font-weight="900" fill="${valueColor}">${esc(value)}</text>`;
}

function rightFieldRow(opts: {
  icon: string;
  label: string;
  value: string;
  y: number;
  valueColor?: string;
}) {
  const { icon, label, value, y, valueColor = NAVY } = opts;
  return `
  <text x="510" y="${y}" font-size="22" font-family="Arial,sans-serif">${icon}</text>
  <text x="544" y="${y}" font-size="13" font-family="Arial,sans-serif"
    fill="${GOLD}" font-weight="700" letter-spacing="1">${esc(label)}</text>
  <text x="544" y="${y + 22}" font-size="19" font-family="Arial Black,sans-serif"
    font-weight="900" fill="${valueColor}">${esc(value)}</text>`;
}

export interface BoardingPassOptions {
  /** child's display name */
  name: string;
  /** "X ANS" format e.g. "3 ANS" */
  ageLabel: string;
  /** "PETIT CHAMPION" | "GRAND CHAMPION" */
  statusLabel: string;
  /** "NMP101" */
  vol: string;
  /** "NIMI À L'ÉCOLE" */
  destination: string;
  /** "1" */
  livreNum: string;
  /** "3A" */
  siege: string;
  /** "G1" */
  porte: string;
  /** "OUVERT" | "EN ATTENTE" */
  embarquement: string;
  /** base64 data URI of child photo (optional) */
  photoDataUri: string | null;
  /** base64 data URI of QR code PNG */
  qrDataUri: string;
}

export function buildBoardingPassSvg(opts: BoardingPassOptions): string {
  const {
    name, ageLabel, statusLabel, vol, destination,
    livreNum, siege, porte, embarquement, photoDataUri, qrDataUri,
  } = opts;

  const hasPhoto = !!photoDataUri;

  // Photo area: left column when present
  const photoBlock = hasPhoto
    ? `<rect x="58" y="295" width="160" height="195" rx="12"
        fill="none" stroke="${GOLD}" stroke-width="2.5"/>
      <image href="${photoDataUri}" x="62" y="299" width="152" height="187"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
    : "";

  // Field layout: shift left edge depending on whether photo is shown
  const fieldX = hasPhoto ? 240 : 110;

  function row(icon: string, label: string, value: string, y: number, col: "left" | "right" = "left", valueColor = NAVY) {
    const x = col === "left" ? fieldX : (hasPhoto ? 570 : 510);
    const lx = x + 35;
    return `
  <text x="${x}" y="${y}" font-size="22" font-family="Arial,sans-serif">${icon}</text>
  <text x="${lx}" y="${y}" font-size="13" font-family="Arial,sans-serif"
    fill="${GOLD}" font-weight="700" letter-spacing="1">${esc(label)}</text>
  <text x="${lx}" y="${y + 22}" font-size="19" font-family="Arial Black,sans-serif"
    font-weight="900" fill="${valueColor}">${esc(value)}</text>`;
  }

  const embarquementColor = embarquement === "OUVERT" ? GREEN : GOLD;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <clipPath id="photoClip">
    <rect x="62" y="299" width="152" height="187" rx="10"/>
  </clipPath>
  <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#FFFFFF"/>
    <stop offset="100%" stop-color="#F9F7F2"/>
  </linearGradient>
  <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#00000018"/>
  </filter>
</defs>

<!-- Card background -->
<rect width="${W}" height="${H}" fill="url(#bgGrad)" rx="22" filter="url(#cardShadow)"/>

<!-- Outer gold border -->
<rect x="12" y="12" width="${W - 24}" height="${H - 24}" rx="16"
  fill="none" stroke="${GOLD}" stroke-width="3"/>
<!-- Inner gold border -->
<rect x="20" y="20" width="${W - 40}" height="${H - 40}" rx="12"
  fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.5"/>

<!-- Header navy bar -->
<rect x="12" y="12" width="${W - 24}" height="120" rx="16"
  fill="${NAVY}"/>
<rect x="12" y="90" width="${W - 24}" height="42" fill="${NAVY}"/>

<!-- NIMIPIKO AIRWAYS -->
<text x="${W / 2}" y="72" text-anchor="middle"
  font-size="52" font-family="Arial Black,sans-serif" font-weight="900"
  fill="white" letter-spacing="2">NIMIPIKO AIRWAYS</text>

<!-- CARTE D'EMBARQUEMENT subtitle -->
<text x="${W / 2}" y="118" text-anchor="middle"
  font-size="22" font-family="Arial Black,sans-serif" font-weight="900"
  fill="${GOLD}" letter-spacing="3">CARTE D'EMBARQUEMENT</text>

<!-- Circular seal top-right -->
<circle cx="${W - 80}" cy="76" r="44" fill="none" stroke="${GOLD}" stroke-width="2"/>
<circle cx="${W - 80}" cy="76" r="36" fill="none" stroke="${GOLD}" stroke-width="1" opacity="0.6"/>
<text x="${W - 80}" y="65" text-anchor="middle" font-size="9"
  font-family="Arial,sans-serif" fill="${GOLD}" letter-spacing="0.5">BIBLIOTHÈQUE DES CHAMPIONS</text>
<text x="${W - 80}" y="78" text-anchor="middle" font-size="16"
  font-family="Arial,sans-serif">✈️</text>
<text x="${W - 80}" y="94" text-anchor="middle" font-size="9"
  font-family="Arial,sans-serif" fill="${GOLD}" letter-spacing="0.5">PASSE DE DÉPART</text>

<!-- Tagline -->
<text x="${W / 2}" y="165" text-anchor="middle"
  font-size="18" font-family="Georgia,serif" font-style="italic"
  fill="#6B7280">Chaque histoire est une nouvelle destination.</text>

<!-- Divider after tagline -->
<line x1="50" y1="180" x2="${W - 50}" y2="180" stroke="${GOLD}" stroke-width="1.5" opacity="0.6"/>

<!-- Champion name section -->
<text x="${fieldX}" y="230" font-size="13" font-family="Arial,sans-serif"
  fill="${GOLD}" font-weight="700" letter-spacing="2">CHAMPION :</text>
<text x="${fieldX}" y="260" font-size="32" font-family="Arial Black,sans-serif"
  font-weight="900" fill="${NAVY}">${esc(name.toUpperCase())}</text>

<!-- Divider below name -->
<line x1="${fieldX}" y1="272" x2="${W - 50}" y2="272" stroke="#E5E7EB" stroke-width="1"/>

<!-- Photo block (personalized only) -->
${photoBlock}

<!-- Fields left column -->
${row("🎂", "ÂGE :", ageLabel, hasPhoto ? 315 : 315)}
${row("🛡️", "STATUT :", statusLabel, hasPhoto ? 365 : 365, "left", GREEN)}
${row("✈️", "VOL :", vol, hasPhoto ? 415 : 415)}
${row("🎒", "DESTINATION :", destination, hasPhoto ? 465 : 465)}
${row("📖", "LIVRE :", livreNum, hasPhoto ? 515 : 515)}

<!-- Fields right column -->
${row("💺", "SIÈGE :", siege, hasPhoto ? 315 : 315, "right")}
${row("🚪", "PORTE :", porte, hasPhoto ? 365 : 365, "right")}
${row("🎫", "EMBARQUEMENT :", embarquement, hasPhoto ? 415 : 415, "right", embarquementColor)}

<!-- Horizontal divider (dashed) -->
<line x1="50" y1="585" x2="${W - 50}" y2="585"
  stroke="${GOLD}" stroke-width="1.5" stroke-dasharray="12,6"/>

<!-- Perforation dots at dashed line -->
<circle cx="28" cy="585" r="18" fill="url(#bgGrad)"/>
<circle cx="${W - 28}" cy="585" r="18" fill="url(#bgGrad)"/>

<!-- QR code -->
<image href="${qrDataUri}" x="${W / 2 - 90}" y="605" width="180" height="180"/>

<!-- Footer text -->
${leaf(W / 2 - 195, 815, -30)}
<text x="${W / 2}" y="820" text-anchor="middle"
  font-size="16" font-family="Arial Black,sans-serif" font-weight="900"
  fill="${GOLD}" letter-spacing="2">✈ SCANNE POUR DÉBUTER TON VOYAGE ✈</text>
${leaf(W / 2 + 195, 815, 30)}

<text x="${W / 2}" y="850" text-anchor="middle"
  font-size="15" font-family="Georgia,serif" font-style="italic"
  fill="#6B7280">Bon voyage, Petit Champion !</text>

<!-- Corner leaves -->
${leaf(50, 200, -30)}
${leaf(W - 50, 200, 30)}
${leaf(50, H - 80, -30)}
${leaf(W - 50, H - 80, 30)}

<!-- Watermark -->
<text x="${W / 2}" y="${H - 15}" text-anchor="middle"
  font-size="10" font-family="Arial,sans-serif" fill="#D1D5DB" opacity="0.6">
  nimipiko.com · Chaque histoire est une nouvelle destination.
</text>
</svg>`;
}
