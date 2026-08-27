import supabase from '@/lib/supabaseClient'

/** storagePath format: "bucket/path/to/file.ext" */
export async function deleteStorageFile(storagePath: string): Promise<void> {
  const slash = storagePath.indexOf('/')
  if (slash === -1) return
  const bucket = storagePath.substring(0, slash)
  const path   = storagePath.substring(slash + 1)
  await supabase.storage.from(bucket).remove([path])
}
