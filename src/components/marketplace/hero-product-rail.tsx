import { withDbFallback } from '@/lib/db/with-db-fallback'
import { FabricService } from '@/services/fabric.service'
import { HeroProductRailClient } from '@/components/marketplace/hero-product-rail-client'

export async function HeroProductRail(props: { limit?: number }) {
  const items = await withDbFallback('home.heroProductRail', () => FabricService.getFeatured(props.limit ?? 12), [])
  if (items.length === 0) return null
  return <HeroProductRailClient items={items} />
}

export function HeroProductRailFallback() {
  return (
    <div className="bg-surface-container-lowest">
      <div className="mx-auto w-full max-w-screen-2xl px-6 pt-10 md:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <div className="h-7 w-44 animate-pulse rounded-xl bg-surface-container/60" />
          <div className="h-3 w-24 animate-pulse rounded-xl bg-surface-container/60" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-screen-2xl px-6 pb-10 md:px-8">
        <div className="mt-5 flex gap-3.5 overflow-hidden">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="w-[210px] shrink-0 overflow-hidden rounded-2xl border border-outline/10 bg-background">
              <div className="h-[160px] animate-pulse bg-surface-container/60" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-24 animate-pulse rounded-lg bg-surface-container/60" />
                <div className="h-4 w-40 animate-pulse rounded-lg bg-surface-container/60" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-4 w-20 animate-pulse rounded-lg bg-surface-container/60" />
                  <div className="h-7 w-16 animate-pulse rounded-lg bg-surface-container/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

