'use client'
import { useEffect, useRef, useState } from 'react'
import { getCachedAdmin } from './adminAuth'
import { Layers, Menu, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
  onNavigate: (t: string) => void
  onOpenSidebar?: () => void
}


interface FieldDef {
  key: string
  label: string
  type: 'area' | 'text'
  sample: string
  clip?: 'oval' | 'rounded'   // visual shape shown in editor; oval = ellipse clip in builder
}

interface Pos { x: number; y: number; w: number; h: number; size: number; color?: string }

// ── Champion Kit ─────────────────────────────────────────────────────────────
const FIELDS_KIT: FieldDef[] = [
  { key: 'photo',        label: 'Photo (pass)',   type: 'area', sample: '' },
  { key: 'handle_photo', label: 'Photo (handle)', type: 'area', sample: '' },
  { key: 'champion',     label: 'Champion',       type: 'text', sample: 'KETSIA' },
  { key: 'age',          label: 'Âge',            type: 'text', sample: '7 ANS' },
  { key: 'statut',       label: 'Statut',         type: 'text', sample: 'PETIT CHAMPION' },
  { key: 'vol',          label: 'Vol',            type: 'text', sample: 'NMP101' },
  { key: 'destination',  label: 'Destination',    type: 'text', sample: 'LE LION ET LA FORÊT' },
  { key: 'livre',        label: 'Livre',          type: 'text', sample: '1' },
  { key: 'siege',        label: 'Siège',          type: 'text', sample: '7A' },
  { key: 'porte',        label: 'Porte',          type: 'text', sample: 'G1' },
  { key: 'embarquement', label: 'Embarquement',   type: 'text', sample: 'OUVERT' },
  { key: 'barcode',      label: 'Barcode',        type: 'area', sample: '' },
  { key: 'qr',           label: 'QR Code',        type: 'area', sample: '' },
]

const INIT_KIT: Record<string, Pos> = {
  photo:        { x: 638,  y: 518, w: 133, h: 195, size: 0  },
  handle_photo: { x: 490,  y: 30,  w: 270, h: 170, size: 0  },
  champion:     { x: 887,  y: 507, w: 150, h: 33,  size: 24 },
  age:          { x: 836,  y: 537, w: 150, h: 33,  size: 20 },
  statut:       { x: 858,  y: 564, w: 150, h: 33,  size: 20 },
  vol:          { x: 846,  y: 599, w: 150, h: 33,  size: 20 },
  destination:  { x: 895,  y: 625, w: 150, h: 33,  size: 18 },
  livre:        { x: 856,  y: 646, w: 150, h: 33,  size: 20 },
  siege:        { x: 856,  y: 667, w: 150, h: 33,  size: 20 },
  porte:        { x: 863,  y: 690, w: 150, h: 33,  size: 20 },
  embarquement: { x: 906,  y: 712, w: 150, h: 33,  size: 20 },
  barcode:      { x: 613,  y: 751, w: 382, h: 40,  size: 0  },
  qr:           { x: 1016, y: 958, w: 148, h: 148, size: 0  },
}

const COLORS_KIT: Record<string, string> = {
  champion: '#1a1a2e', age: '#1a1a2e', statut: '#16a34a', vol: '#1a1a2e',
  destination: '#1a1a2e', livre: '#1a1a2e', siege: '#1a1a2e', porte: '#1a1a2e',
  embarquement: '#16a34a',
}

// ── Boarding Pass ─────────────────────────────────────────────────────────────
const FIELDS_BP: FieldDef[] = [
  { key: 'photo',        label: 'Photo',        type: 'area', sample: '' },
  { key: 'name',         label: 'Nom',          type: 'text', sample: 'KETSIA' },
  { key: 'age',          label: 'Âge',          type: 'text', sample: '7 ANS' },
  { key: 'statut',       label: 'Statut',       type: 'text', sample: 'PETIT CHAMPION' },
  { key: 'vol',          label: 'Vol',          type: 'text', sample: 'NMP101' },
  { key: 'destination',  label: 'Destination',  type: 'text', sample: 'LE LION ET LA FORÊT' },
  { key: 'livre',        label: 'Livre',        type: 'text', sample: '1' },
  { key: 'siege',        label: 'Siège',        type: 'text', sample: '7A' },
  { key: 'porte',        label: 'Porte',        type: 'text', sample: 'G1' },
  { key: 'embarquement', label: 'Embarquement', type: 'text', sample: 'OUVERT' },
  { key: 'barcode',      label: 'Barcode',      type: 'area', sample: '' },
]

const INIT_BP: Record<string, Pos> = {
  photo:        { x: 139, y: 362, w: 295, h: 372, size: 0  },
  name:         { x: 698, y: 293, w: 350, h: 52,  size: 52 },
  age:          { x: 610, y: 373, w: 350, h: 28,  size: 28 },
  statut:       { x: 650, y: 434, w: 350, h: 28,  size: 28 },
  vol:          { x: 652, y: 491, w: 350, h: 28,  size: 28 },
  destination:  { x: 761, y: 549, w: 350, h: 28,  size: 28 },
  livre:        { x: 679, y: 603, w: 350, h: 28,  size: 28 },
  siege:        { x: 675, y: 661, w: 350, h: 28,  size: 28 },
  porte:        { x: 688, y: 715, w: 350, h: 28,  size: 28 },
  embarquement: { x: 751, y: 771, w: 350, h: 28,  size: 28 },
  barcode:      { x: 87,  y: 845, w: 920, h: 100, size: 0  },
}

