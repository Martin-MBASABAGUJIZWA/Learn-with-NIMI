/**
 * Sanitizes a raw name for use in a Content-Disposition filename parameter.
 * Strips header-injection characters (\r \n " \) and replaces whitespace runs
 * with underscores. Preserves accented / international characters, which modern
 * browsers handle fine in filenames. Falls back to "child" if the result is empty.
 */
export function safeFilename(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[\r\n"\\]/g, '')
      .replace(/\s+/g, '_')
      .trim()
    || 'child'
  )
}
