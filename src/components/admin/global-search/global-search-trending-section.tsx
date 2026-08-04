'use client'

import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GlobalSearchTrendingCategory } from '@/types/admin-global-search.types'

type GlobalSearchTrendingSectionProps = {
  title: string
  emptyLabel: string
  loadingLabel: string
  loadError: string
  retryLabel: string
  trending: GlobalSearchTrendingCategory[]
  isLoading: boolean
  hasLoaded: boolean
  isError: boolean
  isRetrying: boolean
  onRetry: () => void
  onPick: (label: string) => void
}

export function GlobalSearchTrendingSection({
  title,
  emptyLabel,
  loadingLabel,
  loadError,
  retryLabel,
  trending,
  isLoading,
  hasLoaded,
  isError,
  isRetrying,
  onRetry,
  onPick
}: GlobalSearchTrendingSectionProps) {
  return (
    <section className="border-t border-outline/10 px-4 py-4 sm:px-6">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-primary/80" aria-hidden />
        <h3 className="font-headline text-[11px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">
          {title}
        </h3>
      </div>
      {isError && !hasLoaded ? (
        <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{loadError}</p>
          <Button type="button" variant="outline" size="sm" className="shrink-0" disabled={isRetrying} onClick={() => void onRetry()}>
            {retryLabel}
          </Button>
        </div>
      ) : isLoading && !hasLoaded ? (
        <div className="flex flex-wrap gap-2" aria-busy aria-label={loadingLabel}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={cn('h-9 animate-pulse rounded-full bg-surface-container-high', i % 3 === 0 ? 'w-24' : i % 3 === 1 ? 'w-32' : 'w-28')}
            />
          ))}
        </div>
      ) : trending.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline/20 bg-surface-container-low/50 px-4 py-6 text-center text-sm text-on-surface-variant">
          {emptyLabel}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {trending.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => onPick(c.label)}
              className="group cursor-pointer rounded-full border border-outline/15 bg-surface-container-high/80 px-3.5 py-2 text-xs font-semibold text-on-surface shadow-sm transition-all hover:border-primary/30 hover:bg-primary hover:text-on-primary"
            >
              <span>{c.label}</span>
              <span className="ml-1.5 tabular-nums opacity-75 group-hover:opacity-100">({c.count})</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
