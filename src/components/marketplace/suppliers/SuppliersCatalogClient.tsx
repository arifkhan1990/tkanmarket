'use client'

import { useMemo, useRef } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Search } from 'lucide-react'

import { useSuppliers, SuppliersSkeleton, visibleSupplierPageWindow } from '@/hooks/useSuppliers'
import { EmptyState } from '@/components/common/EmptyState'

import { DEFAULT_LOCALE } from '@/types/i18n.types'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { isRemoteImageSrc } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { cn } from '@/lib/utils'

const FABRIC_TYPES = ['woven', 'knit', 'nonwoven', 'lace', 'lining', 'technical', 'other'] as const

export function SuppliersCatalogClient() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { messages } = useI18n()
  const sp = useSearchParams()
  const qInputRef = useRef<HTMLInputElement | null>(null)

  const initial = useMemo(() => {
    const page = Number(sp.get('page') ?? '1')
    const limit = Number(sp.get('limit') ?? '12')
    const q = sp.get('q') ?? undefined
    const fabricType = sp.get('fabric_type') ?? undefined
    return { page, limit, q, fabricType }
  }, [sp])

  const query = useSuppliers({
    page: initial.page,
    limit: initial.limit,
    q: initial.q,
    fabricType: initial.fabricType
  })

  const items = query.data?.success ? query.data.data : []
  const meta = query.data?.success ? query.data.meta : undefined

  const pushParams = (next: { page: number; fabricType?: string | null; qOverride?: string }) => {
    const params = new URLSearchParams()
    params.set('page', String(next.page))
    params.set('limit', String(initial.limit))
    const qVal = next.qOverride !== undefined ? next.qOverride : initial.q
    if (qVal?.trim()) params.set('q', qVal.trim())
    const ft = next.fabricType !== undefined ? next.fabricType : initial.fabricType
    if (ft) params.set('fabric_type', ft)
    router.push(withLocaleUrl(`/suppliers?${params.toString()}`, locale))
  }

  const submitSearch = () => {
    const q = qInputRef.current?.value ?? ''
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', String(initial.limit))
    if (q.trim()) params.set('q', q.trim())
    if (initial.fabricType) params.set('fabric_type', initial.fabricType)
    router.push(withLocaleUrl(`/suppliers?${params.toString()}`, locale))
  }

  const pageNumbers = meta ? visibleSupplierPageWindow(meta.page, meta.totalPages) : []

  const rangeText =
    meta && meta.total > 0
      ? (() => {
          const from = (meta.page - 1) * meta.limit + 1
          const to = Math.min(meta.page * meta.limit, meta.total)
          return messages.suppliers.paginationRange
            .replace('{from}', String(from))
            .replace('{to}', String(to))
            .replace('{total}', String(meta.total))
        })()
      : null

  return (
    <PublicPageShell
      className="pb-16 pt-8 md:pb-24 md:pt-10"
      blur="sm"
      contentClassName="max-w-[1440px] space-y-12 md:space-y-16"
    >
      {/* Hero — matches design/supplier.html */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-end lg:gap-12">
        <div>
          <span className="mb-6 inline-block rounded-full bg-secondary-container px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-on-secondary-container">
            {messages.suppliers.directoryHeroEyebrow}
          </span>
          <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-on-surface md:text-5xl lg:text-6xl">
            {messages.suppliers.directoryHeroTitleLine1}
            <br />
            <span className="text-primary">{messages.suppliers.directoryHeroTitleAccent}</span>
          </h1>
        </div>
        <div className="pb-0 lg:pb-2">
          <p className="max-w-xl text-base font-light leading-relaxed text-on-surface-variant md:text-lg">
            {messages.suppliers.directoryHeroSubtitle}
          </p>
        </div>
      </section>

      {/* Search + category pills */}
      <section className="space-y-8">
        <form
          className="group relative max-w-2xl"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            submitSearch()
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-5 flex items-center">
            <Search className="h-5 w-5 text-outline" aria-hidden />
          </div>
          <input
            ref={qInputRef}
            defaultValue={initial.q ?? ''}
            placeholder={messages.suppliers.searchPlaceholder}
            aria-label={messages.suppliers.searchLabel}
            className="w-full rounded-xl border-0 bg-surface-container-highest py-5 pl-14 pr-6 text-on-surface shadow-none ring-0 transition-colors placeholder:text-outline/60 focus:bg-surface-container-lowest focus:outline-none focus:ring-0 dark:placeholder:text-outline/50"
          />
          <div
            className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary/0 transition-colors group-focus-within:border-primary/20"
            aria-hidden
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => pushParams({ page: 1, fabricType: null })}
            className={cn(
              'rounded-full px-6 py-2.5 text-sm font-semibold tracking-tight transition-colors',
              !initial.fabricType
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-highest font-medium text-on-surface-variant hover:bg-surface-container-high'
            )}
          >
            {messages.suppliers.filterAll}
          </button>
          {FABRIC_TYPES.map((ft) => (
            <button
              key={ft}
              type="button"
              onClick={() => pushParams({ page: 1, fabricType: ft })}
              className={cn(
                'rounded-full px-6 py-2.5 text-sm font-medium transition-colors',
                initial.fabricType === ft
                  ? 'bg-primary font-semibold text-on-primary'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              )}
            >
              {messages.fabrics.filters.types[ft]}
            </button>
          ))}
        </div>
      </section>

      {query.isLoading ? (
        <SuppliersSkeleton />
      ) : items.length > 0 ? (
        <section className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map((s, idx) => {
            const lcpBoost = idx < 6 && Boolean(s.catalogPreview?.coverImageUrl)
            return (
            <Link
              key={s.id}
              href={withLocaleUrl(`/suppliers/${s.slug}`, locale)}
              className="group overflow-hidden rounded-xl bg-surface-container-lowest shadow-[0_10px_30px_rgba(25,28,30,0.06)] transition-shadow duration-300 hover:shadow-[0_10px_30px_rgba(25,28,30,0.1)] dark:shadow-none dark:hover:shadow-md"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-container">
                {s.catalogPreview?.coverImageUrl ? (
                  <Image
                    src={s.catalogPreview.coverImageUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    unoptimized={isRemoteImageSrc(s.catalogPreview.coverImageUrl)}
                    priority={lcpBoost}
                    fetchPriority={lcpBoost ? 'high' : 'auto'}
                    loading={lcpBoost ? 'eager' : 'lazy'}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-surface-container-low to-surface-container-highest" />
                )}
                <div
                  className={cn(
                    'absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest shadow-sm backdrop-blur-md',
                    s.verified
                      ? 'bg-white/90 text-primary dark:bg-surface-container-lowest/95'
                      : 'bg-surface-container-lowest/90 text-on-surface-variant'
                  )}
                >
                  {s.verified ? (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                  {s.verified ? messages.suppliers.badgeVerified : messages.suppliers.badgeUnverified}
                </div>
              </div>
              <div className="p-8">
                <div className="mb-6 flex justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container-high text-sm font-bold text-primary">
                      {s.logoUrl ? (
                        <Image
                          src={s.logoUrl}
                          alt={s.name}
                          fill
                          sizes="48px"
                          className="object-contain p-1"
                          unoptimized={isRemoteImageSrc(s.logoUrl)}
                        />
                      ) : (
                        s.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-heading text-xl font-bold tracking-tight text-on-surface line-clamp-2">
                        {s.name}
                      </h2>
                      <div className="mt-0.5 flex items-center gap-1 text-sm text-on-surface-variant/80">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">
                          {s.city ? `${s.city}, ` : ''}
                          {s.country}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-outline/10 pt-6 dark:border-outline/20">
                  <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant/60">
                    {messages.suppliers.labelInventory}:{' '}
                    <span className="ml-1 font-semibold text-on-surface">
                      {s.catalogPreview?.approvedFabricCount ?? 0} {messages.suppliers.fabrics}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-semibold text-primary group-hover:underline group-hover:underline-offset-4">
                    {messages.suppliers.viewShowroom}
                    <ChevronRight className="h-[18px] w-[18px]" aria-hidden />
                  </span>
                </div>
              </div>
            </Link>
            )
          })}
        </section>
      ) : (
        <EmptyState title={messages.suppliers.emptyTitle} description={messages.suppliers.emptyDescription} />
      )}

      {meta && meta.total > 0 ? (
        <section className="flex flex-col items-center justify-between gap-8 border-t border-outline/15 pt-10 dark:border-outline/25 md:flex-row md:pt-12">
          <p className="text-center text-sm text-on-surface-variant/70 md:text-left">{rangeText}</p>
          <nav className="flex items-center gap-2" aria-label={messages.suppliers.paginationPage}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
              disabled={meta.page <= 1}
              aria-label={messages.suppliers.paginationPrev}
              onClick={() => pushParams({ page: meta.page - 1, fabricType: initial.fabricType ?? null })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    num === meta.page
                      ? 'bg-primary font-bold text-on-primary'
                      : 'hover:bg-surface-container-high'
                  )}
                  aria-current={num === meta.page ? 'page' : undefined}
                  onClick={() => pushParams({ page: num, fabricType: initial.fabricType ?? null })}
                >
                  {num}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40"
              disabled={meta.page >= meta.totalPages}
              aria-label={messages.suppliers.paginationNext}
              onClick={() => pushParams({ page: meta.page + 1, fabricType: initial.fabricType ?? null })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </section>
      ) : null}
    </PublicPageShell>
  )
}
