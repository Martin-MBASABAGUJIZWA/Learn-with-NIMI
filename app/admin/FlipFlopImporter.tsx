'use client'
import React, { useState, useRef } from 'react'
import supabase from '@/lib/supabaseClient'
import { smartUpload } from '@/lib/uploadWithProgress'
import { Upload, CheckCircle2, AlertCircle, FileArchive, Image as ImageIcon, Music, X, FileText } from 'lucide-react'

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
    const num = String(i).padStart(3, '0')
    pageFiles.push(new File([blob], `${num}.jpg`, { type: 'image/jpeg' }))
  }

  return pageFiles
}

async function deleteStorageFile(storagePath: string): Promise<void> {
  const slash = storagePath.indexOf('/')
  if (slash === -1) return
  const bucket = storagePath.substring(0, slash)
  const path   = storagePath.substring(slash + 1)
  await supabase.storage.from(bucket).remove([path])
}

interface Props {
  storyId: string
  storyTitle: string
  language: string
  onDone: () => void
  onClose: () => void
}

interface DetectedFile {
  name: string
  type: 'image' | 'audio'
  pageNum: number
  file: File
}

function extractPageNum(name: string): number {
  const match = name.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

export default function FlipFlopImporter({ storyId, storyTitle, language, onDone, onClose }: Props) {
  const [files, setFiles] = useState<DetectedFile[]>([])
  const [importing, setImporting] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState('')
  const [progress, setProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (fileList: FileList) => {
    const detected: DetectedFile[] = []
    const pdfFiles: File[] = []

    for (const f of Array.from(fileList)) {
      const lower = f.name.toLowerCase()
      const pageNum = extractPageNum(f.name)
      if (lower.match(/\.(jpg|jpeg|png|webp|gif)$/)) {
        detected.push({ name: f.name, type: 'image', pageNum, file: f })
      } else if (lower.match(/\.(mp3|wav|ogg|m4a|aac)$/)) {
        detected.push({ name: f.name, type: 'audio', pageNum, file: f })
      } else if (lower.match(/\.pdf$/)) {
        pdfFiles.push(f)
      }
    }

    if (pdfFiles.length > 0) {
      setExtracting(true)
      setError(null)
      try {
        let seqCounter = 0
        for (const pdf of pdfFiles) {
          const filenameNum = extractPageNum(pdf.name)
          const pages = await pdfToImageFiles(pdf, (n, total) => {
            setExtractProgress(`Extracting ${pdf.name}: page ${n}/${total}…`)
          })
          pages.forEach((imgFile, idx) => {
            // Single-page PDF named with a number (e.g. page-7.pdf) → use that number
            // Multi-page PDF → sequential counter
            const pageNum = (pages.length === 1 && filenameNum > 0)
              ? filenameNum
              : ++seqCounter
            detected.push({ name: imgFile.name, type: 'image', pageNum, file: imgFile })
          })
          if (pages.length > 1) seqCounter += pages.length - 1
        }
      } catch {
        setError('Failed to extract PDF pages. Try exporting as images instead.')
      } finally {
        setExtracting(false)
        setExtractProgress('')
      }
    }

    detected.sort((a, b) => a.pageNum - b.pageNum || a.type.localeCompare(b.type))
    setFiles(detected)
    if (pdfFiles.length === 0) setError(null)
  }

  const handleImport = async () => {
    const images = files.filter(f => f.type === 'image').sort((a, b) => a.pageNum - b.pageNum)
    const audios = files.filter(f => f.type === 'audio')

    if (images.length === 0) { setError('No page images found.'); return }

    setImporting(true)
    setProgress(0)
    const total = images.length
    let completed = 0
    const BATCH_SIZE = 4

    const importOnePage = async (img: DetectedFile, pageNum: number) => {
      setCurrentFile(img.name)

      // Upload image + audio in parallel
      const imgPath = `pages/${storyId}/${language}/page-${String(pageNum).padStart(3, '0')}-${Date.now()}.${img.file.name.split('.').pop()}`
      const matchAudio = audios.find(a => a.pageNum === img.pageNum)
      const audioPath = matchAudio ? `pages/${storyId}/${language}/audio-${String(pageNum).padStart(3, '0')}-${Date.now()}.${matchAudio.file.name.split('.').pop()}` : null

      const uploads = [smartUpload('storyBook', imgPath, img.file)]
      if (matchAudio && audioPath) uploads.push(smartUpload('storyBook', audioPath, matchAudio.file))

      const results = await Promise.all(uploads)
      const imgResult = results[0]
      const audioResult = results[1]

      if (imgResult.error) throw new Error(`Failed to upload: ${img.name}`)

      // Upsert the master page row — safe to call repeatedly across language imports
      const { data: page, error: pageErr } = await supabase
        .from('story_pages')
        .upsert({ story_id: storyId, page_number: pageNum }, { onConflict: 'story_id,page_number' })
        .select('id').single()
      if (pageErr) throw new Error(`Failed to upsert page ${pageNum}: ${pageErr.message}`)

      // Delete old storage files for this language version before overwriting
      const { data: existingVer } = await supabase
        .from('story_page_versions')
        .select('image_url, audio_url')
        .eq('story_page_id', page.id)
        .eq('language', language)
        .maybeSingle()
      if (existingVer) {
        await Promise.all([
          existingVer.image_url ? deleteStorageFile(existingVer.image_url).catch(() => {}) : null,
          existingVer.audio_url ? deleteStorageFile(existingVer.audio_url).catch(() => {}) : null,
        ])
      }

      // Image is per-language — stored on story_page_versions, not story_pages
      const { error: versionErr } = await supabase.from('story_page_versions').upsert({
        story_page_id: page.id,
        language,
        text: '',
        image_url: imgResult.storagePath,
        audio_url: (audioResult && !audioResult.error) ? audioResult.storagePath : null,
        published: true,
      }, { onConflict: 'story_page_id,language' })
      if (versionErr) throw new Error(`Failed to save version for page ${pageNum}: ${versionErr.message}`)

      completed++
      setProgress(Math.round((completed / total) * 100))
    }

    try {
      // Process in parallel batches
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE)
        await Promise.all(batch.map((img, j) => importOnePage(img, i + j + 1)))
      }

      setDone(true)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setImporting(false)
    }
  }

  const images = files.filter(f => f.type === 'image')
  const audios = files.filter(f => f.type === 'audio')
  const matched = images.filter(img => audios.some(a => a.pageNum === img.pageNum)).length

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[85vh] overflow-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-[16px] font-extrabold text-gray-800">FlipFlop Bulk Import</h2>
              <p className="text-[12px] text-gray-400">{storyTitle} · {language.toUpperCase()}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {done ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-[16px] font-extrabold text-gray-800">Import Complete!</p>
                <p className="text-[13px] text-gray-500 mt-1">{images.length} pages imported with {matched} audio files.</p>
                <button onClick={onClose} className="mt-4 bg-green-600 text-white font-bold text-[13px] rounded-xl px-6 py-2.5">
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Instructions */}
                <div className="bg-green-50 rounded-xl p-4 text-[12px] text-green-700">
                  <p className="font-bold mb-1">How to import:</p>
                  <p>Select page images, a PDF, and/or audio files at once. Name image files with numbers (001.jpg, 002.jpg, etc.) so pages and audio match automatically. A PDF is automatically split into one image per page.</p>
                </div>

                {/* Extracting spinner */}
                {extracting && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                    <p className="text-[12px] text-blue-700 font-medium">{extractProgress || 'Extracting PDF pages…'}</p>
                  </div>
                )}

                {/* File picker */}
                <button onClick={() => inputRef.current?.click()} disabled={extracting}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center hover:border-green-300 hover:bg-green-50/30 transition disabled:opacity-50">
                  <Upload size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-[13px] font-bold text-gray-600">Select Files</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">PDF · Images (jpg, png) · Audio (mp3, wav)</p>
                </button>
                <input ref={inputRef} type="file" multiple accept="image/*,audio/*,.pdf,application/pdf" className="hidden"
                  onChange={e => { if (e.target.files) void handleFiles(e.target.files) }} />

                {/* Detection results */}
                {files.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <p className="text-[12px] font-bold text-gray-700">Detected:</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-green-500" />
                        <span className="text-[12px] font-medium text-gray-600">{images.length} pages</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Music size={14} className="text-pink-500" />
                        <span className="text-[12px] font-medium text-gray-600">{audios.length} audio</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span className="text-[12px] font-medium text-gray-600">{matched} matched</span>
                      </div>
                    </div>
                    {audios.length > 0 && matched < images.length && (
                      <p className="text-[11px] text-amber-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {images.length - matched} pages missing audio match
                      </p>
                    )}
                  </div>
                )}

                {/* Progress */}
                {importing && (
                  <div>
                    <div className="flex items-center justify-between text-[12px] font-medium text-gray-500 mb-1">
                      <span>Uploading: {currentFile || '...'}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-green-600 h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Large files may take a moment. Please wait.</p>
                  </div>
                )}

                {error && (
                  <p className="text-[12px] text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {error}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 font-bold text-[13px] rounded-xl py-2.5 hover:bg-gray-50 transition">
                    Cancel
                  </button>
                  <button onClick={handleImport} disabled={images.length === 0 || importing || extracting}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-[13px] rounded-xl py-2.5 transition disabled:opacity-50">
                    {importing ? 'Importing...' : extracting ? 'Extracting...' : `Import ${images.length} Pages`}
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
