'use client'

import { DollarSign, Percent, TrendingDown, TrendingUp, Users, Factory } from 'lucide-react'
import * as React from 'react'

import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'
import { AdvancedAnalyticsSparkline } from './AdvancedAnalyticsSparkline'
import { cn } from '@/lib/utils'

function formatCurrencyUSD(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return `$${Math.round(v).toLocaleString()}`
}

function formatPct(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return `${v.toFixed(2)}%`
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="ml-auto text-xs text-on-surface-variant">—</span>
  const positive = value >= 0
  return (
    <span
      className={cn(
        'ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums',
        positive
          ? 'bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200'
          : 'bg-red-500/12 text-red-800 dark:bg-red-400/15 dark:text-red-200'
      )}
    >
      {positive ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
      <span className="ml-1">{`${value >= 0 ? '+' : ''}${value.toFixed(1)}%`}</span>
    </span>
  )
}

function CardShell({
  children,
  tone
}: {
  children: React.ReactNode
  tone: 'primary' | 'emerald' | 'amber' | 'blue'
}) {
  const toneClasses =
    tone === 'primary'
      ? {
          blob: 'from-primary/20 via-primary/5 to-transparent',
          bar: 'before:via-primary/45 dark:before:via-primary/55',
          hoverLine: 'bg-gradient-to-r from-transparent via-primary/50 to-transparent dark:via-primary/45'
        }
      : tone === 'emerald'
        ? {
            blob: 'from-emerald-500/20 via-emerald-400/5 to-transparent dark:from-emerald-400/15',
            bar: 'before:via-emerald-500/40 dark:before:via-emerald-400/50',
            hoverLine: 'bg-gradient-to-r from-transparent via-emerald-500/45 to-transparent dark:via-emerald-400/40'
          }
        : tone === 'amber'
          ? {
              blob: 'from-amber-500/20 via-amber-400/5 to-transparent dark:from-amber-400/15',
              bar: 'before:via-amber-500/45 dark:before:via-amber-400/55',
              hoverLine: 'bg-gradient-to-r from-transparent via-amber-500/50 to-transparent dark:via-amber-400/45'
            }
          : {
              blob: 'from-blue-500/20 via-blue-400/5 to-transparent dark:from-blue-400/15',
              bar: 'before:via-blue-500/40 dark:before:via-blue-400/50',
              hoverLine: 'bg-gradient-to-r from-transparent via-blue-500/45 to-transparent dark:via-blue-400/40'
            }

  return (
    <div
      className={cn(
        'group relative min-h-[140px] overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 sm:p-7',
        'dark:border-outline/15 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent',
        toneClasses.bar,
        'hover:-translate-y-0.5 hover:border-outline/20 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/40'
      )}
    >
      <div
        className={cn(
          'pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-50 blur-3xl sm:h-44 sm:w-44',
          toneClasses.blob
        )}
        aria-hidden
      />
      <div className="relative">{children}</div>
      <div
        className={cn(
          'relative mt-4 h-px w-full opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          toneClasses.hoverLine
        )}
        aria-hidden
      />
    </div>
  )
}

export function AdvancedAnalyticsStatCards({
  data,
  isLoading
}: {
  data: AdvancedAnalyticsResponse | undefined
  isLoading: boolean
}) {
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="relative min-h-[140px] overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm animate-pulse dark:border-outline/15 sm:p-7"
          >
            <div className="h-12 w-12 rounded-2xl bg-surface-container-high" />
            <div className="mt-6 h-3.5 w-1/2 rounded-full bg-surface-container-high" />
            <div className="mt-3 h-11 w-2/3 rounded-xl bg-surface-container-high" />
            <div className="mt-6 h-10 w-full rounded-md bg-surface-container-high" />
          </div>
        ))}
      </div>
    )
  }

  const { stats, sparklines } = data
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CardShell tone="primary">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
            <DollarSign className="h-6 w-6" aria-hidden />
          </div>
          <DeltaBadge value={stats.revenueGrowthPercent} />
        </div>
        <p className={cn(dashboardStatLabelClass, 'mb-1')}>Total Revenue</p>
        <h3 className={cn(dashboardStatValueClass, '!mt-2 mono-data')}>{formatCurrencyUSD(stats.totalRevenue)}</h3>
        <AdvancedAnalyticsSparkline values={sparklines.revenue.map((x) => x.value)} variant="revenue" />
      </CardShell>

      <CardShell tone="emerald">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/[0.12] text-emerald-700 shadow-sm ring-1 ring-inset ring-black/[0.04] dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-white/[0.06]">
            <Percent className="h-6 w-6" aria-hidden />
          </div>
          <DeltaBadge value={stats.conversionRateGrowthPercent} />
        </div>
        <p className={cn(dashboardStatLabelClass, 'mb-1')}>Conversion Rate</p>
        <h3 className={cn(dashboardStatValueClass, '!mt-2 mono-data')}>{formatPct(stats.conversionRate)}</h3>
        <AdvancedAnalyticsSparkline values={sparklines.conversions.map((x) => x.value)} variant="conversions" />
      </CardShell>

      <CardShell tone="amber">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/[0.14] text-amber-800 shadow-sm ring-1 ring-inset ring-black/[0.04] dark:bg-amber-400/15 dark:text-amber-200 dark:ring-white/[0.06]">
            <Users className="h-6 w-6" aria-hidden />
          </div>
          <DeltaBadge value={stats.newLeadsGrowthPercent} />
        </div>
        <p className={cn(dashboardStatLabelClass, 'mb-1')}>New Leads</p>
        <h3 className={cn(dashboardStatValueClass, '!mt-2 mono-data')}>{stats.newLeads.toLocaleString()}</h3>
        <AdvancedAnalyticsSparkline values={sparklines.traffic.map((x) => x.value)} variant="traffic" />
      </CardShell>

      <CardShell tone="blue">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/[0.12] text-blue-700 shadow-sm ring-1 ring-inset ring-black/[0.04] dark:bg-blue-400/15 dark:text-blue-300 dark:ring-white/[0.06]">
            <Factory className="h-6 w-6" aria-hidden />
          </div>
          <DeltaBadge value={stats.activeSuppliersGrowthPercent} />
        </div>
        <p className={cn(dashboardStatLabelClass, 'mb-1')}>Active Suppliers</p>
        <h3 className={cn(dashboardStatValueClass, '!mt-2 mono-data')}>{stats.activeSuppliers.toLocaleString()}</h3>
        <AdvancedAnalyticsSparkline values={sparklines.activeSuppliers.map((x) => x.value)} variant="suppliers" />
      </CardShell>
    </div>
  )
}

