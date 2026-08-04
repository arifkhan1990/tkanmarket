'use client'

import { Calendar, Download, FileDown, Info } from 'lucide-react'
import * as React from 'react'

import { AdvancedAnalyticsStatCards } from '@/components/admin/analytics/AdvancedAnalyticsStatCards'
import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { LeadsBySourceChart } from '@/components/admin/charts/LeadsBySourceChart'
import { TopFabricCategoriesChart } from '@/components/admin/charts/TopFabricCategoriesChart'
import { TrafficVsConversionsChart } from '@/components/admin/charts/TrafficVsConversionsChart'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { useMarketplaceAnalyticsQuery } from '@/hooks/admin/useMarketplaceAnalyticsQuery'
import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'
import type { MarketplaceAnalyticsPeriod } from '@/types/marketplace-analytics.types'
import { toast } from 'sonner'

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function MarketplaceAnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <div className="h-10 w-64 rounded-lg bg-surface-container-highest animate-pulse" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-28 rounded-xl bg-surface-container-highest animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-8 rounded-2xl border border-outline/10 animate-pulse">
            <div className="h-4 w-24 rounded bg-surface-container-highest" />
            <div className="mt-4 h-10 w-40 rounded bg-surface-container-highest" />
          </div>
        ))}
      </div>
      <div className="h-[360px] rounded-2xl bg-surface-container-highest animate-pulse" />
    </div>
  )
}

export function AdminMarketplaceAnalyticsClient() {
  const { messages } = useI18n()
  const t = messages.admin.marketplaceAnalyticsSuitePage
  const [period, setPeriod] = React.useState<MarketplaceAnalyticsPeriod>('30d')
  const query = useMarketplaceAnalyticsQuery(period)
  const data = query.data

  const periods = React.useMemo(
    () =>
      [
        { id: '30d' as const, label: t.period30d },
        { id: 'quarter' as const, label: t.periodQuarter },
        { id: 'ytd' as const, label: t.periodYtd }
      ] as const,
    [t]
  )

  const exportJson = (payload: AdvancedAnalyticsResponse) => {
    const wrapped = {
      exportedAt: new Date().toISOString(),
      period: payload.period,
      stats: payload.stats,
      charts: {
        trafficVsConversions: payload.trafficVsConversions,
        leadsBySource: payload.leadsBySource,
        topFabricCategories: payload.topFabricCategories
      }
    }
    downloadText(`marketplace-analytics-${Date.now()}.json`, JSON.stringify(wrapped, null, 2), 'application/json;charset=utf-8')
    toast.success(t.toastJson)
  }

  const exportCsv = (payload: AdvancedAnalyticsResponse) => {
    const header = ['date', 'traffic', 'conversions']
    const rows = payload.trafficVsConversions.map((p) =>
      [p.date, p.traffic, p.conversions].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    )
    const csv = [header.map((v) => `"${v}"`).join(','), ...rows].join('\n')
    downloadText(`marketplace-analytics-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
    toast.success(t.toastCsv)
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-outline/15 bg-background/90 py-4 backdrop-blur">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-on-surface font-heading">{t.title}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{t.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!data}
              onClick={() => data && exportCsv(data)}
            >
              <Download className="h-4 w-4 mr-2" aria-hidden />
              {t.exportCsv}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!data}
              onClick={() => data && exportJson(data)}
            >
              <FileDown className="h-4 w-4 mr-2" aria-hidden />
              {t.exportJson}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] space-y-8 py-6 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1 rounded-xl bg-surface-container-low p-1.5 border border-outline/10">
            {periods.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                  period === p.id
                    ? 'bg-surface-container-lowest text-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container'
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="hidden sm:flex h-6 w-px bg-outline-variant/30 mx-1" />
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant">
              <Calendar className="h-4 w-4" aria-hidden />
              <span>{t.utcBoundaries}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-outline/10 bg-surface-container-lowest text-on-surface-variant transition-colors hover:bg-surface-container"
                    aria-label="About UTC boundaries"
                  >
                    <Info className="h-4 w-4" aria-hidden />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[320px]">
                  We compute periods using UTC day boundaries (00:00–24:00 UTC) so analytics stay consistent across
                  timezones and don’t shift based on the viewer’s local time.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {query.isLoading && !data ? <MarketplaceAnalyticsSkeleton /> : null}

        {data ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 lg:hidden">
              <DashboardStatCardShell tone="green">
                <p className={dashboardStatLabelClass}>{t.statRevenue}</p>
                <p className={cn(dashboardStatValueClass, 'font-heading')}>${Math.round(data.stats.totalRevenue).toLocaleString()}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="yellow">
                <p className={dashboardStatLabelClass}>{t.statLeads}</p>
                <p className={cn(dashboardStatValueClass, 'font-heading')}>{data.stats.newLeads.toLocaleString()}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="blue">
                <p className={dashboardStatLabelClass}>{t.statSuppliers}</p>
                <p className={cn(dashboardStatValueClass, 'font-heading')}>{data.stats.activeSuppliers.toLocaleString()}</p>
              </DashboardStatCardShell>
            </div>

            <AdvancedAnalyticsStatCards data={data} isLoading={query.isLoading} />

            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-outline/10">
              <TrafficVsConversionsChart data={data.trafficVsConversions} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10">
                <LeadsBySourceChart data={data.leadsBySource} />
              </div>
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10">
                <TopFabricCategoriesChart data={data.topFabricCategories} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
