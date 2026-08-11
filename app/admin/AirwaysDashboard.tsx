'use client'
import { useEffect, useState } from 'react'
import {
  Plane, Layers, Music, BookOpen, CheckCircle2, AlertCircle,
  RefreshCw, ArrowRight, Menu, Trash2,
} from 'lucide-react'
import supabase from '@/lib/supabaseClient'
import { getCachedAdmin } from './adminAuth'

interface Props {
  onNavigate: (t: string) => void
  onOpenSidebar?: () => void
}

// ── The 14 required template slots (must match AirwaysTemplatesManager) ────────
const REQUIRED_SLOTS = [
  'passport-cover', 'passport-interior', 'passport-interior-free',
  'badge-template', 'badge-template-free', 'piko-character',
  'boarding-pass', 'boarding-pass-free',
  'carry-on-day', 'carry-on-night', 'carry-on-day-free', 'carry-on-night-free',
  'certificate', 'certificate-free',
]

// ── All 13 layout editor templates ───────────────────────────────────────────
const LAYOUT_TEMPLATES = [
  'carry-on-day', 'carry-on-night', 'carry-on-day-free', 'carry-on-night-free',
  'boarding-pass', 'boarding-pass-free',
  'passport-interior', 'passport-interior-free',
  'badge-template', 'badge-template-free',
  'certificate', 'certificate-free',
  'story-page',
]

interface HealthCard {
  label: string
  icon: React.ElementType
  table: string
  value: string
  sub: string
  status: 'ok' | 'warn' | 'empty'
  detail?: string
}

