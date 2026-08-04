import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { FabricCardSkeleton } from '@/components/marketplace/FabricCard'
import { FeaturedFabricsGridClient } from '@/components/marketplace/FeaturedFabricsGridClient'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { FabricService } from '@/services/fabric.service'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

export async function FeaturedFabricsSection() {
  const fabrics = await withDbFallback('home.featuredFabrics', () => FabricService.getFeatured(8), [])
  const locale = await getServerLocale()
  const m = getMessages(locale)

  return (
    <section className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:py-24 md:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface">
            {m.featured.title}
          </h2>
          <p className="mt-2 text-sm md:text-base text-on-surface-variant">{m.featured.subtitle}</p>
        </div>
        <Link
          href={withLocaleUrl('/fabrics?sort=created_at_desc', locale)}
          className="text-primary font-bold flex items-center gap-2 hover:underline text-sm md:text-base shrink-0"
        >
          {m.featured.viewAll}
          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
        </Link>
      </div>

      {fabrics.length === 0 ? (
        <p className="mt-10 text-center text-on-surface-variant text-sm">{m.featured.empty}</p>
      ) : (
        <FeaturedFabricsGridClient items={fabrics} />
      )}
    </section>
  )
}

export function FeaturedFabricsFallback() {
  return (
    <section className="mx-auto w-full max-w-screen-2xl px-6 py-16 md:py-24 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="h-7 w-56 rounded-xl bg-surface-container-low/50 animate-pulse" />
          <div className="mt-3 h-4 w-80 rounded-xl bg-surface-container-low/50 animate-pulse" />
        </div>
        <div className="h-4 w-24 rounded-xl bg-surface-container-low/50 animate-pulse" />
      </div>
      <div className="mt-8 md:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {Array.from({ length: 8 }).map((_, idx) => (
          <FabricCardSkeleton key={idx} />
        ))}
      </div>
    </section>
  )
}
