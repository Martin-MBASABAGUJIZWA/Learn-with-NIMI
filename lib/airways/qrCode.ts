import QRCode from "qrcode";

/** Returns a PNG buffer of a QR code for `url`, sized `size×size` px. */
export async function qrPngBuffer(url: string, size = 180): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 1,
    color: { dark: "#1a2a10", light: "#ffffff" },
  });
}

/** Returns QR as base64 PNG data URI. */
export async function qrDataUri(url: string, size = 180): Promise<string> {
  const buf = await qrPngBuffer(url, size);
  return `data:image/png;base64,${buf.toString("base64")}`;
}
