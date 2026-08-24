'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Video, CheckCircle2, AlertCircle, Trash2, RefreshCw, UploadCloud } from 'lucide-react'
import supabase from '@/lib/supabaseClient'
import { getStorageUrl } from '@/lib/queries'
import { smartUpload, type UploadProgress } from '@/lib/uploadWithProgress'
import { useToast } from './Toast'
import { useConfirmDialog } from './ConfirmDialog'

interface Props {
  onNavigate?: (table: string) => void
  onOpenSidebar?: () => void
}

async function deleteStorageFile(storagePath: string) {
  const slash = storagePath.indexOf('/')
  if (slash === -1) return
  await supabase.storage.from(storagePath.substring(0, slash)).remove([storagePath.substring(slash + 1)])
}

export default function PlatformIntroVideoManager({ onOpenSidebar }: Props) {
  const [videoPath, setVideoPath] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<(UploadProgress & { status: string }) | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const { success: toastOk, error: toastErr } = useToast()
  const { confirm, dialog } = useConfirmDialog()

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'nimipiko_intro_video_url')
      .maybeSingle()
    setVideoPath(data?.value ?? null)
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  const saveToDb = async (path: string | null) => {
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ key: 'nimipiko_intro_video_url', value: path, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) throw new Error(error.message)
    setVideoPath(path)
  }

  const handleFile = async (f: File) => {
    setUploadError(null)
    setProgress({ percent: 0, loaded: 0, total: f.size, status: 'Starting…' })
    const ext = f.name.split('.').pop()
    const { error, storagePath } = await smartUpload('storyBook', `platform/nimipiko-intro-${Date.now()}.${ext}`, f, setProgress)
    if (error) {
      setProgress(null)
      setUploadError(error.message)
      toastErr('Upload failed: ' + error.message)
      return
    }
    try {
      if (videoPath) await deleteStorageFile(videoPath).catch(() => {})
      await saveToDb(storagePath)
      toastOk('Intro video updated.')
      setTimeout(() => setProgress(null), 2000)
    } catch (err) {
      setProgress(null)
      const msg = err instanceof Error ? err.message : 'Save failed'
      setUploadError(msg)
      toastErr('Save failed: ' + msg)
    }
  }

  const handleRemove = async () => {
    const ok = await confirm({
      title: 'Remove intro video?',
      message: 'The onboarding video will no longer play for new children. Children who already watched it are unaffected.',
    })
    if (!ok) return
    if (videoPath) await deleteStorageFile(videoPath).catch(() => {})
    await saveToDb(null)
    toastOk('Intro video removed.')
  }

  const uploading = progress !== null && progress.percent < 100

  return (
    <div className="flex flex-col h-full">
      {dialog}
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <button onClick={onOpenSidebar} className="md:hidden w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-lg">
          <Video size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Video size={18} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[16px] font-extrabold text-gray-900">Platform Intro Video</h1>
            <p className="text-[11px] text-gray-400">Plays once before a child starts their very first story</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full space-y-6">

        {/* What this is */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <p className="text-[13px] font-extrabold text-indigo-800 mb-1.5">📺 What is this?</p>
          <p className="text-[12px] text-indigo-700 leading-relaxed">
            This is the official <strong>Nimipiko Introduction Video</strong> (~3 min 57 sec). It plays automatically the first time a child opens any story — before the welcome screen — so they understand how the platform works. After watching once, it never plays again for that child.
          </p>
        </div>

        {/* Current video */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-extrabold text-gray-800">Current Video</p>
            {videoPath && !uploading && (
              <button onClick={handleRemove}
                className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">
                <Trash2 size={12} /> Remove
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-[13px]">
              <RefreshCw size={14} className="animate-spin" /> Loading…
            </div>
          ) : videoPath ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 size={16} />
                <span className="text-[12px] font-bold">Video uploaded and active</span>
              </div>
              <video
                src={getStorageUrl(videoPath)}
                controls
                className="w-full rounded-xl border border-gray-100 bg-black"
                style={{ maxHeight: 300 }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle size={16} />
              <span className="text-[12px] font-bold">No intro video — children will skip this step and go straight to the story</span>
            </div>
          )}
        </div>

        {/* Upload */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <p className="text-[13px] font-extrabold text-gray-800">{videoPath ? 'Replace Video' : 'Upload Intro Video'}</p>
          <p className="text-[11px] text-gray-400">MP4 recommended. Uploading a new video automatically deletes the old one from storage.</p>

          <input ref={fileRef} type="file" accept="video/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = '' } }} />

          {uploading ? (
            <div className="rounded-xl px-4 py-3 bg-green-50 border border-green-200">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-[13px] font-bold text-green-700">{progress!.status}</span>
              </div>
              <div className="w-full bg-green-100 rounded-full h-2">
                <div className="h-full bg-green-500 rounded-full transition-all duration-300" style={{ width: `${progress!.percent}%` }} />
              </div>
            </div>
          ) : uploadError ? (
            <div className="rounded-xl p-4 bg-red-50 border border-red-200">
              <p className="text-[12px] font-bold text-red-700">Upload failed</p>
              <p className="text-[11px] text-red-500 mt-0.5 break-words">{uploadError}</p>
              <button onClick={() => { setUploadError(null); fileRef.current?.click() }}
                className="mt-2 text-[11px] font-bold text-red-600 underline">Try again</button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition group">
              <UploadCloud size={28} className="text-gray-300 group-hover:text-indigo-500 transition" />
              <span className="text-[13px] font-bold text-gray-400 group-hover:text-indigo-600">Click to select video</span>
              <span className="text-[11px] text-gray-300">MP4 · up to 500 MB</span>
            </button>
          )}
        </div>

        {/* Reset watched flags */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <p className="text-[13px] font-extrabold text-gray-800">Reset All Children</p>
          <p className="text-[12px] text-gray-500 leading-relaxed">
            If you uploaded an updated video and want every child to see it again, reset their "watched" flag. The intro video will play the next time they open any story.
          </p>
          <button
            onClick={async () => {
              const ok = await confirm({
                title: 'Reset all watched flags?',
                message: 'Every child will see the intro video again the next time they open a story.',
                confirmLabel: 'Reset All',
              })
              if (!ok) return
              const { error } = await supabase.from('children').update({ nimipiko_intro_watched: false }).gte('created_at', '2000-01-01')
              if (error) { toastErr('Reset failed: ' + error.message) } else { toastOk('All children will see the intro video again.') }
            }}
            className="flex items-center gap-2 text-[12px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl px-4 py-2.5 transition">
            <RefreshCw size={14} /> Reset All Watched Flags
          </button>
        </div>

      </div>
    </div>
  )
}
