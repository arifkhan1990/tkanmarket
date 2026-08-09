'use client'

import * as React from 'react'
import Link from 'next/link'

import { FabricCardSkeleton } from '@/components/common/LoadingSkeleton/FabricCardSkeleton'
import { FabricGridClient } from '@/components/marketplace/FabricGridClient'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useSupplierFabricsCatalog } from '@/hooks/useSupplierFabricsCatalog'
import type { Locale } from '@/types/i18n.types'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'

type FabricTypeRow = { fabricType: string; count: number }

export function SupplierProfileCatalogSection({
  supplierId,
  totalApproved,
  fabricTypeCounts,
  locale,
  messages
}: {
  supplierId: number
  totalApproved: number
  fabricTypeCounts: FabricTypeRow[]
  locale: Locale
  messages: Messages
}) {
  const m = messages.suppliers
  const [fabricFilter, setFabricFilter] = React.useState<string | null>(null)
  const [limit, setLimit] = React.useState(12)

  React.useEffect(() => {
    setLimit(12)
  }, [fabricFilter])

  const q = useSupplierFabricsCatalog({
    supplierId,
    page: 1,
    limit,
    fabricType: fabricFilter
  })

  if (totalApproved === 0) return null

  const items = q.data?.items ?? []
  const meta = q.data?.meta
  const shown = items.length
  const displayTotal = meta?.total ?? totalApproved

  const chips: { key: string | null; label: string }[] = [
    { key: null, label: m.filterAllFabrics },
    ...fabricTypeCounts.slice(0, 6).map((row) => ({
      key: row.fabricType,
      label: `${row.fabricType} (${row.count})`
    }))
  ]

  const fabricsCatalogHref = withLocaleUrl(`/fabrics?supplier_id=${String(supplierId)}`, locale)

  return (
    <section
      id="supplier-catalog"
      className="scroll-mt-28 space-y-5 sm:space-y-6 md:scroll-mt-32"
      aria-labelledby="supplier-catalog-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h2
          id="supplier-catalog-heading"
          className="font-heading text-2xl font-black leading-tight tracking-tight text-on-surface md:text-[1.75rem]"
        >
          {m.catalogGridTitle}
        </h2>
        <Link
          href={fabricsCatalogHref}
          className="shrink-0 text-sm font-bold text-primary transition-opacity hover:opacity-90 hover:underline underline-offset-4"
        >
          {m.viewAllCatalogFabrics.replace('{total}', String(displayTotal))}
        </Link>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <p className="shrink-0 text-sm leading-snug text-on-surface-variant">
          {m.catalogShowing
            .replace('{shown}', String(Math.min(shown, displayTotal)))
            .replace('{total}', String(displayTotal))}
        </p>
        <div className="flex min-w-0 w-full justify-start gap-1 overflow-x-auto rounded-xl bg-surface-container-high/80 p-1 dark:bg-surface-container/60 md:w-auto md:flex-1 md:justify-end">
          {chips.map((c) => {
            const selected = (c.key === null && fabricFilter === null) || c.key === fabricFilter
            return (
              <button
                key={c.key ?? 'all'}
                type="button"
                onClick={() => setFabricFilter(c.key)}
                aria-pressed={selected}
                className={cn(
                  'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  selected
                    ? 'bg-surface-container-lowest text-primary shadow-sm dark:bg-background'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
              >
                {c.label}
              </button>
            )
          })}
        </div>
      </div>

      {q.isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <FabricCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={m.noFeaturedTitle} description={m.noFeaturedDescription} />
      ) : (
        <>
          <FabricGridClient
            items={items}
            showWishlist
            gridClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          />
          {meta && shown < meta.total ? (
            <div className="flex justify-center pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl px-10"
                onClick={() => setLimit((l) => l + 12)}
                disabled={q.isFetching}
              >
                {m.loadMoreFabrics}
              </Button>
            </div>
          ) : null}
        </>
      )}

      <div className="flex justify-center border-t border-outline/10 pt-4">
        <Link
          href={fabricsCatalogHref}
          className="text-center text-sm font-extrabold text-primary transition-opacity hover:opacity-90"
        >
          {m.viewAllFabrics}
        </Link>
      </div>
    </section>
  )
}
