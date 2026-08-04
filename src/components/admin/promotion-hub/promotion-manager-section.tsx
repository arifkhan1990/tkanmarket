'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowDownUp,
  Download,
  Eye,
  MousePointerClick,
  Percent,
  RefreshCw,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  X,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { usePromotionManagerQuery } from '@/hooks/admin/usePromotionManagerQuery'
import { useI18n } from '@/hooks/useI18n'
import { interpolate } from '@/lib/i18n/interpolate'
import { cn } from '@/lib/utils'
import type { PromotionCampaignRow } from '@/types/admin-promotion-manager.types'

type SortKey = 'recent' | 'reach' | 'clicks' | 'ctr'
type CopyType = ReturnType<typeof useI18n>['messages']['admin']['promotionManagerSuitePage']

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-pink-500',
  TIKTOK: 'bg-zinc-900 dark:bg-zinc-200',
  PINTEREST: 'bg-red-500',
  FACEBOOK: 'bg-blue-600',
  YOUTUBE: 'bg-red-600'
}

function statusBadgeClasses(status: string): string {
  switch (status.toUpperCase()) {
    case 'PUBLISHED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
    case 'APPROVED':
      return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200'
    case 'DRAFT':
      return 'bg-surface-container-high text-on-surface-variant'
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200'
    default:
      return 'bg-surface-container-high text-on-surface-variant'
  }
}

function platformDot(platform: string): string {
  return PLATFORM_COLORS[platform.toUpperCase()] ?? 'bg-on-surface-variant'
}

