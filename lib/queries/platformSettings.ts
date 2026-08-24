import supabase from '@/lib/supabaseClient'

export async function getPlatformSetting(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()
  return data?.value ?? null
}

export async function setPlatformSetting(key: string, value: string | null): Promise<void> {
  await supabase
    .from('platform_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
}

export async function getNimipikoPlatformIntroVideoUrl(): Promise<string | null> {
  return getPlatformSetting('nimipiko_intro_video_url')
}

export async function markChildIntroWatched(childId: string): Promise<void> {
  await supabase
    .from('children')
    .update({ nimipiko_intro_watched: true })
    .eq('id', childId)
}
