import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'
import { getLocaleFromPathname, stripLocaleFromPathname } from '@/lib/i18n/locale-path'
import { findDisabledFeatureForRoute, findDisabledFeatureForApi } from '@/lib/features'

const LOCALE_COOKIE = 'tkan_locale'
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year — keeps the picker sticky across browser restarts.

function localeCookieOptions(req: NextRequest) {
  // Set `Secure` automatically when the request came in over HTTPS so the
  // cookie survives a refresh in production but still works in `next dev`.
  return {
    path: '/',
    sameSite: 'lax' as const,
    maxAge: LOCALE_COOKIE_MAX_AGE,
    secure: req.nextUrl.protocol === 'https:'
  }
}

function setSecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  res.headers.set('Cross-Origin-Resource-Policy', 'same-site')
}

function setRateLimitHeaders(res: NextResponse) {
  // Informational headers; actual enforcement is done in route handlers via Redis.
  res.headers.set('X-RateLimit-Policy', 'See per-route limits in API implementation')
}

function getIp(req: NextRequest) {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'anonymous'
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'anonymous'
}

type EdgeCounter = { count: number; resetAtMs: number }
const edgeCounters: Map<string, EdgeCounter> =
  (globalThis as unknown as { __tkan_edge_rl__?: Map<string, EdgeCounter> }).__tkan_edge_rl__ ??
  (((globalThis as unknown as { __tkan_edge_rl__?: Map<string, EdgeCounter> }).__tkan_edge_rl__ = new Map()) as Map<
    string,
    EdgeCounter
  >)

function checkRateLimitEdge(key: string, limit: number, windowSeconds: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const current = edgeCounters.get(key)
  if (!current || now > current.resetAtMs) {
    edgeCounters.set(key, { count: 1, resetAtMs: now + windowSeconds * 1000 })
    return { allowed: true, remaining: Math.max(0, limit - 1) }
  }
  current.count += 1
  const remaining = Math.max(0, limit - current.count)
  return { allowed: current.count <= limit, remaining }
}

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/**
 * Behind nginx/CloudPanel the app often sees `http:` while the browser uses HTTPS.
 * Auth.js then sets `__Secure-authjs.session-token`; `getToken` must use the same
 * `secureCookie` flag or the JWT cookie name will not match (login succeeds but
 * `/admin/*` immediately redirects back to login).
 */
function isHttpsPublicRequest(req: NextRequest): boolean {
  if (req.nextUrl.protocol === 'https:') return true
  const forwarded = req.headers.get('x-forwarded-proto')
  const first = forwarded?.split(',')[0]?.trim()
  if (first === 'https') return true
  try {
    const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL
    if (url && new URL(url.trim()).protocol === 'https:') return true
  } catch {
    // ignore invalid env URL
  }
  return false
}

function shouldSkipLocaleHandling(pathname: string): boolean {
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap') ||
    pathname.startsWith('/manifest') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname === '/icon' ||
    pathname === '/opengraph-image' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/v1/')
  )
}

/**
 * When platform maintenance is enabled, send public visitors to /{locale}/maintenance.
 * Admin, API, auth, and asset routes are excluded. Uses locale-stripped path so
 * `/en/admin` is treated like `/admin`.
 */
function shouldSkipMaintenanceCheck(pathname: string): boolean {
  const stripped = stripLocaleFromPathname(pathname)
  return (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    stripped.startsWith('/admin') ||
    stripped.startsWith('/login') ||
    stripped.startsWith('/maintenance') ||
    stripped.startsWith('/invite') ||
    pathname === '/favicon.ico'
  )
}

/**
 * Edge-safe auth gate for /admin pages and /api/v1/admin/* routes.
 * Decodes the NextAuth JWT cookie (no DB access here — per-route guards
 * stay in place as defense-in-depth and handle fine-grained role checks).
 */