function ctrFor(reach: number | null, clicks: number | null): number | null {
  if (!reach || reach <= 0) return null
  return ((clicks ?? 0) / reach) * 100
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const s = String(cell ?? '')
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
        })
        .join(',')
    )
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function Delta({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-on-surface-variant">—</span>
  const positive = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums',
        positive
          ? 'bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
          : 'bg-red-500/12 text-red-800 dark:bg-red-400/15 dark:text-red-200'
      )}
    >
      {positive ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
      {`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}
    </span>
  )
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  iconClass
}: {
  label: string
  value: string
  delta: number | null
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm dark:border-outline/15">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', iconClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <Delta value={delta} />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
      <p className="mt-1 font-mono text-3xl font-black tabular-nums text-on-surface">{value}</p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl lg:col-span-2" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  )
}

function StatusPipeline({
  statuses,
  copy
}: {
  statuses: { status: string; count: number }[]
  copy: CopyType
}) {
  return (
    <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <h2 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">{copy.pipelineTitle}</h2>
      <p className="mt-1 text-xs text-on-surface-variant">{copy.pipelineSubtitle}</p>
      <ul className="mt-4 space-y-2">
        {statuses.length === 0 ? (
          <li className="rounded-xl border border-dashed border-outline/20 p-4 text-center text-xs text-on-surface-variant">
            {copy.empty}
          </li>
        ) : (
          statuses.map((s) => (
            <li
              key={s.status}
              className="flex items-center justify-between rounded-xl border border-outline/10 bg-surface-container-low px-3 py-2"
            >
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                  statusBadgeClasses(s.status)
                )}
              >
                {s.status}
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-on-surface">{s.count}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}

function PlatformMix({
  platforms,
  copy
}: {
  platforms: { platform: string; posts: number; reach: number; clicks: number }[]
  copy: CopyType
}) {
  const max = Math.max(1, ...platforms.map((p) => p.reach))
  return (
    <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <h2 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">{copy.platformMixTitle}</h2>
      <p className="mt-1 text-xs text-on-surface-variant">{copy.platformMixSubtitle}</p>

      {platforms.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
          {copy.empty}
        </p>
      ) : (
        <ul className="mt-5 space-y-4">
          {platforms.map((p) => {
            const pct = Math.max(2, Math.round((p.reach / max) * 100))
            return (
              <li key={p.platform}>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 font-bold text-on-surface">
                    <span className={cn('h-2 w-2 rounded-full', platformDot(p.platform))} aria-hidden />
                    {p.platform}
                  </span>
                  <span className="font-mono text-on-surface-variant">
                    {p.reach.toLocaleString()} · {interpolate(copy.platformPosts, { n: p.posts })}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div className={cn('h-full rounded-full', platformDot(p.platform))} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export function PromotionManagerSection({ omitHeader = false }: { omitHeader?: boolean }) {
  const { messages, locale } = useI18n()
  const t = messages.admin.promotionManagerSuitePage
  const query = usePromotionManagerQuery()
  const d = query.data

  const [search, setSearch] = React.useState('')
  const [platformFilter, setPlatformFilter] = React.useState<string>('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [sortKey, setSortKey] = React.useState<SortKey>('recent')

  const allCampaigns = React.useMemo(() => d?.campaigns ?? [], [d])
  const platformOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of allCampaigns) set.add(c.platform)
    return Array.from(set).sort()
  }, [allCampaigns])
  const statusOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const c of allCampaigns) set.add(c.status)
    return Array.from(set).sort()
  }, [allCampaigns])

  const filteredCampaigns = React.useMemo<PromotionCampaignRow[]>(() => {
    const needle = search.trim().toLowerCase()
    let out = allCampaigns.filter((c) => {
      if (platformFilter !== 'all' && c.platform !== platformFilter) return false
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (needle) {
        const hay = `${c.fabricTitle} ${c.platform} ${c.status} #${c.fabricId}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    switch (sortKey) {
      case 'reach':
        out = [...out].sort((a, b) => (b.reach ?? 0) - (a.reach ?? 0))
        break
      case 'clicks':
        out = [...out].sort((a, b) => (b.linkClicks ?? 0) - (a.linkClicks ?? 0))
        break
      case 'ctr':
        out = [...out].sort((a, b) => (ctrFor(b.reach, b.linkClicks) ?? 0) - (ctrFor(a.reach, a.linkClicks) ?? 0))
        break
      case 'recent':
      default:
        break
    }
    return out
  }, [allCampaigns, platformFilter, statusFilter, search, sortKey])

  const filtersActive =
    platformFilter !== 'all' || statusFilter !== 'all' || search.length > 0 || sortKey !== 'recent'

  const handleClearFilters = React.useCallback(() => {
    setPlatformFilter('all')
    setStatusFilter('all')
    setSearch('')
    setSortKey('recent')
  }, [])

  const handleExport = React.useCallback(() => {
    if (filteredCampaigns.length === 0) {
      toast.error(t.exportCsvEmpty)
      return
    }
    const header = [t.colFabric, t.colPlatform, t.colStatus, t.colReach, t.colClicks, t.colCtr, t.colUpdated]
    const rows: (string | number)[][] = [header]
    for (const c of filteredCampaigns) {
      const ctr = ctrFor(c.reach, c.linkClicks)
      rows.push([
        c.fabricTitle,
        c.platform,
        c.status,
        c.reach ?? '',
        c.linkClicks ?? '',
        ctr != null ? `${ctr.toFixed(2)}%` : '',
        c.updatedAt
      ])
    }
    downloadCsv(`promotion-manager-${Date.now()}.csv`, rows)
    toast.success(t.exportCsvToast)
  }, [filteredCampaigns, t])

  if (query.isLoading && !d) return <PageSkeleton />

  if (!d) {
    return (
      <div className="rounded-2xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
        {t.empty}
      </div>
    )
  }

  const lastSync = interpolate(t.lastSync, {
    time: formatDistanceToNow(new Date(d.generated_at), { addSuffix: true })
  })

  const body = (
    <div className="space-y-8">
      {/* Toolbar header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[10px] uppercase tracking-widest text-outline">{lastSync}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', query.isFetching && 'animate-spin')} aria-hidden />
            {t.refresh}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
            disabled={filteredCampaigns.length === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t.exportCsv}
          </Button>
          <Button asChild variant="secondary" size="sm" className="rounded-full">
            <Link href="/admin/social">{t.openSocial}</Link>
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t.sectionTitle}>
        <KpiCard
          label={t.cardImpressions}
          value={d.stats.dailyImpressions.toLocaleString(locale)}
          delta={d.stats.impressionsDeltaPercent}
          icon={Eye}
          iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
        />
        <KpiCard
          label={t.cardCtr}
          value={`${d.stats.avgCtrPercent.toFixed(2)}%`}
          delta={d.stats.ctrDeltaPercent}
          icon={Percent}
          iconClass="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        />
        <KpiCard
          label={t.cardClicks}
          value={d.stats.linkClicks.toLocaleString(locale)}
          delta={d.stats.clicksDeltaPercent}
          icon={MousePointerClick}
          iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
        />
        <KpiCard
          label={t.cardLive}
          value={String(d.stats.liveCampaigns).padStart(2, '0')}
          delta={null}
          icon={Zap}
          iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        />
      </section>

      {/* Pipeline + platform mix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <StatusPipeline statuses={d.statuses} copy={t} />
        <div className="lg:col-span-2">
          <PlatformMix platforms={d.platforms} copy={t} />
        </div>
      </div>

      {/* Campaigns table with toolbar */}
      <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm dark:border-outline/15">
        <div className="flex flex-col gap-3 border-b border-outline/10 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <h2 className="flex items-center gap-2 font-heading text-lg font-extrabold tracking-tight text-on-surface">
            <Sparkles className="h-5 w-5 text-primary" aria-hidden />
            {t.sectionTitle}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                aria-hidden
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="pl-9"
                aria-label={t.searchPlaceholder}
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder={t.filterPlatformAll} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterPlatformAll}</SelectItem>
                {platformOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder={t.filterStatusAll} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.filterStatusAll}</SelectItem>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-full sm:w-52">
                <ArrowDownUp className="mr-2 h-4 w-4" aria-hidden />
                <SelectValue placeholder={t.sortLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">{t.sortRecent}</SelectItem>
                <SelectItem value="reach">{t.sortReachDesc}</SelectItem>
                <SelectItem value="clicks">{t.sortClicksDesc}</SelectItem>
                <SelectItem value="ctr">{t.sortCtrDesc}</SelectItem>
              </SelectContent>
            </Select>
            {filtersActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={handleClearFilters}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                {t.clearFilters}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low/80 hover:bg-surface-container-low/80">
                <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colFabric}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colPlatform}
                </TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colStatus}
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colReach}
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colClicks}
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colCtr}
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {t.colUpdated}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-on-surface-variant">
                    {filtersActive ? t.noCampaignsMatch : t.empty}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((c) => {
                  const ctr = ctrFor(c.reach, c.linkClicks)
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/fabrics/${c.fabricId}`} className="text-primary hover:underline">
                          {c.fabricTitle}
                        </Link>
                        <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                          #{c.fabricId}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-2 rounded-md bg-surface-container-high px-2 py-1 text-xs font-bold text-on-surface-variant">
                          <span className={cn('h-2 w-2 rounded-full', platformDot(c.platform))} aria-hidden />
                          {c.platform}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                            statusBadgeClasses(c.status)
                          )}
                        >
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {c.reach != null ? c.reach.toLocaleString(locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {c.linkClicks != null ? c.linkClicks.toLocaleString(locale) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-emerald-700 dark:text-emerald-400">
                        {ctr != null ? `${ctr.toFixed(2)}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[11px] text-on-surface-variant">
                        {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )

  if (omitHeader) {
    return body
  }

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-[1400px] space-y-10 py-8">
        <header>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">
            {t.subtitleBefore} <span className="font-medium text-on-surface">{t.tableName}</span> {t.subtitleAfter}
          </p>
        </header>
        {body}
      </div>
    </div>
  )
}
