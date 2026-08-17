import { ArrowUpRight, Instagram, Mail, MapPin, MessageCircle, Phone, Pin, Send, Video } from 'lucide-react'
import Link from 'next/link'

import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function Footer() {
  const year = new Date().getFullYear()
  const locale = await getServerLocale()
  const m = getMessages(locale)

  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || undefined
  const tiktokUrl = process.env.NEXT_PUBLIC_TIKTOK_URL?.trim() || undefined
  const pinterestUrl = process.env.NEXT_PUBLIC_PINTEREST_URL?.trim() || undefined
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim() || undefined
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL?.trim() || undefined

  const socials = [
    { href: instagramUrl ?? 'https://instagram.com', label: m.a11y.instagram, Icon: Instagram },
    { href: tiktokUrl ?? 'https://www.tiktok.com', label: m.a11y.tikTok, Icon: Video },
    { href: pinterestUrl ?? 'https://pinterest.com', label: m.a11y.pinterest, Icon: Pin },
    { href: telegramUrl ?? 'https://t.me', label: 'Telegram', Icon: Send },
    { href: whatsappUrl ?? 'https://wa.me', label: 'WhatsApp', Icon: MessageCircle },
  ] as const

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-outline/10 bg-gradient-to-b from-surface-container-low via-surface-container-low to-surface-container text-on-surface">
      {/* Decorative accent bar */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/60 to-transparent" aria-hidden />
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-brand-500/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-screen-2xl px-6 pt-16 pb-8 md:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand column */}
          <div className="space-y-5 lg:col-span-4">
            <Link href={withLocaleUrl('/', locale)} className="inline-flex items-center gap-3">
              <div
                className="primary-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-on-primary shadow-[0_10px_28px_-8px_rgba(26,64,194,0.55)] ring-1 ring-white/25"
                aria-hidden
              >
                T
              </div>
              <span className="bg-gradient-to-br from-primary to-brand-700 bg-clip-text text-2xl font-black tracking-tight text-transparent">
                {m.common.brand}
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">{m.footer.description}</p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-outline/15 bg-surface-container-lowest text-on-surface-variant shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary hover:text-on-primary hover:shadow-[0_8px_20px_-6px_rgba(26,64,194,0.45)]"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-2">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-on-surface">{m.footer.catalog}</div>
            <ul className="space-y-3 text-sm">
              <li>
                <Link className="group inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary" href={withLocaleUrl('/fabrics', locale)}>
                  {m.footer.allFabrics}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </Link>
              </li>
              <li>
                <Link className="group inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary" href={withLocaleUrl('/fabrics?sort=created_at_desc', locale)}>
                  {m.footer.newest}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-on-surface">{m.footer.company}</div>
            <ul className="space-y-3 text-sm">
              <li>
                <Link className="group inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary" href={withLocaleUrl('/about', locale)}>
                  {m.footer.about}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </Link>
              </li>
              <li>
                <Link className="group inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary" href={withLocaleUrl('/contact', locale)}>
                  {m.footer.contact}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </Link>
              </li>
              <li>
                <Link className="group inline-flex items-center gap-1 text-on-surface-variant transition-colors hover:text-primary" href={withLocaleUrl('/cookie-preferences', locale)}>
                  {m.footer.cookiePreferences}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" aria-hidden />
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacts card */}
          <div className="lg:col-span-4">
            <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-on-surface">{m.footer.contacts}</div>
            <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest/80 p-5 shadow-sm backdrop-blur-sm">
              <ul className="space-y-3.5 text-sm">
                <li>
                  <a
                    href={`tel:${m.footer.phoneDisplay.replace(/\D/g, '')}`}
                    className="group flex items-start gap-3 text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                      <Phone className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-mono text-[13px] font-semibold tracking-tight text-on-surface">{m.footer.phoneDisplay}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${m.footer.salesEmail}`}
                    className="group flex items-start gap-3 text-on-surface-variant transition-colors hover:text-primary"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
                      <Mail className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="font-semibold text-on-surface">{m.footer.salesEmail}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3 text-on-surface-variant">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="leading-snug">{m.footer.addressLine}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-outline/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-on-surface-variant">
            © {year} {m.common.brand} {m.footer.copyrightSuffix}
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-bold uppercase tracking-[0.15em] text-on-surface-variant">
            <Link href={withLocaleUrl('/privacy-policy', locale)} className="transition-colors hover:text-primary">
              {m.footer.privacy}
            </Link>
            <Link href={withLocaleUrl('/terms-of-service', locale)} className="transition-colors hover:text-primary">
              {m.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
