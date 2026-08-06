'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import {
  ImageOff,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SocialQueueStats } from '@/components/admin/social/social-queue-stats'
import { SocialQueueTable, SocialQueueCardSkeleton } from '@/components/admin/social/social-queue-table'
import { SocialQueueListTable, SocialQueueListTableSkeleton } from '@/components/admin/social/social-queue-list-table'
import { SocialCreatePostDialog } from '@/components/admin/social/social-create-post-dialog'
import { SocialQueuePagination } from '@/components/admin/social/social-queue-pagination'
import { SocialPlatformIcon } from '@/components/admin/social/social-platform-icon'
import {
  useAdminSocialQueue,
  useAdminSocialStats,
  useSocialMutations
} from '@/hooks/admin/useAdminSocialQueue'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/* ─── Platform config ────────────────────────────────────────────── */
const PLATFORMS = [
  { key: 'INSTAGRAM', label: 'Instagram', gradient: 'from-rose-500 via-fuchsia-500 to-orange-400' },
  { key: 'TIKTOK',    label: 'TikTok',    gradient: 'from-slate-800 to-slate-600' },
  { key: 'PINTEREST', label: 'Pinterest', gradient: 'from-red-600 to-red-500' },
  { key: 'FACEBOOK',  label: 'Facebook',  gradient: 'from-blue-600 to-blue-500' },
  { key: 'YOUTUBE',   label: 'YouTube',   gradient: 'from-red-500 to-red-600' }
] as const

type PlatformKey = (typeof PLATFORMS)[number]['key']

