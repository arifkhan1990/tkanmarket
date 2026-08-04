'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { FabricSummary } from '@/types/marketplace.types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'

const SLIDE_DURATION_MS = 6500

function hashToHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function toSwatchStyle(seed: string): React.CSSProperties {
  const hue = hashToHue(seed)
  const hue2 = (hue + 22) % 360
  const c1 = `hsl(${hue} 78% 54%)`
  const c2 = `hsl(${hue2} 70% 30%)`
  return {
    backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`
  }
}

export function HeroFeaturedSliderClient(props: { items: FabricSummary[]; layout?: 'immersive' | 'bento' }) {
  const { locale, messages } = useI18n()
  const items = props.items
  const layout = props.layout ?? 'immersive'
  const isBento = layout === 'bento'

  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const safeIndex = items.length > 0 ? index % items.length : 0
  const current = items[safeIndex]

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setIndex((p) => (p + 1) % Math.max(items.length, 1))
    }, SLIDE_DURATION_MS)
  }, [items.length])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [safeIndex, resetTimer])

  const go = (next: number) => {
    setIndex(next)
    resetTimer()
  }

  const prev = () => go((safeIndex - 1 + items.length) % items.length)
  const nextSlide = () => go((safeIndex + 1) % items.length)

  const subtitle = useMemo(() => {
    if (!current) return ''
    const bits: string[] = []
    if (current.fabricType) bits.push(current.fabricType)
    if (current.gsm) bits.push(`${current.gsm} ${messages.fabricCard.gsmUnit}`)
    if (current.widthCm) bits.push(`${current.widthCm} cm`)
    if (current.supplierName) bits.push(current.supplierName)
    return bits.join(' • ')
  }, [current, messages.fabricCard.gsmUnit])

  if (!current) return null

  const href = withLocaleUrl(`/fabrics/${current.slug}`, locale)
  const swatchSeed = `${current.slug}-${current.fabricType ?? ''}-${current.tags?.[0] ?? ''}`

  if (isBento) {
    return (
      <div
        className={cn(
          'group relative h-[min(74vw,392px)] overflow-hidden bg-[#0a0908] sm:h-[404px] md:h-[428px]',
          'xl:h-full xl:min-h-[436px]',
          'rounded-2xl border border-white/[0.08] shadow-[0_36px_88px_-36px_rgba(0,0,0,0.62)]',
          'ring-1 ring-white/[0.06]'
        )}
      >
        {/* Chrome — glass over imagery (no solid black strip) */}
        <div className="absolute left-0 right-0 top-0 z-40 flex h-11 items-center justify-between border-b border-white/[0.1] bg-black/25 px-4 backdrop-blur-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/70">
            {messages.hero.bentoFeaturedLabel}
          </span>
          <span className="font-mono text-[11px] font-bold tabular-nums tracking-tight text-[#c4a574]">
            {String(safeIndex + 1).padStart(2, '0')}
            <span className="text-white/40"> / </span>
            {String(items.length).padStart(2, '0')}
          </span>
        </div>

        {/* Full-bleed hero media + cinematic scrims (integrated, not 50/50 split) */}
        <div className="absolute bottom-0 left-0 right-0 top-11 overflow-hidden">
          {/* All slides stacked — cross-fade via opacity transition */}
          {items.map((item, i) => {
            const seed = `${item.slug}-${item.fabricType ?? ''}-${item.tags?.[0] ?? ''}`
            return (
              <div
                key={`hero-bento-media-${item.id}`}
                className="absolute inset-0 transition-opacity duration-700 ease-in-out motion-reduce:duration-0"
                style={{ opacity: i === safeIndex ? 1 : 0 }}
                aria-hidden={i !== safeIndex}
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={getLocalizedFabricTitle(item, locale)}
                    fill
                    className={cn(
                      'object-cover transition-transform duration-[1.25s] ease-[cubic-bezier(0.22,1,0.36,1)]',
                      i === safeIndex && 'group-hover:scale-[1.04]'
                    )}
                    sizes="(max-width: 768px) 100vw, (max-width: 1536px) 85vw, 1100px"
                    priority={i === 0}
                  />
                ) : (
                  <div className="absolute inset-0" style={toSwatchStyle(seed)} />
                )}
              </div>
            )
          })}

          {/* Soft vignette + directional scrims — text readable without a black panel */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 120% 90% at 92% 45%, transparent 0%, rgba(0,0,0,0.06) 52%, rgba(0,0,0,0.18) 100%)'
            }}
            aria-hidden
          />
          {/* Left-weighted read legibility → opens to clear fabric on the right (no hard 50/50 split) */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(105deg, rgba(0,0,0,0.91) 0%, rgba(0,0,0,0.52) 28%, rgba(0,0,0,0.18) 48%, rgba(0,0,0,0.05) 62%, transparent 76%)'
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 md:opacity-90"
            style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.12) 42%, rgba(0,0,0,0.08) 100%)'
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 hidden md:block"
            style={{
              background: 'linear-gradient(0deg, transparent 0%, transparent 55%, rgba(0,0,0,0.2) 100%)'
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, transparent 1px, transparent 22px), repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 22px)'
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.35)]"
            aria-hidden
          />

          {/* Copy — all slides stacked, cross-fade via opacity */}
          {items.map((item, i) => {
            const itemHref = withLocaleUrl(`/fabrics/${item.slug}`, locale)
            const itemSubtitle = [
              item.fabricType,
              item.gsm ? `${item.gsm} ${messages.fabricCard.gsmUnit}` : null,
              item.widthCm ? `${item.widthCm} cm` : null,
              item.supplierName || null,
            ].filter(Boolean).join(' • ')

            return (
              <div
                key={`hero-bento-copy-${item.id}`}
                className="pointer-events-none absolute inset-0 z-[2] transition-opacity duration-500 ease-in-out motion-reduce:duration-0"
                style={{ opacity: i === safeIndex ? 1 : 0 }}
                aria-hidden={i !== safeIndex}
              >
                <div className={cn('flex h-full max-w-[min(100%,36rem)] flex-col items-start justify-end p-4 pb-[3.5rem] sm:p-6 sm:pb-14 md:max-w-[min(100%,34rem)] md:p-8 md:pb-16', i === safeIndex && 'pointer-events-auto')}>
                  <div>
                    <div
                      className="inline-flex w-fit items-center gap-2 rounded-md border border-[#b8894a]/50 bg-black/35 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#e8c989] shadow-[0_2px_12px_rgba(0,0,0,0.45)] backdrop-blur-[2px]"
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#d4a855] shadow-[0_0_10px_rgba(212,168,85,0.6)]" aria-hidden />
                      {messages.hero.promoBadge}
                    </div>

                    <div className="mt-3 sm:mt-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags?.[0] ? (
                          <Badge
                            intent="default"
                            className="border-white/20 bg-black/40 text-[10px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] backdrop-blur-sm"
                          >
                            {item.tags[0]}
                          </Badge>
                        ) : null}
                        <Badge
                          intent="default"
                          className="border-white/20 bg-black/35 text-[10px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.45)] backdrop-blur-sm"
                        >
                          {messages.hero.trendingTitle}
                        </Badge>
                      </div>

                      <Link
                        href={itemHref}
                        className={cn(
                          'mt-2 block font-heading text-[clamp(1.25rem,4vw,1.9rem)] font-extrabold leading-[1.12] tracking-tight text-white transition-colors hover:text-[#e8c989]',
                          'xl:text-[clamp(1.4rem,2.3vw,2.05rem)]',
                          '[text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_4px_20px_rgba(0,0,0,0.65),0_8px_40px_rgba(0,0,0,0.45)]'
                        )}
                      >
                        {getLocalizedFabricTitle(item, locale)}
                      </Link>

                      {item.sku ? (
                        <p
                          className={cn(
                            'mt-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85',
                            '[text-shadow:0_1px_3px_rgba(0,0,0,0.95)]'
                          )}
                        >
                          {messages.navbarSearch.sku}: {item.sku}
                        </p>
                      ) : null}

                      <p
                        className={cn(
                          'mt-2 max-w-md text-xs font-medium leading-relaxed text-white/90 sm:text-sm',
                          '[text-shadow:0_1px_4px_rgba(0,0,0,0.92),0_2px_12px_rgba(0,0,0,0.55)]'
                        )}
                      >
                        {itemSubtitle}
                      </p>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Link
                          href={itemHref}
                          className="inline-flex h-10 items-center justify-center rounded-lg bg-[#b8894a] px-5 text-xs font-extrabold tracking-wide text-white shadow-[0_10px_28px_-8px_rgba(184,137,74,0.55)] transition-all hover:bg-[#d4a855] hover:shadow-[0_14px_36px_-8px_rgba(212,168,85,0.45)] sm:h-11 sm:px-6 sm:text-sm"
                        >
                          {messages.hero.slideCtaPrimary}
                        </Link>
                        <Link
                          href={withLocaleUrl('/fabrics?sort=created_at_desc', locale)}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-white/35 bg-black/40 px-4 text-xs font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-colors hover:border-[#d4a855] hover:bg-black/55 hover:text-[#e8c989] sm:h-11 sm:px-5 sm:text-sm"
                        >
                          {messages.hero.slideCtaSecondary}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute bottom-12 right-3 z-[3] rounded-lg border border-white/12 bg-black/40 px-2.5 py-1 text-[10px] font-extrabold tracking-widest text-white/90 shadow-lg backdrop-blur-md sm:bottom-14 sm:right-5 md:bottom-16">
                  {(item.fabricType ?? messages.fabrics.filters.types.other).toUpperCase()}
                  {item.gsm ? ` · ${item.gsm}${messages.fabricCard.gsmUnit}` : null}
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={prev}
          className={cn(
            'absolute left-2 top-[calc(50%+1.375rem)] z-50 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg sm:left-3 sm:h-10 sm:w-10',
            'border border-white/12 bg-black/45 text-white shadow-lg backdrop-blur-md',
            'pointer-events-auto opacity-100 transition-[opacity,transform,colors] duration-300',
            'md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100',
            'md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100',
            'hover:border-[#c4a574]/35 hover:bg-[#b8894a]/25'
          )}
          aria-label={messages.a11y.paginationPrev}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          className={cn(
            'absolute right-2 top-[calc(50%+1.375rem)] z-50 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg sm:right-3 sm:h-10 sm:w-10',
            'border border-white/12 bg-black/45 text-white shadow-lg backdrop-blur-md',
            'pointer-events-auto opacity-100 transition-[opacity,transform,colors] duration-300',
            'md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100',
            'md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100',
            'hover:border-[#c4a574]/35 hover:bg-[#b8894a]/25'
          )}
          aria-label={messages.a11y.paginationNext}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>

        <div className="absolute bottom-3 left-1/2 z-50 flex -translate-x-1/2 gap-1.5 sm:bottom-4">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              className="h-[3px] cursor-pointer rounded-full transition-all duration-300"
              style={{
                width: i === safeIndex ? 36 : 22,
                background: i === safeIndex ? '#d4a855' : 'rgba(255,255,255,.28)'
              }}
              aria-label={`${messages.hero.trendingTitle} ${i + 1}`}
            />
          ))}
        </div>

        <div className="absolute bottom-0 left-0 z-50 h-[3px] w-full bg-white/10">
          <div
            key={safeIndex}
            className="h-[3px] origin-left bg-[#d4a855]"
            style={{
              animation: `heroProgress ${SLIDE_DURATION_MS}ms linear forwards`
            }}
          />
        </div>

        <style jsx>{`
          @keyframes heroProgress {
            from {
              transform: scaleX(0);
            }
            to {
              transform: scaleX(1);
            }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="group relative h-[620px] overflow-hidden bg-[#0e0c0a]">
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.22]" style={{ backgroundImage: toSwatchStyle(swatchSeed).backgroundImage }} />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(212,168,85,.55) 0, rgba(212,168,85,.55) 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, rgba(212,168,85,.55) 0, rgba(212,168,85,.55) 1px, transparent 1px, transparent 32px)'
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(105deg, rgba(14,12,10,.86) 0%, rgba(14,12,10,.48) 45%, rgba(14,12,10,.12) 100%)'
          }}
        />

        <div
          className="absolute right-0 top-0 h-full w-[52%] bg-black/25"
          style={{ clipPath: 'polygon(8% 0,100% 0,100% 100%,0% 100%)' }}
        />

        <div
          className="absolute right-[4%] top-1/2 h-[78%] w-[42%] -translate-y-1/2 overflow-hidden rounded-xl opacity-95"
          style={{ backgroundImage: toSwatchStyle(swatchSeed).backgroundImage }}
        >
          <div
            className="absolute inset-0 opacity-[0.30]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 2px, transparent 2px, transparent 14px), repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 2px, transparent 2px, transparent 14px)'
            }}
          />
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.26) 0%, transparent 52%)' }} />
          <div className="absolute bottom-3 right-3 rounded-md bg-black/55 px-2.5 py-1 text-[11px] font-extrabold tracking-widest text-white/85">
            {(current.fabricType ?? messages.fabrics.filters.types.other).toUpperCase()}
            {current.gsm ? ` · ${current.gsm}${messages.fabricCard.gsmUnit}` : null}
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end pb-16 pl-8 pr-8 md:pl-12 md:pr-12">
        <div className="max-w-[640px]">
          <div className="inline-flex items-center gap-2 rounded-md border border-[#b8894a]/40 bg-[#b8894a]/15 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#d4a855]">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#d4a855]" aria-hidden />
            {messages.hero.promoBadge}
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              {current.tags?.[0] ? (
                <Badge intent="default" className="border-transparent bg-white/10 text-white/85">
                  {current.tags[0]}
                </Badge>
              ) : null}
              <Badge intent="default" className="border-transparent bg-white/10 text-white/85">
                {messages.hero.trendingTitle}
              </Badge>
            </div>

            <Link
              href={href}
              className="mt-4 block font-heading text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-tight text-white hover:text-[#d4a855] hover:underline"
            >
              {getLocalizedFabricTitle(current, locale)}
            </Link>

            <div className="mt-4 max-w-[480px] text-base font-medium leading-relaxed text-white/60">{subtitle}</div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href={href}
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#b8894a] px-7 text-sm font-extrabold tracking-wide text-white transition-colors hover:bg-[#d4a855]"
              >
                {messages.hero.slideCtaPrimary}
              </Link>
              <Link
                href={withLocaleUrl('/fabrics?sort=created_at_desc', locale)}
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-6 text-sm font-semibold text-white transition-colors hover:border-[#d4a855] hover:text-[#d4a855]"
              >
                {messages.hero.slideCtaSecondary}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-10 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center gap-2 md:flex">
        <div className="font-heading text-4xl font-extrabold leading-none text-white">{String(safeIndex + 1).padStart(2, '0')}</div>
        <div className="h-7 w-px bg-white/25" aria-hidden />
        <div className="text-xs font-semibold tracking-widest text-white/40">{String(items.length).padStart(2, '0')}</div>
      </div>

      <button
        type="button"
        onClick={prev}
        className={cn(
          'absolute left-6 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full',
          'border border-white/15 bg-white/10 text-white backdrop-blur-sm',
          'pointer-events-auto opacity-100 transition-opacity duration-300',
          'md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100',
          'md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100',
          'hover:bg-[#b8894a]/40'
        )}
        aria-label={messages.a11y.paginationPrev}
      >
        <ChevronLeft className="h-4.5 w-4.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className={cn(
          'absolute right-6 top-1/2 z-30 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full',
          'border border-white/15 bg-white/10 text-white backdrop-blur-sm',
          'pointer-events-auto opacity-100 transition-opacity duration-300',
          'md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100',
          'md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100',
          'hover:bg-[#b8894a]/40'
        )}
        aria-label={messages.a11y.paginationNext}
      >
        <ChevronRight className="h-4.5 w-4.5" aria-hidden />
      </button>

      <div className="absolute bottom-7 right-10 z-30 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            className="h-[3px] cursor-pointer rounded-full transition-all duration-300"
            style={{
              width: i === safeIndex ? 48 : 28,
              background: i === safeIndex ? '#d4a855' : 'rgba(255,255,255,.30)'
            }}
            aria-label={`${messages.hero.trendingTitle} ${i + 1}`}
          />
        ))}
      </div>

      <div className="absolute bottom-0 left-0 z-30 h-[3px] w-full bg-white/10">
        <div
          key={safeIndex}
          className="h-[3px] origin-left bg-[#d4a855]"
          style={{
            animation: `heroProgress ${SLIDE_DURATION_MS}ms linear forwards`
          }}
        />
      </div>

      <style jsx>{`
        @keyframes heroProgress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
      `}</style>
    </div>
  )
}
