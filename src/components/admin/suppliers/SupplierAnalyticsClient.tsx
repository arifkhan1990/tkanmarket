'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { useAdminSupplierAnalytics } from '@/hooks/admin/useAdminSupplierAnalytics'
import { useI18n } from '@/hooks/useI18n'
import { withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn, isRemoteImageSrc } from '@/lib/utils'

function Trend({ value, upLabel, downLabel }: { value: number | null; upLabel: string; downLabel: string }) {
  if (value == null) return <span className="text-xs text-on-surface-variant">—</span>
  const positive = value >= 0
  return (
    <span
      className={cn(
        'text-xs font-mono font-medium px-2 py-0.5 rounded-lg',
        positive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
      )}
    >
      {positive ? '+' : ''}
      {value}% {value >= 0 ? upLabel : downLabel}
    </span>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-outline/10 bg-surface-container-low animate-pulse dark:border-outline/15" />
    </div>
  )
}

export function SupplierAnalyticsClient() {
  const { messages, locale } = useI18n()
  const p = messages.admin.supplierAnalyticsPage
  const query = useAdminSupplierAnalytics()

  const onExport = React.useCallback(() => {
    if (!query.data) return
    const rows: string[][] = []
    rows.push(['Metric', 'Value'])
    const { overview, funnel, categoryShare, leaderboard } = query.data
    rows.push(['Total suppliers', String(overview.totalSuppliers)])
    rows.push(['Verified', String(overview.verifiedSuppliers)])
    rows.push(['Pending verification', String(overview.pendingVerification)])
    rows.push(['Approved fabrics', String(overview.totalApprovedFabrics)])
    rows.push(['Leads last 30d', String(overview.leadsLast30Days)])
    rows.push([])
    rows.push(['Lead status', 'Count'])
    for (const b of funnel.byStatus) {
      rows.push([b.status, String(b.count)])
    }
    rows.push([])
    rows.push(['Category', 'Fabrics'])
    for (const c of categoryShare) {
      rows.push([c.categorySlug, String(c.count)])
    }
    rows.push([])
    rows.push(['Rank', 'Supplier', 'Fabrics', 'Avg score', 'Verified'])
    for (const r of leaderboard) {
      rows.push([String(r.rank), r.name, String(r.approvedFabrics), String(r.avgSocialScore ?? ''), String(r.verified)])
    }
    const csv = rows.map((line) => line.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supplier-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(p.exportStarted)
  }, [query.data, p.exportStarted])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{p.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{p.subtitle}</p>
          <p className="mt-1 text-xs font-medium text-outline">
            {p.period}: {query.data?.overview.periodLabel ?? '—'}
          </p>
        </div>
        <Button type="button" variant="secondary" className="shrink-0 rounded-xl" disabled={!query.data} onClick={onExport}>
          {p.exportCsv}
        </Button>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : p.loadError}
          <Button type="button" variant="outline" size="sm" className="ml-3" onClick={() => void query.refetch()}>
            {p.retry}
          </Button>
        </div>
      ) : null}

      {query.isLoading || !query.data ? <AnalyticsSkeleton /> : null}

      {query.data ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <DashboardStatCardShell tone="blue">
              <p className={dashboardStatLabelClass}>{p.metricSuppliers}</p>
              <p className={cn(dashboardStatValueClass, 'font-mono font-bold')}>{query.data.overview.totalSuppliers}</p>
              <div className="mt-2">
                <Trend value={query.data.overview.suppliersTrendPct} upLabel={p.trendUp} downLabel={p.trendDown} />
              </div>
            </DashboardStatCardShell>
            <DashboardStatCardShell tone="green">
              <p className={dashboardStatLabelClass}>{p.metricVerified}</p>
              <p className={cn(dashboardStatValueClass, 'font-mono font-bold')}>{query.data.overview.verifiedSuppliers}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                {p.metricPending}: {query.data.overview.pendingVerification}
              </p>
            </DashboardStatCardShell>
            <DashboardStatCardShell tone="yellow">
              <p className={dashboardStatLabelClass}>{p.metricFabrics}</p>
              <p className={cn(dashboardStatValueClass, 'font-mono font-bold')}>{query.data.overview.totalApprovedFabrics}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                {p.metricAvgFabrics}: {query.data.overview.avgFabricsPerSupplier}
              </p>
              <div className="mt-2">
                <Trend value={query.data.overview.fabricsTrendPct} upLabel={p.trendUp} downLabel={p.trendDown} />
              </div>
            </DashboardStatCardShell>
            <DashboardStatCardShell tone="red">
              <p className={dashboardStatLabelClass}>{p.metricLeads30}</p>
              <p className={cn(dashboardStatValueClass, 'font-mono font-bold')}>{query.data.overview.leadsLast30Days}</p>
              <div className="mt-2">
                <Trend value={query.data.overview.leadsTrendPct} upLabel={p.trendUp} downLabel={p.trendDown} />
              </div>
            </DashboardStatCardShell>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
              <h2 className="font-heading text-lg font-bold text-on-surface">{p.funnelTitle}</h2>
              <p className="text-sm text-on-surface-variant">{p.funnelSubtitle}</p>
              <ul className="mt-4 space-y-2">
                {query.data.funnel.byStatus.map((b) => (
                  <li key={b.status} className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-sm">
                    <span className="font-medium text-on-surface">{b.status}</span>
                    <span className="font-mono text-on-surface-variant">{b.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
              <h2 className="font-heading text-lg font-bold text-on-surface">{p.categoryTitle}</h2>
              <p className="text-sm text-on-surface-variant">{p.categorySubtitle}</p>
              <ul className="mt-4 space-y-2">
                {query.data.categoryShare.length === 0 ? (
                  <li className="text-sm text-on-surface-variant">—</li>
                ) : (
                  query.data.categoryShare.map((c) => (
                    <li key={c.categorySlug} className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-sm">
                      <span className="font-medium text-on-surface">{c.categorySlug}</span>
                      <span className="font-mono text-on-surface-variant">{c.count}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
            <div className="border-b border-outline/10 px-6 py-4">
              <h2 className="font-heading text-lg font-bold text-on-surface">{p.leaderboardTitle}</h2>
              <p className="text-sm text-on-surface-variant">{p.leaderboardSubtitle}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-surface-container-low/80 text-xs uppercase tracking-wider text-on-surface-variant">
                    <th className="px-6 py-3">{p.colRank}</th>
                    <th className="px-6 py-3">{p.colSupplier}</th>
                    <th className="px-6 py-3">{p.colFabrics}</th>
                    <th className="px-6 py-3">{p.colScore}</th>
                    <th className="px-6 py-3">{p.colVerified}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/10">
                  {query.data.leaderboard.map((r) => (
                    <tr key={r.supplierId} className="hover:bg-surface-container-low/50">
                      <td className="px-6 py-4 font-mono">{r.rank}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                            {r.logoUrl ? (
                              <Image
                                src={r.logoUrl}
                                alt=""
                                fill
                                sizes="36px"
                                className="object-contain"
                                unoptimized={isRemoteImageSrc(r.logoUrl)}
                              />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[10px] font-bold">{r.name.slice(0, 2)}</span>
                            )}
                          </div>
                          <Link
                            href={withLocaleUrl(`/admin/suppliers/${r.supplierId}/edit`, locale)}
                            className="font-semibold text-primary hover:underline"
                          >
                            {r.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">{r.approvedFabrics}</td>
                      <td className="px-6 py-4 font-mono">{r.avgSocialScore ?? '—'}</td>
                      <td className="px-6 py-4">{r.verified ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
