'use client'
import React, { useState, useRef } from 'react'
import { Palette, Trash2 } from 'lucide-react'
import supabase from '@/lib/supabaseClient'
import { getStorageUrl } from '@/lib/queries'
import { smartUpload } from '@/lib/uploadWithProgress'
import { useToast } from './Toast'
import { useConfirmDialog } from './ConfirmDialog'
import { deleteStorageFile } from './storageDelete'

export interface ColoringPage {
  id: string
  story_id?: string
  page_number: number
  template_image_url: string | null
}

export default function ColoringPageCard({ page, onUpdated }: { page: ColoringPage; onUpdated: () => void }) {
  const imgRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const { error: toastErr } = useToast()
  const { confirm: confirmDialog, dialog: confirmEl } = useConfirmDialog()

  const replaceImage = async (f: File) => {
    setBusy(true)
    const { error, storagePath } = await smartUpload(
      'storyBook',
      `coloring/${page.story_id ?? 'x'}/page-${page.page_number}-${Date.now()}.${f.name.split('.').pop()}`,
      f
    )
    if (!error) {
      if (page.template_image_url) await deleteStorageFile(page.template_image_url).catch(() => {})
      const { error: dbErr } = await supabase.from('coloring_pages').update({ template_image_url: storagePath }).eq('id', page.id)
      if (dbErr) { toastErr(`Save failed: ${dbErr.message}`) } else { onUpdated() }
    }
    setBusy(false)
  }

  const deletePage = async () => {
    const ok = await confirmDialog({ title: 'Delete coloring template?', message: 'This cannot be undone.' })
    if (!ok) return
    if (page.template_image_url) await deleteStorageFile(page.template_image_url).catch(() => {})
    const { error } = await supabase.from('coloring_pages').delete().eq('id', page.id)
    if (error) { toastErr(`Delete failed: ${error.message}`); return }
    onUpdated()
  }

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white group relative">
      {confirmEl}
      <div className="aspect-[3/4] bg-gray-50 relative cursor-pointer" onClick={() => imgRef.current?.click()}>
        {busy ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : page.template_image_url ? (
          <>
            <img src={getStorageUrl(page.template_image_url)} alt={`Coloring ${page.page_number}`} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-white text-[11px] font-bold bg-black/50 rounded-lg px-2.5 py-1">Replace</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
            <Palette size={20} />
            <span className="text-[9px] font-bold mt-0.5">Upload</span>
          </div>
        )}
      </div>
      <input ref={imgRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) replaceImage(f) }} />
      <button type="button" onClick={deletePage}
        className="w-full py-2 text-[10px] font-bold text-red-400 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center gap-1 min-h-[32px]">
        <Trash2 size={10} /> Remove
      </button>
    </div>
  )
}
