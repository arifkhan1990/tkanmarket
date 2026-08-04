'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

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

function FabricCard({ fabric, locale, messages }: { fabric: FabricSummary; locale: Locale; messages: ReturnType<typeof useI18n>['messages'] }) {
  const title = getLocalizedFabricTitle(fabric, locale)
  const hue = hashToHue(fabric.slug)
  const specs: string[] = []
  if (fabric.gsm) specs.push(`${fabric.gsm}${messages.fabricCard.gsmUnit}`)
  if (fabric.widthCm) specs.push(`${fabric.widthCm} cm`)

  return (
    <Link
      href={withLocaleUrl(`/fabrics/${fabric.slug}`, locale)}
      className={cn(
        'group/card flex-none snap-start',
        'w-[156px] sm:w-[172px] md:w-[188px]'
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-outline/10 bg-surface-container-low shadow-sm transition-all duration-300 group-hover/card:-translate-y-1 group-hover/card:shadow-lg group-hover/card:shadow-primary/10">
        {fabric.imageUrl ? (
          <Image
            src={fabric.imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover/card:scale-105"
            sizes="(max-width: 640px) 156px, (max-width: 768px) 172px, 188px"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 30) % 360} 55% 35%))`
            }}
          />
        )}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
          aria-hidden
        />
        {fabric.fabricType ? (
          <span className="absolute left-2 top-2 rounded-md border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            {fabric.fabricType}
          </span>
        ) : null}
        {fabric.priceUsd ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-extrabold text-on-surface shadow-sm backdrop-blur-sm">
            ${fabric.priceUsd}<span className="font-medium text-on-surface-variant">/{messages.hero.priceHint}</span>
          </span>
        ) : null}
      </div>
      <div className="mt-2 space-y-0.5 px-0.5">
        <p className="line-clamp-1 text-sm font-bold leading-snug text-on-surface transition-colors group-hover/card:text-primary">
          {title}
        </p>
        {specs.length > 0 ? (
          <p className="text-xs font-medium text-on-surface-variant">
            {specs.join(' · ')}
          </p>
        ) : null}
      </div>
    </Link>
  )
}

export function HeroFabricCarouselClient({ items }: { items: FabricSummary[] }) {
  const { locale, messages } = useI18n()
  const scrollRef = useRef<HTMLDivElement>(null)

  if (items.length === 0) return null

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' })
  }

  return (
    <div className="mt-5 sm:mt-6">
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-on-surface-variant">
          {messages.hero.popularTitle}
        </h3>
        <Link
          href={withLocaleUrl('/fabrics', locale)}
          className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
        >
          {messages.hero.popularLink}
        </Link>
      </div>

      <div className="group/carousel relative">
        {/* Left fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 top-0 z-10 w-8 bg-gradient-to-r from-surface-container-lowest/90 to-transparent"
          aria-hidden
        />
        {/* Right fade */}
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-8 bg-gradient-to-l from-surface-container-lowest/90 to-transparent"
          aria-hidden
        />

        <div
          ref={scrollRef}
          className="no-scrollbar flex gap-3 overflow-x-auto scroll-smooth px-1 pb-2 snap-x snap-mandatory sm:gap-4"
        >
          {items.map((fabric) => (
            <FabricCard key={fabric.id} fabric={fabric} locale={locale} messages={messages} />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll('left')}
          className={cn(
            'absolute left-1 top-[35%] z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
            'border border-outline/15 bg-background/90 text-on-surface-variant shadow-md backdrop-blur-sm',
            'opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100',
            'hover:bg-background hover:text-on-surface'
          )}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => scroll('right')}
          className={cn(
            'absolute right-1 top-[35%] z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full',
            'border border-outline/15 bg-background/90 text-on-surface-variant shadow-md backdrop-blur-sm',
            'opacity-0 transition-opacity duration-200 group-hover/carousel:opacity-100',
            'hover:bg-background hover:text-on-surface'
          )}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
