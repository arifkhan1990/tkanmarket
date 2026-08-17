'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, Sparkles } from 'lucide-react'

import { HeroFeaturedSliderClient } from '@/components/marketplace/hero-featured-slider-client'
import { Button } from '@/components/ui/button'
import { CATEGORY_GRID_IMAGE_BY_SLUG } from '@/constants/category-grid-images'
import { HOME_HERO_YOUTUBE_EMBED_ID } from '@/constants/home-hero.constants'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { FabricSummary } from '@/types/marketplace.types'

const SILK_POSTER: { src: string; altEn: string } =
  CATEGORY_GRID_IMAGE_BY_SLUG['Шёлк'] ??
  CATEGORY_GRID_IMAGE_BY_SLUG['Хлопок'] ?? {
    src: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1200&q=80',
    altEn: 'Premium textile texture'
  }

function HeroFeaturedEmptyState() {
  const { locale, messages: m } = useI18n()

  return (
    <div
      className={cn(
        'relative flex h-[min(74vw,392px)] w-full flex-col justify-center overflow-hidden rounded-2xl border border-white/[0.08]',
        'bg-[#070605] shadow-[0_36px_88px_-36px_rgba(0,0,0,0.62)] ring-1 ring-white/[0.06] sm:h-[404px] md:h-[428px]',
        'xl:h-full xl:min-h-[436px]'
      )}
    >
      <div
        className="absolute inset-0 opacity-90"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 70% at 20% 20%, rgba(59,130,246,0.22), transparent 55%), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(16,185,129,0.12), transparent 50%), linear-gradient(165deg, #0a0908 0%, #121820 100%)'
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, rgba(255,255,255,.03) 0, rgba(255,255,255,.03) 1px, transparent 1px, transparent 20px)'
        }}
        aria-hidden
      />
      <div className="relative z-10 px-6 py-8 sm:px-10 sm:py-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#c4a574]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {m.hero.bentoFeaturedLabel}
        </div>
        <h3 className="mt-5 max-w-md font-heading text-xl font-extrabold leading-snug tracking-tight text-white sm:text-2xl">
          {m.hero.heroEmptyFeaturedTitle}
        </h3>
        <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-white/65">{m.hero.heroEmptyFeaturedBody}</p>
        <Button
          asChild
          className="mt-7 h-11 rounded-xl bg-[#94611f] px-7 text-sm font-extrabold text-white shadow-[0_12px_32px_-8px_rgba(184,137,74,0.55)] transition-colors hover:bg-[#d4a855]"
        >
          <Link href={withLocaleUrl('/fabrics', locale)}>{m.hero.heroEmptyFeaturedCta}</Link>
        </Button>
      </div>
    </div>
  )
}