async function gateAdminAuth(req: NextRequest): Promise<NextResponse | null> {
  const { pathname } = req.nextUrl
  const stripped = stripLocaleFromPathname(pathname)

  const isAdminPage = stripped === '/admin' || stripped.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/v1/admin/')

  if (!isAdminPage && !isAdminApi) return null

  // Login page must remain reachable without a session.
  if (isAdminPage && (stripped === '/admin/login' || stripped.startsWith('/admin/login/'))) {
    return null
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    // Fail closed: missing secret should never allow admin traffic through.
    if (isAdminApi) {
      return NextResponse.json(
        { success: false, error: { code: 'SERVER_MISCONFIGURED', message: 'Auth not configured', statusCode: 500 } },
        { status: 500 }
      )
    }
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  const token = await getToken({
    req,
    secret,
    secureCookie: isHttpsPublicRequest(req)
  })
  const hasAdminRole = token?.role === 'ADMIN' || token?.role === 'SALES'

  if (token && hasAdminRole) return null

  if (isAdminApi) {
    const status = token ? 403 : 401
    const code = token ? 'FORBIDDEN' : 'UNAUTHORIZED'
    const message = token ? 'Admin access required' : 'Admin authentication required'
    return NextResponse.json(
      { success: false, error: { code, message, statusCode: status } },
      { status }
    )
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/admin/login'
  loginUrl.search = ''
  loginUrl.searchParams.set('callbackUrl', `${pathname}${req.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

async function getMaintenanceRedirectIfEnabled(req: NextRequest): Promise<NextResponse | null> {
  try {
    const origin = req.nextUrl.origin
    const res = await fetch(`${origin}/api/v1/public/maintenance`, {
      cache: 'no-store',
      headers: {
        'x-purpose': 'proxy-maintenance-check'
      }
    })
    if (!res.ok) {
      return null
    }
    const body = (await res.json()) as {
      success?: boolean
      data?: { isEnabled?: boolean }
    }
    if (body.success && body.data?.isEnabled) {
      const url = req.nextUrl.clone()
      const pathLocale = getLocaleFromPathname(req.nextUrl.pathname)
      const cookieRaw = req.cookies.get(LOCALE_COOKIE)?.value
      const cookieLocale = cookieRaw && isLocale(cookieRaw) ? cookieRaw : null
      const locale = pathLocale ?? cookieLocale ?? DEFAULT_LOCALE
      url.pathname = `/${locale}/maintenance`
      url.search = ''
      return NextResponse.redirect(url)
    }
  } catch {
    // Fail open: never block the site if the check fails
  }
  return null
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const authBlock = await gateAdminAuth(req)
  if (authBlock) {
    setSecurityHeaders(authBlock)
    return authBlock
  }

  const pathForFeatureCheck = stripLocaleFromPathname(pathname)
  if (pathname.startsWith('/api/v1/')) {
    const disabledApi = findDisabledFeatureForApi(pathname)
    if (disabledApi) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'FEATURE_DISABLED', message: `Feature "${disabledApi.id}" is currently disabled`, statusCode: 404 }
        },
        { status: 404 }
      )
    }
  } else {
    const disabledRoute = findDisabledFeatureForRoute(pathForFeatureCheck)
    if (disabledRoute) {
      const url = req.nextUrl.clone()
      url.pathname = '/not-found'
      url.search = ''
      const res = NextResponse.rewrite(url, { status: 404 })
      setSecurityHeaders(res)
      return res
    }
  }

  if (!shouldSkipMaintenanceCheck(pathname)) {
    const maintenanceRedirect = await getMaintenanceRedirectIfEnabled(req)
    if (maintenanceRedirect) {
      setSecurityHeaders(maintenanceRedirect)
      return maintenanceRedirect
    }
  }
  const detectedLocale = getLocaleFromPathname(pathname)
  const res = (() => {
    if (!detectedLocale) return NextResponse.next()
    const url = req.nextUrl.clone()
    url.pathname = stripLocaleFromPathname(pathname)
    return NextResponse.rewrite(url)
  })()

  const cookieLocaleRaw = req.cookies.get(LOCALE_COOKIE)?.value
  const cookieLocale: Locale | null = cookieLocaleRaw && isLocale(cookieLocaleRaw) ? cookieLocaleRaw : null

  const effectiveLocale: Locale = detectedLocale ? (isLocale(detectedLocale) ? detectedLocale : DEFAULT_LOCALE) : cookieLocale ?? DEFAULT_LOCALE

  if (detectedLocale) {
    res.headers.set('x-locale', effectiveLocale)
    // Persist locale for subsequent visits.
    res.cookies.set(LOCALE_COOKIE, effectiveLocale, localeCookieOptions(req))
  } else if (cookieLocale) {
    // Allow server components to render correct locale if we didn't redirect (e.g. internal rewrites).
    res.headers.set('x-locale', cookieLocale)
  }

  if (pathname.startsWith('/api/v1/')) {
    setRateLimitHeaders(res)
  }

  // Best-effort limiter in proxy (no Node Redis); authoritative limits live in route handlers.
  if (pathname.startsWith('/api/v1/')) {
    const ip = getIp(req)

    if (!pathname.startsWith('/api/v1/admin/')) {
      const { allowed, remaining } = checkRateLimitEdge(`rl:public_api:${ip}`, 100, 60)
      res.headers.set('X-RateLimit-Remaining', String(remaining))
      if (!allowed) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
      }
    }
  }

  if (!shouldSkipLocaleHandling(pathname) && !detectedLocale) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = pathname === '/' ? `/${effectiveLocale}` : `/${effectiveLocale}${pathname}`
    const redirectRes = NextResponse.redirect(redirectUrl)
    redirectRes.cookies.set(LOCALE_COOKIE, effectiveLocale, localeCookieOptions(req))
    setSecurityHeaders(redirectRes)
    return redirectRes
  }

  setSecurityHeaders(res)
  return res
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)']
}