const COLORS_BP: Record<string, string> = {
  name: '#1a1a2e', age: '#1a1a2e', statut: '#16a34a', vol: '#1a1a2e',
  destination: '#1a1a2e', livre: '#1a1a2e', siege: '#1a1a2e', porte: '#1a1a2e',
  embarquement: '#16a34a',
}

// ── Template registry — add new templates here ────────────────────────────────
// slug  = storage filename (e.g. "passport-cover") + DB template key
// To add a new template: upload <slug>.png via Airways Templates,
// add its entry below, and implement the matching image builder.
interface TemplateConfig {
  slug: string        // airways-templates/<slug>.{png,jpg,...}
  label: string       // shown in the tab bar
  W: number           // canvas width  (matches image builder)
  H: number           // canvas height (matches image builder)
  fields: FieldDef[]
  init: Record<string, Pos>
  colors: Record<string, string>
}

// ── Passport Interior spread (landscape, left=identity, right=destination) ────
const FIELDS_PASSPORT: FieldDef[] = [
  // Left side — identity (per-kid, fixed at registration)
  { key: 'photo',         label: 'Photo',              type: 'area', sample: '' },
  { key: 'attitude_badge',label: 'Attitude Badge',     type: 'area', sample: '' },
  { key: 'qr',            label: 'QR Code',            type: 'area', sample: '' },
  { key: 'name',          label: 'Nom du champion',    type: 'text', sample: 'KETSIA' },
  { key: 'champion',      label: 'N° Champion',        type: 'text', sample: 'KET-A-001' },
  { key: 'date',          label: 'Date de création',   type: 'text', sample: '01 / 01 / 2025' },
  // Right side — destination (changes per story)
  { key: 'dest_num',   label: 'Destination N°',       type: 'text', sample: '1' },
  { key: 'title',      label: 'Titre histoire',        type: 'text', sample: 'NIMI À L\'ÉCOLE' },
  { key: 'book_icon',  label: 'Icône livre (sac)',     type: 'area', sample: '', clip: 'oval' },
  { key: 'livre_num',  label: 'LIVRE N° (au-dessus)',  type: 'text', sample: 'LIVRE 1' },
  { key: 'book_cover', label: 'Couverture livre',      type: 'area', sample: '', clip: 'oval' },
  { key: 'cover_name', label: 'Titre (sous oval)',     type: 'text', sample: 'NIMI À L\'ÉCOLE' },
  { key: 'date_val',   label: 'Date validation',       type: 'text', sample: '01 / 01 / 2025' },
  { key: 'next_cover', label: 'Couverture suivante',   type: 'area', sample: '' },
  { key: 'next_title', label: 'Titre suivant',         type: 'text', sample: 'HISTOIRE 2' },
]

const INIT_PASSPORT: Record<string, Pos> = {
  // ── Left identity page (x: 0–1100) ──
  photo:          { x: 60,  y: 310, w: 210, h: 265, size: 0 },
  attitude_badge: { x: 1595, y: 210, w: 455, h: 230, size: 0 },
  qr:             { x: 455, y: 370, w: 148, h: 148, size: 0 },
  name:           { x: 300, y: 335, w: 400, h: 40,  size: 36 },
  champion:       { x: 300, y: 410, w: 300, h: 30,  size: 26 },
  date:           { x: 300, y: 478, w: 300, h: 26,  size: 22 },
  // ── Right destination page (x: 1100–2200) ──
  dest_num:   { x: 1800, y: 68,  w: 150, h: 26,  size: 22 },
  title:      { x: 1145, y: 132, w: 950, h: 48,  size: 40 },
  book_icon:  { x: 1260, y: 15,  w: 100, h: 100, size: 0  },
  livre_num:  { x: 1145, y: 220, w: 225, h: 36,  size: 28 },
  book_cover: { x: 1145, y: 262, w: 225, h: 315, size: 0  },
  cover_name: { x: 1145, y: 592, w: 225, h: 40,  size: 22 },
  date_val:   { x: 1145, y: 628, w: 300, h: 34,  size: 28 },
  next_cover: { x: 1148, y: 758, w: 100, h: 125, size: 0  },
  next_title: { x: 1270, y: 776, w: 450, h: 26,  size: 22 },
}

const COLORS_PASSPORT: Record<string, string> = {
  name: '#0D1B30', champion: '#0D1B30', date: '#0D1B30',
  dest_num: '#1A7A3E', title: '#0D1B30', date_val: '#0D1B30', next_title: '#0D1B30',
}

// ── Attitude Badge (1080×1080, same aspect as champion-kit) ──────────────────
// child_photo: bounding box of the avatar circle (center = x+w/2, y+h/2 ; r = w/2)
// piko:        bounding box where Piko is contain-fitted
// attitude:    text anchor for the attitude label (centred at x, y)
// bottom_text: text anchor for the bottom banner  (centred at x, y)
const FIELDS_BADGE: FieldDef[] = [
  { key: 'child_photo', label: 'Photo enfant', type: 'area', sample: '' },
  { key: 'piko',        label: 'Piko',         type: 'area', sample: '' },
  { key: 'attitude',    label: 'Attitude (arc haut)',  type: 'text', sample: 'SUPER CURIEUX' },
  { key: 'bottom_text', label: 'Titre (arc bas)',     type: 'text', sample: 'NIMI À L\'ÉCOLE • CHAMPION DU LIVRE 1' },
]

