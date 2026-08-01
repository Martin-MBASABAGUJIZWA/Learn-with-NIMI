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
}

interface Pos { x: number; y: number; w: number; h: number; size: number }

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
  // Left side — identity
  { key: 'photo',    label: 'Photo',             type: 'area', sample: '' },
  { key: 'qr',       label: 'QR Code',           type: 'area', sample: '' },
  { key: 'name',     label: 'Nom du champion',   type: 'text', sample: 'KETSIA' },
  { key: 'champion', label: 'N° Champion',       type: 'text', sample: 'KET-A-001' },
  { key: 'date',     label: 'Date de création',  type: 'text', sample: '01 / 01 / 2025' },
  // Right side — destination
  { key: 'dest_num',   label: 'Destination N°',    type: 'text', sample: '1' },
  { key: 'title',      label: 'Titre histoire',    type: 'text', sample: 'NIMI À L\'ÉCOLE' },
  { key: 'book_cover', label: 'Couverture livre',  type: 'area', sample: '' },
  { key: 'date_val',   label: 'Date validation',   type: 'text', sample: '01 / 01 / 2025' },
  { key: 'next_cover', label: 'Couverture suivante', type: 'area', sample: '' },
  { key: 'next_title', label: 'Titre suivant',     type: 'text', sample: 'HISTOIRE 2' },
]

const INIT_PASSPORT: Record<string, Pos> = {
  photo:      { x: 76,  y: 330, w: 210, h: 265, size: 0  },
  qr:         { x: 450, y: 395, w: 148, h: 148, size: 0  },
  name:       { x: 326, y: 370, w: 400, h: 40,  size: 36 },
  champion:   { x: 326, y: 445, w: 400, h: 30,  size: 26 },
  date:       { x: 326, y: 515, w: 400, h: 26,  size: 22 },
  dest_num:   { x: 1560, y: 68,  w: 80,  h: 26,  size: 22 },
  title:      { x: 1540, y: 148, w: 900, h: 48,  size: 40 },
  book_cover: { x: 1220, y: 240, w: 198, h: 310, size: 0  },
  date_val:   { x: 1280, y: 748, w: 300, h: 34,  size: 28 },
  next_cover: { x: 1145, y: 878, w: 100, h: 130, size: 0  },
  next_title: { x: 1640, y: 890, w: 420, h: 26,  size: 22 },
}

