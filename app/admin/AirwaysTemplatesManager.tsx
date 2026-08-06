'use client'
import React, { useEffect, useState, useCallback } from 'react'
import supabase from '@/lib/supabaseClient'
import { getCachedAdmin } from './adminAuth'
import {
  Plane, Upload, Trash2, ExternalLink, CheckCircle2, AlertCircle,
  RefreshCw, X, Menu, Copy, Check, ImageIcon, Download,
} from 'lucide-react'
import { ACCENT } from './missionMeta'

const accent = ACCENT.green

// ── Template slot definitions ─────────────────────────────────

interface TemplateSlot {
  key: string
  label: string
  description: string
  note: string
  required: boolean
}

const SLOTS: TemplateSlot[] = [
  {
    key: 'passport-cover',
    label: 'Passport Cover',
    description: 'Dark navy cover with PASSEPORT VOYAGE NIMIPIKO, Nimi/Piko/Zilo characters and laurel decoration.',
    note: 'Fixed image — no text overlay needed.',
    required: true,
  },
  {
    key: 'passport-interior',
    label: 'Passport Interior',
    description: 'Cream spread: left = identity page (photo + name + champion number + date + QR), right = destination page.',
    note: 'Overlays: child photo, name, champion number, creation date, QR code (left); story title, book cover, badge, validation date (right).',
    required: true,
  },
  {
    key: 'badge-template',
    label: 'Champion Attitude Badge',
    description: 'Holographic badge frame with [ATTITUDE] and [TITRE] • CHAMPION DU LIVRE placeholders.',
    note: 'Overlay: attitude text, story title, child photo (center circle).',
    required: true,
  },
  {
    key: 'piko-character',
    label: 'Piko Character PNG',
    description: 'Piko robot character on a transparent background — placed in the right half of the badge inner circle.',
    note: 'Must be PNG with transparency. Sized to fit inside the badge circle.',
    required: true,
  },
  {
    key: 'boarding-pass',
    label: 'Boarding Pass',
    description: 'White/gold boarding pass layout with photo box and field placeholders.',
    note: 'Overlay: photo, name, age, status, flight number, destination, seat, gate, QR code.',
    required: true,
  },
  {
    key: 'stamps',
    label: 'Stamp Collection (Page 13)',
    description: 'Cream 4×3 grid with ILLUSTRATION, BADGE and TAMPON OFFICIEL placeholders per slot.',
    note: 'Overlay: story covers, badge images, validation dates per completed story.',
    required: true,
  },
  {
    key: 'champion-kit',
    label: 'Champion Kit',
    description: 'Blue suitcase kit template (1254×1254px). Contains the boarding pass panel on the right and the passport cover on the left — both already baked into the template.',
    note: 'Overlay: child photo (handle area), boarding pass values (name, age, status, flight, destination, livre, siège, porte, embarquement), real barcode, QR code.',
    required: true,
  },
  {
    key: 'carry-on-day',
    label: 'Carry-On (Day)',
    description: 'Blue carry-on suitcase with passport + boarding pass visible (daytime variant).',
    note: 'Reference / marketing asset.',
    required: false,
  },
  {
    key: 'carry-on-night',
    label: 'Carry-On (Night)',
    description: 'Blue carry-on suitcase with LED lights glowing (night variant).',
    note: 'Reference / marketing asset.',
    required: false,
  },
]

const BUCKET = 'airways-templates'

interface SlotState {
  url: string | null
  loading: boolean
  uploading: boolean
  deleting: boolean
  error: string | null
  copied: boolean
}

interface AirwaysTemplatesManagerProps {
  onNavigate: (table: string) => void
  onOpenSidebar?: () => void
}

interface Child { id: string; name: string; age: number | null }

