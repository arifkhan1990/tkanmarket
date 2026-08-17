'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Globe, Mail, Menu, MessageCircle, Phone, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NavbarSearch } from '@/components/common/NavbarSearch'
import { cn } from '@/lib/utils'
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/types/i18n.types'
import { getLocaleFromPathname, stripLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { setLocaleCookieClient } from '@/lib/i18n/set-locale-cookie'
import { useI18n } from '@/hooks/useI18n'
import { useFabricCompareNav } from '@/hooks/useFabricCompareNav'
import { useWishlistCountNav } from '@/hooks/useBuyerWishlist'
import { isNavKeyEnabled } from '@/lib/features'

const localeLabels: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
  zh: '中文',
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const locale: Locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { t, messages } = useI18n()
  const { count: compareCount, comparePath } = useFabricCompareNav()
  const { count: wishlistCount } = useWishlistCountNav()

  const navItems = useMemo(() => {
    return [
      { key: 'catalog', label: t('nav.catalog'), href: '/fabrics' },
      { key: 'blog', label: t('nav.blog'), href: '/blog' },
      { key: 'wishlist', label: t('nav.wishlist'), href: '/wishlist' },
    ].filter((item) => isNavKeyEnabled(item.key))
  }, [t])

  const whatsappPhone = useMemo(() => {
    const raw = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.trim()
    return raw && raw.length > 0 ? raw : '+7 (000) 000-00-00'
  }, [])

  const whatsappHref = useMemo(() => {
    const digits = whatsappPhone.replace(/[^\d]/g, '')
    const text = encodeURIComponent(t('search.whatsappPrefill'))
    return digits ? `https://wa.me/${digits}?text=${text}` : '#'
  }, [t, whatsappPhone])

  const salesEmail = messages.footer.salesEmail

  const handleChangeLocale = (nextLocale: Locale) => {
    setLocaleCookieClient(nextLocale)
    const basePath = stripLocaleFromPathname(pathname)
    const qs = typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : ''
    const nextUrl = qs.length > 0 ? `${basePath}?${qs}` : basePath
    router.push(withLocaleUrl(nextUrl, nextLocale))
  }

  const closeMobileNav = () => setMobileNavOpen(false)

  const isActive = (href: string) => {
    const normalized = pathname.replace(/^\/(en|ru|zh)(?=\/|$)/, '') || '/'
    if (href === '/') return normalized === '/'
    if (href === '/fabrics') {
      if (normalized.startsWith('/fabrics/compare')) return false
      return normalized.startsWith('/fabrics')
    }
    if (href === '/blog') return normalized.startsWith('/blog')
    if (href === '/wishlist') return normalized.startsWith('/wishlist')
    if (href === '/fabrics/compare') return normalized.startsWith('/fabrics/compare')
    return normalized === href
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile drawer on route change. Tracking the previous pathname in
  // state lets us reset via the React-recommended "adjust state during render"
  // pattern instead of a useEffect.
  const [lastPathname, setLastPathname] = useState(pathname)
  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    if (mobileNavOpen) setMobileNavOpen(false)
  }

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'border-b border-outline/10 bg-background/85 shadow-soft backdrop-blur-xl'
            : 'border-b border-transparent bg-background/60 backdrop-blur-md'
        )}
      >
        {/* ─────────────────── Top utility bar ─────────────────── */}
        {/* Hidden on tiny phones; shows phone from sm+, +email from md+ */}
        <div
          className={cn(
            'relative hidden overflow-hidden border-b border-outline/10 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 text-white transition-all duration-300 sm:block',
            scrolled ? 'max-h-0 border-transparent opacity-0' : 'max-h-12 opacity-100'
          )}
          aria-hidden={scrolled}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.25),transparent_60%)]" />
          <div className="relative mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-2 text-[11px] font-medium sm:px-6 sm:text-xs lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span className="hidden truncate opacity-95 md:inline">{messages.footer.description}</span>
              <span className="truncate opacity-95 md:hidden">{t('search.whatsappPrefill')}</span>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <a
                href={`tel:${whatsappPhone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center gap-1.5 whitespace-nowrap opacity-90 transition-opacity hover:opacity-100"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                <span>{whatsappPhone}</span>
              </a>
              <a
                href={`mailto:${salesEmail}`}
                className="hidden items-center gap-1.5 whitespace-nowrap opacity-90 transition-opacity hover:opacity-100 md:inline-flex"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden />
                <span>{salesEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* ─────────────────── Main bar ─────────────────── */}
        <div
          className={cn(
            'mx-auto flex w-full max-w-screen-2xl items-center gap-2 px-4 transition-[padding] duration-300 sm:gap-4 sm:px-6 lg:gap-6 lg:px-8',
            scrolled ? 'py-2 sm:py-2.5' : 'py-3 sm:py-4'
          )}
        >
          {/* Logo + brand */}
          <Link
            href={withLocaleUrl('/', locale)}
            className="group flex min-w-0 shrink-0 items-center gap-2 sm:gap-2.5"
          >
            <div
              className={cn(
                'primary-gradient flex shrink-0 items-center justify-center rounded-2xl font-black text-on-primary shadow-[0_8px_24px_-6px_rgba(26,64,194,0.55)] ring-1 ring-white/25 transition-all duration-300',
                scrolled ? 'h-9 w-9 text-base' : 'h-10 w-10 text-lg sm:h-11 sm:w-11'
              )}
              aria-hidden
            >
              T
            </div>
            <span className="truncate bg-gradient-to-br from-primary to-brand-700 bg-clip-text text-base font-black tracking-tight text-transparent sm:text-xl">
              {messages.common.brand}
            </span>
          </Link>

          {/* Center search bar (lg+) */}
          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="w-full max-w-xl xl:max-w-2xl">
              <NavbarSearch variant="pill" />
            </div>
          </div>

          {/* Right-side actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5 lg:gap-2">

            {/* Language picker (sm+ : icon-only on sm/md, full pill on lg+) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden h-10 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low sm:inline-flex lg:px-3"
                  aria-label={messages.common.language}
                >
                  <Globe className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:inline">{localeLabels[locale]}</span>
                  <ChevronDown className="hidden h-3.5 w-3.5 opacity-70 lg:inline" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[10rem] rounded-2xl">
                <DropdownMenuLabel>{messages.common.language}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(LOCALES as readonly Locale[]).map((opt) => (
                  <DropdownMenuItem key={opt} onSelect={() => handleChangeLocale(opt)} className="rounded-xl">
                    <span className="flex w-full items-center justify-between">
                      <span className="font-medium">{localeLabels[opt]}</span>
                      {opt === locale ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* WhatsApp CTA: icon-only on md, full button on xl+ */}
            <Button
              asChild
              size="icon"
              className="hidden h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-green-500 to-green-600 p-0 text-white shadow-[0_8px_20px_-6px_rgba(34,197,94,0.55)] transition-transform hover:scale-105 active:scale-95 md:inline-flex xl:hidden"
              aria-label={t('a11y.contactWhatsApp')}
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden />
              </a>
            </Button>
            <Button
              asChild
              size="sm"
              className="hidden h-10 shrink-0 gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-4 font-bold text-white shadow-[0_8px_24px_-6px_rgba(26,64,194,0.45)] transition-transform hover:scale-[1.02] active:scale-[0.98] xl:inline-flex"
            >
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" aria-hidden />
                <span>{t('common.whatsapp')}</span>
              </a>
            </Button>

            {/* Hamburger (below lg) */}
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface lg:hidden"
                  aria-label={t('a11y.openNavigation')}
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex w-[min(100vw-1rem,22rem)] flex-col border-outline/10 bg-surface-container-lowest p-0 sm:max-w-none"
              >
                <SheetHeader className="shrink-0 border-b border-outline/10 bg-gradient-to-br from-brand-50 to-transparent px-5 pb-5 pt-6 dark:from-brand-900/20">
                  <SheetTitle className="flex items-center gap-2.5">
                    <div
                      className="primary-gradient flex h-9 w-9 items-center justify-center rounded-xl text-base font-black text-on-primary shadow-sm"
                      aria-hidden
                    >
                      T
                    </div>
                    <span className="bg-gradient-to-br from-primary to-brand-700 bg-clip-text text-lg font-black tracking-tight text-transparent">
                      {messages.common.brand}
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5">
                  <NavbarSearch variant="full" onNavigate={closeMobileNav} autoFocus={false} />

                  <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                      <Fragment key={item.key}>
                        <Link
                          href={withLocaleUrl(item.href, locale)}
                          className={cn(
                            'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                            isActive(item.href)
                              ? 'bg-primary/10 text-primary'
                              : 'text-on-surface hover:bg-surface-container-low'
                          )}
                        >
                          <span>{item.label}</span>
                          {item.href === '/wishlist' && wishlistCount > 0 ? (
                            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-extrabold text-white">
                              {wishlistCount}
                            </span>
                          ) : null}
                        </Link>
                        {item.href === '/fabrics' ? (
                          <Link
                            href={withLocaleUrl(comparePath, locale)}
                            className={cn(
                              'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors',
                              isActive('/fabrics/compare')
                                ? 'bg-primary/10 text-primary'
                                : 'text-on-surface hover:bg-surface-container-low'
                            )}
                          >
                            <span>{t('nav.compare')}</span>
                            {compareCount > 0 ? (
                              <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-extrabold text-on-primary">
                                {compareCount}
                              </span>
                            ) : null}
                          </Link>
                        ) : null}
                      </Fragment>
                    ))}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-between rounded-2xl">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold">
                          <Globe className="h-4 w-4" aria-hidden />
                          {messages.common.language}
                        </span>
                        <span className="flex items-center gap-2 text-sm font-semibold">
                          {localeLabels[locale]}
                          <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[10rem] rounded-2xl">
                      {(LOCALES as readonly Locale[]).map((opt) => (
                        <DropdownMenuItem key={opt} onSelect={() => handleChangeLocale(opt)} className="rounded-xl">
                          <span className="flex w-full items-center justify-between">
                            <span className="font-medium">{localeLabels[opt]}</span>
                            {opt === locale ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    asChild
                    className="h-11 gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-700 font-bold text-white shadow-[0_8px_24px_-6px_rgba(26,64,194,0.45)]"
                  >
                    <a href={whatsappHref} target="_blank" rel="noreferrer">
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      <span className="truncate">{whatsappPhone}</span>
                    </a>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Floating WhatsApp FAB — hidden on mobile (button is in header), visible lg+ */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noreferrer"
        className="group fixed bottom-6 right-4 z-40 hidden h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-[0_12px_28px_-8px_rgba(34,197,94,0.6)] transition-transform hover:scale-110 active:scale-95 sm:bottom-8 sm:right-6 lg:flex"
        aria-label={t('a11y.contactWhatsApp')}
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-green-400/40" aria-hidden />
        <MessageCircle className="relative h-6 w-6" aria-hidden />
      </a>
    </>
  )
}
