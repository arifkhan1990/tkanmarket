import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Verify Meta (Facebook/Instagram) X-Hub-Signature-256 header.
 * Returns true only if the signature exactly matches an HMAC-SHA256 of the raw body
 * computed with the app secret. Any parsing failure returns false.
 */
export function verifyMetaSignature(params: { rawBody: string; header: string | null; appSecret: string }): boolean {
  if (!params.header || !params.appSecret) return false
  const [scheme, provided] = params.header.split('=')
  if (scheme !== 'sha256' || !provided) return false
  const expected = createHmac('sha256', params.appSecret).update(params.rawBody, 'utf8').digest('hex')
  if (expected.length !== provided.length) return false
  try {
    return timingSafeEqual(Buffer.from(expected, 'utf8'), Buffer.from(provided, 'utf8'))
  } catch {
    return false
  }
}