export default function AirwaysTemplatesManager({ onNavigate, onOpenSidebar }: AirwaysTemplatesManagerProps) {
  const [admin, setAdmin] = useState<{ name: string; role: string } | null>(null)
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>(() =>
    Object.fromEntries(SLOTS.map(s => [s.key, { url: null, loading: true, uploading: false, deleting: false, error: null, copied: false }]))
  )
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // ── Test download ─────────────────────────────────────────────
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [testDoc, setTestDoc] = useState<'kit' | 'boarding-pass' | 'passport' | 'badge'>('kit')
  const [downloading, setDownloading] = useState(false)
  const [dlError, setDlError] = useState<string | null>(null)

  useEffect(() => {
    getCachedAdmin().then(a => { if (a) setAdmin(a) }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/admin/children')
      .then(r => r.json())
      .then((data: Child[]) => { if (Array.isArray(data)) setChildren(data) })
      .catch(() => {})
  }, [])

  const handleTestDownload = async () => {
    if (!selectedChild) return
    setDownloading(true)
    setDlError(null)
    try {
      // passport → PDF (no format param); badge → PNG (no format param);
      // boarding-pass / kit / stamps → PNG (need &format=png)
      const needsFormatParam = testDoc !== 'passport' && testDoc !== 'badge'
      const url = needsFormatParam
        ? `/api/airways/${testDoc}?childId=${selectedChild}&format=png`
        : `/api/airways/${testDoc}?childId=${selectedChild}`
      const ext = testDoc === 'passport' ? 'pdf' : 'png'
      const res = await fetch(url)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error ?? `HTTP ${res.status}`)
      }
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `test_${testDoc}.${ext}`
      a.click()
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      setDlError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const updateSlot = useCallback((key: string, patch: Partial<SlotState>) => {
    setSlotStates(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }, [])

  // Probe each slot: try .png then .jpg
  const probeSlot = useCallback(async (key: string) => {
    updateSlot(key, { loading: true, error: null })
    try {
      for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
        const fileName = `${key}.${ext}`
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
        // HEAD the URL to confirm it exists
        const res = await fetch(data.publicUrl, { method: 'HEAD', signal: AbortSignal.timeout(4000) })
        if (res.ok) {
          updateSlot(key, { url: `${data.publicUrl}?t=${Date.now()}`, loading: false })
          return
        }
      }
      updateSlot(key, { url: null, loading: false })
    } catch {
      updateSlot(key, { url: null, loading: false })
    }
  }, [updateSlot])

  useEffect(() => {
    SLOTS.forEach(s => probeSlot(s.key))
  }, [probeSlot, refreshKey])

  const handleUpload = async (key: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const fileName = `${key}.${ext}`
    updateSlot(key, { uploading: true, error: null })
    try {
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true })
      if (error) throw error
      // After upload, get the public URL directly
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      updateSlot(key, { uploading: false, url: `${data.publicUrl}?t=${Date.now()}` })
    } catch (err) {
      updateSlot(key, { uploading: false, error: err instanceof Error ? err.message : 'Upload failed.' })
    }
  }

  const handleDelete = async (key: string) => {
    const url = slotStates[key]?.url
    if (!url) return
    // Derive filename from URL — strip the cache-busting ?t=... before passing to storage.remove()
    const rawName = url.split('/').pop()
    if (!rawName) return
    const fileName = rawName.split('?')[0]
    if (!window.confirm(`Delete the "${key}" template? This cannot be undone.`)) return
    updateSlot(key, { deleting: true, error: null })
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([fileName])
      if (error) throw error
      updateSlot(key, { deleting: false, url: null })
    } catch (err) {
      updateSlot(key, { deleting: false, error: err instanceof Error ? err.message : 'Delete failed.' })
    }
  }

  const handleCopy = (key: string) => {
    const url = slotStates[key]?.url
    if (!url) return
    navigator.clipboard.writeText(url).catch(() => {})
    updateSlot(key, { copied: true })
    setTimeout(() => updateSlot(key, { copied: false }), 1800)
  }

  const uploadedRequired = SLOTS.filter(s => s.required && slotStates[s.key]?.url).length
  const totalRequired = SLOTS.filter(s => s.required).length

  return (
    <div>
      {/* Header */}
      <header className={`border-b border-gray-100 px-4 sm:px-6 py-5 ${accent.soft}`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3.5 min-w-0">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-100 hover:bg-gray-50 text-gray-600 shadow-sm transition mt-0.5"
            >
              <Menu size={17} />
            </button>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm bg-white ${accent.text}`}>
              <Plane className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                Airways Templates <span className="text-lg">✈️</span>
              </h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                Upload the 8 Nimipiko Airways document templates
              </p>
              <p className="text-xs text-gray-400 mt-1.5">
                <button onClick={() => onNavigate('Dashboard')} className={`font-bold hover:underline ${accent.text}`}>Dashboard</button>
                <span className="mx-1.5 text-gray-300">/</span>
                <span className="font-bold text-gray-500">Airways Templates</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress badge */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border ${
              uploadedRequired === totalRequired
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {uploadedRequired === totalRequired
                ? <CheckCircle2 className="w-4 h-4" />
                : <AlertCircle className="w-4 h-4" />}
              {uploadedRequired} / {totalRequired} required
            </div>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh all"
              className="w-9 h-9 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-white border border-gray-100 pl-1.5 pr-3 py-1.5 rounded-full shadow-sm">
              <img src="/nimi-logo-circle.png" alt="Profile" className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-white" loading="lazy" />
              <div className="hidden sm:block leading-tight">
                <p className="text-sm font-semibold text-gray-700">{admin?.name ?? 'Admin'}</p>
                <p className="text-[10px] text-gray-400 uppercase font-bold">{admin?.role ?? 'admin'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {globalError && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-xl px-3.5 py-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{globalError}</span>
            <button onClick={() => setGlobalError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-sm text-blue-800">
          <p className="font-bold mb-1">How this works</p>
          <p className="text-blue-700 text-xs leading-relaxed">
            Upload each template as a PNG or JPG. The PDF generator uses these images as base layers and composites
            the child's personalized data (name, photo, QR code, dates) on top — exactly like the certificate system.
            Required templates must be uploaded before boarding passes and passports can be generated.
          </p>
        </div>

        {/* ── Test download panel ───────────────────────────── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-green-600" /> Test a document
          </p>
          <p className="text-xs text-gray-400">Pick a child and document type — downloads a PNG so you can check the overlay positions.</p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Child</label>
              <select
                value={selectedChild}
                onChange={e => setSelectedChild(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="">— Select a child —</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.age ? ` (${c.age} ans)` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Document</label>
              <select
                value={testDoc}
                onChange={e => setTestDoc(e.target.value as 'kit' | 'boarding-pass' | 'passport' | 'badge')}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <option value="kit">Champion Kit</option>
                <option value="boarding-pass">Boarding Pass</option>
                <option value="passport">Passport</option>
                <option value="badge">Attitude Badge</option>
              </select>
            </div>
            <button
              onClick={handleTestDownload}
              disabled={!selectedChild || downloading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-full transition"
            >
              {downloading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              {downloading ? 'Generating…' : testDoc === 'passport' ? 'Download PDF' : 'Download PNG'}
            </button>
          </div>
          {dlError && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{dlError}</p>
          )}
        </div>

        {/* Template slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SLOTS.map(slot => {
            const state = slotStates[slot.key]
            const isUploaded = !!state?.url
            const isLoading = state?.loading
            const isUploading = state?.uploading
            const isDeleting = state?.deleting

            return (
              <div
                key={slot.key}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition ${
                  isUploaded ? 'border-green-200' : slot.required ? 'border-amber-200' : 'border-gray-100'
                }`}
              >
                {/* Preview area */}
                <div className={`relative w-full h-44 flex items-center justify-center overflow-hidden ${
                  isUploaded ? 'bg-gray-50' : 'bg-gray-50'
                }`}>
                  {isLoading ? (
                    <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                  ) : isUploaded && state.url ? (
                    <img
                      src={state.url}
                      alt={slot.label}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-300">
                      <ImageIcon className="w-10 h-10" />
                      <span className="text-xs font-semibold">No template uploaded</span>
                    </div>
                  )}

                  {/* Status badge */}
                  <div className={`absolute top-2 left-2 flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    isUploaded
                      ? 'bg-green-100 text-green-700'
                      : slot.required
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isUploaded ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {isUploaded ? 'Uploaded' : slot.required ? 'Required' : 'Optional'}
                  </div>
                </div>

                {/* Info + actions */}
                <div className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="font-bold text-gray-800 text-sm">{slot.label}</p>
                      <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-500">
                        {slot.key}.png
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{slot.description}</p>
                    <p className="text-[11px] text-blue-600 mt-1 leading-relaxed">💡 {slot.note}</p>
                  </div>

                  {/* Error */}
                  {state?.error && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">{state.error}</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {/* Upload */}
                    <label className={`flex-1 inline-flex items-center justify-center gap-2 text-white text-xs font-bold px-3 py-2 rounded-full cursor-pointer transition ${accent.button} ${isUploading ? 'opacity-70 cursor-wait' : ''}`}>
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Uploading…' : isUploaded ? 'Replace' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        disabled={isUploading || isDeleting}
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(slot.key, file)
                          e.target.value = ''
                        }}
                      />
                    </label>

                    {/* Copy URL */}
                    {isUploaded && (
                      <button
                        onClick={() => handleCopy(slot.key)}
                        title="Copy public URL"
                        className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
                      >
                        {state.copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Open */}
                    {isUploaded && state.url && (
                      <a
                        href={state.url}
                        target="_blank"
                        rel="noreferrer"
                        title="View full size"
                        className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Delete */}
                    {isUploaded && (
                      <button
                        onClick={() => handleDelete(slot.key)}
                        disabled={isDeleting}
                        title="Delete template"
                        className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-500 hover:text-red-700 disabled:opacity-50 transition"
                      >
                        {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Usage guide */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="font-bold text-gray-700 text-sm">API Endpoints</p>
          <div className="space-y-1.5">
            {[
              { method: 'GET', path: '/api/airways/boarding-pass?childId=UUID', desc: 'Personalized boarding pass (PDF/PNG)' },
              { method: 'GET', path: '/api/airways/boarding-pass?generic=true', desc: 'Generic boarding pass template' },
              { method: 'GET', path: '/api/airways/passport?childId=UUID', desc: 'Full passport (multi-page PDF)' },
              { method: 'GET', path: '/api/airways/stamps?childId=UUID', desc: 'Stamp collection page (PDF/PNG)' },
            ].map(e => (
              <div key={e.path} className="flex items-start gap-2 text-xs">
                <span className="bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded shrink-0">{e.method}</span>
                <code className="text-gray-600 font-mono break-all">{e.path}</code>
                <span className="text-gray-400 shrink-0 hidden sm:block">— {e.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            All personalized endpoints require authentication. Add <code className="bg-gray-100 px-1 rounded">&amp;format=png</code> for image output.
          </p>
        </div>
      </div>
    </div>
  )
}
