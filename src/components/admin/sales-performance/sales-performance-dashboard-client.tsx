'use client'

import { Download, RefreshCw } from 'lucide-react'
import * as React from 'react'
import { toast } from 'sonner'

import { invPageWrap, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { useAdminSalesPerformanceQuery } from '@/hooks/admin/useAdminSalesPerformanceQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

import { SalesPerformanceChartsSection } from './sales-performance-charts-section'
import { SalesPerformanceDashboardSkeleton, SalesPerformanceErrorPanel } from './sales-performance-dashboard-skeleton'
import { downloadCsv } from './sales-performance-format'
import { SalesPerformanceKpiGrid } from './sales-performance-kpi-grid'
import { SalesPerformanceRepsSection } from './sales-performance-reps-section'
import { SalesPerformanceSourceSection } from './sales-performance-source-section'

export function SalesPerformanceDashboardClient() {
  const { messages, locale } = useI18n()
  const t = messages.admin.salesPerformancePage
  const loadFailedMessage = messages.admin.loadErrors.salesPerformance
  const [days, setDays] = React.useState(30)
  const q = useAdminSalesPerformanceQuery(days)
  const d = q.data

  const revenueSeries = React.useMemo(() => d?.analytics.sparklines.revenue ?? [], [d])
  const trafficVsConv = d?.analytics.trafficVsConversions ?? []
  const topCategories = d?.analytics.topFabricCategories ?? []

  const handleExport = React.useCallback(() => {
    if (!d) {
      toast.error(loadFailedMessage)
      return
    }
    if (d.topRepresentatives.length === 0) {
      toast.error(t.noReps)
      return
    }
    const header = [t.colRep, t.colRegion, t.colGross, t.colDeals, t.colPerformance]
    const rows: (string | number)[][] = [header]
    for (const r of d.topRepresentatives) {
      rows.push([r.name, r.regionLabel, Math.round(r.grossSalesUsd), r.wonDeals, r.performanceBand])
    }
    downloadCsv(`sales-performance-${days}d.csv`, rows)
    toast.success(t.exportCsvToast)
  }, [d, days, loadFailedMessage, t])

  return (
    <div className={invPageWrap()}>
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className={cn('text-3xl font-extrabold tracking-tight md:text-4xl', invText.title)}>{t.title}</h1>
          <p className={cn('mt-2 max-w-2xl text-base', invText.body)}>{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-full border border-outline/10 bg-surface-container-high p-1">
            {(
              [
                { label: t.range1m, value: 30 },
                { label: t.range6m, value: 180 },
                { label: t.range1y, value: 365 }
              ] as const
            ).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setDays(r.value)}
                className={cn(
                  'min-h-[40px] rounded-full px-4 py-2 text-xs font-bold transition-all',
                  days === r.value
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                )}
                aria-pressed={days === r.value}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-10 rounded-full"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', q.isFetching && 'animate-spin')} aria-hidden />
            {t.refresh}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="default"
            className="h-10 rounded-full font-bold"
            onClick={handleExport}
            disabled={!d || d.topRepresentatives.length === 0}
            title={!d ? loadFailedMessage : d.topRepresentatives.length === 0 ? t.noReps : undefined}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden />
            {t.exportCsv}
          </Button>
        </div>
      </header>

      {q.isLoading ? (
        <SalesPerformanceDashboardSkeleton />
      ) : q.isError || !d ? (
        <SalesPerformanceErrorPanel
          message={q.error instanceof Error ? q.error.message : loadFailedMessage}
          onRetry={() => void q.refetch()}
          disabled={q.isFetching}
          refreshLabel={t.refresh}
        />
      ) : (
        <>
          <SalesPerformanceKpiGrid d={d} locale={locale} t={t} />
          <SalesPerformanceChartsSection
            d={d}
            locale={locale}
            t={t}
            revenueSeries={revenueSeries}
            trafficVsConv={trafficVsConv}
            topCategories={topCategories}
          />
          <SalesPerformanceSourceSection d={d} t={t} />
          <SalesPerformanceRepsSection d={d} locale={locale} t={t} />
        </>
      )}
    </div>
  )
}
