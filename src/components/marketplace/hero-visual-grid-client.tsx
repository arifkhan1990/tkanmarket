'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { HeroFeaturedSliderClient } from '@/components/marketplace/hero-featured-slider-client'
import { CATEGORY_GRID_IMAGE_BY_SLUG } from '@/constants/category-grid-images'
import { HOME_HERO_YOUTUBE_EMBED_ID } from '@/constants/home-hero.constants'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/i18n.types'
import type { FabricSummary } from '@/types/marketplace.types'

const SILK_POSTER: { src: string; altEn: string } =
  CATEGORY_GRID_IMAGE_BY_SLUG['Шёлк'] ??
  CATEGORY_GRID_IMAGE_BY_SLUG['Хлопок'] ?? {
    src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80',
    altEn: 'Premium textile texture'
  }

const PLACEHOLDER_IMAGES = [
  CATEGORY_GRID_IMAGE_BY_SLUG['Хлопок'],
  CATEGORY_GRID_IMAGE_BY_SLUG['Шёлк'],
  CATEGORY_GRID_IMAGE_BY_SLUG['Лён'],
  CATEGORY_GRID_IMAGE_BY_SLUG['Полиэстер'],
  CATEGORY_GRID_IMAGE_BY_SLUG['Трикотаж'],
  CATEGORY_GRID_IMAGE_BY_SLUG['Шерсть'],
].filter((v): v is { src: string; altEn: string } => v != null)

const PLACEHOLDER_META: Array<{ titleRu: string; titleEn: string; fabricType: string; gsm: number; widthCm: number; priceUsd: string }> = [
  { titleRu: 'Хлопок премиум', titleEn: 'Premium Cotton', fabricType: 'WOVEN', gsm: 180, widthCm: 150, priceUsd: '3.20' },
  { titleRu: 'Натуральный шёлк', titleEn: 'Natural Silk', fabricType: 'WOVEN', gsm: 65, widthCm: 140, priceUsd: '8.50' },
  { titleRu: 'Лён классический', titleEn: 'Classic Linen', fabricType: 'WOVEN', gsm: 200, widthCm: 145, priceUsd: '4.80' },
  { titleRu: 'Полиэстер техно', titleEn: 'Tech Polyester', fabricType: 'KNIT', gsm: 160, widthCm: 155, priceUsd: '2.10' },
  { titleRu: 'Трикотаж базовый', titleEn: 'Basic Knit', fabricType: 'KNIT', gsm: 220, widthCm: 160, priceUsd: '3.50' },
  { titleRu: 'Шерсть мериноса', titleEn: 'Merino Wool', fabricType: 'WOVEN', gsm: 280, widthCm: 150, priceUsd: '6.90' },
]

function getPlaceholderImage(index: number): { src: string; altEn: string } {
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length] ?? SILK_POSTER
}

function getPlaceholderMeta(index: number) {
  return PLACEHOLDER_META[index % PLACEHOLDER_META.length]!
}

