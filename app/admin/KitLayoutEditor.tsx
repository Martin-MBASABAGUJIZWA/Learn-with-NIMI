'use client'
import { useEffect, useRef, useState } from 'react'
import supabase from '@/lib/supabaseClient'
import { getCachedAdmin } from './adminAuth'
import { Layers, Menu, Save, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from './Toast'

interface Props {
  onNavigate: (t: string) => void
  onOpenSidebar?: () => void
}

const CW = 1254
const CH = 1254

const FIELDS = [
  { key: 'photo',        label: 'Photo (pass)',  type: 'area' as const, sample: '' },
  { key: 'handle_photo', label: 'Photo (handle)',type: 'area' as const, sample: '' },
  { key: 'champion',     label: 'Champion',      type: 'text' as const, sample: 'KETSIA' },
  { key: 'age',          label: 'Âge',           type: 'text' as const, sample: '7 ANS' },
  { key: 'statut',       label: 'Statut',        type: 'text' as const, sample: 'PETIT CHAMPION' },
  { key: 'vol',          label: 'Vol',           type: 'text' as const, sample: 'NMP101' },
  { key: 'destination',  label: 'Destination',   type: 'text' as const, sample: 'LE LION ET LA FORÊT' },
  { key: 'livre',        label: 'Livre',         type: 'text' as const, sample: '1' },
  { key: 'siege',        label: 'Siège',         type: 'text' as const, sample: '7A' },
  { key: 'porte',        label: 'Porte',         type: 'text' as const, sample: 'G1' },
  { key: 'embarquement', label: 'Embarquement',  type: 'text' as const, sample: 'OUVERT' },
  { key: 'barcode',      label: 'Barcode',       type: 'area' as const, sample: '' },
  { key: 'qr',           label: 'QR Code',       type: 'area' as const, sample: '' },
]

// Colors mirror buildKitImage.ts DEFAULTS
const FIELD_COLORS: Record<string, string> = {
  champion:     '#1a1a2e',
  age:          '#1a1a2e',
  statut:       '#16a34a',
  vol:          '#1a1a2e',
  destination:  '#1a1a2e',
  livre:        '#1a1a2e',
  siege:        '#1a1a2e',
  porte:        '#1a1a2e',
  embarquement: '#16a34a',
}

interface Pos { x: number; y: number; w: number; h: number; size: number }

const INIT: Record<string, Pos> = {
  photo:        { x: 710,  y: 440, w: 133, h: 195, size: 0  },
  handle_photo: { x: 490,  y: 30,  w: 270, h: 170, size: 0  },
  champion:     { x: 912,  y: 428, w: 150, h: 33,  size: 16 },
  age:          { x: 912,  y: 463, w: 150, h: 33,  size: 16 },
  statut:       { x: 912,  y: 498, w: 150, h: 33,  size: 16 },
  vol:          { x: 912,  y: 533, w: 150, h: 33,  size: 16 },
  destination:  { x: 912,  y: 568, w: 150, h: 33,  size: 14 },
  livre:        { x: 912,  y: 603, w: 150, h: 33,  size: 16 },
  siege:        { x: 912,  y: 638, w: 150, h: 33,  size: 16 },
  porte:        { x: 912,  y: 673, w: 150, h: 33,  size: 16 },
  embarquement: { x: 912,  y: 708, w: 150, h: 33,  size: 16 },
  barcode:      { x: 703,  y: 750, w: 382, h: 40,  size: 0  },
  qr:           { x: 1058, y: 898, w: 148, h: 148, size: 0  },
}

export default function KitLayoutEditor({ onNavigate, onOpenSidebar }: Props) {
  const { error: toastErr } = useToast()

  const [admin,    setAdmin]    = useState<{ name: string; role: string } | null>(null)
  const [pos,      setPos]      = useState<Record<string, Pos>>({ ...INIT })
  const [sel,      setSel]      = useState('champion')
  const [saving,   setSaving]   = useState(false)
  const [toast,    setToast]    = useState<{ ok: boolean; msg: string } | null>(null)
  const [imgSrc,   setImgSrc]   = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef       = useRef<SVGSVGElement>(null)
  const dragging     = useRef(false)
  const grabOffset   = useRef({ x: 0, y: 0 })
  const selRef       = useRef(sel)
  useEffect(() => { selRef.current = sel }, [sel])

  // ── Convert client coords → 1254-space ──────────────────────────
  function containerXY(clientX: number, clientY: number) {
    const r = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.round((clientX - r.left) / r.width  * CW),
      y: Math.round((clientY - r.top)  / r.height * CH),
    }
  }

  // ── Drag starts only from a field handle ─────────────────────────
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
    setPos(prev => ({
      ...prev,
      [k]: { ...prev[k], x: x - grabOffset.current.x, y: y - grabOffset.current.y },
    }))
  }

  function handlePointerUp() {
    dragging.current = false
  }

  // ── Arrow key nudge (1px, 10px with Shift) ──────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const step = e.shiftKey ? 10 : 1
      const map: Record<string, { x: number; y: number }> = {
        ArrowLeft:  { x: -step, y: 0 },
        ArrowRight: { x:  step, y: 0 },
        ArrowUp:    { x: 0, y: -step },
        ArrowDown:  { x: 0, y:  step },
      }
      const d = map[e.key]
      if (!d) return
      e.preventDefault()
      setSel(k => {
        setPos(prev => ({
          ...prev,
          [k]: { ...prev[k], x: prev[k].x + d.x, y: prev[k].y + d.y },
        }))
        return k
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Find template image ──────────────────────────────────────────
  useEffect(() => {
    const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/airways-templates/champion-kit`
    let cancelled = false
    void (async () => {
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        try {
          const res = await fetch(`${base}.${ext}`, { method: 'HEAD' })
          if (cancelled) return
          if (res.ok) { setImgSrc(`${base}.${ext}?t=${Date.now()}`); return }
        } catch { /* try next */ }
      }
      if (!cancelled) setImgError(true)
    })()
    return () => { cancelled = true }
  }, [])

  // ── Load saved layout from DB ────────────────────────────────────
  useEffect(() => {
    void (async () => {
      try {
        const [adminData, { data: rows }] = await Promise.all([
          getCachedAdmin(),
          supabase.from('kit_layout').select('field,x,y,w,h,font_size'),
        ])
        if (adminData) setAdmin(adminData)
        if (rows?.length) {
          const next: Record<string, Pos> = { ...INIT }
          for (const r of rows) {
            if (!next[r.field]) continue
            next[r.field] = {
              x:    r.x         ?? next[r.field].x,
              y:    r.y         ?? next[r.field].y,
              w:    r.w         ?? next[r.field].w,
              h:    r.h         ?? next[r.field].h,
              size: r.font_size ?? next[r.field].size,
            }
          }
          setPos(next)
        }
      } catch { toastErr('Failed to load layout') }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save layout ──────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    try {
      const rows = FIELDS.map(f => ({
        field:     f.key,
        x:         pos[f.key].x,
        y:         pos[f.key].y,
        w:         f.type === 'area' ? pos[f.key].w    : null,
        h:         f.type === 'area' ? pos[f.key].h    : null,
        font_size: f.type === 'text' ? pos[f.key].size : null,
        color:     null,
        updated_at: new Date().toISOString(),
      }))
      const res = await fetch('/api/airways/kit-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
        signal: AbortSignal.timeout(15000),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      setToast({ ok: true, msg: 'Saved!' })
    } catch (err) {
      setToast({ ok: false, msg: err instanceof Error ? err.message : 'Save failed' })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  const cur  = pos[sel]
  const curF = FIELDS.find(f => f.key === sel)!

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
              <h1 className="text-xl font-extrabold text-gray-800">Kit Layout Editor</h1>
              <p className="text-sm text-gray-500 mt-0.5">Select a field → drag or use ← → ↑ ↓ keys → Save.</p>
              <p className="text-xs text-gray-400 mt-1">
                <button onClick={() => onNavigate('Dashboard')} className="font-bold hover:underline text-green-600">Dashboard</button>
                <span className="mx-1 text-gray-300">/</span>
                <span className="font-bold text-gray-500">Kit Layout</span>
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
      </header>

      <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto w-full space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

          {/* Canvas preview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="font-bold text-gray-700 text-sm">
                Editing: <span className="text-red-500">{curF.label}</span>
              </p>
              <span className="text-xs font-mono text-gray-400">x={cur.x} y={cur.y}</span>
            </div>

            {/* Container forced square — matches buildKitImage's 1254×1254 fill exactly */}
            <div
              ref={containerRef}
              style={{ position: 'relative', userSelect: 'none', aspectRatio: '1 / 1', width: '100%' }}
            >
              {/* Template image — object-fill matches sharp's fit:'fill' stretch */}
              {imgSrc ? (
                <img src={imgSrc} alt="Kit template"
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                  draggable={false} />
              ) : imgError ? (
                <div className="w-full aspect-square bg-gray-100 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Layers className="w-12 h-12 opacity-40" />
                  <p className="font-bold text-sm text-gray-500">No template uploaded yet</p>
                  <p className="text-xs">Upload <code>champion-kit.png</code> via Admin → Airways Templates</p>
                </div>
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              )}

              {/* SVG overlay — viewBox matches buildKitImage coordinates exactly */}
              {imgSrc && (
                <svg
                  ref={svgRef}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
                  viewBox={`0 0 ${CW} ${CH}`}
                  preserveAspectRatio="xMidYMid meet"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {FIELDS.map(f => {
                    const p   = pos[f.key]
                    const hot = f.key === sel
                    if (!p) return null

                    if (f.type === 'area') {
                      return (
                        <g key={f.key}>
                          {/* border — thin when inactive, bold red when selected */}
                          <rect x={p.x} y={p.y} width={p.w} height={p.h}
                            fill="none"
                            stroke={hot ? '#ef4444' : 'rgba(99,102,241,0.3)'}
                            strokeWidth={hot ? 4 : 1.5}
                            pointerEvents="none"
                          />
                          {hot ? (
                            /* Selected: grip handle in top-left corner */
                            <g onPointerDown={e => startDrag(e, f.key)} style={{ cursor: 'grab' }}>
                              <rect x={p.x} y={p.y} width={34} height={20} rx={4}
                                fill="#ef4444" stroke="white" strokeWidth={2} />
                              {([[-6,-4],[6,-4],[-6,4],[6,4]] as [number,number][]).map(([dx,dy], i) => (
                                <circle key={i} cx={p.x+17+dx} cy={p.y+10+dy} r={2} fill="white" />
                              ))}
                            </g>
                          ) : (
                            /* Inactive: tiny dot — click to select */
                            <circle cx={p.x + 6} cy={p.y + 6} r={5}
                              fill="rgba(99,102,241,0.5)"
                              onPointerDown={e => startDrag(e, f.key)}
                              style={{ cursor: 'grab' }}
                            />
                          )}
                        </g>
                      )
                    }

                    // Text field
                    const size  = p.size || 14
                    const color = FIELD_COLORS[f.key] ?? '#1a1a2e'

                    return (
                      <g key={f.key}>
                        {/* WYSIWYG sample text */}
                        <text
                          x={p.x} y={p.y + size}
                          fontSize={size}
                          fill={hot ? '#ef4444' : color}
                          fontFamily="Arial,Helvetica,sans-serif"
                          fontWeight={700}
                          opacity={hot ? 0.9 : 0.45}
                          pointerEvents="none"
                        >
                          {f.sample}
                        </text>
                        {hot ? (
                          /* Selected: grip handle at anchor */
                          <g onPointerDown={e => startDrag(e, f.key)} style={{ cursor: 'grab' }}>
                            <rect x={p.x - 16} y={p.y - 11} width={32} height={22} rx={4}
                              fill="#ef4444" stroke="white" strokeWidth={2} />
                            {([[-5,-5],[5,-5],[-5,5],[5,5]] as [number,number][]).map(([dx,dy], i) => (
                              <circle key={i} cx={p.x+dx} cy={p.y+dy} r={2} fill="white" />
                            ))}
                          </g>
                        ) : (
                          /* Inactive: tiny dot — click to select */
                          <circle cx={p.x} cy={p.y} r={4}
                            fill="rgba(99,102,241,0.45)"
                            onPointerDown={e => startDrag(e, f.key)}
                            style={{ cursor: 'grab' }}
                          />
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
                {FIELDS.map(f => (
                  <button key={f.key} onClick={() => setSel(f.key)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-semibold transition flex items-center justify-between ${
                      sel === f.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span>{f.label}</span>
                    <span className={`text-xs font-mono ${sel === f.key ? 'text-blue-200' : 'text-gray-400'}`}>
                      {pos[f.key].x},{pos[f.key].y}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {cur && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-gray-700 text-sm">{curF.label} — Fine-tune</p>
                  <button
                    onClick={() => setPos(p => ({ ...p, [sel]: { ...INIT[sel] } }))}
                    className="text-[11px] font-bold text-orange-500 hover:text-orange-700 underline"
                  >
                    Reset
                  </button>
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
            )}

            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-bold text-sm py-3 rounded-xl shadow transition">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save All Positions'}
            </button>
            <p className="text-center text-xs text-gray-400">
              What you see here = what the kit generates. Save → download a test kit.
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