const INIT_BADGE: Record<string, Pos> = {
  child_photo: { x: 407, y: 503, w: 330, h: 380, size: 0   },
  piko:        { x: 571, y: 499, w: 275, h: 340, size: 0   },
  // Arc text — y = vertical centre of text; w = left curve radius; h = right curve radius; size = font px
  attitude:    { x: 630, y: 362, w: 1500, h: 1500, size: 85 },
  bottom_text: { x: 637, y: 1178, w: 1800, h: 1800, size: 36 },
}

const COLORS_BADGE: Record<string, string> = {
  attitude:    '#7A5100',
  bottom_text: '#C9A227',
}

const TEMPLATE_REGISTRY: TemplateConfig[] = [
  {
    slug: 'champion-kit', label: 'Champion Kit',
    W: 1254, H: 1254,
    fields: FIELDS_KIT, init: INIT_KIT, colors: COLORS_KIT,
  },
  {
    slug: 'boarding-pass', label: 'Boarding Pass',
    W: 1080, H: 1080,
    fields: FIELDS_BP, init: INIT_BP, colors: COLORS_BP,
  },
  {
    slug: 'passport-interior', label: 'Passport (spread)',
    W: 2200, H: 1100,
    fields: FIELDS_PASSPORT, init: INIT_PASSPORT, colors: COLORS_PASSPORT,
  },
  {
    slug: 'badge-template', label: 'Champion Attitude Badge',
    W: 1080, H: 1080,
    fields: FIELDS_BADGE, init: INIT_BADGE, colors: COLORS_BADGE,
  },
]

type TemplateKey = string  // now just the slug string

