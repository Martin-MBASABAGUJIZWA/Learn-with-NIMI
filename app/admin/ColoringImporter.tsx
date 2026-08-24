'use client'
import React, { useState, useRef } from 'react'
import supabase from '@/lib/supabaseClient'
import { smartUpload } from '@/lib/uploadWithProgress'
import { Upload, CheckCircle2, Image as ImageIcon, X } from 'lucide-react'
import { useToast } from './Toast'

async function pdfToImageFiles(pdfFile: File, onPage?: (n: number, total: number) => void): Promise<File[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageFiles: File[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    onPage?.(i, pdf.numPages)
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 2 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (page as any).render({ canvasContext: ctx, viewport }).promise
    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92))
    pageFiles.push(new File([blob], `${String(i).padStart(3, '0')}.jpg`, { type: 'image/jpeg' }))
  }
  return pageFiles
}

interface Props {
  storyId: string
  storyTitle: string
  onDone: () => void
  onClose: () => void
}

export default function ColoringImporter({ storyId, storyTitle, onDone, onClose }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState('')
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { error: toastErr } = useToast()

  const handleFiles = async (fileList: FileList) => {
    const imgs: File[] = []
    const pdfs: File[] = []
    for (const f of Array.from(fileList)) {
      const lower = f.name.toLowerCase()
      if (lower.match(/\.(jpg|jpeg|png|webp|gif)$/)) imgs.push(f)
      else if (lower.match(/\.pdf$/)) pdfs.push(f)
    }

    if (pdfs.length > 0) {
      setExtracting(true)
      try {
        for (const pdf of pdfs) {
          const pages = await pdfToImageFiles(pdf, (n, total) => {
            setExtractProgress(`Extracting ${pdf.name}: page ${n}/${total}…`)
          })
          imgs.push(...pages)
        }
      } catch {
        toastErr('Failed to extract PDF pages.')
      } finally {
        setExtracting(false)
        setExtractProgress('')
      }
    }

    imgs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    setFiles(imgs)
  }

  const handleImport = async () => {
    if (files.length === 0) return
    setImporting(true)
    setProgress(0)
    let completed = 0

    try {
      const { data: existing } = await supabase.from('coloring_pages').select('page_number').eq('story_id', storyId).order('page_number', { ascending: false }).limit(1)
      let nextPage = (existing?.[0]?.page_number ?? 0) + 1

      for (const file of files) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `coloring/${storyId}/page-${String(nextPage).padStart(3, '0')}-${Date.now()}.${ext}`
        const { error: uploadErr, storagePath } = await smartUpload('storyBook', path, file)
        if (uploadErr) throw new Error(`Upload failed: ${file.name}`)

        const { error: insertErr } = await supabase.from('coloring_pages').insert({
          story_id: storyId,
          page_number: nextPage,
          template_image_url: storagePath,
        })
        if (insertErr) throw new Error(`DB insert failed for page ${nextPage}: ${insertErr.message}`)

        nextPage++
        completed++
        setProgress(Math.round((completed / files.length) * 100))
      }

      setDone(true)
      onDone()
    } catch (err) {
      toastErr(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-800">Coloring Batch Import</h2>
              <p className="text-[12px] text-gray-400">{storyTitle}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {done ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-[16px] font-extrabold text-gray-800">Import Complete!</p>
                <p className="text-[13px] text-gray-500 mt-1">{files.length} coloring pages imported.</p>
                <button onClick={onClose} className="mt-4 bg-green-600 text-white font-bold text-[13px] rounded-xl px-6 py-2.5">Done</button>
              </div>
            ) : (
              <>
                {extracting && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-[12px] text-blue-700 font-medium">{extractProgress || 'Extracting PDF pages…'}</p>
                  </div>
                )}

                <button onClick={() => inputRef.current?.click()} disabled={extracting}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-center hover:border-orange-300 hover:bg-orange-50/30 transition disabled:opacity-50">
                  <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-[13px] font-bold text-gray-600">Select Coloring Pages</p>
                  <p className="text-[11px] text-gray-400">PDF · PNG · JPG</p>
                </button>
                <input ref={inputRef} type="file" multiple accept="image/*,.pdf,application/pdf" className="hidden"
                  onChange={e => { if (e.target.files) void handleFiles(e.target.files) }} />

                {files.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                    <ImageIcon size={16} className="text-orange-500" />
                    <span className="text-[12px] font-medium text-gray-600">{files.length} pages ready</span>
                  </div>
                )}

                {importing && (
                  <div>
                    <div className="flex justify-between text-[12px] text-gray-500 mb-1">
                      <span>Importing...</span><span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold text-[13px] rounded-xl py-2.5 hover:bg-gray-50">Cancel</button>
                  <button onClick={handleImport} disabled={files.length === 0 || importing || extracting}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[13px] rounded-xl py-2.5 disabled:opacity-50">
                    {importing ? 'Importing...' : extracting ? 'Extracting...' : `Import ${files.length} Pages`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
