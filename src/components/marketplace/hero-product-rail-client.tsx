'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import type { FabricSummary } from '@/types/marketplace.types'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { getLocalizedFabricTitle } from '@/lib/i18n/localized-fabric'

function hashToHue(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h % 360
}

function cardGradient(seed: string): string {
  const hue = hashToHue(seed)
  const hue2 = (hue + 26) % 360
  return `linear-gradient(145deg, hsl(${hue} 70% 84%), hsl(${hue2} 62% 62%))`
}

export function HeroProductRailClient(props: { items: FabricSummary[] }) {
  const { locale, messages } = useI18n()

  const doubled = useMemo(() => [...props.items, ...props.items], [props.items])
  if (props.items.length === 0) return null

  return (
    <div className="bg-surface-container-lowest">
      <div className="mx-auto w-full max-w-screen-2xl px-6 pt-10 md:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <div className="font-heading text-2xl font-extrabold tracking-tight text-on-surface">
            {messages.hero.popularTitle}
          </div>
          <Link
            href={withLocaleUrl('/fabrics', locale)}
            className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant hover:text-primary hover:underline"
          >
            {messages.hero.popularLink}
          </Link>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl px-6 pb-10 md:px-8">
        <div className="mt-5 overflow-hidden">
          <div className="flex w-max gap-3.5 pr-4 [animation:heroRailScroll_34s_linear_infinite] hover:[animation-play-state:paused]">
            {doubled.map((f, idx) => {
              const href = withLocaleUrl(`/fabrics/${f.slug}`, locale)
              const seed = `${f.slug}-${f.tags?.[0] ?? ''}-${f.fabricType ?? ''}`
              return (
                <Link
                  key={`${f.id}-${idx}`}
                  href={href}
                  className={cn(
                    'group relative w-[210px] shrink-0 overflow-hidden rounded-2xl border border-outline/10 bg-background',
                    'transition-all duration-300 hover:-translate-y-1 hover:shadow-soft'
                  )}
                >
                  <div className="relative h-[160px] overflow-hidden" style={{ backgroundImage: cardGradient(seed) }}>
                    <div
                      className="absolute inset-0 opacity-[0.22]"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 2px, transparent 2px, transparent 14px), repeating-linear-gradient(90deg, rgba(0,0,0,.35) 0, rgba(0,0,0,.35) 2px, transparent 2px, transparent 14px)'
                      }}
                      aria-hidden
                    />
                    <div
                      className="absolute inset-0"
                      style={{ backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.35) 0%, transparent 55%)' }}
                      aria-hidden
                    />
                    {f.fabricType ? (
                      <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-on-primary">
                        {f.fabricType}
                      </span>
                    ) : null}
                    <div className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm font-black text-primary">♥</span>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-on-surface-variant">
                      {f.supplierName}
                    </div>
                    <div className="mt-1 line-clamp-2 text-sm font-extrabold text-on-surface group-hover:text-primary">
                      {getLocalizedFabricTitle(f, locale)}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="text-sm font-extrabold text-primary">
                        {f.priceUsd ? `$${f.priceUsd}` : '—'}
                        <span className="ml-1 text-[11px] font-semibold text-on-surface-variant">/{messages.hero.priceHint}</span>
                      </div>
                      <span className="rounded-md bg-surface-container-high px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
                        {f.gsm ? `${f.gsm} ${messages.fabricCard.gsmUnit}` : '—'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes heroRailScroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  )
}

