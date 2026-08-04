'use client'

import Link from 'next/link'
import { Inbox, Layers, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { invPanelFlat } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import type { Messages } from '@/lib/i18n/get-messages'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/i18n.types'

type P = Messages['admin']['productReviewQueuePage']

/** Shown in the main pane while the queue list is loading (avoid flashing empty state). */
export function ProductReviewQueueMainLoading() {
  return (
    <div className="flex min-h-[min(60vh,560px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg space-y-4">
        <div className="mx-auto h-24 w-24 animate-pulse rounded-3xl bg-surface-container-high" />
        <div className="mx-auto h-6 w-48 animate-pulse rounded-md bg-surface-container-high" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-container-high/80" />
        <div className="h-4 w-[85%] max-w-md animate-pulse rounded bg-surface-container-high/60" />
      </div>
    </div>
  )
}

export function ProductReviewQueueEmptyHero(props: {
  p: P
  locale: Locale
  onRefresh: () => void
  isRefreshing: boolean
}) {
  const { p, locale, onRefresh, isRefreshing } = props

  return (
    <div className="flex min-h-[min(70vh,720px)] flex-col items-center justify-center px-4 py-12 md:px-8">
      <div
        className={cn(
          invPanelFlat(),
          'relative max-w-lg overflow-hidden border-outline/20 px-8 py-10 text-center shadow-lg',
          'bg-gradient-to-b from-surface-container-lowest via-surface-container-lowest to-surface-container-low/80'
        )}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/[0.08] blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-tertiary-fixed/15 blur-2xl"
          aria-hidden
        />

        <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-primary/10 ring-1 ring-primary/20" />
          <div className="absolute inset-2 rounded-2xl bg-surface-container-lowest/90 shadow-inner ring-1 ring-outline/10" />
          <Inbox className="relative z-[1] h-11 w-11 text-primary" aria-hidden />
          <Sparkles
            className="absolute -right-1 -top-1 z-[2] h-6 w-6 text-amber-500 dark:text-amber-400"
            aria-hidden
          />
          <Layers className="absolute -bottom-0.5 -left-0.5 z-[2] h-5 w-5 text-on-surface-variant opacity-70" aria-hidden />
        </div>

        <h2 className="font-heading text-xl font-extrabold tracking-tight text-on-surface md:text-2xl">
          {p.emptyQueueHeroTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant">{p.emptyQueueHeroBody}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            className="h-11 rounded-xl font-semibold shadow-md"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
            )}
            {p.refresh}
          </Button>
          <Button type="button" variant="outline" className="h-11 rounded-xl font-semibold" asChild>
            <Link href={withLocaleUrl('/admin/fabrics', locale)}>{p.emptyQueueBrowseFabrics}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProductReviewQueueDetailErrorPanel(props: {
  message: string
  retryLabel: string
  onRetry: () => void
}) {
  const { message, retryLabel, onRetry } = props
  return (
    <div className="flex min-h-[min(50vh,480px)] flex-col items-center justify-center px-4">
      <div className={cn(invPanelFlat(), 'max-w-md border-destructive/20 bg-destructive/5 px-8 py-10 text-center')}>
        <p className="text-sm font-medium text-destructive">{message}</p>
        <Button type="button" variant="outline" className="mt-6 rounded-xl" onClick={() => void onRetry()}>
          {retryLabel}
        </Button>
      </div>
    </div>
  )
}
