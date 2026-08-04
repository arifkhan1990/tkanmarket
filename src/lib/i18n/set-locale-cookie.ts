import type { Locale } from '@/types/i18n.types'

const LOCALE_COOKIE = 'tkan_locale'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

/** Browser-only: persist locale before client navigation (used by Header). */
export function setLocaleCookieClient(nextLocale: Locale): void {
  if (typeof document === 'undefined') return
  // `Secure` is set automatically when the page is loaded over HTTPS so the
  // cookie survives a refresh on production. `Max-Age` keeps the picker sticky
  // across browser restarts (otherwise it would be a session cookie).
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const secure = isHttps ? '; Secure' : ''
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(
    nextLocale
  )}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`
}