export default function AirwaysDashboard({ onNavigate, onOpenSidebar }: Props) {
  const [admin,      setAdmin]      = useState<{ name: string; role: string } | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [cards,      setCards]      = useState<HealthCard[]>([])
  const [invalidating, setInvalidating] = useState(false)
  const [invMsg,     setInvMsg]     = useState<string | null>(null)

  useEffect(() => {
    getCachedAdmin().then(a => { if (a) setAdmin(a) }).catch(() => {})
  }, [])

  async function loadHealth() {
    setLoading(true)
    try {
      const [
        templateResults,
        layoutResult,
        songsResult,
        storyPagesResult,
      ] = await Promise.all([
        // 1. Check each required template slot via HEAD
        Promise.all(
          REQUIRED_SLOTS.map(async key => {
            for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
              const { data } = supabase.storage.from('airways-templates').getPublicUrl(`${key}.${ext}`)
              try {
                const r = await fetch(data.publicUrl, { method: 'HEAD', signal: AbortSignal.timeout(3000) })
                if (r.ok) return true
              } catch { /* skip */ }
            }
            return false
          })
        ),
        // 2. Count template_layout rows per template
        supabase.from('template_layout').select('template', { count: 'exact', head: false }),
        // 3. List child-songs bucket root (each folder = one child has a song)
        supabase.storage.from('child-songs').list('', { limit: 500 }),
        // 4. List story-pages bucket root
        supabase.storage.from('story-pages').list('', { limit: 500 }),
      ])

      const uploadedSlots  = templateResults.filter(Boolean).length
      const totalSlots     = REQUIRED_SLOTS.length

      // Count which templates have at least one calibration row
      const calibratedTemplates = new Set((layoutResult.data ?? []).map((r: { template: string }) => r.template))
      const calibratedCount = LAYOUT_TEMPLATES.filter(t => calibratedTemplates.has(t)).length
      const totalLayouts    = LAYOUT_TEMPLATES.length

      const songFolders     = (songsResult.data ?? []).filter(f => !f.name.includes('.')).length
      const storyFolders    = (storyPagesResult.data ?? []).filter(f => !f.name.includes('.')).length

      setCards([
        {
          label:  'Templates',
          icon:   Plane,
          table:  'airways_templates',
          value:  `${uploadedSlots} / ${totalSlots}`,
          sub:    'required slots uploaded',
          status: uploadedSlots === totalSlots ? 'ok' : uploadedSlots > 0 ? 'warn' : 'empty',
          detail: uploadedSlots < totalSlots
            ? `${totalSlots - uploadedSlots} slot(s) still missing — PDF builders fall back to white canvas`
            : 'All templates ready for PDF generation',
        },
        {
          label:  'Kit Layout',
          icon:   Layers,
          table:  'kit_layout',
          value:  `${calibratedCount} / ${totalLayouts}`,
          sub:    'templates calibrated',
          status: calibratedCount === totalLayouts ? 'ok' : calibratedCount > 0 ? 'warn' : 'empty',
          detail: calibratedCount < totalLayouts
            ? `${totalLayouts - calibratedCount} template(s) use built-in defaults — upload templates first, then calibrate`
            : 'All field positions calibrated',
        },
        {
          label:  'Songs',
          icon:   Music,
          table:  'song_manager',
          value:  String(songFolders),
          sub:    'children with songs',
          status: songFolders > 0 ? 'ok' : 'empty',
          detail: songFolders > 0
            ? `${songFolders} child(ren) have personalised songs uploaded`
            : 'No songs uploaded yet — use Song Manager to add per-child audio',
        },
        {
          label:  'Story Pages',
          icon:   BookOpen,
          table:  'story_pages',
          value:  String(storyFolders),
          sub:    'stories with pages',
          status: storyFolders > 0 ? 'ok' : 'empty',
          detail: storyFolders > 0
            ? `${storyFolders} story(s) have blank pages ready for personalisation`
            : 'No story pages uploaded yet — designer must supply blank pages (without Nimi)',
        },
      ])
    } catch (err) {
      console.error('[AirwaysDashboard] health check failed', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadHealth() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function invalidateAllPassportCaches() {
    setInvalidating(true)
    setInvMsg(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {}
      const res = await fetch('/api/airways/invalidate-passport-cache', { method: 'POST', headers })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setInvMsg('Passport cache cleared. Next download will regenerate all passports.')
    } catch (err) {
      setInvMsg(`Failed: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setInvalidating(false)
    }
  }

  const statusColor = (s: 'ok' | 'warn' | 'empty') =>
    s === 'ok'   ? 'border-green-200 bg-green-50'  :
    s === 'warn' ? 'border-amber-200 bg-amber-50'  :
                   'border-gray-200 bg-gray-50'

  const statusIcon = (s: 'ok' | 'warn' | 'empty') =>
    s === 'ok'   ? <CheckCircle2 size={16} className="text-green-600" /> :
    s === 'warn' ? <AlertCircle  size={16} className="text-amber-500" /> :
                   <AlertCircle  size={16} className="text-gray-400" />

  const valueColor = (s: 'ok' | 'warn' | 'empty') =>
    s === 'ok' ? 'text-green-700' : s === 'warn' ? 'text-amber-700' : 'text-gray-500'

  const overallReady = cards.every(c => c.status === 'ok')

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text flex flex-col">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-ds-surface border-b border-ds-border px-4 py-3 flex items-center gap-3">
        <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-lg hover:bg-ds-bg transition-colors">
          <Menu size={18} />
        </button>
        <Plane size={20} className="text-ds-accent flex-shrink-0" />
        <div className="flex-1">
          <h1 className="text-base font-bold">Nimipiko Airways ✈️</h1>
          {admin && <p className="text-xs text-ds-muted">Administration complète du système Airways</p>}
        </div>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="p-2 rounded-lg border border-ds-border hover:bg-ds-bg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-5">

        {/* Overall status banner */}
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${overallReady && !loading ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
          {loading
            ? <RefreshCw size={18} className="animate-spin text-ds-muted" />
            : overallReady
              ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
              : <AlertCircle  size={18} className="text-amber-600 flex-shrink-0" />
          }
          <div>
            <p className={`text-sm font-bold ${overallReady && !loading ? 'text-green-800' : 'text-amber-800'}`}>
              {loading ? 'Checking system health…'
                : overallReady ? 'All systems ready — Airways is fully operational'
                : 'Setup incomplete — some sections need attention below'}
            </p>
            <p className="text-xs text-ds-muted mt-0.5">
              8 document types · 14 template slots · 13 layout tabs · 3 premium features
            </p>
          </div>
        </div>

        {/* Health cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-ds-surface border border-ds-border animate-pulse" />
              ))
            : cards.map(card => (
                <div key={card.table} className={`rounded-2xl border p-4 space-y-3 ${statusColor(card.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <card.icon size={16} className="text-ds-muted" />
                      <span className="text-xs font-bold uppercase tracking-wide text-ds-muted">{card.label}</span>
                    </div>
                    {statusIcon(card.status)}
                  </div>
                  <div>
                    <p className={`text-3xl font-black leading-none ${valueColor(card.status)}`}>{card.value}</p>
                    <p className="text-xs text-ds-muted mt-0.5">{card.sub}</p>
                  </div>
                  {card.detail && (
                    <p className="text-xs text-ds-muted leading-relaxed">{card.detail}</p>
                  )}
                  <button
                    onClick={() => onNavigate(card.table)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-ds-accent hover:underline"
                  >
                    Gérer <ArrowRight size={12} />
                  </button>
                </div>
              ))
          }
        </div>

        {/* Document inventory */}
        <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ds-border">
            <p className="text-sm font-bold">Inventaire des documents</p>
            <p className="text-xs text-ds-muted">8 types de documents générés par le système</p>
          </div>
          <div className="divide-y divide-ds-border">
            {[
              { emoji: '📘', label: 'Passport',               route: '/api/airways/passport',     tier: 'all',      note: 'Multi-page PDF, Grand Champion ceremony included' },
              { emoji: '✈️', label: 'Boarding Pass',           route: '/api/airways/boarding-pass', tier: 'all',      note: 'Day boarding card, PNG or PDF' },
              { emoji: '🗺️', label: 'Stamp Collection',        route: '/api/airways/stamps',        tier: 'all',      note: 'SVG-generated 12-stamp grid' },
              { emoji: '🏅', label: 'Attitude Badge',          route: '/api/airways/badge',         tier: 'all',      note: 'Arc text, Piko composite, PNG' },
              { emoji: '🧳', label: 'Champion Kit',            route: '/api/airways/kit',           tier: 'all',      note: 'Day/night variants — auto by server time' },
              { emoji: '🏆', label: 'Certificat Champion',     route: '/api/airways/certificate',   tier: 'premium',  note: 'Last completed story, A4 landscape' },
              { emoji: '📖', label: 'Histoire PDF personnalisé', route: '/api/airways/story-pdf',  tier: 'premium',  note: 'Blank pages + child photo overlay, needs story-pages bucket' },
              { emoji: '🎵', label: 'Chanson personnalisée',   route: '/api/airways/song',          tier: 'premium',  note: 'Manual upload per child via Songs Manager' },
            ].map(doc => (
              <div key={doc.route} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="text-lg w-6 text-center flex-shrink-0">{doc.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ds-text text-xs">{doc.label}</p>
                  <p className="text-ds-muted text-[11px]">{doc.note}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    doc.tier === 'premium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {doc.tier === 'premium' ? '⭐ Premium' : '🌐 All'}
                  </span>
                  <code className="text-[10px] font-mono text-ds-muted bg-ds-bg px-1.5 py-0.5 rounded hidden sm:block">{doc.route}</code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Phase 2 setup checklist */}
        <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ds-border">
            <p className="text-sm font-bold">Checklist de mise en service (Phase 2)</p>
            <p className="text-xs text-ds-muted">Étapes à compléter quand le designer livre les assets</p>
          </div>
          <div className="divide-y divide-ds-border">
            {[
              { done: false, step: '1. Upload 14 templates dans Airways Templates', action: 'airways_templates', note: 'PNG ou JPG, dimensions exactes requises par type de document' },
              { done: false, step: '2. Calibrer les 13 tabs dans Kit Layout Editor', action: 'kit_layout',         note: 'Drag & drop des champs sur le template — sauvegarder chaque tab' },
              { done: false, step: '3. Uploader les pages vierges par histoire', action: 'story_pages',           note: 'page-01.png, page-02.png… dans story-pages/{slug}/' },
              { done: false, step: '4. Uploader les chansons par enfant (optionnel)', action: 'song_manager',    note: 'MP3/M4A dans child-songs/{childId}/ — admin manuel' },
              { done: true,  step: '5. Tester tous les 8 types de documents', action: 'airways_templates',       note: 'Via le panel "Test a document" dans Airways Templates' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${item.done ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {item.done
                    ? <CheckCircle2 size={12} className="text-green-600" />
                    : <span className="text-[10px] font-bold text-gray-400">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${item.done ? 'line-through text-ds-muted' : 'text-ds-text'}`}>{item.step}</p>
                  <p className="text-[11px] text-ds-muted mt-0.5">{item.note}</p>
                </div>
                {!item.done && (
                  <button
                    onClick={() => onNavigate(item.action)}
                    className="text-[11px] font-semibold text-ds-accent hover:underline flex-shrink-0"
                  >
                    Ouvrir →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ds-border">
            <p className="text-sm font-bold">Maintenance</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-ds-text">Vider le cache passport</p>
                <p className="text-xs text-ds-muted mt-0.5">
                  Force la régénération de tous les passports au prochain téléchargement.
                  À utiliser après un changement de template ou de layout.
                </p>
                {invMsg && (
                  <p className={`text-xs mt-1.5 font-medium ${invMsg.startsWith('Failed') ? 'text-red-600' : 'text-green-700'}`}>
                    {invMsg}
                  </p>
                )}
              </div>
              <button
                onClick={invalidateAllPassportCaches}
                disabled={invalidating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition disabled:opacity-40 flex-shrink-0"
              >
                <Trash2 size={13} />
                {invalidating ? 'Clearing…' : 'Clear cache'}
              </button>
            </div>
          </div>
        </div>

        {/* Dimension reference */}
        <div className="bg-ds-surface border border-ds-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-ds-border">
            <p className="text-sm font-bold">Dimensions requises par template</p>
            <p className="text-xs text-ds-muted">Le designer doit fournir les images à ces dimensions exactes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-ds-bg border-b border-ds-border text-ds-muted uppercase tracking-wide">
                  <th className="text-left px-4 py-2 font-semibold">Template</th>
                  <th className="text-left px-4 py-2 font-semibold">Dimensions</th>
                  <th className="text-left px-4 py-2 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {[
                  { name: 'passport-cover',            dims: 'Free (A4 portrait recommended)',  note: 'Fixed image, no overlay' },
                  { name: 'passport-interior / free',  dims: '2200 × 1100 px',                  note: 'Landscape spread, left + right pages' },
                  { name: 'badge-template / free',     dims: '1080 × 1080 px',                  note: 'Square, arc text overlay' },
                  { name: 'piko-character',            dims: 'Free (PNG with transparency)',     note: 'No overlay needed' },
                  { name: 'boarding-pass / free',      dims: '1080 × 1080 px',                  note: 'Square card' },
                  { name: 'carry-on-day/night / free', dims: '1254 × 1254 px',                  note: 'Square suitcase, 4 variants' },
                  { name: 'certificate / free',        dims: '1400 × 990 px',                   note: 'Landscape certificate' },
                  { name: 'story-pages/{slug}/',       dims: '1240 × 1754 px (A4 @ 150dpi)',    note: 'Portrait, all pages same size, no Nimi character' },
                ].map(row => (
                  <tr key={row.name}>
                    <td className="px-4 py-2.5 font-mono font-medium text-ds-text">{row.name}</td>
                    <td className="px-4 py-2.5 font-mono text-ds-accent">{row.dims}</td>
                    <td className="px-4 py-2.5 text-ds-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
