import { sanitizeLeadSuccessContactParam } from '@/lib/sanitize-lead-success-contact'

/** HttpOnly cookie scoped to `/lead-success` — set on successful `POST /api/v1/leads`. */
export const LEAD_SUCCESS_COOKIE_NAME = 'tk_lm_ls_contact'

const MAX_AGE_SECONDS = 120

export function encodeLeadSuccessCookieValue(rawContactName: string): string {
  const s = sanitizeLeadSuccessContactParam(rawContactName)
  if (!s) return ''
  return Buffer.from(s, 'utf8').toString('base64url')
}

export function decodeLeadSuccessCookieValue(encoded: string): string | null {
  const t = encoded.trim()
  if (t.length === 0) return null
  try {
    const raw = Buffer.from(t, 'base64url').toString('utf8')
    return sanitizeLeadSuccessContactParam(raw)
  } catch {
    return null
  }
}

export function getLeadSuccessCookieSetOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/lead-success',
    maxAge: MAX_AGE_SECONDS
  }
}
