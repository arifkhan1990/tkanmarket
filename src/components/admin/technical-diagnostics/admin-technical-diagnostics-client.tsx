'use client'

import Link from 'next/link'
import { ExternalLink, Loader2 } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { Button } from '@/components/ui/button'
import {
  SystemHealthSummaryCards,
  SystemHealthSummaryCardsSkeleton
} from '@/components/admin/system-health/SystemHealthSummaryCards'
import { useCrawlerDiagnosticsQuery } from '@/hooks/admin/useAdminCrawler'
import { useAdminSystemHealthDashboardQuery } from '@/hooks/admin/useAdminSystemHealthDashboardQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminTechnicalDiagnosticsClient() {
  const { messages } = useI18n()
  const t = messages.admin.technicalDiagnosticsPage
  const d = messages.admin.crawlerDiagnostics
  const health = useAdminSystemHealthDashboardQuery({ range: '24H', level: 'ALL' })
  const crawler = useCrawlerDiagnosticsQuery()
  const cEnv = crawler.data
  const cdata = cEnv && cEnv.success ? cEnv.data : null

  return (
    <div className="mx-auto max-w-[1600px] pb-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{t.title}</h1>
          <p className="mt-2 max-w-2xl text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/system-health-monitor">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              {t.openSystemHealth}
            </Link>
          </Button>
          <Button variant="secondary" className="rounded-full" asChild>
            <Link href="/admin/crawler/diagnostics">
              <ExternalLink className="mr-2 h-4 w-4" aria-hidden />
              {t.openCrawler}
            </Link>
          </Button>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-headline text-xl font-bold text-on-surface">{t.systemSection}</h2>
        {health.isLoading && !health.data ? (
          <SystemHealthSummaryCardsSkeleton />
        ) : health.data ? (
          <SystemHealthSummaryCards data={health.data.core} />
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </section>

      <section className="mt-12 space-y-4">
        <h2 className="font-headline text-xl font-bold text-on-surface">{t.crawlerSection}</h2>
        {crawler.isLoading && !cdata ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
        ) : cdata ? (
          <>
            {cdata.crawlerEnabled === false ? (
              <div
                className="mb-4 rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
                role="status"
              >
                {d.crawlerOff}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <DashboardStatCardShell tone="blue">
                <p className={dashboardStatLabelClass}>{d.throughput}</p>
                <p className={cn(dashboardStatValueClass, 'font-mono text-4xl font-extrabold sm:text-5xl')}>
                  {cdata.throughputPerSec}
                  <span className="ml-2 text-base font-normal text-on-surface-variant">{d.throughputUnit}</span>
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  {d.saved1h}: {cdata.db.productsSavedLastHour}
                </p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="red">
                <p className={dashboardStatLabelClass}>{d.errorBudget}</p>
                <p
                  className={cn(
                    dashboardStatValueClass,
                    'font-mono text-4xl font-extrabold text-red-600 sm:text-5xl dark:text-red-400'
                  )}
                >
                  {cdata.queue.failed}
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">{d.errorBudgetHint}</p>
              </DashboardStatCardShell>
              <DashboardStatCardShell tone="green">
                <p className={dashboardStatLabelClass}>{d.workers}</p>
                <p className={cn(dashboardStatValueClass, 'font-mono text-4xl font-extrabold sm:text-5xl')}>
                  {cdata.workerConcurrency}
                </p>
                <p className="mt-2 text-xs text-on-surface-variant">{d.workersHint}</p>
              </DashboardStatCardShell>
            </div>
          </>
        ) : (
          <p className="text-sm text-on-surface-variant">{d.requestFailed}</p>
        )}
      </section>

      <section className="mt-12 space-y-4">
        <div>
          <h2 className="font-headline text-xl font-bold text-on-surface">{t.consoleSection}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{t.consoleHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/system/logs">{t.openSystemLogs}</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/system/integrations">{t.openIntegrations}</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/system/maintenance">{t.openMaintenance}</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
