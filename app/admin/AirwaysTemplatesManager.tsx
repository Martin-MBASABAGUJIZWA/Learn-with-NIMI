'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import supabase from '@/lib/supabaseClient'
import { getCachedAdmin } from './adminAuth'
import {
  Plane, Upload, Trash2, ExternalLink, CheckCircle2, AlertCircle,
  RefreshCw, X, Menu, Copy, Check, ImageIcon, Download,
} from 'lucide-react'
import { ACCENT } from './missionMeta'
import { useConfirmDialog } from './ConfirmDialog'

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
    label: 'Passport Interior (Personalized)',
    description: 'Cream spread: left = identity page (photo + name + champion number + date + QR), right = destination page.',
    note: 'Subscribed users. Overlays: child photo, name, champion number, creation date, QR code (left); story title, book cover, badge, validation date (right).',
    required: true,
  },
  {
    key: 'passport-interior-free',
    label: 'Passport Interior (Free)',
    description: 'Cream spread without the child photo box — identity fields show PETIT CHAMPION placeholder data.',
    note: 'Free users. Overlays: name (PETIT CHAMPION), champion number (STD-001), date (left); story title, book cover, badge, validation date (right).',
    required: true,
  },
  {
    key: 'badge-template',
    label: 'Champion Attitude Badge (Personalized)',
    description: 'Holographic badge frame with child photo composited in the center circle alongside Piko.',
    note: 'Subscribed users. Overlay: attitude text, story title, child photo (center circle).',
    required: true,
  },
  {
    key: 'badge-template-free',
    label: 'Champion Attitude Badge (Free)',
    description: 'Holographic badge frame showing Nimi + Piko only in the center circle — no child photo slot.',
    note: 'Free users. Overlay: attitude text, story title. No child photo composited.',
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
    label: 'Boarding Pass (Personalized)',
    description: 'White/gold boarding pass layout with photo box on the left and text fields on the right.',
    note: 'Subscribed users only. Overlay: photo, name, age, status, flight number, destination, seat, gate, barcode.',
    required: true,
  },
  {
    key: 'boarding-pass-free',
    label: 'Boarding Pass (Free)',
    description: 'White/gold boarding pass layout without a photo box — text fields spread across the full width.',
    note: 'Free users. Overlay: name (PETIT CHAMPION), age, status, flight number, destination, seat, gate, QR code.',
    required: true,
  },
  {
    key: 'stamps',
    label: 'Stamp Collection (Page 13)',
    description: 'Optional background for the stamp collection page. Not currently used — stamps are generated programmatically as SVG.',
    note: 'Reserved for a future design override. Uploading this has no effect on generated documents today.',
    required: false,
  },
  {
    key: 'carry-on-day',
    label: 'Champion Kit — Jour (Personnalisé)',
    description: 'Blue suitcase kit, daytime background (1254×1254px). Photo slots in handle oval and boarding pass window.',
    note: 'Subscribed users, daytime download. Overlay: child photo (handle + window), boarding pass values, barcode, QR.',
    required: true,
  },
  {
    key: 'carry-on-night',
    label: 'Champion Kit — Nuit (Personnalisé)',
    description: 'Blue suitcase kit, nighttime background with warm LED glow (1254×1254px). Same layout as daytime.',
    note: 'Subscribed users, night-time download. Same overlays as daytime variant.',
    required: true,
  },
  {
    key: 'carry-on-day-free',
    label: 'Champion Kit — Jour (Gratuit)',
    description: 'Blue suitcase kit, daytime background — no child photo slots. Handle and window show generic design.',
    note: 'Free users, daytime download. Overlay: PETIT CHAMPION name, boarding pass values, barcode, QR. No photo.',
    required: true,
  },
  {
    key: 'carry-on-night-free',
    label: 'Champion Kit — Nuit (Gratuit)',
    description: 'Blue suitcase kit, nighttime background — no child photo slots.',
    note: 'Free users, night-time download. Same overlays as daytime free variant.',
    required: true,
  },
  {
    key: 'certificate',
    label: 'Champion Certificate (Personnalisé)',
    description: 'Landscape certificate awarded after completing all 6 missions of a story. Child photo, name, champion number, story title, date.',
    note: 'Subscribed users. Overlay: child photo, name, champion number, story title, story number, completion date.',
    required: true,
  },
  {
    key: 'certificate-free',
    label: 'Champion Certificate (Gratuit)',
    description: 'Landscape certificate without child photo — name shows PETIT CHAMPION.',
    note: 'Free users. Overlay: PETIT CHAMPION, story title, story number, completion date. No photo or champion number.',
    required: true,
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
  const { confirm, dialog: confirmDialog } = useConfirmDialog()

  // ── Test download ─────────────────────────────────────────────
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [testDoc, setTestDoc] = useState<'kit' | 'boarding-pass' | 'passport' | 'stamps' | 'badge' | 'certificate' | 'song' | 'story-pdf'>('kit')
  const [testStories, setTestStories]   = useState<{ slug: string; title: string; sort_order: number }[]>([])
  const [testStorySlug, setTestStorySlug] = useState<string>('')
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

  // Load stories when child changes (for story-pdf test)
  useEffect(() => {
    if (!selectedChild) { setTestStories([]); setTestStorySlug(''); return }
    fetch(`/api/airways/stories?childId=${selectedChild}`)
      .then(r => r.json())
      .then((d: { stories?: { slug: string; title: string; sort_order: number; is_complete: boolean }[] }) => {
        const list = (d.stories ?? []).filter(s => s.slug)
        setTestStories(list)
        setTestStorySlug(list[0]?.slug ?? '')
      })
      .catch(() => {})
  }, [selectedChild])

  const handleTestDownload = async () => {
    if (!selectedChild) return
    setDownloading(true)
    setDlError(null)
    try {
      let url: string
      let ext: string

      if (testDoc === 'badge') {
        url = `/api/airways/badge?childId=${selectedChild}`
        ext = 'png'
      } else if (testDoc === 'passport' || testDoc === 'stamps') {
        url = `/api/airways/${testDoc}?childId=${selectedChild}`
        ext = 'pdf'
      } else if (testDoc === 'certificate') {
        url = `/api/airways/certificate?childId=${selectedChild}&format=pdf`
        ext = 'pdf'
      } else if (testDoc === 'song') {
        url = `/api/airways/song?childId=${selectedChild}`
        ext = 'mp3'
      } else if (testDoc === 'story-pdf') {
        if (!testStorySlug) throw new Error('Select a story first.')
        url = `/api/airways/story-pdf?childId=${selectedChild}&storySlug=${encodeURIComponent(testStorySlug)}`
        ext = 'pdf'
      } else {
        url = `/api/airways/${testDoc}?childId=${selectedChild}&format=pdf`
        ext = 'pdf'
      }

      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `HTTP ${res.status}`)
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

  // Fire-and-forget: clears the server-side in-process template cache so the
  // next PDF generation fetches the freshly uploaded image rather than a stale hit.
  const invalidateServerCache = async (key: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    await fetch(`/api/airways/invalidate-template?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    }).catch(() => {})
  }

  const handleUpload = async (key: string, file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
    const fileName = `${key}.${ext}`
    updateSlot(key, { uploading: true, error: null })
    try {
      // Delete old file if it has a different extension (avoids orphan + stale probe)
      const existingUrl = slotStates[key]?.url
      if (existingUrl) {
        const rawName = existingUrl.split('/').pop()?.split('?')[0]
        if (rawName && rawName !== fileName) {
          await supabase.storage.from(BUCKET).remove([rawName]).catch(() => {})
        }
      }
      const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
      updateSlot(key, { uploading: false, url: `${data.publicUrl}?t=${Date.now()}` })
      void invalidateServerCache(key)
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
    if (!await confirm({ title: `Delete "${key}" template?`, message: 'This removes the file from storage permanently. Cannot be undone.' })) return
    updateSlot(key, { deleting: true, error: null })
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([fileName])
      if (error) throw error
      updateSlot(key, { deleting: false, url: null })
      void invalidateServerCache(key)
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
      {confirmDialog}
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
                Upload the {totalRequired} required Nimipiko Airways templates
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

        {/* Phase 2 awaiting-designer banner — only when 0 templates uploaded */}
        {uploadedRequired === 0 && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">Phase 2 — Awaiting designer assets</p>
                <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                  No template images have been uploaded yet. Airways PDF generation is fully wired but <strong>non-functional</strong> until
                  the designer delivers the {totalRequired} required PNG files. Once received, upload each template to its slot below.
                  The layout editor (Kit Layout) is ready and can be calibrated before images arrive.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button onClick={() => onNavigate('kit_layout')} className="text-xs font-bold text-amber-700 underline">Open Layout Editor →</button>
                  <button onClick={() => onNavigate('airways_hub')} className="text-xs font-bold text-amber-700 underline">Open Airways Hub →</button>
                </div>
              </div>
            </div>
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
                onChange={e => setTestDoc(e.target.value as typeof testDoc)}
                className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              >
                <optgroup label="Classic">
                  <option value="kit">Champion Kit</option>
                  <option value="boarding-pass">Boarding Pass</option>
                  <option value="passport">Passport</option>
                  <option value="stamps">Stamp Collection</option>
                  <option value="badge">Attitude Badge</option>
                </optgroup>
                <optgroup label="Premium">
                  <option value="certificate">Certificat Champion</option>
                  <option value="song">Chanson personnalisée</option>
                  <option value="story-pdf">Histoire PDF</option>
                </optgroup>
              </select>
            </div>

            {/* Story picker — only visible for story-pdf */}
            {testDoc === 'story-pdf' && (
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Histoire</label>
                {testStories.length > 0 ? (
                  <select
                    value={testStorySlug}
                    onChange={e => setTestStorySlug(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
                  >
                    {testStories.map(s => (
                      <option key={s.slug} value={s.slug}>
                        Livre {s.sort_order} — {s.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-gray-400 italic py-2">
                    {selectedChild ? 'Aucune histoire trouvée pour cet enfant.' : 'Sélectionner un enfant d\'abord.'}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={handleTestDownload}
              disabled={!selectedChild || downloading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-full transition"
            >
              {downloading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              {downloading ? 'Generating…'
                : testDoc === 'badge'   ? 'Download PNG'
                : testDoc === 'song'    ? 'Download Audio'
                : 'Download PDF'}
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

        {/* API reference */}
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="font-bold text-gray-700 text-sm">Tous les endpoints Airways</p>
          <div className="space-y-1.5">
            {[
              { path: '/api/airways/passport?childId=UUID',            desc: 'Passport multi-page (PDF)' },
              { path: '/api/airways/boarding-pass?childId=UUID&format=pdf', desc: 'Boarding pass (PDF/PNG)' },
              { path: '/api/airways/stamps?childId=UUID',              desc: 'Stamp collection (PDF)' },
              { path: '/api/airways/badge?childId=UUID',               desc: 'Attitude badge (PNG)' },
              { path: '/api/airways/kit?childId=UUID&format=pdf',      desc: 'Champion kit, day/night auto (PDF/PNG)' },
              { path: '/api/airways/certificate?childId=UUID&format=pdf', desc: 'Champion certificate — last story ★ Premium' },
              { path: '/api/airways/story-pdf?childId=UUID&storySlug=X', desc: 'Histoire PDF personnalisé ★ Premium' },
              { path: '/api/airways/song?childId=UUID',                desc: 'Chanson personnalisée (audio) ★ Premium' },
              { path: '/api/airways/stories?childId=UUID',             desc: 'Liste des histoires de l\'enfant (JSON)' },
            ].map(e => (
              <div key={e.path} className="flex items-start gap-2 text-xs">
                <span className="bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded shrink-0 mt-px">GET</span>
                <code className="text-gray-600 font-mono break-all flex-1">{e.path}</code>
                <span className="text-gray-400 shrink-0 hidden sm:block text-right max-w-[200px]">— {e.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            All endpoints require <code className="bg-gray-100 px-1 rounded">Authorization: Bearer TOKEN</code>. ★ Premium = subscription required.
          </p>
        </div>
      </div>
    </div>
  )
}
