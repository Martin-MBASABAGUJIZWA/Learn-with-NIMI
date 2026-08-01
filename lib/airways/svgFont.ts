import fs from 'fs'
import path from 'path'

let _cache: string | null = null

/** Returns an SVG <style> block with DejaVu fonts embedded as data URIs.
 *  Cached after first call so each request only pays the disk-read cost once.
 *  librsvg (used by sharp for SVG→PNG) resolves @font-face data URIs without
 *  needing system fontconfig — this makes text render correctly on Vercel Lambda. */
export function svgFontStyle(): string {
  if (_cache) return _cache
  try {
    const dir   = path.join(process.cwd(), 'public', 'fonts')
    const bold  = fs.readFileSync(path.join(dir, 'DejaVuSans-Bold.ttf')).toString('base64')
    const reg   = fs.readFileSync(path.join(dir, 'DejaVuSans.ttf')).toString('base64')
    _cache = `<style>
@font-face{font-family:'DejaVu';src:url('data:font/truetype;base64,${bold}');font-weight:bold}
@font-face{font-family:'DejaVu';src:url('data:font/truetype;base64,${reg}');font-weight:normal}
</style>`
  } catch {
    _cache = '' // fonts not found — fall back to system fonts
  }
  return _cache
}
