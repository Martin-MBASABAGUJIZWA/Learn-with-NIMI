'use client'
import { useEffect, useRef, useState } from 'react'
import { getCachedAdmin } from './adminAuth'
import {
  BookOpen, Upload, Trash2, RefreshCw, Menu,
  CheckCircle2, AlertCircle, ImageIcon, Eye, X,
} from 'lucide-react'
import supabase from '@/lib/supabaseClient'

interface Props {
  onNavigate: (t: string) => void
  onOpenSidebar?: () => void
}

interface StoryOption {
  id: string
  slug: string
  title: string
  sort_order: number
}

interface PageFile {
  name: string
  pageNum: number
  url: string
  size: number
}

const BUCKET = 'story-pages'
const ACCEPTED = 'image/png,image/jpeg,image/webp'

function extractPageNum(name: string): number {
  return parseInt(name.match(/(\d+)/)?.[1] ?? '999', 10)
}

function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function StoryPagesManager({ onNavigate, onOpenSidebar }: Props) {
  const [admin,         setAdmin]         = useState<{ name: string; role: string } | null>(null)
  const [stories,       setStories]       = useState<StoryOption[]>([])
  const [selectedSlug,  setSelectedSlug]  = useState<string>('')
  const [pages,         setPages]         = useState<PageFile[]>([])
  const [loadingPages,  setLoadingPages]  = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [deletingName,  setDeletingName]  = useState<string | null>(null)
  const [toast,         setToast]         = useState<{ ok: boolean; msg: string } | null>(null)
  const [preview,       setPreview]       = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    getCachedAdmin().then(a => { if (a) setAdmin(a) }).catch(() => {})
  }, [])

  useEffect(() => {
    supabase
      .from('stories')
      .select('id, slug, title, sort_order')
      .not('slug', 'is', null)
      .order('sort_order')
      .then(({ data }) => {
        const list = (data ?? []) as StoryOption[]
        setStories(list)
        if (list[0]?.slug) setSelectedSlug(list[0].slug)
      })
  }, [])

  async function loadPages(slug: string) {
    if (!slug) { setPages([]); return }
    setLoadingPages(true)
    try {
      const { data: files, error } = await supabase.storage
        .from(BUCKET)
        .list(slug, { sortBy: { column: 'name', order: 'asc' }, limit: 100 })

      if (error) throw error

      const imageFiles = (files ?? [])
        .filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f.name))

      const withUrls: PageFile[] = imageFiles.map(f => {
        const { data } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(`${slug}/${f.name}`)
        return {
          name:    f.name,
          pageNum: extractPageNum(f.name),
          url:     `${data.publicUrl}?t=${Date.now()}`,
          size:    f.metadata?.size ?? 0,
        }
      }).sort((a, b) => a.pageNum - b.pageNum)

      setPages(withUrls)
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : 'Failed to load pages')
      setPages([])
    } finally {
      setLoadingPages(false)
    }
  }

  useEffect(() => {
    loadPages(selectedSlug)
  }, [selectedSlug])  // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleUpload(files: FileList) {
    if (!selectedSlug || files.length === 0) return
    setUploading(true)
    try {
      const nextNum = pages.length > 0
        ? Math.max(...pages.map(p => p.pageNum)) + 1
        : 1

      const sorted = Array.from(files).sort((a, b) => a.name.localeCompare(b.name))
      let errs = 0

      await Promise.all(
        sorted.map(async (file, i) => {
          const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'png'
          const fileName = `page-${String(nextNum + i).padStart(2, '0')}.${ext}`
          const { error } = await supabase.storage
            .from(BUCKET)
            .upload(`${selectedSlug}/${fileName}`, file, { upsert: false })
          if (error) errs++
        })
      )

      if (errs > 0) showToast(false, `${errs} file(s) failed to upload.`)
      else showToast(true, `${sorted.length} page(s) uploaded for "${selectedSlug}"`)

      await loadPages(selectedSlug)
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(name: string) {
    if (!selectedSlug) return
    if (!confirm(`Delete "${name}" from ${selectedSlug}? This cannot be undone.`)) return
    setDeletingName(name)
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([`${selectedSlug}/${name}`])
      if (error) throw error
      setPages(p => p.filter(pg => pg.name !== name))
      showToast(true, `Deleted "${name}"`)
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeletingName(null)
    }
  }

  async function handleDeleteAll() {
    if (!selectedSlug || pages.length === 0) return
    if (!confirm(`Delete ALL ${pages.length} pages for "${selectedSlug}"? This cannot be undone.`)) return
    setUploading(true)
    try {
      const paths = pages.map(p => `${selectedSlug}/${p.name}`)
      const { error } = await supabase.storage.from(BUCKET).remove(paths)
      if (error) throw error
      setPages([])
      showToast(true, `All pages deleted for "${selectedSlug}"`)
    } catch (err) {
      showToast(false, err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setUploading(false)
    }
  }

  const selectedStory = stories.find(s => s.slug === selectedSlug)

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-ds-surface border-b border-ds-border px-4 py-3 flex items-center gap-3">
        <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-lg hover:bg-ds-bg transition-colors">
          <Menu size={18} />
        </button>
        <BookOpen size={20} className="text-ds-accent flex-shrink-0" />
        <div className="flex-1">
          <h1 className="text-base font-bold">Pages d&apos;histoires</h1>
          {admin && (
            <p className="text-xs text-ds-muted">
              {stories.length} histoires · pages vierges pour PDF personnalisés
            </p>
          )}
        </div>
        <button
          onClick={() => loadPages(selectedSlug)}
          disabled={loadingPages}
          className="p-2 rounded-lg border border-ds-border hover:bg-ds-bg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} className={loadingPages ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mx-4 mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
          toast.ok
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {toast.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-4 max-w-5xl mx-auto w-full">

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-800 leading-relaxed">
          <strong>Comment ça marche :</strong> Le designer prépare des pages PNG sans le personnage Nimi (espace vide).
          Uploadez ces pages ici par histoire. Le générateur PDF superpose automatiquement la photo et le prénom de l&apos;enfant
          à chaque page. Les pages sont nommées automatiquement <code className="bg-blue-100 px-1 rounded">page-01.png</code>, <code className="bg-blue-100 px-1 rounded">page-02.png</code>…
        </div>

        {/* Story selector */}
        <div className="bg-ds-surface border border-ds-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <label className="text-xs font-semibold text-ds-muted mb-1.5 block">Histoire</label>
              <select
                value={selectedSlug}
                onChange={e => setSelectedSlug(e.target.value)}
                className="w-full text-sm border border-ds-border rounded-lg px-3 py-2 bg-ds-bg focus:outline-none focus:ring-2 focus:ring-ds-accent/40"
              >
                {stories.map(s => (
                  <option key={s.slug} value={s.slug}>
                    Livre {s.sort_order} — {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Upload button */}
              <label className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-ds-accent hover:opacity-90 transition cursor-pointer ${uploading ? 'opacity-60 cursor-wait' : ''}`}>
                <Upload size={14} />
                {uploading ? 'Upload…' : 'Ajouter des pages'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  multiple
                  disabled={uploading || !selectedSlug}
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.length) handleUpload(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>

              {/* Delete all */}
              {pages.length > 0 && (
                <button
                  onClick={handleDeleteAll}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition disabled:opacity-40"
                >
                  <Trash2 size={14} />
                  Tout supprimer
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          {selectedStory && (
            <div className="flex items-center gap-3 text-xs text-ds-muted">
              <span className={`flex items-center gap-1 font-semibold ${pages.length > 0 ? 'text-green-700' : 'text-amber-600'}`}>
                {pages.length > 0
                  ? <><CheckCircle2 size={13} /> {pages.length} page(s) uploadée(s)</>
                  : <><AlertCircle size={13} /> Aucune page</>
                }
              </span>
              <span>·</span>
              <span>Bucket: <code className="font-mono">story-pages/{selectedSlug}/</code></span>
            </div>
          )}
        </div>

        {/* Pages grid */}
        {loadingPages ? (
          <div className="flex items-center justify-center py-16 text-ds-muted text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Chargement…
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-ds-muted">
            <ImageIcon size={36} className="opacity-30" />
            <p className="text-sm">Aucune page uploadée pour cette histoire.</p>
            <p className="text-xs">Cliquez sur &quot;Ajouter des pages&quot; pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map(page => (
              <div
                key={page.name}
                className="bg-ds-surface border border-ds-border rounded-xl overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[1240/1754] bg-gray-100 overflow-hidden">
                  <img
                    src={page.url}
                    alt={page.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreview(page.url)}
                      className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-700 hover:bg-gray-100 transition"
                      title="Prévisualiser"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(page.name)}
                      disabled={deletingName === page.name}
                      className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition disabled:opacity-50"
                      title="Supprimer"
                    >
                      {deletingName === page.name
                        ? <RefreshCw size={13} className="animate-spin" />
                        : <Trash2 size={13} />
                      }
                    </button>
                  </div>
                  {/* Page number badge */}
                  <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    p.{page.pageNum}
                  </div>
                </div>
                {/* Footer */}
                <div className="px-2 py-1.5">
                  <p className="text-[10px] font-mono text-ds-muted truncate">{page.name}</p>
                  <p className="text-[10px] text-ds-muted">{formatBytes(page.size)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox preview */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-h-full max-w-2xl" onClick={e => e.stopPropagation()}>
            <img
              src={preview}
              alt="Preview"
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
            />
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
