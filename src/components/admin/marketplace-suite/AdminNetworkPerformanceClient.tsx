'use client'

import { Activity, Loader2, RefreshCcw, Server } from 'lucide-react'
import Link from 'next/link'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useI18n } from '@/hooks/useI18n'
import { useNetworkPerformanceQuery } from '@/hooks/admin/useNetworkPerformanceQuery'
import { QUEUE_NAMES } from '@/constants'

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500/80" aria-hidden />
        Active
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden />
        Waiting
      </span>
      <span className="inline-flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500/80" aria-hidden />
        Failed
      </span>
    </div>
  )
}

function BarRow({
  label,
  statsLine,
  active,
  waiting,
  failed
}: {
  label: string
  statsLine: string
  active: number
  waiting: number
  failed: number
}) {
  const total = Math.max(1, active + waiting + failed)
  const a = (active / total) * 100
  const w = (waiting / total) * 100
  const f = (failed / total) * 100
  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-2 text-xs font-medium text-on-surface">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 text-on-surface-variant tabular-nums text-[10px] sm:text-xs">{statsLine}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden flex">
        <span className="h-full bg-emerald-500/80" style={{ width: `${a}%` }} />
        <span className="h-full bg-amber-400/80" style={{ width: `${w}%` }} />
        <span className="h-full bg-red-500/80" style={{ width: `${f}%` }} />
      </div>
    </div>
  )
}

function BarRowSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="flex justify-between gap-2">
        <Skeleton className="h-4 w-40 max-w-[55%]" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-[55%] bg-primary/15" />
      </div>
    </div>
  )
}

function ChartBarsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-4 w-56" />
      <div className="h-48 flex items-end gap-1">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 min-w-[4px] rounded-t-sm bg-primary/10"
            style={{ height: `${Math.max(8, (i % 10) * 10)}%` }}
          />
        ))}
      </div>
    </div>
  )
}

export function AdminNetworkPerformanceClient() {
  const { messages } = useI18n()
  const t = messages.admin.networkPerformancePage
  const query = useNetworkPerformanceQuery()
  const d = query.data

  const queueLabel = (name: string): string => {
    if (name === QUEUE_NAMES.CRAWLER) return t.queueCrawler
    if (name === QUEUE_NAMES.AI) return t.queueAi
    if (name === QUEUE_NAMES.IMAGE) return t.queueImage
    if (name === QUEUE_NAMES.SOCIAL) return t.queueSocial
    return name
  }

  const formatQueueStats = (active: number, waiting: number, failed: number) =>
    t.queueStats.replace('{active}', String(active)).replace('{waiting}', String(waiting)).replace('{failed}', String(failed))

  const maxDur =
    d?.crawlerLatency.recent.reduce((m, r) => {
      const v = r.durationMs ?? 0
      return v > m ? v : m
    }, 1) ?? 1

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t.livePolling}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCcw className="h-4 w-4" aria-hidden />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        {query.isLoading && !d ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : d ? (
          <>
            <DashboardStatCardShell tone="blue">
              <p className={dashboardStatLabelClass}>{t.crawlerAvg}</p>
              <p className={cn(dashboardStatValueClass, 'font-heading')}>
                {d.crawlerLatency.avgMs == null ? '—' : `${d.crawlerLatency.avgMs} ms`}
              </p>
            </DashboardStatCardShell>
            <DashboardStatCardShell tone="green">
              <p className={dashboardStatLabelClass}>{t.crawlerP99}</p>
              <p className={cn(dashboardStatValueClass, 'font-heading')}>
                {d.crawlerLatency.p99Ms == null ? '—' : `${d.crawlerLatency.p99Ms} ms`}
              </p>
            </DashboardStatCardShell>
          </>
        ) : null}
      </div>

      {d ? (
        <>
          <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10 space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-lg font-bold font-heading">{t.queuesTitle}</h2>
              </div>
              <Legend />
            </div>
            <div className="space-y-5">
              {Object.entries(d.queues).length === 0 ? (
                <p className="text-sm text-on-surface-variant">No queues found.</p>
              ) : (
                Object.entries(d.queues).map(([name, stats]) => (
                  <BarRow
                    key={name}
                    label={queueLabel(name)}
                    statsLine={formatQueueStats(stats.active, stats.waiting, stats.failed)}
                    active={stats.active}
                    waiting={stats.waiting}
                    failed={stats.failed}
                  />
                ))
              )}
            </div>
            <ButtonLink label={t.openJobQueue} />
          </section>

          <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold font-heading">{t.recentRunsTitle}</h2>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">{t.recentRunsHint}</p>
            <div className="h-48 flex items-end gap-1">
              {d.crawlerLatency.recent.length === 0 ? (
                <p className="text-sm text-on-surface-variant w-full text-center py-12">{t.emptyRuns}</p>
              ) : (
                d.crawlerLatency.recent.map((r) => {
                  const h = r.durationMs == null ? 4 : Math.max(4, (r.durationMs / maxDur) * 100)
                  return (
                    <div
                      key={r.runId}
                      className={cn(
                        'flex-1 min-w-[4px] rounded-t-sm transition-colors bg-primary/20 hover:bg-primary/40',
                        r.durationMs == null && 'opacity-30'
                      )}
                      style={{ height: `${h}%` }}
                      title={`${r.source} · ${r.durationMs ?? '?'} ms`}
                    />
                  )
                })
              )}
            </div>
          </section>
        </>
      ) : query.isLoading ? (
        <>
          <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" aria-hidden />
                <h2 className="text-lg font-bold font-heading">{t.queuesTitle}</h2>
              </div>
              <Legend />
            </div>
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <BarRowSkeleton key={i} />
              ))}
            </div>
          </section>
          <section className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl border border-outline/10">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-bold font-heading">{t.recentRunsTitle}</h2>
            </div>
            <ChartBarsSkeleton />
          </section>
        </>
      ) : null}
    </div>
  )
}

function ButtonLink({ label }: { label: string }) {
  return (
    <div className="pt-2">
      <Button asChild variant="outline" className="rounded-xl">
        <Link href="/admin/job-queue">{label}</Link>
      </Button>
    </div>
  )
}