const COLORS_PASSPORT: Record<string, string> = {
  name: '#0D1B30', champion: '#0D1B30', date: '#0D1B30',
  dest_num: '#1A7A3E', title: '#0D1B30', date_val: '#0D1B30', next_title: '#0D1B30',
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

  const cfg = TEMPLATE_REGISTRY.find(t => t.slug === template) ?? TEMPLATE_REGISTRY[0]

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef       = useRef<SVGSVGElement>(null)
  const dragging     = useRef(false)
  const grabOffset   = useRef({ x: 0, y: 0 })
  const selRef       = useRef(sel)
  useEffect(() => { selRef.current = sel }, [sel])

  // ── Convert client coords → canvas-space ─────────────────────────
  function containerXY(clientX: number, clientY: number) {
    const r = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.round((clientX - r.left) / r.width  * cfg.W),
      y: Math.round((clientY - r.top)  / r.height * cfg.H),
    }
  }

  function startDrag(e: React.PointerEvent, fieldKey: string) {
    e.preventDefault()
    e.stopPropagation()
    setSel(fieldKey)
    selRef.current = fieldKey
    dragging.current = true
    svgRef.current!.setPointerCapture(e.pointerId)
    const { x, y } = containerXY(e.clientX, e.clientY)
    const p = pos[fieldKey]
    grabOffset.current = { x: x - p.x, y: y - p.y }
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragging.current) return
    const { x, y } = containerXY(e.clientX, e.clientY)
    const k = selRef.current
    setPos(prev => ({ ...prev, [k]: { ...prev[k], x: x - grabOffset.current.x, y: y - grabOffset.current.y } }))
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
        const rows: { field: string; x: number; y: number; w: number | null; h: number | null; font_size: number | null }[] = await res.json()
        if (cancelled) return
        if (rows.length) {
          const next: Record<string, Pos> = { ...cfg.init }
          for (const r of rows) {
            if (!next[r.field]) continue
            next[r.field] = {
              x: r.x ?? next[r.field].x, y: r.y ?? next[r.field].y,
              w: r.w ?? next[r.field].w, h: r.h ?? next[r.field].h,
              size: r.font_size ?? next[r.field].size,
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

  // ── Save layout ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const rows = cfg.fields.map(f => ({
        field:      f.key,
        x:          pos[f.key].x,
        y:          pos[f.key].y,
        w:          f.type === 'area' ? pos[f.key].w    : null,
        h:          f.type === 'area' ? pos[f.key].h    : null,
        font_size:  f.type === 'text' ? pos[f.key].size : null,
        color:      null,
        updated_at: new Date().toISOString(),
      }))
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
      setToast({ ok: true, msg: 'Saved!' })
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
              style={{ position: 'relative', userSelect: 'none', aspectRatio: `${cfg.W} / ${cfg.H}`, width: '100%' }}
            >
              {loading ? (
                <div className="w-full h-full absolute inset-0 bg-gray-50 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-300" />
                </div>
              ) : imgSrc ? (
                <img src={imgSrc} alt="Template"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
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
                  viewBox={`0 0 ${cfg.W} ${cfg.H}`}
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {cfg.fields.map(f => {
                    const p   = pos[f.key] ?? cfg.init[f.key]
                    const hot = f.key === sel
                    if (!p) return null

                    if (f.type === 'area') return (
                      <g key={f.key}>
                        <rect x={p.x} y={p.y} width={p.w} height={p.h}
                          fill="none"
                          stroke={hot ? '#ef4444' : 'rgba(99,102,241,0.3)'}
                          strokeWidth={hot ? 4 : 1.5}
                          pointerEvents="none" />
                        {hot ? (
                          <g onPointerDown={e => startDrag(e, f.key)} style={{ cursor: 'grab' }}>
                            <rect x={p.x} y={p.y} width={34} height={20} rx={4}
                              fill="#ef4444" stroke="white" strokeWidth={2} />
                            {([[-6,-4],[6,-4],[-6,4],[6,4]] as [number,number][]).map(([dx,dy], i) => (
                              <circle key={i} cx={p.x+17+dx} cy={p.y+10+dy} r={2} fill="white" />
                            ))}
                          </g>
                        ) : (
                          <circle cx={p.x+6} cy={p.y+6} r={5}
                            fill="rgba(99,102,241,0.5)"
                            onPointerDown={e => startDrag(e, f.key)}
                            style={{ cursor: 'grab' }} />
                        )}
                      </g>
                    )

                    const size  = p.size || 14
                    const color = cfg.colors[f.key] ?? '#1a1a2e'
                    return (
                      <g key={f.key}>
                        <text x={p.x} y={p.y + size} fontSize={size}
                          fill={hot ? '#ef4444' : color}
                          fontFamily="Arial,Helvetica,sans-serif" fontWeight={700}
                          opacity={hot ? 0.9 : 0.45} pointerEvents="none">
                          {f.sample}
                        </text>
                        {hot ? (
                          <g onPointerDown={e => startDrag(e, f.key)} style={{ cursor: 'grab' }}>
                            <rect x={p.x-16} y={p.y-11} width={32} height={22} rx={4}
                              fill="#ef4444" stroke="white" strokeWidth={2} />
                            {([[-5,-5],[5,-5],[-5,5],[5,5]] as [number,number][]).map(([dx,dy], i) => (
                              <circle key={i} cx={p.x+dx} cy={p.y+dy} r={2} fill="white" />
                            ))}
                          </g>
                        ) : (
                          <circle cx={p.x} cy={p.y} r={4}
                            fill="rgba(99,102,241,0.45)"
                            onPointerDown={e => startDrag(e, f.key)}
                            style={{ cursor: 'grab' }} />
                        )}
                      </g>
                    )
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="font-bold text-gray-700 text-sm mb-3">Fields</p>
              <div className="space-y-1">
                {cfg.fields.map(f => (
                  <button key={f.key} onClick={() => setSel(f.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                      sel === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span>{f.label}</span>
                    <span className={`text-xs font-mono ${sel === f.key ? 'text-blue-200' : 'text-gray-400'}`}>
                      {pos[f.key]?.x ?? 0},{pos[f.key]?.y ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-bold text-gray-700 text-sm">{curF.label} — Fine-tune</p>
                <button
                  onClick={() => setPos(p => ({ ...p, [sel]: { ...cfg.init[sel] } }))}
                  className="text-[11px] font-bold text-orange-500 hover:text-orange-700 underline"
                >Reset</button>
              </div>
              <p className="text-xs text-gray-400">Arrow keys = 1px · Shift+Arrow = 10px</p>
              <div className="grid grid-cols-2 gap-3">
                {(['x', 'y'] as const).map(f => (
                  <div key={f}>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">{f}</label>
                    <input type="number" value={cur[f]}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], [f]: +e.target.value } }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                ))}
                {curF.type === 'area' && (['w', 'h'] as const).map(f => (
                  <div key={f}>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase">{f}</label>
                    <input type="number" value={cur[f]}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], [f]: +e.target.value } }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                ))}
                {curF.type === 'text' && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">Font size</label>
                    <input type="number" value={cur.size}
                      onChange={e => setPos(p => ({ ...p, [sel]: { ...p[sel], size: +e.target.value } }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400" />
                  </div>
                )}
              </div>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl shadow transition">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : `Save ${cfg.label} Layout`}
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
