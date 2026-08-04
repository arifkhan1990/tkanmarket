'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import { CheckCircle2, Inbox, Layers, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { invPanelFlat, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, isRemoteImageSrc } from '@/lib/utils'
import type { Messages } from '@/lib/i18n/get-messages'
import type {
  ProductReviewQueueCounts,
  ProductReviewQueueRow,
  ProductReviewStatusFilter
} from '@/types/admin-product-review-queue.types'

type P = Messages['admin']['productReviewQueuePage']

const FILTERS: { id: ProductReviewStatusFilter; labelKey: 'filterPending' | 'filterProcessing' | 'filterAll' }[] =
  [
    { id: 'pending', labelKey: 'filterPending' },
    { id: 'processing', labelKey: 'filterProcessing' },
    { id: 'all', labelKey: 'filterAll' }
  ]

function fabricStatusLabel(status: string, p: P): string {
  if (status === 'raw_scraped') return p.statusRawScraped
  if (status === 'ai_processing') return p.statusAiProcessing
  if (status === 'ai_processed') return p.statusAiProcessed
  return status
}

export function ProductReviewQueueListSkeleton() {
  return (
    <div className="space-y-3 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse gap-3 rounded-xl border border-outline/10 bg-surface-container-lowest p-3 md:gap-4 md:p-4"
        >
          <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-container-high md:h-16 md:w-16" />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className="h-2 w-20 rounded bg-surface-container-high" />
            <div className="h-4 w-full max-w-[220px] rounded bg-surface-container-high" />
            <div className="h-3 w-28 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  )
}

function StatChip({
  label,
  value,
  icon
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div
      className={cn(
        invPanelFlat(),
        'px-3 py-3 transition-shadow',
        'bg-gradient-to-br from-surface-container-lowest to-surface-container-low/90 ring-1 ring-outline/10'
      )}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/15">
          {icon}
        </span>
        <p className={cn('font-mono text-lg font-black tabular-nums text-on-surface', invText.title)}>{value}</p>
      </div>
      <p className={cn('mt-2 text-[10px] font-semibold uppercase tracking-wide', invText.muted)}>{label}</p>
    </div>
  )
}

export function ProductReviewQueueSidebar(props: {
  p: P
  filter: ProductReviewStatusFilter
  onFilterChange: (f: ProductReviewStatusFilter) => void
  counts: ProductReviewQueueCounts | undefined
  items: ProductReviewQueueRow[]
  listLoading: boolean
  selectedId: number | null
  onSelect: (id: number) => void
  page: number
  totalPages: number
  onPageChange: (next: number) => void
  onRefresh: () => void
  isRefreshing: boolean
  total: number
}) {
  const {
    p,
    filter,
    onFilterChange,
    counts,
    items,
    listLoading,
    selectedId,
    onSelect,
    page,
    totalPages,
    onPageChange,
    onRefresh,
    isRefreshing,
    total
  } = props

  const ready = counts?.readyForReview ?? 0
  const proc = counts?.aiProcessing ?? 0
  const pipe = counts?.pipelineTotal ?? 0

  return (
    <section
      className="flex min-h-0 w-full max-h-[min(calc(100dvh-5rem),900px)] flex-col overflow-hidden border-b border-outline/10 bg-surface-container-low/95 lg:sticky lg:top-[var(--admin-topbar-height)] lg:max-h-[calc(100dvh-var(--admin-topbar-height)-var(--admin-footer-height))] lg:w-[400px] lg:min-w-[300px] lg:shrink-0 lg:self-start lg:border-b-0 lg:border-r lg:border-outline/15"
    >
      <div className="border-b border-outline/10 bg-gradient-to-b from-surface-container-lowest to-surface-container-lowest/85 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{p.title}</p>
            <h2 className="mt-1 font-heading text-lg font-bold tracking-tight text-on-surface md:text-xl">{p.pendingTitle}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{p.pendingHint.replace('{n}', String(total))}</p>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant/90">{p.subtitle}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-xl"
            onClick={() => void onRefresh()}
            disabled={isRefreshing}
            aria-label={p.refresh}
          >
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatChip label={p.statReady} value={ready} icon={<CheckCircle2 className="h-4 w-4" aria-hidden />} />
          <StatChip label={p.statProcessing} value={proc} icon={<Sparkles className="h-4 w-4" aria-hidden />} />
          <StatChip label={p.statPipeline} value={pipe} icon={<Layers className="h-4 w-4" aria-hidden />} />
        </div>

        <div
          className={cn('mt-4 flex flex-col gap-1 rounded-2xl bg-surface-container-high/90 p-1.5 ring-1 ring-outline/10')}
          role="group"
          aria-label={p.title}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                'min-h-[44px] w-full rounded-xl px-4 py-2.5 text-left text-xs font-semibold transition-all',
                filter === f.id
                  ? 'bg-surface-container-lowest text-on-surface shadow-sm ring-1 ring-primary/25'
                  : 'text-on-surface-variant hover:bg-surface-container-low/80 hover:text-on-surface'
              )}
            >
              {p[f.labelKey]}
            </button>
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <div className="space-y-2 p-3 md:p-4">
          {listLoading ? (
            <ProductReviewQueueListSkeleton />
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline/25 bg-surface-container-lowest/50 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Inbox className="h-7 w-7" aria-hidden />
              </div>
              <p className="font-medium text-on-surface">{p.emptyQueue}</p>
              <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">{p.emptyQueueSidebarHint}</p>
            </div>
          ) : (
            items.map((row) => {
              const active = row.id === selectedId
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => onSelect(row.id)}
                  className={cn(
                    'flex min-h-[44px] w-full gap-3 rounded-xl border p-3 text-left shadow-sm transition-all md:gap-3.5 md:p-3.5',
                    active
                      ? 'border-primary/50 bg-gradient-to-r from-primary/[0.08] to-surface-container-lowest ring-2 ring-primary/20'
                      : 'border-outline/10 bg-surface-container-lowest hover:border-outline/20 hover:bg-surface-container-high'
                  )}
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-container-high md:h-16 md:w-16">
                    {row.primaryImage ? (
                      <Image
                        src={row.primaryImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 56px, 64px"
                        unoptimized={isRemoteImageSrc(row.primaryImage)}
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                      {p.skuLabel}: {row.sku?.trim() || '—'}
                    </div>
                    <div className="line-clamp-2 font-heading text-sm font-bold leading-snug text-on-surface">{row.title}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">{row.supplierName ?? '—'}</div>
                    <div className="mt-1.5 inline-flex rounded-full bg-surface-container-high px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-surface-variant">
                      {fabricStatusLabel(row.status, p)}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </ScrollArea>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 border-t border-outline/10 px-3 py-3 md:px-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 rounded-xl"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            ‹
          </Button>
          <span className="truncate text-center text-xs font-medium text-on-surface-variant">
            {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 rounded-xl"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            ›
          </Button>
        </div>
      ) : null}
    </section>
  )
}
