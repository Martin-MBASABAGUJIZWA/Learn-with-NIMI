'use client'
import { useEffect, useRef, useState } from 'react'
import { getCachedAdmin } from './adminAuth'
import { Menu, Music, Upload, Trash2, RefreshCw, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import { useToast } from './Toast'
import supabase from '@/lib/supabaseClient'

interface Props {
  onNavigate: (t: string) => void
  onOpenSidebar?: () => void
}

interface ChildRow {
  id: string
  name: string
  age: number | null
  parent_id: string
}

interface SongFile {
  name: string
  size: number
}

const BUCKET = 'child-songs'
const ACCEPTED = '.mp3,.m4a,.ogg,.wav,.webm,audio/*'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function SongManager({ onNavigate, onOpenSidebar }: Props) {
  const { error: toastErr } = useToast()

  const [admin,       setAdmin]       = useState<{ name: string; role: string } | null>(null)
  const [children,    setChildren]    = useState<ChildRow[]>([])
  const [songs,       setSongs]       = useState<Record<string, SongFile | null>>({})  // childId → file or null
  const [loading,     setLoading]     = useState(true)
  const [query,       setQuery]       = useState('')
  const [uploading,   setUploading]   = useState<Record<string, boolean>>({})
  const [deleting,    setDeleting]    = useState<Record<string, boolean>>({})
  const [toast,       setToast]       = useState<{ ok: boolean; msg: string } | null>(null)
  const fileInputRef  = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    getCachedAdmin().then(a => { if (a) setAdmin(a) }).catch(() => {})
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const { data: kids } = await supabase
        .from('children')
        .select('id, name, age, parent_id')
        .order('name', { ascending: true })
        .limit(500)

      const list = kids ?? []
      setChildren(list)

      // List root of child-songs bucket to find which children have folders
      const { data: folders } = await supabase.storage.from(BUCKET).list('', {
        sortBy: { column: 'name', order: 'asc' },
        limit: 1000,
      })

      const folderSet = new Set((folders ?? []).map(f => f.name))

      // For children that have a folder, fetch the first file inside
      const songMap: Record<string, SongFile | null> = {}
      await Promise.all(
        list.map(async (child) => {
          if (!folderSet.has(child.id)) {
            songMap[child.id] = null
            return
          }
          const { data: files } = await supabase.storage.from(BUCKET).list(child.id, {
            sortBy: { column: 'name', order: 'asc' },
            limit: 10,
          })
          const audioFiles = (files ?? []).filter(f =>
            /\.(mp3|m4a|ogg|wav|webm)$/i.test(f.name)
          )
          songMap[child.id] = audioFiles[0]
            ? { name: audioFiles[0].name, size: audioFiles[0].metadata?.size ?? 0 }
            : null
        })
      )

      setSongs(songMap)
    } catch (err) {
      toastErr('Failed to load data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleUpload(child: ChildRow, file: File) {
    setUploading(p => ({ ...p, [child.id]: true }))
    try {
      // Remove existing song first
      const existing = songs[child.id]
      if (existing) {
        await supabase.storage.from(BUCKET).remove([`${child.id}/${existing.name}`])
      }

      const ext = file.name.split('.').pop() ?? 'mp3'
      const fileName = `${child.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${ext}`
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(`${child.id}/${fileName}`, file, { upsert: true })

      if (error) throw error

      setSongs(p => ({
        ...p,
        [child.id]: { name: fileName, size: file.size },
      }))
      showToast(true, `Song uploaded for ${child.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(false, `Upload failed: ${msg}`)
    } finally {
      setUploading(p => ({ ...p, [child.id]: false }))
    }
  }

  async function handleDelete(child: ChildRow) {
    const existing = songs[child.id]
    if (!existing) return
    if (!confirm(`Delete song "${existing.name}" for ${child.name}?`)) return

    setDeleting(p => ({ ...p, [child.id]: true }))
    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove([`${child.id}/${existing.name}`])
      if (error) throw error
      setSongs(p => ({ ...p, [child.id]: null }))
      showToast(true, `Song deleted for ${child.name}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      showToast(false, `Delete failed: ${msg}`)
    } finally {
      setDeleting(p => ({ ...p, [child.id]: false }))
    }
  }

  const filtered = children.filter(c =>
    !query || c.name.toLowerCase().includes(query.toLowerCase())
  )
  const withSong    = filtered.filter(c => songs[c.id])
  const withoutSong = filtered.filter(c => !songs[c.id])
  const sorted      = [...withSong, ...withoutSong]

  return (
    <div className="min-h-screen bg-ds-bg text-ds-text flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-ds-surface border-b border-ds-border px-4 py-3 flex items-center gap-3">
        <button onClick={onOpenSidebar} className="lg:hidden p-2 rounded-lg hover:bg-ds-bg transition-colors">
          <Menu size={18} />
        </button>
        <Music size={20} className="text-ds-accent flex-shrink-0" />
        <div className="flex-1">
          <h1 className="text-base font-bold">Songs par enfant</h1>
          {admin && (
            <p className="text-xs text-ds-muted">
              {children.length} enfants · {Object.values(songs).filter(Boolean).length} chansons
            </p>
          )}
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg border border-ds-border hover:bg-ds-bg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
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

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ds-muted" />
          <input
            type="search"
            placeholder="Rechercher un enfant…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-ds-border bg-ds-bg focus:outline-none focus:ring-2 focus:ring-ds-accent/40"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-2 flex gap-4 text-xs text-ds-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> Song uploadée
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-300" /> Pas de song
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 px-4 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-ds-muted text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Chargement…
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-24 text-ds-muted text-sm">Aucun enfant trouvé.</div>
        ) : (
          <div className="rounded-xl border border-ds-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ds-surface border-b border-ds-border text-xs uppercase tracking-wide text-ds-muted">
                  <th className="text-left px-4 py-3 font-semibold">Enfant</th>
                  <th className="text-left px-4 py-3 font-semibold">Âge</th>
                  <th className="text-left px-4 py-3 font-semibold">Song</th>
                  <th className="text-left px-4 py-3 font-semibold">Taille</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {sorted.map(child => {
                  const song        = songs[child.id]
                  const isUploading = uploading[child.id]
                  const isDeleting  = deleting[child.id]

                  return (
                    <tr key={child.id} className="hover:bg-ds-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${song ? 'bg-green-500' : 'bg-gray-300'}`} />
                          {child.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ds-muted">{child.age != null ? `${child.age} ans` : '—'}</td>
                      <td className="px-4 py-3">
                        {song ? (
                          <span className="font-mono text-xs text-ds-text">{song.name}</span>
                        ) : (
                          <span className="text-ds-muted text-xs italic">Aucune</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ds-muted text-xs">
                        {song ? formatBytes(song.size) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {/* Upload */}
                          <input
                            ref={el => { fileInputRef.current[child.id] = el }}
                            type="file"
                            accept={ACCEPTED}
                            className="hidden"
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(child, file)
                              e.target.value = ''
                            }}
                          />
                          <button
                            onClick={() => fileInputRef.current[child.id]?.click()}
                            disabled={isUploading || isDeleting}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-ds-border hover:bg-ds-bg transition-colors disabled:opacity-40"
                          >
                            <Upload size={13} />
                            {isUploading ? 'Upload…' : song ? 'Remplacer' : 'Uploader'}
                          </button>

                          {/* Delete */}
                          {song && (
                            <button
                              onClick={() => handleDelete(child)}
                              disabled={isUploading || isDeleting}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={13} />
                              {isDeleting ? 'Suppression…' : 'Supprimer'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
