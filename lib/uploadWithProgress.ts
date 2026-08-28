import supabase from './supabaseClient'
import * as tus from 'tus-js-client'

export interface UploadProgress {
  percent: number
  loaded: number
  total: number
}

// Files larger than this use TUS resumable upload (bypasses the project-level HTTP size limit)
const TUS_THRESHOLD = 10 * 1024 * 1024 // 10 MB

async function uploadSmall(
  bucket: string,
  path: string,
  file: File,
  token: string,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ error: Error | null }> {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/${bucket}/${path}`

  return new Promise(resolve => {
    const xhr = new XMLHttpRequest()

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ percent: Math.round((e.loaded / e.total) * 100), loaded: e.loaded, total: e.total })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ error: null })
      } else {
        let detail = ''
        try { detail = (JSON.parse(xhr.responseText) as { message?: string })?.message ?? xhr.responseText } catch { detail = xhr.responseText }
        resolve({ error: new Error(`Upload failed: ${xhr.status}${detail ? ' — ' + detail : ''}`) })
      }
    }

    xhr.onerror = () => resolve({ error: new Error('Network error') })
    xhr.ontimeout = () => resolve({ error: new Error('Upload timed out') })

    xhr.open('POST', url)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    xhr.setRequestHeader('x-upsert', 'true')
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.timeout = 0

    xhr.send(file)
  })
}

function uploadResumable(
  bucket: string,
  path: string,
  file: File,
  token: string,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ error: Error | null }> {
  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`

  return new Promise((resolve) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 6000, 12000],
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024, // 6 MB chunks
      onError: (err) => resolve({ error: new Error(err.message) }),
      onProgress: (bytesUploaded, bytesTotal) => {
        onProgress?.({
          percent: Math.round((bytesUploaded / bytesTotal) * 100),
          loaded: bytesUploaded,
          total: bytesTotal,
        })
      },
      onSuccess: () => resolve({ error: null }),
    })

    upload.start()
  })
}

export async function uploadWithProgress(
  bucket: string,
  path: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ error: Error | null }> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) return { error: new Error('Not authenticated') }

  if (file.size > TUS_THRESHOLD) {
    return uploadResumable(bucket, path, file, token, onProgress)
  }
  return uploadSmall(bucket, path, file, token, onProgress)
}

export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < 500 * 1024) return file
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(blob => {
        if (blob && blob.size < file.size) {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }))
        } else {
          resolve(file)
        }
      }, 'image/jpeg', quality)
    }
    img.onerror = () => resolve(file)
    img.src = URL.createObjectURL(file)
  })
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export async function smartUpload(
  bucket: string,
  path: string,
  rawFile: File,
  onProgress?: (p: UploadProgress & { status: string }) => void,
): Promise<{ error: Error | null; storagePath: string }> {
  const storagePath = `${bucket}/${path}`

  onProgress?.({ percent: 0, loaded: 0, total: rawFile.size, status: 'Compressing...' })
  const file = await compressImage(rawFile)

  const sizeLabel = formatBytes(file.size)
  const isResumable = file.size > TUS_THRESHOLD
  onProgress?.({ percent: 0, loaded: 0, total: file.size, status: `Uploading ${sizeLabel}${isResumable ? ' (resumable)' : ''}...` })

  const { error } = await uploadWithProgress(bucket, path, file, (p) => {
    onProgress?.({ ...p, status: `${p.percent}% — ${formatBytes(p.loaded)} of ${sizeLabel}` })
  })

  if (!error) {
    onProgress?.({ percent: 100, loaded: file.size, total: file.size, status: 'Done!' })
  }

  return { error, storagePath }
}
