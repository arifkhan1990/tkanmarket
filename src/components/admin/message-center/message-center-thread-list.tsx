'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { UseQueryResult } from '@tanstack/react-query'

import {
  MESSAGE_CENTER_STATUS_FILTER_ALL,
  type MessageCenterResponse,
  type MessageCenterStatusFilterValue,
  type MessageThreadRow
} from '@/types/admin-message-center.types'
import type { LeadStatus } from '@/types/marketplace.types'

export type { MessageCenterStatusFilterValue as StatusFilterValue } from '@/types/admin-message-center.types'
export { MESSAGE_CENTER_STATUS_FILTER_ALL } from '@/types/admin-message-center.types'

type ListCopy = {
  searchPlaceholder: string
  filtersAria: string
  loadError: string
  pagePrev: string
  pageNext: string
  pageIndicator: string
  emptyThreads: string
  noResultsForQuery: string
  filterAll: string
  filterInquiries: string
  filterSamples: string
  filterCampaigns: string
  filterDirect: string
  filterManual: string
  statusFilterAria: string
  statusFilterAll: string
  statusNew: string
  statusContacted: string
  statusQualified: string
  statusProposalSent: string
  statusNegotiating: string
  statusClosedWon: string
  statusClosedLost: string
  clearFilters: string
}

export interface MessageCenterThreadListProps {
  t: ListCopy
  locale: string
  filters: readonly { id: string; label: string }[]
  page: number
  setPage: React.Dispatch<React.SetStateAction<number>>
  search: string
  onSearchChange: (next: string) => void
  source: string
  onSourceChange: (id: string) => void
  status: MessageCenterStatusFilterValue
  onStatusChange: (next: MessageCenterStatusFilterValue) => void
  selectedId: number | null
  onSelectThread: (id: number) => void
  onClearFilters: () => void
  filtersActive: boolean
  query: UseQueryResult<MessageCenterResponse, Error>
}

function statusBadgeClasses(status: LeadStatus): string {
  switch (status) {
    case 'NEW':
      return 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-200'
    case 'CONTACTED':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200'
    case 'QUALIFIED':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
    case 'PROPOSAL_SENT':
    case 'NEGOTIATING':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
    case 'CLOSED_WON':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'CLOSED_LOST':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function ThreadSkeleton() {
  return (
    <div className="space-y-3 p-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-[88px] animate-pulse rounded-2xl border border-outline/10 bg-surface-container-highest/80"
        />
      ))}
    </div>
  )
}

export function MessageCenterThreadList({
  t,
  locale,
  filters,
  page,
  setPage,
  search,
  onSearchChange,
  source,
  onSourceChange,
  status,
  onStatusChange,
  selectedId,
  onSelectThread,
  onClearFilters,
  filtersActive,
  query
}: MessageCenterThreadListProps) {
  const data = query.data

  const statusOptions: { value: MessageCenterStatusFilterValue; label: string }[] = [
    { value: MESSAGE_CENTER_STATUS_FILTER_ALL, label: t.statusFilterAll },
    { value: 'NEW', label: t.statusNew },
    { value: 'CONTACTED', label: t.statusContacted },
    { value: 'QUALIFIED', label: t.statusQualified },
    { value: 'PROPOSAL_SENT', label: t.statusProposalSent },
    { value: 'NEGOTIATING', label: t.statusNegotiating },
    { value: 'CLOSED_WON', label: t.statusClosedWon },
    { value: 'CLOSED_LOST', label: t.statusClosedLost }
  ]

  return (
    <>
      <div className="shrink-0 space-y-3 p-4 md:p-5">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-9"
            aria-label={t.searchPlaceholder}
            type="search"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar" role="tablist" aria-label={t.filtersAria}>
          {filters.map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              role="tab"
              aria-selected={source === f.id}
              onClick={() => onSourceChange(f.id)}
              className={cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                source === f.id
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onValueChange={(v) => onStatusChange(v as MessageCenterStatusFilterValue)}
          >
            <SelectTrigger className="h-9 flex-1 rounded-xl text-xs" aria-label={t.statusFilterAria}>
              <SelectValue placeholder={t.statusFilterAll} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtersActive ? (
            <Button type="button" variant="ghost" size="sm" className="gap-1 text-xs" onClick={onClearFilters}>
              <X className="h-3.5 w-3.5" aria-hidden />
              {t.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 px-3 md:px-4">
        <div className="space-y-1.5 pb-4">
          {query.isLoading && !data ? <ThreadSkeleton /> : null}
          {query.isError ? <p className="py-12 text-center text-sm text-destructive">{t.loadError}</p> : null}
          {!query.isError &&
            data?.threads.map((thread: MessageThreadRow) => {
              const active = selectedId === thread.id
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectThread(thread.id)}
                  className={cn(
                    'w-full rounded-2xl border p-4 text-left transition-colors hover:bg-surface-container-high',
                    active
                      ? 'border-primary/40 bg-surface-container-low shadow-sm ring-1 ring-primary/20'
                      : 'border-transparent',
                    thread.unreadHint && !active
                      ? 'border-l-4 border-l-primary bg-surface-container-lowest/80'
                      : ''
                  )}
                  aria-pressed={active}
                >
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="line-clamp-1 text-sm font-bold text-on-surface">{thread.companyName}</span>
                    <time
                      className="shrink-0 font-mono text-[10px] text-on-surface-variant"
                      dateTime={thread.updatedAt}
                    >
                      {formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true })}
                    </time>
                  </div>
                  <p className="mb-2 line-clamp-2 text-xs text-on-surface-variant">{thread.preview}</p>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="rounded-full border border-outline/30 bg-surface-container-high px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-on-surface-variant">
                      {thread.source.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                        statusBadgeClasses(thread.status)
                      )}
                    >
                      {thread.status}
                    </span>
                    {thread.unreadHint ? (
                      <span className="ml-auto h-2 w-2 rounded-full bg-primary" aria-label="unread" />
                    ) : null}
                  </div>
                </button>
              )
            })}
          {!query.isError && data && data.threads.length === 0 && !query.isLoading ? (
            <p className="py-12 text-center text-sm text-on-surface-variant">
              {search ? t.noResultsForQuery.replace('{q}', search) : t.emptyThreads}
            </p>
          ) : null}
        </div>
      </ScrollArea>

      {!query.isError && data && data.meta.totalPages > 1 ? (
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-outline/15 p-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label={t.pagePrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-mono text-xs tabular-nums text-on-surface-variant">
            {t.pageIndicator.replace('{current}', String(page)).replace('{total}', String(data.meta.totalPages))}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            disabled={page >= data.meta.totalPages || query.isFetching}
            onClick={() => setPage((p) => p + 1)}
            aria-label={t.pageNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : null}
      {/* locale prop is forwarded to keep the parent's locale-aware date contract — currently the
          thread list uses date-fns relative time which is locale-agnostic. Reserved for future intl. */}
      <span className="hidden">{locale}</span>
    </>
  )
}
