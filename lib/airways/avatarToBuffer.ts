// ══════════════════════════════════════════════════════════════════════════════
//  Renders a Nimipiko avatar config (stored as "ava:{…json…}" in avatar_url)
//  to a PNG Buffer using React's server-side renderToStaticMarkup + sharp.
// ══════════════════════════════════════════════════════════════════════════════
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (element: React.ReactElement) => string }
import React from 'react'
import sharp from 'sharp'
import { parseAvatar, isAvatarConfig } from '@/lib/avatarConfig'
import AvatarSvg from '@/components/avatar/AvatarSvg'

/**
 * Given the raw value stored in `children.avatar_url`:
 * - If it's an avatar config ("ava:{…}") → renders to PNG and returns the Buffer
 * - If it's a real URL → returns null (caller should fetch it normally)
 * - If null/missing → returns null
 */
export async function avatarUrlToBuffer(
  avatarUrl: string | null | undefined,
  size = 295,
): Promise<Buffer | null> {
  if (!avatarUrl || !isAvatarConfig(avatarUrl)) return null

  const cfg = parseAvatar(avatarUrl)
  if (!cfg) return null

  const svgString = renderToStaticMarkup(
    React.createElement(AvatarSvg, { config: cfg, size }),
  )

  // sharp can render SVG via librsvg; wrap in a proper SVG document just in case
  const svgDoc = svgString.startsWith('<svg') ? svgString
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" width="${size}" height="${Math.round(size * 1.2)}">${svgString}</svg>`

  return sharp(Buffer.from(svgDoc))
    .png({ quality: 95 })
    .toBuffer()
}