export function HomeHeroMarketplaceGridClient(props: { items: FabricSummary[] }) {
  const { locale, messages: m } = useI18n()
  const [isVideoPreviewActive, setIsVideoPreviewActive] = useState(false)
  const [isVideoMounted, setIsVideoMounted] = useState(false)
  const { items } = props
  const embedId = HOME_HERO_YOUTUBE_EMBED_ID
  const hasEmbed = typeof embedId === 'string' && embedId.length > 0

  return (
    <div
      className={cn(
        'relative rounded-[1.75rem] bg-gradient-to-br from-primary/[0.18] via-white/55 to-emerald-500/[0.12] p-px',
        'shadow-[0_36px_96px_-44px_rgba(15,23,42,0.55)]'
      )}
      role="region"
      aria-label={m.hero.bentoGridAriaLabel}
    >
      <div
        className={cn(
          'rounded-[1.6875rem] border border-outline/[0.08] bg-gradient-to-br from-surface-container-lowest/95 via-background/55 to-surface-container-lowest/90 p-2 backdrop-blur-xl sm:p-2.5 md:p-3',
          'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]'
        )}
      >
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-[minmax(228px,1fr)_minmax(204px,1fr)] xl:items-stretch">
          <div className="order-1 min-h-0 md:col-span-2 xl:col-span-8 xl:row-span-2">
            {items.length > 0 ? (
              <HeroFeaturedSliderClient items={items} layout="bento" />
            ) : (
              <HeroFeaturedEmptyState />
            )}
          </div>

          <div className="order-2 flex min-h-[220px] xl:col-span-4 xl:row-start-1 xl:min-h-0">
            <div
              className={cn(
                'group relative flex w-full flex-col overflow-hidden rounded-2xl border border-outline/10',
                'bg-surface-container-low shadow-[0_28px_64px_-36px_rgba(15,23,42,0.48)]',
                /* Fixed ring width — avoids corner “flip” when ring-1 ↔ ring-2 toggled */
                'ring-1 transition-[box-shadow,border-color] duration-300 ease-out',
                'hover:border-primary/15 hover:shadow-[0_32px_72px_-36px_rgba(15,23,42,0.52)]',
                hasEmbed && isVideoPreviewActive
                  ? 'border-emerald-500/25 ring-emerald-500/30'
                  : 'ring-black/[0.03]'
              )}
              onMouseEnter={() => {
                setIsVideoPreviewActive(true)
                setIsVideoMounted(true)
              }}
              onMouseLeave={() => setIsVideoPreviewActive(false)}
            >
              {/* Clip media to radius on its own layer (scale + iframe won’t square the corners) */}
              <div className="relative isolate min-h-[200px] flex-1 overflow-hidden rounded-2xl xl:min-h-[208px]">
                <div className="absolute inset-0 overflow-hidden rounded-2xl [transform:translateZ(0)]">
                  {hasEmbed && isVideoMounted ? (
                    <>
                      <iframe
                        title={m.hero.bentoVideoDialogTitle}
                        className={cn(
                          'pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 border-0',
                          'transition-opacity duration-300 ease-out motion-reduce:transition-none',
                          isVideoPreviewActive ? 'opacity-100' : 'opacity-0'
                        )}
                        src={`https://www.youtube-nocookie.com/embed/${embedId}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1&loop=1&playlist=${embedId}`}
                        loading="lazy"
                        allow="autoplay; encrypted-media; picture-in-picture"
                      />
                      <div
                        className={cn(
                          'absolute inset-0 transition-opacity duration-300 ease-out motion-reduce:transition-none',
                          isVideoPreviewActive ? 'pointer-events-none opacity-0' : 'opacity-100'
                        )}
                      >
                        <Image
                          src={SILK_POSTER.src}
                          alt={m.hero.bentoVideoPosterAlt}
                          fill
                          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                          priority
                        />
                      </div>
                    </>
                  ) : (
                    <Image
                      src={SILK_POSTER.src}
                      alt={m.hero.bentoVideoPosterAlt}
                      fill
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
                      priority
                    />
                  )}
                </div>
                {/* Strong bottom read-legibility zone (poster + video both vary in luminance) */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 32%, rgba(0,0,0,0.35) 58%, transparent 82%)'
                  }}
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute inset-0 shadow-[inset_0_-72px_96px_rgba(0,0,0,0.6)]"
                  aria-hidden
                />
                <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-black/40 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white backdrop-blur-md sm:left-4 sm:top-4 sm:px-3">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.85)]"
                    aria-hidden
                  />
                  {m.hero.bentoVideoBadge}
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-[2] space-y-1.5 p-4 pb-5 sm:p-5 sm:pb-6">
                  <p
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-widest text-white/92',
                      '[text-shadow:0_1px_3px_rgba(0,0,0,0.95)]'
                    )}
                  >
                    {m.hero.bentoVideoDuration}
                  </p>
                  <h3
                    className={cn(
                      'font-heading text-lg font-extrabold leading-snug tracking-tight text-white sm:text-xl',
                      '[text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_2px_16px_rgba(0,0,0,0.65)]'
                    )}
                  >
                    {m.hero.bentoVideoTitle}
                  </h3>
                  <p
                    className={cn(
                      'max-w-[42ch] text-sm font-medium leading-relaxed text-zinc-100 sm:text-[0.9375rem]',
                      '[text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_2px_12px_rgba(0,0,0,0.75)]'
                    )}
                  >
                    {m.hero.bentoVideoSubtitle}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 flex min-h-[200px] xl:col-span-4 xl:row-start-2 xl:min-h-0">
            <div
              className={cn(
                'group/value relative flex w-full flex-col overflow-hidden rounded-2xl border border-outline/10 bg-gradient-to-br from-background/98 via-brand-50/40 to-background/96 p-5 sm:p-6',
                'shadow-[0_24px_60px_-36px_rgba(26,64,194,0.42)] backdrop-blur-md',
                'ring-1 ring-primary/[0.04] transition-[box-shadow,transform] duration-500 ease-out',
                'before:pointer-events-none before:absolute before:inset-y-5 before:left-0 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-primary before:via-primary/75 before:to-primary/20',
                'hover:-translate-y-1 hover:shadow-[0_32px_72px_-32px_rgba(26,64,194,0.48)]'
              )}
            >
              <div className="pl-3 sm:pl-4">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-primary">{m.hero.bentoValueEyebrow}</div>
                <h3 className="mt-2 font-heading text-lg font-extrabold tracking-tight text-on-surface sm:text-xl">
                  {m.hero.perksTitle}
                </h3>
                <ul className="mt-4 flex flex-1 flex-col gap-3.5 text-sm text-on-surface-variant">
                  {[m.hero.perk1, m.hero.perk2, m.hero.perk3].map((line) => (
                    <li key={line} className="flex gap-2.5 transition-colors duration-300 group-hover/value:text-on-surface/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                      <span className="leading-snug">{line}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="secondary"
                  className="mt-6 h-11 w-full rounded-xl border-primary/20 bg-background/95 text-sm font-extrabold shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary hover:text-on-primary hover:shadow-[0_14px_36px_-12px_rgba(26,64,194,0.45)] sm:w-auto sm:self-start"
                >
                  <Link href={withLocaleUrl('/fabrics', locale)}>{m.hero.bentoValueCta}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
