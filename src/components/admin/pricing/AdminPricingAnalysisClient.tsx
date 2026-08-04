'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowDownUp,
  Download,
  ExternalLink,
  Layers,
  Loader2,
  Percent,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Wallet,
  X
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { toast } from 'sonner'

import { useAdminPricingAnalysisQuery } from '@/hooks/admin/useAdminPricingAnalysis'
import { useI18n } from '@/hooks/useI18n'
import { formatPricingOptimizationBody } from '@/lib/format-pricing-optimization-body'
import { interpolate } from '@/lib/i18n/interpolate'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import type { Locale } from '@/types/i18n.types'
import type {
  PricingAnalysisFabricRow,
  PricingAnalysisOptimizationItem,
  PricingAnalysisResponse,
  PricingRiskLevel
} from '@/types/admin-pricing-analysis.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type SortKey = 'recent' | 'priceDesc' | 'priceAsc' | 'marginDesc' | 'marginAsc' | 'moqDesc'
type RiskFilter = 'all' | PricingRiskLevel
type PricingCopy = ReturnType<typeof useI18n>['messages']['admin']['pricingAnalysisPage']

function localeFor(loc: Locale): string {
  return loc === 'zh' ? 'zh-CN' : loc === 'ru' ? 'ru-RU' : 'en-US'
}

function formatUsdCompact(n: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFor(locale), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: 'compact'
  }).format(n)
}

function formatUsd(n: number, locale: Locale): string {
  return new Intl.NumberFormat(localeFor(locale), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n)
}

function formatRelative(iso: string, locale: Locale): string {
  const rtf = new Intl.RelativeTimeFormat(localeFor(locale), { numeric: 'auto' })
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return rtf.format(0, 'minute')
  if (mins < 60) return rtf.format(-mins, 'minute')
  const hours = Math.round(mins / 60)
  if (hours < 48) return rtf.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  return rtf.format(-days, 'day')
}

function optimizationTagLabel(
  tag: PricingAnalysisOptimizationItem['tag'],
  p: Pick<PricingCopy, 'tagSupplyChain' | 'tagMarketRisk' | 'tagOpportunity'>
): string {
  switch (tag) {
    case 'SUPPLY_CHAIN':
      return p.tagSupplyChain
    case 'MARKET_RISK':
      return p.tagMarketRisk
    case 'OPPORTUNITY':
      return p.tagOpportunity
    default: {
      const _exhaustive: never = tag
      return _exhaustive
    }
  }
}

function RiskBadge({ risk, labels }: { risk: PricingRiskLevel; labels: Record<PricingRiskLevel, string> }) {
  const styles: Record<PricingRiskLevel, string> = {
    Stable: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    Volatile: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    Critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
  }
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold', styles[risk])}>
      {labels[risk]}
    </span>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClass
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  iconClass: string
}) {
  return (
    <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 shadow-sm dark:border-outline/15">
      <div className="flex items-start justify-between">
        <div className={cn('rounded-xl p-2.5', iconClass)}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black tabular-nums text-on-surface md:text-3xl">{value}</p>
      {hint ? <p className="mt-2 text-xs text-on-surface-variant">{hint}</p> : null}
    </div>
  )
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

function PageSkeleton() {
  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  )
}