/* ─── Video card ──────────────────────────────────────── */
function VideoCard({ embedId }: { embedId: string | null }) {
  const { messages: m } = useI18n()
  const [active, setActive] = useState(false)
  const hasEmbed = typeof embedId === 'string' && embedId.length > 0

  return (
    <div
      className={cn(
        'group/video relative h-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070605]',
        'shadow-[0_28px_64px_-24px_rgba(0,0,0,0.5)] ring-1 transition-all duration-300',
        active ? 'ring-emerald-500/30' : 'ring-black/[0.03]',
        'hover:shadow-[0_32px_72px_-24px_rgba(0,0,0,0.55)]'
      )}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      <div className="relative h-full overflow-hidden">
        {hasEmbed ? (
          <>
            <iframe
              title={m.hero.bentoVideoDialogTitle}
              className={cn(
                'pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 border-0',
                'transition-opacity duration-300',
                active ? 'opacity-100' : 'opacity-0'
              )}
              src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${embedId}`}
              allow="autoplay; encrypted-media; picture-in-picture"
            />
            <div
              className={cn(
                'absolute inset-0 transition-opacity duration-300',
                active ? 'pointer-events-none opacity-0' : 'opacity-100'
              )}
            >
              <Image
                src={SILK_POSTER.src}
                alt={m.hero.bentoVideoPosterAlt}
                fill
                priority
                loading="eager"
                className="object-cover transition-transform duration-700 ease-out group-hover/video:scale-[1.03]"
                sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 380px"
              />
            </div>
          </>
        ) : (
          <Image
            src={SILK_POSTER.src}
            alt={m.hero.bentoVideoPosterAlt}
            fill
            priority
            loading="eager"
            className="object-cover transition-transform duration-700 ease-out group-hover/video:scale-[1.03]"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 380px"
          />
        )}

        {/* Scrim */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.12) 70%, transparent 100%)'
          }}
          aria-hidden
        />

        {/* Badge */}
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-black/40 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" aria-hidden />
          {m.hero.bentoVideoBadge}
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            {m.hero.bentoVideoDuration}
          </p>
          <h3 className="mt-1 font-heading text-base font-extrabold leading-snug tracking-tight text-white sm:text-lg [text-shadow:0_1px_2px_rgba(0,0,0,0.85)]">
            {m.hero.bentoVideoTitle}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-zinc-200 sm:text-sm [text-shadow:0_1px_3px_rgba(0,0,0,0.9)]">
            {m.hero.bentoVideoSubtitle}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Fabric image card ───────────────────────────────── */
function FabricCard({
  fabric,
  locale,
  messages,
  className,
  index = 0,
  priority = false,
}: {
  fabric: FabricSummary
  locale: Locale
  messages: ReturnType<typeof useI18n>['messages']
  className?: string
  index?: number
  priority?: boolean
}) {
  const title = getLocalizedFabricTitle(fabric, locale)
  const [imgError, setImgError] = useState(false)
  const specs: string[] = []
  if (fabric.gsm) specs.push(`${fabric.gsm}${messages.fabricCard.gsmUnit}`)
  if (fabric.widthCm) specs.push(`${fabric.widthCm} cm`)
  const placeholder = getPlaceholderImage(index)
  const usePlaceholder = !fabric.imageUrl || imgError
  const imgSrc = usePlaceholder ? placeholder.src : (fabric.imageUrl as string)
  const imgAlt = usePlaceholder ? placeholder.altEn : title
  const href = fabric.slug
    ? withLocaleUrl(`/fabrics/${fabric.slug}`, locale)
    : withLocaleUrl('/fabrics', locale)

  return (
    <Link
      href={href}
      className={cn('group/card relative block h-full overflow-hidden rounded-2xl', className)}
    >
      <Image
        src={imgSrc}
        alt={imgAlt}
        fill
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/card:scale-[1.05]"
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        onError={() => setImgError(true)}
      />

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity duration-300 group-hover/card:from-black/55"
        aria-hidden
      />

      {fabric.fabricType ? (
        <span className="absolute left-2.5 top-2.5 rounded-lg border border-white/15 bg-black/40 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.1em] text-white backdrop-blur-md sm:left-3 sm:top-3 sm:px-2.5 sm:py-1">
          {fabric.fabricType}
        </span>
      ) : null}

      {fabric.priceUsd ? (
        <span className="absolute right-2.5 top-2.5 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-extrabold text-on-surface shadow-sm backdrop-blur-sm sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
          ${fabric.priceUsd}<span className="font-medium text-on-surface-variant">/{messages.hero.priceHint}</span>
        </span>
      ) : null}

      {title ? (
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <p className="line-clamp-1 text-sm font-bold leading-snug text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)] sm:text-base">
            {title}
          </p>
          {specs.length > 0 ? (
            <p className="mt-0.5 text-[11px] font-medium text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.7)] sm:text-xs">
              {specs.join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </Link>
  )
}

/* ─── Main export ─────────────────────────────────────── */
export function HeroVisualGridClient({
  sliderItems,
  cardItems,
  videoEmbedId = HOME_HERO_YOUTUBE_EMBED_ID,
}: {
  sliderItems: FabricSummary[]
  cardItems: FabricSummary[]
  videoEmbedId?: string | null
}) {
  const { locale, messages } = useI18n()
  const BOTTOM_COUNT = 5
  const rightCard = cardItems[0]
  const realBottom = cardItems.slice(1, 1 + BOTTOM_COUNT)
  const bottomCards: FabricSummary[] = [...realBottom]
  while (bottomCards.length < BOTTOM_COUNT) {
    const idx = bottomCards.length
    const ph = getPlaceholderImage(idx)
    const meta = getPlaceholderMeta(idx)
    bottomCards.push({
      id: -(idx + 100),
      slug: '',
      titleRu: meta.titleRu,
      titleEn: meta.titleEn,
      fabricType: meta.fabricType,
      gsm: meta.gsm,
      widthCm: meta.widthCm,
      priceUsd: meta.priceUsd,
      moq: null,
      supplierName: '',
      imageUrl: ph.src,
      tags: [],
      tagsEn: null,
      color: null,
      colorEn: null,
      supplyType: null,
      supplyTypeEn: null,
      shipmentTime: null,
      shipmentTimeEn: null,
      hasVideo: false,
      thumbnailUrl: null,
    })
  }

  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] bg-gradient-to-br from-primary/[0.15] via-white/50 to-emerald-500/[0.1] p-px',
        'shadow-[0_36px_96px_-44px_rgba(15,23,42,0.5)]'
      )}
    >
      <div
        className={cn(
          'rounded-[calc(1.75rem-1px)] border border-outline/[0.08] bg-gradient-to-br from-surface-container-lowest/95 via-background/50 to-surface-container-lowest/90 p-2 backdrop-blur-xl sm:p-2.5 md:p-3',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]'
        )}
      >
        {/* ─── Top bento: slider + video + fabric card ─── */}
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-12 md:h-[428px] lg:h-[480px] xl:h-[520px]">
          {/* Main slider */}
          <div className="h-[min(74vw,392px)] overflow-hidden rounded-2xl sm:h-[404px] md:col-span-8 md:h-auto">
            {sliderItems.length > 0 ? (
              <HeroFeaturedSliderClient items={sliderItems} layout="bento" />
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl bg-surface-container/60">
                <p className="text-sm text-on-surface-variant">{messages.hero.heroEmptyFeaturedTitle}</p>
              </div>
            )}
          </div>

          {/* Right column: video + fabric card */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:col-span-4 md:flex md:flex-col">
            <div className="aspect-[4/3] md:aspect-auto md:flex-1">
              <VideoCard embedId={videoEmbedId} />
            </div>
            {rightCard ? (
              <div className="aspect-[4/3] md:aspect-auto md:flex-1">
                <FabricCard
                  fabric={rightCard}
                  locale={locale}
                  messages={messages}
                  index={0}
                  priority
                  className="border border-white/[0.08] shadow-[0_20px_48px_-20px_rgba(0,0,0,0.45)]"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* ─── Bottom row: exactly 5 fabric image cards ─── */}
        {bottomCards.length > 0 ? (
          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:mt-3 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {bottomCards.map((fabric, i) => (
              <div key={fabric.id} className={cn('aspect-[3/4]', i >= 2 && 'max-sm:hidden', i >= 3 && 'max-lg:hidden')}>
                <FabricCard
                  fabric={fabric}
                  locale={locale}
                  messages={messages}
                  index={i + 1}
                  className="border border-outline/10 shadow-[0_12px_36px_-12px_rgba(0,0,0,0.3)]"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
