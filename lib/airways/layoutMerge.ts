/**
 * Merge a saved layout field (from DB, may have null sub-fields) with its
 * compile-time defaults. Iterates over the keys of `defaults` so unknown DB
 * columns are ignored and every expected key has a non-null value.
 */
export function mergeField<T>(
  saved: Partial<T> | undefined | null,
  defaults: T,
): T {
  if (!saved) return defaults
  const s = saved as Record<string, unknown>
  const d = defaults as Record<string, unknown>
  return Object.fromEntries(Object.keys(d).map(k => [k, s[k] ?? d[k]])) as T
}
