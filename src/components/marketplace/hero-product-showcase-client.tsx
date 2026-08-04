'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/i18n.types'
import type { FabricSummary } from '@/types/marketplace.types'

function hashToHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function ShowcaseCard({
  fabric,
  locale,
  variant,
  messages,
}: {
  fabric: FabricSummary
  locale: Locale
  variant: 'main' | 'side'
  messages: ReturnType<typeof useI18n>['messages']
}) {
  const title = getLocalizedFabricTitle(fabric, locale)
  const hue = hashToHue(fabric.slug)
  const specs: string[] = []
  if (fabric.gsm) specs.push(`${fabric.gsm}${messages.fabricCard.gsmUnit}`)
  if (fabric.widthCm) specs.push(`${fabric.widthCm} cm`)
  if (fabric.supplierName && variant === 'main') specs.push(fabric.supplierName)

  return (
    <Link
      href={withLocaleUrl(`/fabrics/${fabric.slug}`, locale)}
      className="group/card relative block h-full overflow-hidden rounded-2xl"
    >
      {/* Image / fallback gradient */}
      {fabric.imageUrl ? (
        <Image
          src={fabric.imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.05]"
          sizes={variant === 'main' ? '(max-width: 1024px) 100vw, 55vw' : '(max-width: 1024px) 50vw, 25vw'}
          priority={variant === 'main'}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(145deg, hsl(${hue} 60% 52%), hsl(${(hue + 35) % 360} 50% 32%))`
          }}
        />
      )}

      {/* Overlay gradient */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 transition-opacity duration-500',
          variant === 'main'
            ? 'bg-gradient-to-t from-black/75 via-black/25 to-black/5 group-hover/card:from-black/65'
            : 'bg-gradient-to-t from-black/70 via-black/15 to-transparent group-hover/card:from-black/55'
        )}
        aria-hidden
      />

      {/* Fabric type badge */}
      {fabric.fabricType ? (
        <span
          className={cn(
            'absolute left-3 top-3 rounded-lg border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-md',
            variant === 'main' && 'sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]'
          )}
        >
          {fabric.fabricType}
        </span>
      ) : null}

      {/* Price badge */}
      {fabric.priceUsd ? (
        <span
          className={cn(
            'absolute right-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-on-surface shadow-sm backdrop-blur-sm',
            variant === 'main' && 'sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs'
          )}
        >
          ${fabric.priceUsd}
          <span className="font-semibold text-on-surface-variant">/{messages.hero.priceHint}</span>
        </span>
      ) : null}

      {/* Bottom info */}
      <div
        className={cn(
          'absolute bottom-0 left-0 right-0 p-3',
          variant === 'main' ? 'sm:p-5' : 'sm:p-4'
        )}
      >
        <h3
          className={cn(
            'font-heading font-extrabold leading-snug tracking-tight text-white',
            variant === 'main'
              ? 'text-base sm:text-lg lg:text-xl [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]'
              : 'text-sm sm:text-base line-clamp-1 [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]'
          )}
        >
          {title}
        </h3>
        {specs.length > 0 ? (
          <p
            className={cn(
              'mt-1 font-medium text-white/80 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]',
              variant === 'main' ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs line-clamp-1'
            )}
          >
            {specs.join(' · ')}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

function EmptyShowcase({ messages }: { messages: ReturnType<typeof useI18n>['messages'] }) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-outline/10 bg-gradient-to-br from-surface-container-low via-background to-surface-container-low p-8 text-center">
      <Sparkles className="h-10 w-10 text-primary/40" aria-hidden />
      <h3 className="mt-4 font-heading text-lg font-extrabold text-on-surface">
        {messages.hero.heroEmptyFeaturedTitle}
      </h3>
      <p className="mt-2 max-w-xs text-sm text-on-surface-variant">
        {messages.hero.heroEmptyFeaturedBody}
      </p>
    </div>
  )
}

export function HeroProductShowcaseClient({ items }: { items: FabricSummary[] }) {
  const { locale, messages } = useI18n()

  if (items.length === 0) {
    return <EmptyShowcase messages={messages} />
  }

  const main = items[0]!
  const side1 = items[1]
  const side2 = items[2]

  return (
    <div className="h-full space-y-3 lg:flex lg:gap-3 lg:space-y-0">
      {/* Main featured card */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.4)] sm:aspect-[3/4] lg:aspect-auto lg:w-[58%] lg:flex-none">
        <ShowcaseCard fabric={main} locale={locale} variant="main" messages={messages} />
      </div>

      {/* Side column */}
      <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-1 lg:flex-col">
        {side1 ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-[0_16px_48px_-16px_rgba(0,0,0,0.35)] lg:aspect-auto lg:flex-1">
            <ShowcaseCard fabric={side1} locale={locale} variant="side" messages={messages} />
          </div>
        ) : null}
        {side2 ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-[0_16px_48px_-16px_rgba(0,0,0,0.35)] lg:aspect-auto lg:flex-1">
            <ShowcaseCard fabric={side2} locale={locale} variant="side" messages={messages} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
