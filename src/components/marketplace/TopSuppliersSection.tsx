import { ArrowRight, BadgeCheck, MapPin, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { isRemoteImageSrc } from '@/lib/utils'
import { SupplierService } from '@/services/supplier.service'
import type { SupplierSummary } from '@/types/marketplace.types'

export async function TopSuppliersSection() {
  const locale = await getServerLocale()
  const m = getMessages(locale)

  const result = await withDbFallback(
    'home.topSuppliers',
    () => SupplierService.list({ page: 1, limit: 6 }),
    { items: [] as SupplierSummary[], total: 0 }
  )

  const suppliers = result.items

  return (
    <section className="bg-surface-container-low">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{m.topSuppliers.eyebrow}</div>
            <h2 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
              {m.topSuppliers.title}
            </h2>
            <p className="text-sm leading-relaxed text-on-surface-variant">{m.topSuppliers.subtitle}</p>
          </div>
          <Button asChild variant="outline" className="rounded-full self-start sm:self-auto">
            <Link href={withLocaleUrl('/suppliers', locale)}>
              {m.topSuppliers.viewAll}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>

        {suppliers.length === 0 ? (
          <p className="mt-10 rounded-3xl border border-dashed border-outline/20 bg-surface-container-lowest px-6 py-10 text-center text-sm text-on-surface-variant">
            {m.topSuppliers.empty}
          </p>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {suppliers.map((s, idx) => {
              const fabricCount = s.catalogPreview?.approvedFabricCount ?? 0
              const previewImage = s.catalogPreview?.coverImageUrl ?? null
              const showRemote = previewImage !== null && isRemoteImageSrc(previewImage)
              const lcpBoost = idx < 6
              const location = [s.city, s.country].filter(Boolean).join(', ')
              return (
                <Link
                  key={s.id}
                  href={withLocaleUrl(`/suppliers/${s.slug}`, locale)}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-soft"
                >
                  <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-50 to-surface-container-low">
                    {showRemote ? (
                      <Image
                        src={previewImage}
                        alt={s.name}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized={showRemote}
                        priority={lcpBoost}
                        fetchPriority={lcpBoost ? 'high' : 'auto'}
                        loading={lcpBoost ? 'eager' : 'lazy'}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-6xl font-black text-primary/15">
                        {s.name.charAt(0)}
                      </div>
                    )}
                    {s.verified ? (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm backdrop-blur-sm">
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                        {m.topSuppliers.verifiedBadge}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-start gap-3">
                      <div className="primary-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-on-primary shadow-sm" aria-hidden>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-extrabold text-on-surface group-hover:text-primary">
                          {s.name}
                        </div>
                        {location ? (
                          <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-on-surface-variant">
                            <MapPin className="h-3 w-3" aria-hidden />
                            {location}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-outline/10 pt-3 text-xs text-on-surface-variant">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <Package className="h-3.5 w-3.5 text-primary" aria-hidden />
                        {fabricCount} {m.topSuppliers.fabricsLabel}
                      </span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export function TopSuppliersFallback() {
  return (
    <section className="bg-surface-container-low">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded-full bg-surface-container/60" />
            <div className="h-7 w-72 animate-pulse rounded-xl bg-surface-container/60" />
            <div className="h-4 w-96 max-w-full animate-pulse rounded-xl bg-surface-container/60" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-full bg-surface-container/60" />
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest"
            >
              <div className="aspect-[16/9] w-full animate-pulse bg-surface-container/60" />
              <div className="flex items-center gap-3 p-5">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-surface-container/60" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded-full bg-surface-container/60" />
                  <div className="h-3 w-24 animate-pulse rounded-full bg-surface-container/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