// ─────────────────────────────────────────────────────────────────────────────
export default function KitLayoutEditor({ onNavigate, onOpenSidebar }: Props) {
  const { error: toastErr } = useToast()

  const [admin,    setAdmin]    = useState<{ name: string; role: string } | null>(null)
  const [template, setTemplate] = useState<TemplateKey>(TEMPLATE_REGISTRY[0].slug)
  const [pos,      setPos]      = useState<Record<string, Pos>>({ ...TEMPLATE_REGISTRY[0].init })
  const [sel,      setSel]      = useState(TEMPLATE_REGISTRY[0].fields[0].key)
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ ok: boolean; msg: string } | null>(null)
  const [imgSrc,   setImgSrc]   = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [loading,  setLoading]  = useState(false)
  // Actual pixel dimensions of the loaded template image
  const [imgNatW, setImgNatW] = useState(0)
  const [imgNatH, setImgNatH] = useState(0)

  const cfg = TEMPLATE_REGISTRY.find(t => t.slug === template) ?? TEMPLATE_REGISTRY[0]

  // Use actual image dimensions when available, fall back to config
  const viewW = imgNatW || cfg.W
  const viewH = imgNatH || cfg.H

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef       = useRef<SVGSVGElement>(null)
  const dragging     = useRef(false)
  const grabOffset   = useRef({ x: 0, y: 0 })
  const selRef       = useRef(sel)
  const viewWRef     = useRef(viewW)
  const viewHRef     = useRef(viewH)
  // drag modes: move, resize edges, arc curve handles
  const dragMode     = useRef<'pos' | 'resizeN' | 'resizeS' | 'resizeE' | 'resizeW' | 'curveL' | 'curveR'>('pos')
  const curveSign    = useRef(1)   // +1 attitude, -1 bottom
  const curveHalfW   = useRef(300) // half text width in image px at drag start
  const curveBaseY   = useRef(0)   // apex y at drag start
  useEffect(() => { selRef.current = sel }, [sel])
  useEffect(() => { viewWRef.current = viewW; viewHRef.current = viewH }, [viewW, viewH])

  // ── Convert client coords → image-space (uses actual image px) ───
  function containerXY(clientX: number, clientY: number) {
    const r = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.round((clientX - r.left) / r.width  * viewWRef.current),
      y: Math.round((clientY - r.top)  / r.height * viewHRef.current),
    }
  }

  function startDrag(e: React.PointerEvent, fieldKey: string) {
    e.preventDefault()
    e.stopPropagation()
    setSel(fieldKey)
    selRef.current = fieldKey
    dragMode.current = 'pos'
    dragging.current = true
    svgRef.current!.setPointerCapture(e.pointerId)
    const { x, y } = containerXY(e.clientX, e.clientY)
    const p = pos[fieldKey]
    grabOffset.current = { x: x - p.x, y: y - p.y }
  }

  function startResize(e: React.PointerEvent, fieldKey: string, edge: 'N' | 'S' | 'E' | 'W') {
    e.preventDefault()
    e.stopPropagation()
    setSel(fieldKey)
    selRef.current = fieldKey
    dragMode.current = `resize${edge}` as typeof dragMode.current
    dragging.current = true
    svgRef.current!.setPointerCapture(e.pointerId)
    grabOffset.current = { x: 0, y: 0 }
  }

  function startCurveDrag(
    e: React.PointerEvent, fieldKey: string,
    halfW: number, baseY: number, sign: number, side: 'L' | 'R',
  ) {
    e.preventDefault()
    e.stopPropagation()
    setSel(fieldKey)
    selRef.current = fieldKey
    dragMode.current = side === 'L' ? 'curveL' : 'curveR'
    curveSign.current  = sign
    curveHalfW.current = halfW
    curveBaseY.current = baseY
    dragging.current = true
    svgRef.current!.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    const { x, y } = containerXY(e.clientX, e.clientY)
    const k = selRef.current

    if (dragMode.current === 'curveL' || dragMode.current === 'curveR') {
      const dy = (y - curveBaseY.current) * curveSign.current
      if (dy > 2) {
        const hw = curveHalfW.current
        const newR = Math.round(Math.max(50, hw * hw / (2 * dy)))
        const field = dragMode.current === 'curveL' ? 'w' : 'h'
        setPos(prev => ({ ...prev, [k]: { ...prev[k], [field]: newR } }))
      }
    } else if (dragMode.current.startsWith('resize')) {
      setPos(prev => {
        const p = prev[k]
        const minSz = 10
        switch (dragMode.current) {
          case 'resizeN': {
            const newH = Math.max(minSz, p.y + p.h - y)
            return { ...prev, [k]: { ...p, y, h: newH } }
          }
          case 'resizeS': {
            return { ...prev, [k]: { ...p, h: Math.max(minSz, y - p.y) } }
          }
          case 'resizeE': {
            return { ...prev, [k]: { ...p, w: Math.max(minSz, x - p.x) } }
          }
          case 'resizeW': {
            const newW = Math.max(minSz, p.x + p.w - x)
            return { ...prev, [k]: { ...p, x, w: newW } }
          }
          default: return prev
        }
      })
    } else {
      const isBadgeArc = cfg.slug === 'badge-template' &&
        (k === 'attitude' || k === 'bottom_text')
      if (isBadgeArc) {
        setPos(prev => ({ ...prev, [k]: { ...prev[k], y: y - grabOffset.current.y } }))
      } else {
        setPos(prev => ({ ...prev, [k]: { ...prev[k], x: x - grabOffset.current.x, y: y - grabOffset.current.y } }))
      }
    }
  }

  function handlePointerUp() { dragging.current = false }

  // ── Arrow key nudge ──────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const step = e.shiftKey ? 10 : 1
      const map: Record<string, { x: number; y: number }> = {
        ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
        ArrowUp:   { x: 0, y: -step }, ArrowDown:  { x: 0, y: step },
      }
      const d = map[e.key]
      if (!d) return
      e.preventDefault()
      setSel(k => {
        setPos(prev => ({ ...prev, [k]: { ...prev[k], x: prev[k].x + d.x, y: prev[k].y + d.y } }))
        return k
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Load template image + DB layout whenever template changes ────
  useEffect(() => {
    setImgSrc(null)
    setImgError(false)
    setImgNatW(0)
    setImgNatH(0)
    setLoading(true)

    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/airways-templates/${cfg.slug}`
    let cancelled = false

    void (async () => {
      // Load image
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        try {
          const res = await fetch(`${base}.${ext}`, { method: 'HEAD' })
          if (cancelled) return
          if (res.ok) { setImgSrc(`${base}.${ext}?t=${Date.now()}`); break }
        } catch { /* try next */ }
      }
      if (!cancelled && !imgSrc) setImgError(true)

      // Load DB layout via API
      try {
        const res = await fetch(`/api/airways/kit-layout?template=${template}`)
        if (!res.ok) throw new Error('failed')
        const rows: { field: string; x: number; y: number; w: number | null; h: number | null; font_size: number | null; color: string | null }[] = await res.json()
        if (cancelled) return
        if (rows.length) {
          const next: Record<string, Pos> = { ...cfg.init }
          for (const r of rows) {
            if (!next[r.field]) continue
            next[r.field] = {
              x: r.x ?? next[r.field].x, y: r.y ?? next[r.field].y,
              w: r.w ?? next[r.field].w, h: r.h ?? next[r.field].h,
              size: r.font_size ?? next[r.field].size,
              color: r.color ?? undefined,
            }
          }
          setPos(next)
        } else {
          setPos({ ...cfg.init })
        }
      } catch { toastErr('Failed to load layout') }

      if (!cancelled) setLoading(false)
    })()

    return () => { cancelled = true }
  }, [template]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin profile (once) ──────────────────────────────────────────
  useEffect(() => {
    getCachedAdmin().then(a => { if (a) setAdmin(a) }).catch(() => {})
  }, [])

  // ── Ensure selected field exists in new template ──────────────────
  useEffect(() => {
    if (!cfg.fields.find(f => f.key === sel)) setSel(cfg.fields[0].key)
  }, [template]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset all fields to code defaults (local only — Save when ready) ──
  async function handleReset() {
    if (!confirm(`Reset all ${cfg.label} fields to defaults?`)) return
    setPos({ ...cfg.init })
    setToast({ ok: true, msg: 'Reset to defaults — adjust then Save' })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Save layout ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const rows = cfg.fields.map(f => {
        const p = pos[f.key] ?? cfg.init[f.key]
        return {
          field:      f.key,
          x:          p.x,
          y:          p.y,
          w:          p.w ?? null,
          h:          (f.type === 'area' || (cfg.slug === 'badge-template' && (f.key === 'attitude' || f.key === 'bottom_text')))
                        ? p.h : null,
          font_size:  f.type === 'text' ? p.size : null,
          color:      f.type === 'text' ? (p.color ?? cfg.colors[f.key] ?? null) : null,
          updated_at: new Date().toISOString(),
        }
      })
      const res = await fetch(`/api/airways/kit-layout?template=${template}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`)
      }
      // Re-read from DB to confirm exactly what was stored
      const verify = await fetch(`/api/airways/kit-layout?template=${template}`)
      if (verify.ok) {
        const rows2: { field: string; x: number; y: number; w: number | null; h: number | null; font_size: number | null; color: string | null }[] = await verify.json()
        if (rows2.length) {
          const next: Record<string, Pos> = { ...cfg.init }
          for (const r of rows2) {
            if (!next[r.field]) continue
            next[r.field] = {
              x: r.x ?? next[r.field].x, y: r.y ?? next[r.field].y,
              w: r.w ?? next[r.field].w, h: r.h ?? next[r.field].h,
              size: r.font_size ?? next[r.field].size,
              color: r.color ?? undefined,
            }
          }
          setPos(next)
        }
      }
      setToast({ ok: true, msg: '✓ Saved & verified from DB' })
    } catch (err) {
      setToast({ ok: false, msg: err instanceof Error ? err.message : 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const cur  = pos[sel] ?? cfg.init[sel] ?? { x: 0, y: 0, w: 0, h: 0, size: 0 }
  const curF = cfg.fields.find(f => f.key === sel) ?? cfg.fields[0]

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <button onClick={onOpenSidebar} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 shadow-sm mt-0.5">
              <Menu size={17} />
            </button>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 flex-shrink-0 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">Template Layout Editor</h1>
              <p className="text-sm text-gray-500 mt-0.5">Select a field → drag or ← → ↑ ↓ keys → Save.</p>
              <p className="text-xs text-gray-400 mt-1">
                <button onClick={() => onNavigate('Dashboard')} className="font-bold hover:underline text-green-600">Dashboard</button>
                <span className="mx-1 text-gray-300">/</span>
                <span className="font-bold text-gray-500">Template Layout</span>
              </p>
            </div>
          </div>
          {admin && (
            <div className="flex items-center gap-2 bg-white border border-gray-100 pl-1.5 pr-3 py-1.5 rounded-full shadow-sm">
              <img src="/nimi-logo-circle.png" alt="" className="w-7 h-7 rounded-full object-cover ring-2 ring-white" loading="lazy" />
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-gray-700">{admin.name}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{admin.role}</p>
              </div>
            </div>
          )}
        </div>

        {/* Template tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {TEMPLATE_REGISTRY.map(t => (
            <button
              key={t.slug}
              onClick={() => setTemplate(t.slug)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition border ${
                template === t.slug
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* Canvas */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-700 text-sm">
                Editing: <span className="text-red-500">{curF.label}</span>
                <span className="ml-2 text-xs font-normal text-gray-400">{cfg.label} · {cfg.W}×{cfg.H}</span>
              </p>
              <span className="text-xs font-mono text-gray-400">x={cur.x} y={cur.y}</span>
            </div>

            <div
              ref={containerRef}
              style={{ position: 'relative', userSelect: 'none', aspectRatio: `${viewW} / ${viewH}`, width: '100%' }}
            >
              {loading ? (
                <div className="w-full h-full absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
                </div>
              ) : imgSrc ? (
                <img src={imgSrc} alt="Template"
                  onLoad={e => {
                    const img = e.currentTarget
                    const nw = img.naturalWidth
                    const nh = img.naturalHeight
                    setImgNatW(nw)
                    setImgNatH(nh)
                    // Clamp any field that landed off-canvas (e.g. old DB coords from a different
                    // coordinate space) back to a visible position inside the template bounds.
                    setPos(prev => {
                      const next = { ...prev }
                      for (const key of Object.keys(next)) {
                        const p = next[key]
                        if (p.x >= nw || p.y >= nh) {
                          const init = cfg.init[key]
                          next[key] = init
                            ? { ...p, x: Math.min(init.x, nw - 20), y: Math.min(init.y, nh - 20) }
                            : { ...p, x: Math.min(p.x, nw - 20),    y: Math.min(p.y, nh - 20) }
                        }
                      }
                      return next
                    })
                  }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                  draggable={false} />
              ) : (
                <div className="w-full h-full absolute inset-0 bg-gray-100 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Layers className="w-12 h-12 opacity-40" />
                  <p className="font-bold text-sm text-gray-500">No template uploaded</p>
                  <p className="text-xs">Upload <code>{cfg.slug}.png</code> via Admin → Airways Templates</p>
                </div>
              )}

              {imgSrc && (
                <svg
                  ref={svgRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
                  viewBox={`0 0 ${viewW} ${viewH}`}
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {(() => {
                    // Base unit scaled to template size — keeps handles ~20px on screen
                    const u = Math.round(viewW / 28)
                    // Render selected field LAST so it always sits on top in SVG z-order
                    const ordered = [
                      ...cfg.fields.filter(f => f.key !== sel),
                      ...cfg.fields.filter(f => f.key === sel),
                    ]
                    return ordered.map(f => {
                      const p   = pos[f.key] ?? cfg.init[f.key]
                      const hot = f.key === sel
                      if (!p) return null

                      if (f.type === 'area') {
                        const cx = p.x + p.w / 2
                        const cy = p.y + p.h / 2
                        const isOval = f.clip === 'oval'
                        const rx = p.w / 2
                        const ry = p.h / 2
                        const outlineProps = {
                          fill:            hot ? 'rgba(239,68,68,0.08)' : 'none',
                          stroke:          hot ? '#ef4444' : 'rgba(99,102,241,0.4)',
                          strokeWidth:     hot ? Math.max(3, u * 0.15) : Math.max(1, u * 0.08),
                          strokeDasharray: hot ? 'none' : `${u*0.4} ${u*0.3}`,
                          pointerEvents:   'none' as const,
                        }
                        return (
                          <g key={f.key}>
                            {/* outline — oval or rect */}
                            {isOval
                              ? <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...outlineProps} />
                              : <rect x={p.x} y={p.y} width={p.w} height={p.h} {...outlineProps} />
                            }
                            {/* drag zone — same shape, transparent */}
                            {isOval
                              ? <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
                                  fill="transparent"
                                  onPointerDown={e => startDrag(e, f.key)}
                                  style={{ cursor: 'grab' }} />
                              : <rect x={p.x} y={p.y} width={p.w} height={p.h}
                                  fill="transparent"
                                  onPointerDown={e => startDrag(e, f.key)}
                                  style={{ cursor: 'grab' }} />
                            }
                            {/* center move handle */}
                            <circle cx={cx} cy={cy} r={hot ? u * 0.7 : u * 0.45}
                              fill={hot ? '#ef4444' : 'rgba(99,102,241,0.65)'}
                              stroke="white" strokeWidth={Math.max(2, u * 0.1)}
                              onPointerDown={e => startDrag(e, f.key)}
                              style={{ cursor: 'grab' }} />
                            <line x1={cx - u*0.4} y1={cy} x2={cx + u*0.4} y2={cy}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />
                            <line x1={cx} y1={cy - u*0.4} x2={cx} y2={cy + u*0.4}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />

                            {/* N / S / E / W resize handles — always visible for area fields */}
                            {([
                              { edge: 'N' as const, hx: cx,        hy: p.y,        cursor: 'ns-resize'   },
                              { edge: 'S' as const, hx: cx,        hy: p.y + p.h,  cursor: 'ns-resize'   },
                              { edge: 'E' as const, hx: p.x + p.w, hy: cy,         cursor: 'ew-resize'   },
                              { edge: 'W' as const, hx: p.x,       hy: cy,         cursor: 'ew-resize'   },
                            ]).map(({ edge, hx, hy, cursor }) => (
                              <g key={edge}>
                                <circle cx={hx} cy={hy} r={hot ? u * 0.55 : u * 0.35}
                                  fill={hot ? '#3b82f6' : 'rgba(59,130,246,0.6)'}
                                  stroke="white" strokeWidth={Math.max(1.5, u * 0.08)}
                                  onPointerDown={e => startResize(e, f.key, edge)}
                                  style={{ cursor }} />
                                {hot && (
                                  <text x={hx} y={hy - u*0.6}
                                    fontSize={u*0.38} fill="#3b82f6" fontFamily="Arial,sans-serif" fontWeight={700}
                                    textAnchor="middle" pointerEvents="none">{edge}</text>
                                )}
                              </g>
                            ))}

                            {hot && (
                              <g pointerEvents="none">
                                <rect x={isOval ? cx - p.w/2 : p.x} y={(isOval ? cy - ry : p.y) - u*0.9}
                                  width={u*3.5} height={u*0.8} rx={u*0.15} fill="#ef4444" />
                                <text x={(isOval ? cx - p.w/2 : p.x) + u*0.2}
                                  y={(isOval ? cy - ry : p.y) - u*0.15}
                                  fontSize={u*0.55} fill="white" fontFamily="Arial,sans-serif" fontWeight={700}>
                                  {f.label}
                                </text>
                              </g>
                            )}
                          </g>
                        )
                      }

                      // text field
                      const size  = p.size || 14
                      const color = pos[f.key]?.color ?? cfg.colors[f.key] ?? '#1a1a2e'
                      const dotR  = hot ? u * 0.7 : u * 0.42

                      // Live arc-text preview for badge text fields
                      const isBadgeArc = cfg.slug === 'badge-template' &&
                        (f.key === 'attitude' || f.key === 'bottom_text')

                      if (isBadgeArc) {
                        const isBottom = f.key === 'bottom_text'
                        const fontSize = p.size || (isBottom ? 36 : 85)
                        const sign     = isBottom ? -1 : 1
                        const wL       = Math.max(50, p.w || 1500)
                        const wR       = Math.max(50, p.h || wL)  // 0 or missing → mirrors left side
                        const kL       = sign / (2 * wL)
                        const kR       = sign / (2 * wR)
                        const sample   = f.sample
                        const totalW   = sample.split('').reduce((acc, c) =>
                          acc + fontSize * (c === ' ' ? 0.28 : 0.60), 0)
                        const halfW    = totalW / 2
                        const cx       = p.x
                        const baseY    = p.y
                        const leftEdgeY  = baseY + kL * halfW * halfW
                        const rightEdgeY = baseY + kR * halfW * halfW
                        const startX   = cx - halfW
                        const endX     = cx + halfW
                        // Asymmetric quadratic bezier: control point adjusted so curve
                        // passes through (cx, baseY) at t=0.5
                        const ctrlY    = (4 * baseY - leftEdgeY - rightEdgeY) / 2
                        const pathId   = `arcpath-${f.key}`
                        const pathD    = `M ${startX} ${leftEdgeY} Q ${cx} ${ctrlY} ${endX} ${rightEdgeY}`
                        const edgeY    = (leftEdgeY + rightEdgeY) / 2  // for handle hints

                        const edgeDotR  = dotR * 0.75
                        // Connecting lines from centre to edges
                        return (
                          <g key={f.key}>
                            <defs>
                              <path id={pathId} d={pathD} />
                            </defs>
                            {/* Arc guide line */}
                            <use href={`#${pathId}`} fill="none"
                              stroke={hot ? '#ef444460' : `${color}40`}
                              strokeWidth={Math.max(1, u * 0.06)}
                              strokeDasharray={`${u*0.3} ${u*0.2}`}
                              pointerEvents="none" />
                            {/* Arc text preview */}
                            <text fontFamily="Arial,Helvetica,sans-serif" fontWeight={700}
                              fontSize={fontSize} fill={hot ? '#ef4444' : color}
                              opacity={hot ? 0.92 : 0.55} pointerEvents="none">
                              <textPath href={`#${pathId}`} startOffset="50%" textAnchor="middle">
                                {sample}
                              </textPath>
                            </text>

                            {/* Lines connecting centre ↔ edges */}
                            <line x1={cx} y1={baseY} x2={startX} y2={leftEdgeY}
                              stroke={hot ? '#ef444460' : '#6366f150'} strokeWidth={Math.max(1, u*0.04)}
                              strokeDasharray={`${u*0.2} ${u*0.15}`} pointerEvents="none" />
                            <line x1={cx} y1={baseY} x2={endX} y2={rightEdgeY}
                              stroke={hot ? '#ef444460' : '#6366f150'} strokeWidth={Math.max(1, u*0.04)}
                              strokeDasharray={`${u*0.2} ${u*0.15}`} pointerEvents="none" />

                            {/* LEFT edge handle — controls left side curve (w) */}
                            <circle cx={startX} cy={leftEdgeY} r={edgeDotR}
                              fill={hot ? '#f97316' : 'rgba(249,115,22,0.75)'}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.08)}
                              onPointerDown={e => startCurveDrag(e, f.key, halfW, baseY, sign, 'L')}
                              style={{ cursor: 'ns-resize' }} />

                            {/* RIGHT edge handle — controls right side curve (h) */}
                            <circle cx={endX} cy={rightEdgeY} r={edgeDotR}
                              fill={hot ? '#10b981' : 'rgba(16,185,129,0.75)'}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.08)}
                              onPointerDown={e => startCurveDrag(e, f.key, halfW, baseY, sign, 'R')}
                              style={{ cursor: 'ns-resize' }} />

                            {/* CENTRE handle — drag up/down to move text position */}
                            <circle cx={cx} cy={baseY} r={dotR}
                              fill={hot ? '#ef4444' : 'rgba(99,102,241,0.75)'}
                              stroke="white" strokeWidth={Math.max(2, u * 0.1)}
                              onPointerDown={e => startDrag(e, f.key)}
                              style={{ cursor: 'ns-resize' }} />

                            {hot && <>
                              <line x1={cx - dotR*0.55} y1={baseY} x2={cx + dotR*0.55} y2={baseY}
                                stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />
                              <line x1={cx} y1={baseY - dotR*0.55} x2={cx} y2={baseY + dotR*0.55}
                                stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />
                              <g pointerEvents="none">
                                <rect x={cx + dotR + u*0.1} y={baseY - u*0.45} width={u*3.6} height={u*0.75} rx={u*0.15}
                                  fill="#ef4444" />
                                <text x={cx + dotR + u*0.25} y={baseY + u*0.2}
                                  fontSize={u*0.5} fill="white" fontFamily="Arial,sans-serif" fontWeight={700}>
                                  {f.label}
                                </text>
                              </g>
                              {/* Edge hint labels */}
                              <text x={startX} y={edgeY - edgeDotR - u*0.15}
                                fontSize={u*0.4} fill="#f97316" fontFamily="Arial,sans-serif" fontWeight={700}
                                textAnchor="middle" pointerEvents="none">courbe</text>
                              <text x={endX} y={edgeY - edgeDotR - u*0.15}
                                fontSize={u*0.4} fill="#f97316" fontFamily="Arial,sans-serif" fontWeight={700}
                                textAnchor="middle" pointerEvents="none">courbe</text>
                            </>}
                          </g>
                        )
                      }

                      return (
                        <g key={f.key}>
                          <text x={p.x} y={p.y + size} fontSize={size}
                            fill={hot ? '#ef4444' : color}
                            fontFamily="Arial,Helvetica,sans-serif" fontWeight={700}
                            opacity={hot ? 0.95 : 0.5} pointerEvents="none">
                            {f.sample}
                          </text>
                          <circle cx={p.x} cy={p.y} r={dotR}
                            fill={hot ? '#ef4444' : 'rgba(99,102,241,0.65)'}
                            stroke="white" strokeWidth={Math.max(2, u * 0.1)}
                            onPointerDown={e => startDrag(e, f.key)}
                            style={{ cursor: 'grab' }} />
                          {hot && <>
                            <line x1={p.x - dotR*0.55} y1={p.y} x2={p.x + dotR*0.55} y2={p.y}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />
                            <line x1={p.x} y1={p.y - dotR*0.55} x2={p.x} y2={p.y + dotR*0.55}
                              stroke="white" strokeWidth={Math.max(1.5, u*0.07)} pointerEvents="none" />
                            <g pointerEvents="none">
                              <rect x={p.x + dotR + u*0.1} y={p.y - u*0.45} width={u*3.2} height={u*0.75} rx={u*0.15}
                                fill="#ef4444" />
                              <text x={p.x + dotR + u*0.25} y={p.y + u*0.2}
                                fontSize={u*0.5} fill="white" fontFamily="Arial,sans-serif" fontWeight={700}>
                                {f.label}
                              </text>
                            </g>
                          </>}
                        </g>
                      )
                    })
                  })()}
                </svg>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">

            {/* Selected field controls */}
            <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Editing</p>
                  <p className="font-extrabold text-blue-700 text-base leading-tight">{curF.label}</p>
                </div>
                <button
                  onClick={() => setPos(p => ({ ...p, [sel]: { ...cfg.init[sel] } }))}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-700 underline"
                >Reset</button>
              </div>
              <p className="text-[11px] text-blue-400">Arrow keys = 1px · Shift+Arrow = 10px</p>
              <div className="grid grid-cols-2 gap-2">
                {(['x', 'y'] as const).map(f => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-blue-500 mb-1 block uppercase">{f}</label>
                    <input type="number" value={cur[f]}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], [f]: +e.target.value } }))}
                      className="w-full border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                {curF.type === 'area' && (['w', 'h'] as const).map(f => (
                  <div key={f}>
                    <label className="text-[10px] font-bold text-blue-500 mb-1 block uppercase">{f}</label>
                    <input type="number" value={cur[f]}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], [f]: +e.target.value } }))}
                      className="w-full border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                  </div>
                ))}
                {curF.type === 'text' && (<>
                  <div>
                    <label className="text-[10px] font-bold text-blue-500 mb-1 block">
                      Font size — <span className="text-gray-400 font-normal">{cur.size}px</span>
                    </label>
                    <input type="range" min={10} max={200}
                      value={cur.size}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], size: +e.target.value } }))}
                      className="w-full accent-blue-500" />
                    <input type="number" value={cur.size}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], size: +e.target.value } }))}
                      className="w-full border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500 mt-1" />
                  </div>
                  {cfg.slug === 'badge-template' ? (
                    <div>
                      {(() => {
                        // strength 0=flat … 100=very curved, mapped exponentially to w
                        // w = 8000 * (300/8000)^(strength/100)  →  strength = log(w/8000)/log(300/8000)*100
                        const w = cur.w ?? 1500
                        const strength = Math.round(Math.max(0, Math.min(100,
                          Math.log(w / 8000) / Math.log(300 / 8000) * 100
                        )))
                        const label = strength < 15 ? 'plat' : strength < 40 ? 'léger' : strength < 70 ? 'courbé' : 'très courbé'
                        const setStrength = (s: number) => {
                          const newW = Math.round(8000 * Math.pow(300 / 8000, s / 100))
                          setPos(p => ({ ...p, [sel]: { ...p[sel], w: newW } }))
                        }
                        return (<>
                          <label className="text-[10px] font-bold text-blue-500 mb-1 flex justify-between">
                            <span>Arc</span>
                            <span className="text-gray-400 font-normal">{label} ({strength}%)</span>
                          </label>
                          <input type="range" min={0} max={100} step={1}
                            value={strength}
                            onChange={e => setStrength(+e.target.value)}
                            className="w-full accent-blue-500" />
                          <div className="flex justify-between text-[9px] text-gray-400 mt-0.5 mb-1">
                            <span>plat</span><span>très courbé ▶</span>
                          </div>
                          <input type="number" value={w}
                            onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], w: +e.target.value } }))}
                            className="w-full border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500"
                            placeholder="rayon (ex: 1500)" />
                        </>)
                      })()}
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-blue-500 mb-1 block">Max width</label>
                      <input type="number" value={cur.w}
                        onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], w: +e.target.value } }))}
                        className="w-full border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-blue-500 mb-1 block uppercase">Text Color</label>
                    <div className="flex gap-2 items-center">
                      <input type="color"
                        value={cur.color ?? cfg.colors[sel] ?? '#0D1B30'}
                        onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], color: e.target.value } }))}
                        className="w-10 h-8 rounded border border-blue-300 cursor-pointer p-0.5 bg-white" />
                      <input type="text"
                        value={cur.color ?? cfg.colors[sel] ?? '#0D1B30'}
                        onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], color: e.target.value } }))}
                        className="flex-1 border border-blue-300 bg-white rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </>)}
              </div>
            </div>

            {/* Field list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-700 text-sm mb-3">All fields</p>
              <div className="space-y-1">
                {cfg.fields.map(f => (
                  <button key={f.key} onClick={() => setSel(f.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                      sel === f.key
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span>{f.label}</span>
                    <span className={`text-xs font-mono ${sel === f.key ? 'text-blue-100' : 'text-gray-400'}`}>
                      {pos[f.key]?.x ?? 0},{pos[f.key]?.y ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl shadow transition">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : `Save ${cfg.label} Layout`}
            </button>
            <button onClick={handleReset} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 disabled:opacity-40 text-red-500 border border-red-200 font-bold text-sm py-2 rounded-xl transition">
              <RefreshCw className="w-4 h-4" />
              Reset All to Defaults
            </button>
            <p className="text-center text-xs text-gray-400">
              Drag fields to match your template, then save.
            </p>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-bold z-50 ${toast.ok ? 'bg-green-600' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
