/**
 * Best-effort IP and User-Agent for auth/security audit rows.
 * May be unavailable outside a request context.
 */
export async function getAuthRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const { headers } = await import('next/headers')
    const h = await headers()
    const xf = h.get('x-forwarded-for')
    const ip = xf?.split(',')[0]?.trim() || h.get('x-real-ip') || null
    return { ip, userAgent: h.get('user-agent') }
  } catch {
    return { ip: null, userAgent: null }
  }
}
