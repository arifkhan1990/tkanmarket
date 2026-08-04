import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { FABRIC_IMAGE_PLACEHOLDER_PATH } from '@/constants/marketplace-images'
import { withDbFallback } from '@/lib/db/with-db-fallback'
import { getServerLocale } from '@/lib/i18n/get-locale'
import { getMessages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import { isRemoteImageSrc } from '@/lib/utils'
import { FabricService } from '@/services/fabric.service'

export async function HeroFeaturedRail(props: { limit?: number }) {
  const locale = await getServerLocale()
  const m = getMessages(locale)
  const fabrics = await withDbFallback('home.heroFeaturedRail', () => FabricService.getFeatured(props.limit ?? 3), [])

  if (fabrics.length === 0) return null

  return (
    <div className="rounded-[2.25rem] border border-outline/10 bg-background/70 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TrendingUp className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-on-surface">{m.hero.trendingTitle}</div>
            <div className="text-xs font-medium text-on-surface-variant">{m.hero.trendingSubtitle}</div>
          </div>
        </div>
        <Link
          href={withLocaleUrl('/fabrics?sort=created_at_desc', locale)}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          {m.hero.trendingLink}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {fabrics.map((f, idx) => {
          const href = withLocaleUrl(`/fabrics/${f.slug}`, locale)
          const imageSrc = f.imageUrl?.trim() ? f.imageUrl : FABRIC_IMAGE_PLACEHOLDER_PATH
          const hasPrice = Boolean(f.priceUsd)
          return (
            <Link
              key={f.id}
              href={href}
              className="group flex gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest p-3 transition-colors hover:bg-primary/5"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-surface-container-highest">
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  unoptimized={isRemoteImageSrc(imageSrc)}
                  priority={idx === 0}
                  aria-hidden
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 text-sm font-extrabold text-on-surface group-hover:text-primary">
                  {getLocalizedFabricTitle(f, locale)}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge intent="default" className="h-5 rounded-full bg-surface-container-high px-2 text-[11px]">
                    {f.fabricType ?? m.fabrics.filters.types.other}
                  </Badge>
                  {f.gsm ? (
                    <span className="text-xs font-semibold text-on-surface-variant">{f.gsm} {m.fabricCard.gsmUnit}</span>
                  ) : null}
                  {f.widthCm ? (
                    <span className="text-xs font-semibold text-on-surface-variant">{f.widthCm} cm</span>
                  ) : null}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-sm font-extrabold text-primary">{hasPrice ? `$${f.priceUsd}` : '—'}</div>
                <div className="mt-0.5 text-[11px] font-semibold text-on-surface-variant">{m.hero.priceHint}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function HeroFeaturedRailFallback() {
  return (
    <div className="rounded-[2.25rem] border border-outline/10 bg-background/70 p-6 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-surface-container/60 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-lg bg-surface-container/60 animate-pulse" />
            <div className="h-3 w-44 rounded-lg bg-surface-container/60 animate-pulse" />
          </div>
        </div>
        <div className="h-3 w-20 rounded-lg bg-surface-container/60 animate-pulse" />
      </div>

      <div className="mt-5 space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest p-3">
            <div className="h-16 w-16 rounded-xl bg-surface-container/60 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded-lg bg-surface-container/60 animate-pulse" />
              <div className="h-3 w-1/2 rounded-lg bg-surface-container/60 animate-pulse" />
            </div>
            <div className="w-16 space-y-2 text-right">
              <div className="h-4 w-14 ml-auto rounded-lg bg-surface-container/60 animate-pulse" />
              <div className="h-3 w-10 ml-auto rounded-lg bg-surface-container/60 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