function RiskDistributionPanel({
  data,
  copy
}: {
  data: PricingAnalysisResponse['risk_distribution']
  copy: PricingCopy
}) {
  const total = data.total
  const items = [
    { key: 'Stable' as const, count: data.stable, label: copy.riskStable, color: 'bg-emerald-500' },
    { key: 'Volatile' as const, count: data.volatile, label: copy.riskVolatile, color: 'bg-amber-500' },
    { key: 'Critical' as const, count: data.critical, label: copy.riskCritical, color: 'bg-red-500' }
  ]

  return (
    <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <h2 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
        {copy.riskDistributionTitle}
      </h2>
      <p className="mt-1 text-sm text-on-surface-variant">{copy.riskDistributionSubtitle}</p>

      {total === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
          {copy.chartEmpty}
        </p>
      ) : (
        <>
          <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-surface-container-high">
            {items.map((it) => {
              const pct = (it.count / total) * 100
              if (pct === 0) return null
              return <div key={it.key} className={cn('h-full', it.color)} style={{ width: `${pct}%` }} />
            })}
          </div>
          <ul className="mt-5 space-y-3">
            {items.map((it) => {
              const pct = total > 0 ? Math.round((it.count / total) * 1000) / 10 : 0
              return (
                <li key={it.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm font-bold text-on-surface">
                    <span className={cn('h-2.5 w-2.5 rounded-full', it.color)} aria-hidden />
                    {it.label}
                  </span>
                  <span className="font-mono text-xs text-on-surface-variant">
                    {interpolate(copy.riskShareLabel, { count: it.count, total })} · {pct}%
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}

function PriceTrendChart({
  points,
  tags,
  copy,
  locale
}: {
  points: PricingAnalysisResponse['chart_points']
  tags: string[]
  copy: PricingCopy
  locale: Locale
}) {
  const series = points.map((p) => ({ label: p.month_label, value: p.avg_price_usd ?? 0 }))
  return (
    <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">{copy.chartTitle}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">{copy.chartSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-container-highest px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant ring-1 ring-outline/10"
            >
              {t.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
      {points.length === 0 ? (
        <p className="rounded-xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
          {copy.chartEmpty}
        </p>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="pricingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a40c2" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1a40c2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const parts = v.split('-')
                  return parts.length === 2 ? (parts[1] ?? v) : v
                }}
                minTickGap={16}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => formatUsdCompact(v, locale)}
                width={64}
              />
              <Tooltip
                formatter={(v: number) => [formatUsd(v, locale), copy.chartTitle]}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1a40c2"
                strokeWidth={2}
                fill="url(#pricingTrendGradient)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

function FabricCatalogTable({
  rows,
  copy,
  locale,
  riskLabels
}: {
  rows: PricingAnalysisFabricRow[]
  copy: PricingCopy
  locale: Locale
  riskLabels: Record<PricingRiskLevel, string>
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline/20 p-12 text-center text-sm text-on-surface-variant">
        {copy.noFabricsMatch}
      </p>
    )
  }
  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm dark:border-outline/15">
      <table className="w-full min-w-[52rem] text-left text-sm">
        <thead className="bg-surface-container-low">
          <tr className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
            <th className="px-6 py-4">{copy.colSku}</th>
            <th className="px-6 py-4">{copy.colSupplier}</th>
            <th className="px-6 py-4">{copy.colPrice}</th>
            <th className="px-6 py-4">{copy.colMoq}</th>
            <th className="px-6 py-4">{copy.colMargin}</th>
            <th className="px-6 py-4">{copy.colRisk}</th>
            <th className="px-6 py-4 text-right">{copy.colActions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/10">
          {rows.map((row) => (
            <tr key={row.id} className="transition-colors hover:bg-surface-container-low/60">
              <td className="px-6 py-4 font-mono font-medium text-primary">{row.sku ?? '—'}</td>
              <td className="px-6 py-4 text-on-surface-variant">{row.supplierName ?? '—'}</td>
              <td className="px-6 py-4 font-mono">
                {row.price_usd !== null ? formatUsd(row.price_usd, locale) : '—'}
              </td>
              <td className="px-6 py-4 text-on-surface-variant">{row.moq ?? '—'}</td>
              <td className="px-6 py-4 font-semibold">
                {row.estimated_margin_percent !== null ? `${row.estimated_margin_percent}%` : '—'}
              </td>
              <td className="px-6 py-4">
                <RiskBadge risk={row.risk} labels={riskLabels} />
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={withLocaleUrl(`/admin/fabrics/${row.id}`, locale)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {copy.openFabric}
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OptimizationsList({
  items,
  copy,
  locale
}: {
  items: PricingAnalysisOptimizationItem[]
  copy: PricingCopy
  locale: Locale
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-outline/20 p-6 text-center text-sm text-on-surface-variant">
        {copy.noOptimizations}
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {items.map((o) => (
        <li
          key={o.id}
          className="rounded-xl border border-outline/10 bg-surface-container-low p-4 text-sm transition-colors hover:bg-surface-container-low/80"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide',
                o.tag === 'SUPPLY_CHAIN' &&
                  'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200',
                o.tag === 'MARKET_RISK' && 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200',
                o.tag === 'OPPORTUNITY' &&
                  'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              )}
            >
              {optimizationTagLabel(o.tag, copy)}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {formatRelative(o.created_at, locale)}
            </span>
          </div>
          <p className="mt-2 text-on-surface">{formatPricingOptimizationBody(o, copy)}</p>
        </li>
      ))}
    </ul>
  )
}

export function AdminPricingAnalysisClient() {
  const { locale, messages } = useI18n()
  const p = messages.admin.pricingAnalysisPage
  const q = useAdminPricingAnalysisQuery(messages.admin.loadErrors.pricingAnalysis)

  const [costAdj, setCostAdj] = React.useState(0)
  const [riskFilter, setRiskFilter] = React.useState<RiskFilter>('all')
  const [search, setSearch] = React.useState('')
  const [sortKey, setSortKey] = React.useState<SortKey>('recent')

  const riskLabels: Record<PricingRiskLevel, string> = {
    Stable: p.riskStable,
    Volatile: p.riskVolatile,
    Critical: p.riskCritical
  }

  const filteredRows = React.useMemo<PricingAnalysisFabricRow[]>(() => {
    const all = q.data?.fabrics ?? []
    const needle = search.trim().toLowerCase()
    let out = all.filter((r) => {
      if (riskFilter !== 'all' && r.risk !== riskFilter) return false
      if (needle) {
        const hay = `${r.sku ?? ''} ${r.title ?? ''} ${r.supplierName ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })

    switch (sortKey) {
      case 'priceDesc':
        out = [...out].sort((a, b) => (b.price_usd ?? 0) - (a.price_usd ?? 0))
        break
      case 'priceAsc':
        out = [...out].sort((a, b) => (a.price_usd ?? Number.POSITIVE_INFINITY) - (b.price_usd ?? Number.POSITIVE_INFINITY))
        break
      case 'marginDesc':
        out = [...out].sort((a, b) => (b.estimated_margin_percent ?? 0) - (a.estimated_margin_percent ?? 0))
        break
      case 'marginAsc':
        out = [...out].sort(
          (a, b) =>
            (a.estimated_margin_percent ?? Number.POSITIVE_INFINITY) -
            (b.estimated_margin_percent ?? Number.POSITIVE_INFINITY)
        )
        break
      case 'moqDesc':
        out = [...out].sort((a, b) => (b.moq ?? 0) - (a.moq ?? 0))
        break
      case 'recent':
      default:
        break
    }
    return out
  }, [q.data, riskFilter, search, sortKey])

  const handleExport = React.useCallback(() => {
    if (!q.data || filteredRows.length === 0) {
      toast.error(p.exportCsvEmpty)
      return
    }
    const header = [p.colSku, p.colSupplier, p.colPrice, p.colMoq, p.colMargin, p.colRisk]
    const rows: (string | number)[][] = [header]
    for (const r of filteredRows) {
      rows.push([
        r.sku ?? '',
        r.supplierName ?? '',
        r.price_usd != null ? r.price_usd : '',
        r.moq != null ? r.moq : '',
        r.estimated_margin_percent != null ? `${r.estimated_margin_percent}%` : '',
        r.risk
      ])
    }
    downloadCsv(`pricing-analysis-${Date.now()}.csv`, rows)
    toast.success(p.exportCsvToast)
  }, [filteredRows, p, q.data])

  const handleClearFilters = React.useCallback(() => {
    setRiskFilter('all')
    setSearch('')
    setSortKey('recent')
  }, [])

  if (q.isLoading && !q.data) return <PageSkeleton />

  if (!q.data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-12 text-center">
        <p className="max-w-md text-sm text-on-surface-variant">{p.footerNote}</p>
      </div>
    )
  }

  const d = q.data
  const baselineProfit = d.simulator.projected_gross_profit_usd
  const adjustedProfit = Math.round(baselineProfit * (1 + costAdj / 100))
  const baselineDelta = d.simulator.projected_delta_percent
  const mh = d.market_health
  const viewsDisplay =
    mh.avg_listing_views >= 10 ? mh.avg_listing_views.toFixed(1) : mh.avg_listing_views.toFixed(2)

  const baselineDeltaDisplay =
    baselineDelta == null ? (
      '—'
    ) : (
      <span
        className={
          baselineDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
        }
      >
        {baselineDelta > 0 ? '+' : ''}
        {baselineDelta}%
      </span>
    )

  const riskFilterChips: { key: RiskFilter; label: string }[] = [
    { key: 'all', label: p.filterAll },
    { key: 'Stable', label: p.riskStable },
    { key: 'Volatile', label: p.riskVolatile },
    { key: 'Critical', label: p.riskCritical }
  ]

  const filtersActive = riskFilter !== 'all' || search.length > 0 || sortKey !== 'recent'

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary sm:hidden">
            {p.pageBadge}
          </p>
          <h1 className="mt-1 font-heading text-heading-xl font-extrabold tracking-tight sm:mt-0">{p.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">{p.subtitle}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-outline">
            {interpolate(p.lastSync, { time: formatRelative(d.generated_at, locale) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden rounded-full border border-outline/10 bg-surface-container-highest px-4 py-2 sm:block">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
              {p.pageBadge}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', q.isFetching && 'animate-spin')} aria-hidden />
            {p.refresh}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={handleExport}
            disabled={filteredRows.length === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {p.exportCsv}
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={p.metricsSectionAria}
      >
        <KpiCard
          label={p.kpiProfit}
          value={formatUsdCompact(d.simulator.projected_gross_profit_usd, locale)}
          icon={Wallet}
          iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
        />
        <KpiCard
          label={p.kpiDelta}
          value={baselineDeltaDisplay}
          hint={p.simulatorBaselineDelta}
          icon={TrendingUp}
          iconClass="bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
        />
        <KpiCard
          label={p.kpiCommission}
          value={`${d.assumed_commission_percent}%`}
          icon={Percent}
          iconClass="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        />
        <KpiCard
          label={p.kpiSkus}
          value={d.fabrics.length}
          icon={Layers}
          iconClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
        />
      </section>

      {/* Tabbed content */}
      <Tabs defaultValue="overview" aria-label={p.tabsAria}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">{p.tabOverview}</TabsTrigger>
          <TabsTrigger value="catalog">{p.tabCatalog}</TabsTrigger>
          <TabsTrigger value="signals">{p.tabSignals}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="min-w-0 space-y-6 lg:col-span-8">
              <PriceTrendChart points={d.chart_points} tags={d.series_tags} copy={p} locale={locale} />
              <RiskDistributionPanel data={d.risk_distribution} copy={p} />
            </div>
            <aside className="min-w-0 space-y-6 lg:col-span-4">
              {/* Simulator */}
              <section className="rounded-2xl border border-outline/15 border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 shrink-0 text-primary" aria-hidden />
                  <h2 className="font-heading text-base font-bold text-on-surface">{p.simulatorTitle}</h2>
                </div>
                <p className="mb-4 text-xs text-on-surface-variant">{p.simulatorHint}</p>
                <label
                  className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant"
                  htmlFor="cost-pressure-slider"
                >
                  {interpolate(p.costPressure, { percent: String(costAdj) })}
                </label>
                <input
                  id="cost-pressure-slider"
                  type="range"
                  min={-15}
                  max={15}
                  value={costAdj}
                  onChange={(e) => setCostAdj(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
                <div className="mt-4 space-y-3 rounded-xl bg-surface-container-low p-4">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {p.projectedProfit}
                    </p>
                    <p className="font-heading text-3xl font-black text-on-surface">
                      {formatUsd(adjustedProfit, locale)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-outline/10 pt-3">
                    <span className="text-xs text-on-surface-variant">{p.simulatorAdjustedDelta}</span>
                    <span
                      className={cn(
                        'font-mono text-sm font-bold',
                        costAdj === 0
                          ? 'text-on-surface-variant'
                          : costAdj < 0
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-red-700 dark:text-red-400'
                      )}
                    >
                      {costAdj > 0 ? '+' : ''}
                      {costAdj}%
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-4 w-full gap-2"
                  onClick={() => setCostAdj(0)}
                  disabled={costAdj === 0}
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {p.reset}
                </Button>
              </section>

              {/* Market health card */}
              <div className="relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 to-brand-500">
                <Image src="/og-placeholder.svg" alt="" fill className="object-cover opacity-40" />
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <p className="font-mono text-xs opacity-80">{p.brandMark}</p>
                  <p className="font-heading text-xl font-black">{p.marketHealthTitle}</p>
                  <p className="mt-1 text-sm opacity-90">
                    {interpolate(p.marketHealthSubtitle, {
                      days: String(mh.inventory_turn_proxy_days),
                      views: viewsDisplay
                    })}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="catalog" className="mt-6 space-y-4">
          {/* Filter toolbar */}
          <section
            className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-4 shadow-sm dark:border-outline/15"
            aria-label={p.filtersAria}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {riskFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setRiskFilter(chip.key)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
                      riskFilter === chip.key
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    )}
                    aria-pressed={riskFilter === chip.key}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
                    aria-hidden
                  />
                  <Input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={p.searchPlaceholder}
                    className="pl-9"
                    aria-label={p.searchPlaceholder}
                  />
                </div>
                <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <SelectTrigger className="w-full sm:w-56">
                    <ArrowDownUp className="mr-2 h-4 w-4" aria-hidden />
                    <SelectValue placeholder={p.sortLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">{p.sortRecent}</SelectItem>
                    <SelectItem value="priceDesc">{p.sortPriceDesc}</SelectItem>
                    <SelectItem value="priceAsc">{p.sortPriceAsc}</SelectItem>
                    <SelectItem value="marginDesc">{p.sortMarginDesc}</SelectItem>
                    <SelectItem value="marginAsc">{p.sortMarginAsc}</SelectItem>
                    <SelectItem value="moqDesc">{p.sortMoqDesc}</SelectItem>
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
                    {p.clearFilters}
                  </Button>
                ) : null}
              </div>
            </div>
          </section>

          <FabricCatalogTable rows={filteredRows} copy={p} locale={locale} riskLabels={riskLabels} />
          <p className="text-xs text-on-surface-variant">
            {interpolate(p.commissionHint, { percent: String(d.assumed_commission_percent) })}
          </p>
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          <section className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
                {p.signalsHeading}
              </h2>
            </div>
            <OptimizationsList items={d.optimizations} copy={p} locale={locale} />
          </section>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-on-surface-variant">{p.footerNote}</p>
      {q.isFetching ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" aria-hidden />
        </div>
      ) : null}
    </div>
  )
}
