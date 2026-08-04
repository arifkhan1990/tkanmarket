'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, Download, Eye, Filter, Megaphone, Percent, TrendingUp, UserPlus } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PromotionAnalyticsSkeleton } from '@/components/admin/promotion-analytics/promotion-analytics-skeleton'
import { useMarketplaceAnalyticsQuery } from '@/hooks/admin/useMarketplaceAnalyticsQuery'
import { usePromotionAnalyticsQuery } from '@/hooks/admin/usePromotionAnalyticsQuery'
import { usePromotionManagerQuery } from '@/hooks/admin/usePromotionManagerQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export type PromotionAnalyticsClientVariant = 'standalone' | 'embedded'

export function PromotionAnalyticsClient({
  variant = 'standalone',
  onOpenOperationsTab
}: {
  variant?: PromotionAnalyticsClientVariant
  /** When set (embedded hub), planner CTA switches parent tab instead of navigating. */
  onOpenOperationsTab?: () => void
}) {
  const { messages } = useI18n()
  const p = messages.admin.promotionAnalyticsPage
  const isEmbedded = variant === 'embedded'
  const plannerHref = '/admin/promotion-manager'
  const promo = usePromotionManagerQuery()
  const market = useMarketplaceAnalyticsQuery('30d')
  const weeklySocial = usePromotionAnalyticsQuery()
  const [chartMode, setChartMode] = useState<'daily' | 'weekly'>('daily')

  const stats = promo.data?.stats
  const campaigns = promo.data?.campaigns ?? []
  const mstats = market.data?.stats
  const topCats = market.data?.topFabricCategories ?? []

  const chartBars = useMemo(() => {
    const traffic = market.data?.trafficVsConversions ?? []
    const slice = chartMode === 'daily' ? traffic.slice(-14) : traffic.filter((_, i) => i % 7 === 0).slice(-8)
    const maxT = Math.max(1, ...slice.map((x) => x.traffic))
    return slice.map((point) => ({
      label: point.date.slice(5),
      pct: Math.round((point.traffic / maxT) * 100)
    }))
  }, [chartMode, market.data?.trafficVsConversions])

  const weeklyChartData = useMemo(() => {
    const series = weeklySocial.data?.series ?? []
    return series.map((row) => ({
      week: row.weekStart.slice(5),
      reach: row.reach,
      clicks: row.linkClicks
    }))
  }, [weeklySocial.data?.series])

  const exportJson = () => {
    const payload = { promotion: promo.data, marketplace: market.data }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `promotion-analytics-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const loading = promo.isLoading || market.isLoading
  const wd = weeklySocial.data

  const shellClass = isEmbedded ? 'space-y-8' : 'mx-auto max-w-[1600px] space-y-8 pb-10'

  return (
    <div className={shellClass}>
      {isEmbedded ? null : (
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">{p.title}</h1>
          <p className="mt-1 text-on-surface-variant">{p.subtitle}</p>
        </div>
      )}

      {loading ? (
        <PromotionAnalyticsSkeleton aria-label={p.loading} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={p.cardCtr}
              value={stats ? `${stats.avgCtrPercent.toFixed(2)}%` : '—'}
              delta={stats?.ctrDeltaPercent}
              icon={Megaphone}
            />
            <StatCard
              label={p.cardLeads}
              value={mstats ? String(mstats.newLeads) : '—'}
              delta={mstats?.newLeadsGrowthPercent}
              icon={UserPlus}
            />
            <StatCard
              label={p.cardImpressions}
              value={stats ? String(stats.dailyImpressions) : '—'}
              delta={stats?.impressionsDeltaPercent}
              icon={Eye}
            />
            <StatCard
              label={p.cardConv}
              value={mstats ? `${(mstats.conversionRate * 100).toFixed(2)}%` : '—'}
              delta={mstats?.conversionRateGrowthPercent}
              icon={Percent}
            />
          </div>

          {weeklySocial.isLoading && !wd ? (
            <div className="h-48 rounded-2xl bg-surface-container-highest animate-pulse" aria-hidden />
          ) : wd ? (
            <section className="space-y-6 rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
              <div>
                <h2 className="font-heading text-lg font-bold text-on-surface">{p.weeklySocialTitle}</h2>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {p.weeklySocialSubtitle.replace('{period}', wd.periodLabel)}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-outline/10 bg-surface-container-low p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{p.weeklyCardReach}</p>
                  <p className="mt-2 font-heading text-2xl font-extrabold text-on-surface">{wd.totals.reach.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-outline/10 bg-surface-container-low p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{p.weeklyCardClicks}</p>
                  <p className="mt-2 font-heading text-2xl font-extrabold text-on-surface">{wd.totals.clicks.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-outline/10 bg-surface-container-low p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{p.weeklyCardPosts}</p>
                  <p className="mt-2 font-heading text-2xl font-extrabold text-on-surface">{wd.totals.posts.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <h3 className="mb-4 font-heading text-sm font-bold text-on-surface">{p.weeklyBarTitle}</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-outline/20" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="reach" name={p.chartSeriesReach} fill="#1a40c2" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="clicks" name={p.chartSeriesClicks} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          ) : null}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-heading text-lg font-bold text-on-surface">{p.chartTitle}</h3>
                  <p className="text-sm text-on-surface-variant">{p.chartHint}</p>
                </div>
                <div className="flex gap-1 rounded-lg bg-surface-container-low p-1">
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-bold',
                      chartMode === 'daily' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'
                    )}
                    onClick={() => setChartMode('daily')}
                  >
                    {p.daily}
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-bold',
                      chartMode === 'weekly' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'
                    )}
                    onClick={() => setChartMode('weekly')}
                  >
                    {p.weekly}
                  </button>
                </div>
              </div>
              <div className="flex h-[240px] items-end justify-between gap-1 px-1">
                {chartBars.map((b) => (
                  <div key={b.label} className="flex w-[8%] max-w-[40px] flex-1 flex-col items-center gap-2">
                    <div className="relative h-[180px] w-full rounded-t-md bg-primary/15">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md bg-primary transition-all"
                        style={{ height: `${b.pct}%` }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-on-surface-variant">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
              <h3 className="mb-4 font-heading text-lg font-bold text-on-surface">{p.topCategories}</h3>
              <div className="space-y-4">
                {topCats.slice(0, 5).map((c) => {
                  const max = Math.max(1, ...topCats.map((x) => x.count))
                  const w = Math.round((c.count / max) * 100)
                  return (
                    <div key={c.category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-on-surface">{c.category}</span>
                        <span className="font-mono font-bold text-primary">{c.count}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Button asChild variant="link" className="mt-6 h-auto px-0 font-bold text-primary">
                <Link href="/admin/advanced-analytics" className="inline-flex items-center gap-1">
                  {p.fullReport}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline/10 bg-surface-container-lowest shadow-sm">
            <div className="flex flex-col gap-3 border-b border-outline/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <h3 className="font-heading text-lg font-bold text-on-surface">{p.tableTitle}</h3>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="rounded-lg" disabled>
                  <Filter className="mr-2 h-4 w-4" aria-hidden />
                  {p.filter}
                </Button>
                <Button type="button" size="sm" className="rounded-lg" onClick={exportJson}>
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  {p.exportCsv}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-surface-container-low/80 hover:bg-surface-container-low/80">
                    <TableHead className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colCampaign}</TableHead>
                    <TableHead className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colType}</TableHead>
                    <TableHead className="text-right text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colImpressions}</TableHead>
                    <TableHead className="text-right text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colCtr}</TableHead>
                    <TableHead className="text-right text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colLeads}</TableHead>
                    <TableHead className="text-center text-xs font-extrabold uppercase tracking-widest text-on-surface-variant">{p.colStatus}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((c) => {
                    const reach = c.reach ?? 0
                    const clicks = c.linkClicks ?? 0
                    const ctr = reach > 0 ? ((clicks / reach) * 100).toFixed(2) : '0.00'
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-bold text-on-surface">{c.fabricTitle}</div>
                          <div className="text-xs text-on-surface-variant">#{c.fabricId}</div>
                        </TableCell>
                        <TableCell>
                          <span className="rounded-md bg-surface-container-high px-2 py-1 text-xs font-bold text-on-surface-variant">{c.platform}</span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{reach.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-emerald-700 dark:text-emerald-400">{ctr}%</TableCell>
                        <TableCell className="text-right font-mono text-sm">{clicks.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {c.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl bg-indigo-900 p-8 text-white">
              <div className="relative z-10 max-w-md">
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-indigo-200">{p.spotlight}</span>
                <h4 className="font-heading text-2xl font-extrabold leading-tight">{p.spotlightTitle}</h4>
                <p className="mb-6 mt-3 text-sm text-indigo-100/90">{p.spotlightBody}</p>
                <Button asChild variant="secondary" className="rounded-xl font-bold text-indigo-900">
                  <Link href="/admin/social">{p.spotlightCta}</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {isEmbedded && onOpenOperationsTab ? (
                <button
                  type="button"
                  onClick={onOpenOperationsTab}
                  className="flex w-full min-h-[44px] items-center justify-between rounded-2xl border border-outline/10 bg-surface-container-high p-6 text-left transition-colors hover:bg-surface-container-highest"
                >
                  <div>
                    <h5 className="font-heading text-lg font-bold text-on-surface">{p.plannerTitle}</h5>
                    <p className="text-sm text-on-surface-variant">{p.plannerHint}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <TrendingUp className="h-5 w-5" aria-hidden />
                  </div>
                </button>
              ) : (
                <Link
                  href={plannerHref}
                  className="flex items-center justify-between rounded-2xl border border-outline/10 bg-surface-container-high p-6 transition-colors hover:bg-surface-container-highest"
                >
                  <div>
                    <h5 className="font-heading text-lg font-bold text-on-surface">{p.plannerTitle}</h5>
                    <p className="text-sm text-on-surface-variant">{p.plannerHint}</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <TrendingUp className="h-5 w-5" aria-hidden />
                  </div>
                </Link>
              )}
              <Link
                href="/admin/social"
                className="flex items-center justify-between rounded-2xl border border-indigo-200/50 bg-indigo-50 p-6 transition-colors hover:bg-indigo-100 dark:border-indigo-900/40 dark:bg-indigo-950/40"
              >
                <div>
                  <h5 className="font-heading text-lg font-bold text-indigo-950 dark:text-indigo-100">{p.creativeTitle}</h5>
                  <p className="text-sm text-indigo-800/80 dark:text-indigo-200/80">{p.creativeHint}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg">
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon
}: {
  label: string
  value: string
  delta: number | null | undefined
  icon: LucideIcon
}) {
  const positive = delta != null && delta >= 0
  return (
    <div className="rounded-xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
        <span className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="font-heading text-3xl font-extrabold text-on-surface">{value}</span>
        {delta != null && (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-bold',
              positive ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100' : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-100'
            )}
          >
            {positive ? '+' : ''}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-[55%] rounded-full bg-primary" />
      </div>
    </div>
  )
}
