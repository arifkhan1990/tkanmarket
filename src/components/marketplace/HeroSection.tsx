import { Suspense } from 'react'

import { HeroVisualGridClient } from '@/components/marketplace/hero-visual-grid-client'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { cn } from '@/lib/utils'
import { FabricService } from '@/services/fabric.service'

function ShowcaseSkeleton() {
  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] bg-gradient-to-br from-primary/[0.15] via-white/50 to-emerald-500/[0.1] p-px',
        'shadow-[0_36px_96px_-44px_rgba(15,23,42,0.5)]'
      )}
      aria-hidden
    >
      <div
        className={cn(
          'rounded-[calc(1.75rem-1px)] border border-outline/[0.08] bg-gradient-to-br from-surface-container-lowest/95 via-background/50 to-surface-container-lowest/90 p-2.5 backdrop-blur-xl md:p-3',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'
        )}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:h-[480px] lg:h-[520px]">
          <div className="aspect-[16/10] animate-pulse rounded-2xl bg-surface-container/60 md:col-span-8 md:aspect-auto" />
          <div className="grid grid-cols-2 gap-3 md:col-span-4 md:flex md:flex-col">
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-container/50 md:aspect-auto md:flex-1" />
            <div className="aspect-[4/3] animate-pulse rounded-2xl bg-surface-container/40 md:aspect-auto md:flex-1" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-container/35" />
          ))}
        </div>
      </div>
    </div>
  )
}

async function HeroShowcase() {
  const items = await withDbFallback('home.heroShowcase', () => FabricService.getFeatured(11), [])
  const sliderItems = items.slice(0, 5)
  const cardItems = items.length > 5 ? items.slice(5) : []
  return <HeroVisualGridClient sliderItems={sliderItems} cardItems={cardItems} />
}

export async function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-background to-background pb-6 md:pb-10">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(37,99,235,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.05),transparent_50%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 pt-4 sm:px-6 md:px-8 md:pt-6">
        <Suspense fallback={<ShowcaseSkeleton />}>
          <HeroShowcase />
        </Suspense>
      </div>
    </section>
  )
}