const STATUS_FILTERS = ['ALL', 'DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'VIDEO_PENDING'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const CONTENT_TYPE_OPTIONS = ['ALL', 'REEL_5', 'REEL_8', 'REEL_10', 'CAROUSEL', 'IMAGE_POST', 'PIN'] as const

const PAGE_SIZE = 12 // keep in sync with 4-col grid on desktop

export function AdminSocialClient() {
  const queryClient = useQueryClient()
  const { locale, messages } = useI18n()
  const s = messages.admin.socialPage

  const [platform, setPlatform]        = React.useState<PlatformKey>('INSTAGRAM')
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('ALL')
  const [contentTypeFilter, setContentTypeFilter] = React.useState<string>('ALL')
  const [searchQuery, setSearchQuery]   = React.useState('')
  const [page, setPage]                 = React.useState(1)
  const [view, setView]                 = React.useState<'cards' | 'table'>('cards')
  const [selectedIds, setSelectedIds]   = React.useState<Set<number>>(new Set())

  React.useEffect(() => { setPage(1) }, [platform, statusFilter])

  React.useEffect(() => { setSelectedIds(new Set()) }, [platform, statusFilter, contentTypeFilter, searchQuery])

  const toggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = React.useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      const allSelected = ids.length > 0 && ids.every((id) => next.has(id))
      for (const id of ids) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }, [])

  const clearSelection = React.useCallback(() => setSelectedIds(new Set()), [])

  const listParams = React.useMemo(() => ({
    page,
    limit: PAGE_SIZE,
    platform,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: searchQuery.trim().length > 0 ? searchQuery.trim() : undefined,
    content_type: contentTypeFilter === 'ALL' ? undefined : contentTypeFilter
  }), [page, platform, statusFilter, searchQuery, contentTypeFilter])

  React.useEffect(() => { setPage(1) }, [platform, statusFilter, contentTypeFilter])

  const queueQuery = useAdminSocialQueue(listParams)
  const statsQuery = useAdminSocialStats(platform)
  const { approve, publish, schedule, createPost, aiBatch, PublishTrackers } = useSocialMutations()

  const items = queueQuery.data?.success ? queueQuery.data.data.items : []
  const total = queueQuery.data?.success ? queueQuery.data.data.total : 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const isLoading = queueQuery.isLoading || queueQuery.isFetching
  const isEmpty = !isLoading && items.length === 0
  const selectableItems = items.filter((i) => i.status === 'DRAFT' || i.status === 'FAILED')

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const rangeTo = Math.min(page * PAGE_SIZE, total)

  function goToPage(p: number) { setPage(Math.max(1, Math.min(totalPages, p))) }

  const currentPlatform = PLATFORMS.find((p) => p.key === platform)!

  const activeFilterCount =
    (statusFilter !== 'ALL' ? 1 : 0) +
    (contentTypeFilter !== 'ALL' ? 1 : 0) +
    (searchQuery.trim().length > 0 ? 1 : 0)

  function resetFilters() {
    setStatusFilter('ALL')
    setContentTypeFilter('ALL')
    setSearchQuery('')
  }

  function runAiBatch() {
    if (selectedIds.size === 0) return
    aiBatch.mutate(
      { platform, post_ids: [...selectedIds] },
      {
        onSuccess: () => {
          setSelectedIds(new Set())
          void queueQuery.refetch()
          void statsQuery.refetch()
        }
      }
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <PublishTrackers />

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            {s.title}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-surface-variant">{s.subtitle}</p>
          {selectedIds.size === 0 ? (
            <p className="mt-1 text-xs font-medium text-primary/70">{s.aiBatchHint}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            disabled={isLoading}
            onClick={() => {
              void queueQuery.refetch()
              void statsQuery.refetch()
            }}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden />
            {messages.common.refresh}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl"
            disabled={aiBatch.isPending || selectedIds.size === 0}
            title={selectedIds.size === 0 ? s.aiBatchHint : undefined}
            onClick={runAiBatch}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {s.aiBatch}
          </Button>
          <SocialCreatePostDialog
            initialPlatform={platform}
            triggerLabel={s.createPost}
            isPending={createPost.isPending}
            onCreate={async (input) => {
              const data = await createPost.mutateAsync(input)
              void queueQuery.refetch()
              void statsQuery.refetch()
              return data
            }}
          />
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────── */}
      <SocialQueueStats
        stats={statsQuery.data?.success ? statsQuery.data.data : undefined}
        isLoading={statsQuery.isLoading}
        labels={{
          scheduled:     s.statsScheduled,
          published:     s.statsPublished,
          activeFabrics: s.statsActiveFabrics,
          next:          s.statsNext,
          nextEmpty:     s.statsNextEmpty
        }}
      />

      {/* ── Filters toolbar ─────────────────────────────────────── */}
      <section className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        {/* Toolbar header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline/10 bg-surface-container-low/30 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-container-high text-on-surface-variant">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">{s.filters}</p>
              <p className="text-xs text-on-surface-variant">{currentPlatform.label}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {total > 0 ? (
              <span className="hidden rounded-lg bg-surface-container-low px-2.5 py-1 text-xs font-semibold tabular-nums text-on-surface-variant sm:inline-block">
                {rangeFrom}–{rangeTo} / {total} {s.resultsCount}
              </span>
            ) : null}
            <Tabs value={view} onValueChange={(v) => setView(v as 'cards' | 'table')}>
              <TabsList className="h-9 rounded-xl p-0.5">
                <TabsTrigger value="cards" className="h-8 rounded-lg px-3 text-xs font-bold">
                  {s.viewCards}
                </TabsTrigger>
                <TabsTrigger value="table" className="h-8 rounded-lg px-3 text-xs font-bold">
                  {s.viewTable}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-5">
          {PLATFORMS.map((p) => {
            const isActive = p.key === platform
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setPlatform(p.key)}
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
                  isActive
                    ? `bg-gradient-to-r ${p.gradient} text-white shadow-md`
                    : 'border border-outline/15 bg-surface-container-low text-on-surface-variant hover:border-outline/30 hover:bg-surface-container-high hover:text-on-surface'
                )}
              >
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    isActive
                      ? 'bg-white/20 text-white'
                      : `bg-gradient-to-br ${p.gradient} text-white`
                  )}
                >
                  <SocialPlatformIcon platform={p.key} className="h-3.5 w-3.5" />
                </span>
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Search + selects */}
        <div className="grid grid-cols-1 gap-3 border-t border-outline/10 px-4 py-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end sm:px-5">
          {/* Search input */}
          <div className="sm:col-span-2 lg:col-span-6">
            <label htmlFor="social-search" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {s.searchLabel}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="social-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={s.searchPlaceholder}
                className="h-11 rounded-xl border border-input bg-background pl-10 pr-9 shadow-sm transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-0"
                type="search"
              />
              {searchQuery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                  aria-label={s.clearSearch}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>

          {/* Content type filter */}
          <div className="lg:col-span-3">
            <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{s.filterType}</p>
            <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
              <SelectTrigger className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold shadow-sm">
                <SelectValue placeholder={s.filterAll} />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPE_OPTIONS.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {ct === 'ALL' ? s.filterAll : ct.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="lg:col-span-3">
            <p className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{s.filterStatus}</p>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-11 w-full rounded-xl border border-input bg-background px-3 text-xs font-semibold shadow-sm">
                <SelectValue placeholder={s.statusAll} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((st) => (
                  <SelectItem key={st} value={st}>
                    {st === 'ALL' ? s.statusAll : st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-outline/10 bg-surface-container-low/30 px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              {statusFilter !== 'ALL' ? (
                <Badge intent="brand" className="gap-1.5 normal-case tracking-normal">
                  {s.filterStatus}: {statusFilter}
                  <button type="button" onClick={() => setStatusFilter('ALL')} aria-label={`Clear ${s.filterStatus}`} className="text-inherit opacity-70 transition-opacity hover:opacity-100">
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ) : null}
              {contentTypeFilter !== 'ALL' ? (
                <Badge intent="brand" className="gap-1.5 normal-case tracking-normal">
                  {s.filterType}: {contentTypeFilter.replace('_', ' ')}
                  <button type="button" onClick={() => setContentTypeFilter('ALL')} aria-label={`Clear ${s.filterType}`} className="text-inherit opacity-70 transition-opacity hover:opacity-100">
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ) : null}
              {searchQuery.trim().length > 0 ? (
                <Badge intent="brand" className="gap-1.5 normal-case tracking-normal">
                  &ldquo;{searchQuery.trim()}&rdquo;
                  <button type="button" onClick={() => setSearchQuery('')} aria-label={s.clearSearch} className="text-inherit opacity-70 transition-opacity hover:opacity-100">
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </Badge>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1.5 rounded-lg text-xs font-semibold"
              onClick={resetFilters}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {s.resetFilters}
            </Button>
          </div>
        ) : null}
      </section>

      {/* ── Selection bar ───────────────────────────────────────── */}
      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 shadow-sm">
          <p className="text-sm font-semibold text-on-surface">
            {selectedIds.size} {s.selectedCount}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-xl border-outline/20 text-xs font-semibold"
              disabled={aiBatch.isPending}
              onClick={runAiBatch}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {s.aiBatchSelected}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl text-xs font-semibold"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {s.clearSelection}
            </Button>
          </div>
        </div>
      ) : null}

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className={cn('transition-opacity duration-150', isLoading && !queueQuery.isLoading && 'opacity-60')}>
        {queueQuery.isLoading ? (
          view === 'table' ? <SocialQueueListTableSkeleton /> : <SocialQueueCardSkeleton />
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-outline/20 bg-surface-container-lowest py-20 text-center">
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br', currentPlatform.gradient)}>
              <ImageOff className="h-6 w-6 text-white/80" aria-hidden />
            </div>
            <div>
              <p className="font-semibold text-on-surface">
                {queueQuery.isError ? queueQuery.error?.message ?? s.empty : s.empty}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">{s.subtitle}</p>
            </div>
            <SocialCreatePostDialog
              initialPlatform={platform}
              triggerLabel={s.createPost}
              isPending={createPost.isPending}
              onCreate={async (input) => {
                const data = await createPost.mutateAsync(input)
                void queueQuery.refetch()
                void statsQuery.refetch()
                return data
              }}
            />
          </div>
        ) : (
          view === 'table' ? (
            <SocialQueueListTable
              items={items}
              labels={{
                columnPreview: s.columnPreview,
                columnScript: s.columnScript,
                columnContentType: s.columnContentType,
                columnStatus: s.columnStatus,
                columnRelease: s.columnRelease,
                columnActions: s.columnActions,
                openPreview: s.openPreview,
                approve: s.approve,
                publish: s.publish,
                scheduleDate: s.scheduleDate,
                scheduleTime: s.scheduleTime,
                scheduleSave: s.scheduleSave,
                scheduleRequired: s.scheduleRequired,
              }}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={() => toggleSelectAll(selectableItems.map((i) => i.id))}
              onApprove={(id: number) =>
                approve.mutate(id, {
                  onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] }),
                })
              }
              onPublish={(id: number) =>
                publish.mutate(id, {
                  onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] }),
                })
              }
              onSchedule={(id: number, scheduledAt: string) =>
                schedule.mutate(
                  { id, scheduledAt },
                  {
                    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] }),
                  }
                )
              }
              approvePending={approve.isPending}
              publishPending={publish.isPending}
              schedulePending={schedule.isPending}
            />
          ) : (
            <SocialQueueTable
              items={items}
              locale={locale}
              labels={{
                columnPreview: s.columnPreview,
                columnScript: s.columnScript,
                columnStatus: s.columnStatus,
                columnRelease: s.columnRelease,
                columnActions: s.columnActions,
                openPreview: s.openPreview,
                approve: s.approve,
                publish: s.publish,
              }}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onApprove={(id) =>
                approve.mutate(id, {
                  onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] }),
                })
              }
              onPublish={(id) =>
                publish.mutate(id, {
                  onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] }),
                })
              }
              approvePending={approve.isPending}
              publishPending={publish.isPending}
            />
          )
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      {!isEmpty ? (
        <SocialQueuePagination
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          onGoToPage={goToPage}
        />
      ) : null}
    </div>
  )
}
