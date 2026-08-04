'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

import { ensureLocaleInUrl, getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { DEFAULT_LOCALE, type Locale } from '@/types/i18n.types'

import type { BuyerWishlistItemRow } from '@/types/buyer-wishlist.types'

import { FabricCard, FabricCardSkeleton } from '@/components/marketplace/FabricCard'
import { Button } from '@/components/ui/button'
import { PublicPageShell } from '@/components/shared/public-page-shell'
import { cn } from '@/lib/utils'
import { buyerWishlistRowToFabricSummary } from '@/lib/marketplace/buyer-wishlist-to-fabric-summary'
import { useBuyerWishlistQuery } from '@/hooks/useBuyerWishlist'
import { useI18n } from '@/hooks/useI18n'

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <FabricCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function BuyerWishlistPageClient() {
  const pathname = usePathname()
  const locale: Locale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { status } = useSession()
  const { messages } = useI18n()
  const w = messages.wishlistPage

  const [page, setPage] = React.useState(1)
  const [collection, setCollection] = React.useState<string>('__all__')
  const limit = 12

  const listQuery = useBuyerWishlistQuery({
    page,
    limit,
    collection: collection === '__all__' ? undefined : collection,
    enabled: status === 'authenticated'
  })

  const data = listQuery.data?.data
  const items = data?.items ?? []
  const collections = data?.collections ?? []
  const totals = data?.totals
  const meta = listQuery.data?.meta

  if (status === 'loading') {
    return (
      <PublicPageShell className="py-10 md:py-14" blur="sm">
        <GridSkeleton />
      </PublicPageShell>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <PublicPageShell className="py-16 md:py-24" blur="sm">
        <div className="mx-auto max-w-lg text-center">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {w.signInTitle}
          </h1>
          <p className="mt-3 text-body text-on-surface-variant">{w.signInDescription}</p>
          <Button className="mt-8 rounded-full" asChild>
            <Link
              href={`/admin/login?callbackUrl=${encodeURIComponent(ensureLocaleInUrl(withLocaleUrl('/wishlist', locale)))}`}
            >
              {w.signIn}
            </Link>
          </Button>
        </div>
      </PublicPageShell>
    )
  }

  return (
    <PublicPageShell className="pb-16 pt-10 md:pb-20 md:pt-12" blur="sm">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {w.title}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-on-surface-variant">{w.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" className="rounded-full" asChild>
            <Link href={withLocaleUrl('/fabrics', locale)}>{w.browseCatalog}</Link>
          </Button>
        </div>
      </header>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => {
            setPage(1)
            setCollection('__all__')
          }}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors',
            collection === '__all__'
              ? 'border border-primary/25 bg-primary/10 text-primary'
              : 'border border-outline/10 bg-surface-container-low text-on-surface-variant hover:border-outline/20'
          )}
        >
          {w.allItems} ({totals?.itemCount ?? 0})
        </button>
        {collections.map((c: { label: string; count: number }) => (
          <button
            key={c.label}
            type="button"
            onClick={() => {
              setPage(1)
              setCollection(c.label)
            }}
            className={cn(
              'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              collection === c.label
                ? 'border border-primary/25 bg-primary/10 text-primary'
                : 'border border-outline/10 bg-surface-container-low text-on-surface-variant hover:border-outline/20'
            )}
          >
            {c.label} ({c.count})
          </button>
        ))}
      </div>

      {listQuery.isLoading && !data ? <GridSkeleton /> : null}

      {!listQuery.isLoading && items.length === 0 ? (
        <div className="rounded-3xl border border-outline/10 bg-surface-container-lowest p-12 text-center shadow-sm">
          <p className="font-medium text-on-surface">{w.emptyTitle}</p>
          <Button className="mt-6 rounded-full" asChild>
            <Link href={withLocaleUrl('/fabrics', locale)}>{w.exploreFabrics}</Link>
          </Button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item: BuyerWishlistItemRow) => (
            <FabricCard
              key={item.wishlistId}
              fabric={buyerWishlistRowToFabricSummary(item)}
              showWishlist
              wishlistSaved
            />
          ))}
        </div>
      ) : null}

      {items.length > 0 && meta && meta.totalPages > 1 ? (
        <div className="mt-10 flex justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={meta.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {w.pagerPrev}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          >
            {w.pagerNext}
          </Button>
        </div>
      ) : null}

      {items.length > 0 && totals !== undefined && totals.estimatedValueUsd !== null ? (
        <aside className="mt-12 rounded-[2rem] border border-outline/10 bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-on-primary">
          <h3 className="text-lg font-bold">{w.portfolioTitle}</h3>
          <p className="mt-2 text-sm text-on-primary/85">{w.portfolioDescription}</p>
          <p className="mt-6 font-mono text-3xl font-black">
            ${totals.estimatedValueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </aside>
      ) : null}
    </PublicPageShell>
  )
}
