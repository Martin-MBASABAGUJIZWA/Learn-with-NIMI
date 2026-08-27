'use client'
import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Music, Image as ImageIcon, Trash2 } from 'lucide-react'
import supabase from '@/lib/supabaseClient'
import { getStorageUrl } from '@/lib/queries'
import { smartUpload } from '@/lib/uploadWithProgress'
import { useToast } from './Toast'
import { useConfirmDialog } from './ConfirmDialog'
import { deleteStorageFile } from './storageDelete'
import type { Lang } from './missionMeta'

export interface FlipFlopPage {
  id: string
  page_number: number
  image_url: string | null
  story_page_versions: {
    id: string
    language: string
    audio_url: string | null
    image_url: string | null
    text: string | null
  }[]
}

export default function FlipFlopPageCard({
  page, lang, onUpdated, index, total, onReorder,
}: {
  page: FlipFlopPage
  lang: Lang
  onUpdated: () => void
  index: number
  total: number
  onReorder: (dir: 'up' | 'down') => Promise<void>
}) {
  const imgRef   = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy]           = useState('')
  const [reordering, setReordering] = useState(false)
  const { error: toastErr }       = useToast()
  const { confirm: confirmDialog, dialog: confirmEl } = useConfirmDialog()
  const langVer    = (page.story_page_versions ?? []).find(v => v.language === lang)
  const hasAudio   = !!langVer?.audio_url
  const displayImage = langVer?.image_url ?? page.image_url

  const handleReorder = async (dir: 'up' | 'down') => {
    setReordering(true)
    try { await onReorder(dir) }
    catch (err) { toastErr(err instanceof Error ? err.message : 'Reorder failed') }
    finally { setReordering(false) }
  }

  const [caption, setCaption]         = useState(langVer?.text ?? '')
  const captionTimer                   = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => { setCaption(langVer?.text ?? '') }, [langVer?.text])
  useEffect(() => () => { if (captionTimer.current) clearTimeout(captionTimer.current) }, [])

  const handleCaption = (v: string) => {
    setCaption(v)
    if (captionTimer.current) clearTimeout(captionTimer.current)
    captionTimer.current = setTimeout(async () => {
      if (langVer) {
        const { error } = await supabase.from('story_page_versions').update({ text: v || null }).eq('id', langVer.id)
        if (error) toastErr(`Caption save failed: ${error.message}`)
      } else {
        const { error } = await supabase.from('story_page_versions')
          .insert({ story_page_id: page.id, language: lang, text: v || null, audio_url: null, published: true })
        if (error) { toastErr(`Caption save failed: ${error.message}`) } else { onUpdated() }
      }
    }, 800)
  }

  const uploadImage = async (f: File) => {
    setBusy('image')
    const { error, storagePath } = await smartUpload(
      'storyBook', `pages/${page.id}-${lang}-${Date.now()}.${f.name.split('.').pop()}`, f
    )
    if (!error) {
      if (langVer?.image_url) await deleteStorageFile(langVer.image_url).catch(() => {})
      const dbErr = langVer
        ? (await supabase.from('story_page_versions').update({ image_url: storagePath }).eq('id', langVer.id)).error
        : (await supabase.from('story_page_versions').insert({ story_page_id: page.id, language: lang, text: '', image_url: storagePath, audio_url: null, published: true })).error
      if (dbErr) { toastErr(`Save failed: ${dbErr.message}`) } else { onUpdated() }
    }
    setBusy('')
  }

  const uploadAudio = async (f: File) => {
    setBusy('audio')
    const ext = f.name.split('.').pop()
    const { error, storagePath } = await smartUpload('storyBook', `pages/audio-${page.id}-${Date.now()}.${ext}`, f)
    if (!error) {
      if (langVer?.audio_url) await deleteStorageFile(langVer.audio_url).catch(() => {})
      const { error: dbErr } = langVer
        ? await supabase.from('story_page_versions').update({ audio_url: storagePath }).eq('id', langVer.id)
        : await supabase.from('story_page_versions').insert({ story_page_id: page.id, language: lang, text: '', audio_url: storagePath, published: true })
      if (dbErr) { toastErr(`Save failed: ${dbErr.message}`) } else { onUpdated() }
    }
    setBusy('')
  }

  const deletePage = async () => {
    const ok = await confirmDialog({ title: `Delete page #${page.page_number}?`, message: 'This will remove the image and all audio versions. Cannot be undone.' })
    if (!ok) return
    const allVersions = page.story_page_versions ?? []
    await Promise.all([
      page.image_url ? deleteStorageFile(page.image_url).catch(() => {}) : null,
      ...allVersions.flatMap(v => [
        v.image_url ? deleteStorageFile(v.image_url).catch(() => {}) : null,
        v.audio_url ? deleteStorageFile(v.audio_url).catch(() => {}) : null,
      ]),
    ])
    const { error: e1 } = await supabase.from('story_page_versions').delete().eq('story_page_id', page.id)
    if (e1) { toastErr(`Delete failed: ${e1.message}`); return }
    const { error: e2 } = await supabase.from('story_pages').delete().eq('id', page.id)
    if (e2) { toastErr(`Delete failed: ${e2.message}`); return }
    onUpdated()
  }

  const removeAudio = async () => {
    if (!langVer) return
    if (langVer.audio_url) await deleteStorageFile(langVer.audio_url).catch(() => {})
    const { error } = await supabase.from('story_page_versions').update({ audio_url: null }).eq('id', langVer.id)
    if (error) { toastErr(`Remove failed: ${error.message}`); return }
    onUpdated()
  }

  return (
    <div className={`rounded-xl border border-gray-200 overflow-hidden bg-white group relative ${reordering ? 'opacity-50 pointer-events-none' : ''}`}>
      {confirmEl}
      {/* Reorder arrows */}
      <div className="absolute top-1.5 right-1.5 z-10 flex gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button type="button" disabled={index === 0} onClick={() => handleReorder('up')}
          className="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-gray-500 hover:text-green-600 disabled:opacity-30 disabled:pointer-events-none shadow-sm">
          <ChevronDown size={11} className="rotate-180" />
        </button>
        <button type="button" disabled={index === total - 1} onClick={() => handleReorder('down')}
          className="w-5 h-5 bg-white/90 rounded flex items-center justify-center text-gray-500 hover:text-green-600 disabled:opacity-30 disabled:pointer-events-none shadow-sm">
          <ChevronDown size={11} />
        </button>
      </div>
      {/* Image area */}
      <div className="aspect-[3/4] bg-gray-100 relative cursor-pointer" onClick={() => imgRef.current?.click()}>
        {busy === 'image' ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayImage ? (
          <>
            <img src={getStorageUrl(displayImage)} alt={`Page ${page.page_number}`} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-white text-[11px] font-bold bg-black/50 rounded-lg px-3 py-1.5">Replace</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 hover:text-green-400 transition">
            <ImageIcon size={28} />
            <span className="text-[11px] font-bold mt-1">Upload Image</span>
          </div>
        )}
        <div className="absolute top-1.5 left-1.5 bg-white/90 backdrop-blur-sm rounded-md px-2 py-0.5 text-[10px] font-bold text-gray-600 shadow-sm">#{page.page_number}</div>
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} />

      {/* Bottom controls */}
      <div className="p-2.5 space-y-2">
        {/* Audio */}
        {busy === 'audio' ? (
          <div className="flex items-center gap-2 bg-green-50 rounded-lg px-2.5 py-2">
            <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-[11px] text-green-600 font-medium">Uploading...</span>
          </div>
        ) : hasAudio ? (
          <div className="space-y-1.5">
            <audio controls src={getStorageUrl(langVer!.audio_url!)} className="w-full h-8 rounded" />
            <div className="flex items-center gap-1.5">
              <Music size={11} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] text-emerald-700 font-medium truncate flex-1">{langVer?.audio_url?.split('/').pop()}</span>
              <button type="button" onClick={() => audioRef.current?.click()} className="text-[10px] font-bold text-green-600 hover:underline shrink-0">Replace</button>
              <button type="button" onClick={removeAudio} className="text-[10px] font-bold text-red-500 hover:underline shrink-0">✕</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => audioRef.current?.click()}
            className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-200 rounded-lg py-2.5 text-gray-400 hover:text-green-500 hover:border-green-300 transition min-h-[36px]">
            <Music size={12} />
            <span className="text-[11px] font-bold">Add Audio</span>
          </button>
        )}
        <input ref={audioRef} type="file" accept="audio/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadAudio(f) }} />

        {/* Caption */}
        <textarea
          value={caption}
          onChange={e => handleCaption(e.target.value)}
          placeholder="Caption…"
          rows={2}
          className="w-full text-[11px] text-gray-700 border border-gray-200 rounded-lg px-2.5 py-2 resize-none focus:outline-none focus:border-green-400 transition placeholder:text-gray-300"
        />

        {/* Delete */}
        <button type="button" onClick={deletePage}
          className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg py-2 transition min-h-[32px]">
          <Trash2 size={11} /> Delete Page
        </button>
      </div>
    </div>
  )
}
