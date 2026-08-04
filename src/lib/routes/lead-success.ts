import { sanitizeLeadSuccessContactParam } from '@/lib/sanitize-lead-success-contact'

/** Canonical path; after a successful lead POST the API sets an HttpOnly cookie — redirect here without query params. */
export const LEAD_SUCCESS_PATH = '/lead-success'

/**
 * Thank-you page after a public lead submission (`src/app/(conversion)/lead-success/page.tsx`).
 * Prefer {@link LEAD_SUCCESS_PATH} after POST (server sets HttpOnly cookie for the display name).
 *
 * Query `contact` is optional (legacy / shareable links). It may appear in Referer logs and
 * browser history — use the same sanitization as the page.
 */
export function leadSuccessHref(contactName: string): string {
  const q = new URLSearchParams()
  const cleaned = sanitizeLeadSuccessContactParam(contactName)
  if (cleaned) q.set('contact', cleaned)
  const qs = q.toString()
  return qs ? `/lead-success?${qs}` : '/lead-success'
}
