import { logger } from '@/lib/logger'

export type CookieLike = {
  name: string
  value: string
  domain: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  expires?: number
}

type RawCookieExport = {
  name?: string
  value?: string
  domain?: string
  path?: string
  secure?: boolean
  httpOnly?: boolean
  // Cookie-Editor uses "no_restriction" instead of Playwright's "None"
  sameSite?: string
  // Cookie-Editor uses "expirationDate", Playwright uses "expires"
  expirationDate?: number
  expires?: number
  // ignored by Playwright
  hostOnly?: boolean
  session?: boolean
  storeId?: unknown
}

let parsedSiteCookies: CookieLike[] | null = null

function normalizeCookie(raw: RawCookieExport): CookieLike | null {
  if (!raw.name || !raw.value || !raw.domain) return null
  const sameSiteMap: Record<string, 'Strict' | 'Lax' | 'None'> = {
    strict: 'Strict',
    lax: 'Lax',
    none: 'None',
    no_restriction: 'None',
    unspecified: 'Lax'
  }
  const sameSite = sameSiteMap[(raw.sameSite ?? '').toLowerCase()] ?? 'Lax'
  const expires = raw.expirationDate ?? raw.expires ?? -1
  return {
    name: raw.name,
    value: raw.value,
    domain: raw.domain,
    path: raw.path ?? '/',
    secure: raw.secure ?? false,
    httpOnly: raw.httpOnly ?? false,
    sameSite,
    ...(expires > 0 ? { expires } : {})
  }
}

export function getSiteCookies(): CookieLike[] {
  if (parsedSiteCookies !== null) return parsedSiteCookies
  const raw = process.env.CRAWLER_SITE_COOKIES?.trim()
  if (!raw) {
    parsedSiteCookies = []
    return []
  }
  try {
    // dotenv may strip surrounding quotes; handle both quoted and bare JSON
    const cleaned = raw.replace(/^"+|"+$/g, '').trim()
    const parsed = JSON.parse(cleaned) as unknown
    if (!Array.isArray(parsed)) {
      logger.warn('CRAWLER_SITE_COOKIES must be a JSON array — ignored')
      parsedSiteCookies = []
      return []
    }
    parsedSiteCookies = (parsed as RawCookieExport[])
      .map(normalizeCookie)
      .filter((c): c is CookieLike => c !== null)
    logger.info('CRAWLER_SITE_COOKIES parsed', { count: parsedSiteCookies.length })
  } catch (err) {
    logger.warn('CRAWLER_SITE_COOKIES JSON parse failed', {
      message: err instanceof Error ? err.message : String(err),
      hint: 'Ensure it is single-line JSON or properly escaped in .env'
    })
    parsedSiteCookies = []
  }
  return parsedSiteCookies
}

