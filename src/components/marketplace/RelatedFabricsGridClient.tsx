'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useRef } from 'react'

import { FabricCard } from '@/components/marketplace/FabricCard'
import { Button } from '@/components/ui/button'
import { useWishlistBatchStatusQuery } from '@/hooks/useBuyerWishlist'
import { useI18n } from '@/hooks/useI18n'

import type { FabricSummary } from '@/types/marketplace.types'

type Props = {
  fabrics: FabricSummary[]
}

export function RelatedFabricsGridClient({ fabrics }: Props) {
  const { messages: m } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)
  const ids = useMemo(() => fabrics.map((f) => f.id), [fabrics])
  const batch = useWishlistBatchStatusQuery(ids, fabrics.length > 0)
  const savedSet = batch.data ?? new Set<number>()

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current
    if (!el) return
    const delta = Math.min(el.clientWidth * 0.95, 640) * dir
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  return (
    <div className="relative mt-8">
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-outline/20 shadow-sm"
          onClick={() => scrollByDir(-1)}
          aria-label={m.related.scrollPrev}
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-outline/20 shadow-sm"
          onClick={() => scrollByDir(1)}
          aria-label={m.related.scrollNext}
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </Button>
      </div>

      <div
        ref={scrollRef}
        className="grid auto-cols-[78%] grid-flow-col gap-4 overflow-x-auto pb-2 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[48%] lg:auto-cols-[calc((100%-4.5rem)/4)] lg:gap-6"
      >
        {fabrics.map((f) => (
          <div key={f.id} className="snap-start">
            <FabricCard fabric={f} showWishlist wishlistSaved={savedSet.has(f.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
