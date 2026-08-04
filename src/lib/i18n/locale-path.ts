import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const seg = pathname.split('/').filter(Boolean)[0] ?? ''
  return seg && isLocale(seg) ? seg : null
}

export function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return '/'
  const first = parts[0]
  if (!first || !isLocale(first)) return pathname.startsWith('/') ? pathname : `/${pathname}`
  const rest = parts.slice(1).join('/')
  return `/${rest}`.replace(/\/+$/, '') || '/'
}

export function withLocaleUrl(url: string, locale: Locale): string {
  const [pathAndQuery, hash = ''] = url.split('#')
  const [rawPath, query = ''] = (pathAndQuery ?? '').split('?')

  const path = rawPath?.startsWith('/') ? rawPath : `/${rawPath ?? ''}`
  const stripped = stripLocaleFromPathname(path)

  const prefixed = stripped === '/' ? `/${locale}` : `/${locale}${stripped}`
  const next = query ? `${prefixed}?${query}` : prefixed
  return hash ? `${next}#${hash}` : next
}

export function ensureLocaleInUrl(url: string): string {
  const [pathAndQuery] = url.split('#')
  const [rawPath] = (pathAndQuery ?? '').split('?')
  const path = rawPath?.startsWith('/') ? rawPath : `/${rawPath ?? ''}`
  const locale = getLocaleFromPathname(path)
  if (locale) return url
  return withLocaleUrl(url, DEFAULT_LOCALE)
}

