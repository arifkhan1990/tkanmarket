'use client'

import { useMemo } from 'react'

import { FabricCard } from '@/components/marketplace/FabricCard'
import { FabricListRow } from '@/components/marketplace/FabricListRow'
import { useWishlistBatchStatusQuery } from '@/hooks/useBuyerWishlist'

import type { FabricSummary } from '@/types/marketplace.types'

const DEFAULT_GRID_CLASS =
  'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'

type Props = {
  items: FabricSummary[]
  view?: 'grid' | 'list'
  /** When true, loads batch wishlist state and shows hearts on cards. */
  showWishlist?: boolean
  /** Tailwind grid wrapper (default: catalog 3-column). */
  gridClassName?: string
  /** Render the first N items with `priority` for LCP. Default 0. */
  priorityCount?: number
}

export function FabricGridClient({
  items,
  view = 'grid',
  showWishlist = false,
  gridClassName,
  priorityCount = 0
}: Props) {
  const ids = useMemo(() => items.map((f) => f.id), [items])
  const batch = useWishlistBatchStatusQuery(ids, showWishlist)
  const savedSet = batch.data ?? new Set<number>()

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-4">
        {items.map((f, idx) => (
          <FabricListRow
            key={f.id}
            fabric={f}
            showWishlist={showWishlist}
            wishlistSaved={savedSet.has(f.id)}
            priority={idx < priorityCount}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={gridClassName ?? DEFAULT_GRID_CLASS}>
      {items.map((f, idx) => (
        <FabricCard
          key={f.id}
          fabric={f}
          showWishlist={showWishlist}
          wishlistSaved={savedSet.has(f.id)}
          priority={idx < priorityCount}
        />
      ))}
    </div>
  )
}
