import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { SearchX, Sparkles, Leaf, Layers, RotateCcw, ArrowRight, SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import type { JunctionCategoryCount } from '@/types/marketplace.types'

const ICONS: LucideIcon[] = [Sparkles, Layers, Leaf]

export async function FabricCatalogNoResults({ topCategories }: { topCategories: JunctionCategoryCount[] }) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const t = m.catalogNoResults
  const sorted = [...topCategories].sort((a, b) => b.count - a.count).slice(0, 3)
  const base = withLocaleUrl('/fabrics', locale)
  const resetHref = withLocaleUrl('/fabrics', locale)
  const sampleHref = withLocaleUrl('/sample-request', locale)
  const contactHref = withLocaleUrl('/contact', locale)

  return (
    <div className="rounded-[2.5rem] border border-outline/10 bg-surface-container-lowest p-6 shadow-soft md:p-10">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-outline/10 bg-surface-container-low px-4 py-2">
            <SearchX className="h-4 w-4 text-primary" aria-hidden />
            <span className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">
              {t.popularHeading}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
              {t.title}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed text-on-surface-variant md:text-lg">{t.description}</p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 rounded-2xl px-6 text-base font-extrabold" asChild>
              <Link href={sampleHref}>
                {t.ctaSourcing}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button variant="secondary" className="h-12 rounded-2xl px-6 text-base font-extrabold" asChild>
              <Link href={contactHref}>{t.ctaContact}</Link>
            </Button>
            <Button variant="outline" className="h-12 rounded-2xl px-6 text-base font-extrabold" asChild>
              <Link href={resetHref}>
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden />
                {m.fabrics.filters.resetAll}
              </Link>
            </Button>
          </div>

          {sorted.length > 0 ? (
            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{t.popularHeading}</div>
              <div className="mt-4 flex flex-wrap gap-3">
                {sorted.map((c, i) => {
                  const Icon = ICONS[i % ICONS.length] ?? Sparkles
                  const href = `${base}?category_slug=${encodeURIComponent(c.slug)}`
                  const label = locale === 'ru' ? c.name_ru : c.name_en ?? c.name_ru
                  return (
                    <Link
                      key={c.slug}
                      href={href}
                      className="group inline-flex items-center gap-2 rounded-full border border-outline/10 bg-surface-container-low px-4 py-2 text-sm font-extrabold text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface"
                    >
                      <Icon className="h-4 w-4 text-primary transition-transform group-hover:scale-110" aria-hidden />
                      <span className="max-w-[18rem] truncate" title={label}>
                        {label}
                      </span>
                      <span className="text-xs text-outline">({c.count})</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-outline/10 bg-surface-container-lowest shadow-soft">
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary-container/30 blur-3xl"
              aria-hidden
            />

            <div className="relative p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold uppercase tracking-widest text-outline">{m.sort.labelShort}</div>
                  <div className="text-lg font-extrabold tracking-tight text-on-surface">{t.popularHeading}</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-outline/10 bg-background/70 px-3 py-2 backdrop-blur-md">
                  <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden />
                  <span className="text-xs font-extrabold text-on-surface-variant">{m.fabrics.filters.title}</span>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-outline/10 bg-surface-container-low p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-outline">{t.popularHeading}</div>
                  <SearchX className="h-4 w-4 text-outline" aria-hidden />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sorted.map((c, i) => {
                    const Icon = ICONS[i % ICONS.length] ?? Sparkles
                    const href = `${base}?category_slug=${encodeURIComponent(c.slug)}`
                    const label = locale === 'ru' ? c.name_ru : c.name_en ?? c.name_ru
                    return (
                      <Link
                        key={`mini-${c.slug}`}
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-background/80 px-3 py-2 text-xs font-extrabold text-on-surface-variant hover:text-on-surface"
                      >
                        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                        <span className="max-w-[10rem] truncate" title={label}>
                          {label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-outline/10 bg-background/60 p-4 text-sm font-bold text-on-surface-variant">
                <span className="inline-flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
                  {m.grid.emptyDescription}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
