import { withDbFallback } from '@/lib/db/with-db-fallback'
import { FabricService } from '@/services/fabric.service'
import { HeroFeaturedSliderClient } from '@/components/marketplace/hero-featured-slider-client'

export async function HeroFeaturedSlider(props: { limit?: number }) {
  const items = await withDbFallback('home.heroFeaturedSlider', () => FabricService.getFeatured(props.limit ?? 3), [])
  if (items.length === 0) return null
  return <HeroFeaturedSliderClient items={items} />
}

export function HeroFeaturedSliderFallback() {
  return (
    <div className="rounded-3xl border border-outline/10 bg-background/70 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="h-7 w-32 animate-pulse rounded-full bg-surface-container/60" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container/60" />
          <div className="h-9 w-9 animate-pulse rounded-full bg-surface-container/60" />
        </div>
      </div>
      <div className="mt-6 grid gap-5 md:grid-cols-[1fr_180px] md:items-end">
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface-container/60" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-container/60" />
          </div>
          <div className="h-7 w-4/5 animate-pulse rounded-xl bg-surface-container/60" />
          <div className="h-4 w-2/3 animate-pulse rounded-xl bg-surface-container/60" />
          <div className="flex gap-2 pt-2">
            <div className="h-11 w-36 animate-pulse rounded-xl bg-surface-container/60" />
            <div className="h-11 w-36 animate-pulse rounded-xl bg-surface-container/60" />
          </div>
        </div>
        <div className="h-[132px] animate-pulse rounded-2xl bg-surface-container/60" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="h-1.5 w-10 animate-pulse rounded-full bg-surface-container/60" />
          <div className="h-1.5 w-6 animate-pulse rounded-full bg-surface-container/60" />
          <div className="h-1.5 w-6 animate-pulse rounded-full bg-surface-container/60" />
        </div>
        <div className="h-4 w-12 animate-pulse rounded-xl bg-surface-container/60" />
      </div>
      <div className="mt-4 h-1.5 animate-pulse rounded-full bg-surface-container/60" />
    </div>
  )
}

