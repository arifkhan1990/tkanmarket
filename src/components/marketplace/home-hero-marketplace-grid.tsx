import { withDbFallback } from '@/lib/db/with-db-fallback'
import { FabricService } from '@/services/fabric.service'
import { HomeHeroMarketplaceGridClient } from '@/components/marketplace/home-hero-marketplace-grid-client'
import { cn } from '@/lib/utils'

export async function HomeHeroMarketplaceGrid() {
  const items = await withDbFallback('home.heroMarketplaceGrid', () => FabricService.getFeatured(5), [])
  return <HomeHeroMarketplaceGridClient items={items} />
}

export function HomeHeroMarketplaceGridFallback() {
  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] bg-gradient-to-br from-primary/[0.18] via-white/55 to-emerald-500/[0.12] p-px',
        'shadow-[0_36px_96px_-44px_rgba(15,23,42,0.55)]'
      )}
      aria-hidden
    >
      <div
        className={cn(
          'rounded-[1.6875rem] border border-outline/[0.08] bg-gradient-to-br from-surface-container-lowest/95 via-background/55 to-surface-container-lowest/90 p-2 backdrop-blur-xl sm:p-2.5 md:p-3',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]'
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-2">
          <div className="order-1 min-h-[300px] animate-pulse rounded-2xl bg-surface-container/70 md:col-span-2 xl:col-span-8 xl:row-span-2 xl:min-h-[436px]" />
          <div className="order-2 min-h-[220px] animate-pulse rounded-2xl bg-surface-container/60 xl:col-span-4" />
          <div className="order-3 min-h-[200px] animate-pulse rounded-2xl bg-surface-container/50 xl:col-span-4" />
        </div>
      </div>
    </div>
  )
}
