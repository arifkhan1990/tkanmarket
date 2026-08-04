/**
 * Normalizes display names for `/lead-success` (optional `contact` query, HttpOnly cookie, redirects).
 * Defense-in-depth for reflected display; pair with React text rendering. Truncates for URLs and headings.
 */
export const MAX_LEAD_SUCCESS_CONTACT_LEN = 80

export function sanitizeLeadSuccessContactParam(raw: string | null | undefined): string | null {
  if (raw == null) return null
  let s = raw.trim()
  if (s.length === 0) return null

  try {
    s = decodeURIComponent(s)
  } catch {
    /* ignore malformed percent-encoding */
  }

  s = s.replace(/\u200B/g, '').replace(/[\u0000-\u001F\u007F]/g, '')
  s = s.normalize('NFKC').trim()
  if (s.length === 0) return null

  s = s.replace(/[<>]/g, '').slice(0, MAX_LEAD_SUCCESS_CONTACT_LEN).trim()
  return s.length > 0 ? s : null
}
