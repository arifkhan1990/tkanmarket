import crypto from 'node:crypto'

/**
 * Strips common tracking params and normalizes URL for stable deduplication.
 */
export function normalizeProductUrl(raw: string): string {
  try {
    const u = new URL(raw.trim())
    u.hash = ''
    const drop = new Set([
      'spm',
      'tracelog',
      'from',
      'shareId',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'pvid',
      'scene'
    ])
    for (const k of [...u.searchParams.keys()]) {
      if (drop.has(k)) u.searchParams.delete(k)
    }
    u.pathname = u.pathname.replace(/\/+$/, '') || '/'
    return u.toString()
  } catch {
    return raw.trim()
  }
}

export function urlHash16(url: string): string {
  return crypto.createHash('sha256').update(normalizeProductUrl(url)).digest('hex').slice(0, 16)
}
