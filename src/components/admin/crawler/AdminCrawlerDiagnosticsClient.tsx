'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useCrawlerDiagnosticsQuery, useReconcileStaleRuns } from '@/hooks/admin/useAdminCrawler'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

export function AdminCrawlerDiagnosticsClient() {
  const { messages } = useI18n()
  const d = messages.admin.crawlerDiagnostics
  const q = useCrawlerDiagnosticsQuery()
  const reconcile = useReconcileStaleRuns()
  const data = q.data?.success ? q.data.data : null

  if (q.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-2/3 max-w-md animate-pulse rounded-lg bg-surface-container-high" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{d.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{d.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            title={d.reconcileHint}
            disabled={reconcile.isPending}
            onClick={() => reconcile.mutate({ maxAgeMinutes: 120 })}
          >
            {d.reconcileStale}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-full"
            title={d.forceReconcileHint}
            disabled={reconcile.isPending}
            onClick={() => reconcile.mutate({ force: true })}
          >
            {d.forceReconcile}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-full"
            onClick={() => {
              if (!data) return
              const payload = {
                exportedAt: new Date().toISOString(),
                diagnostics: data,
              }
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `tkanmarket-crawler-diagnostics-${new Date().toISOString().slice(0, 10)}.json`
              document.body.appendChild(a)
              a.click()
              a.remove()
              URL.revokeObjectURL(url)
            }}
          >
            {d.exportSnapshot}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => void q.refetch()} disabled={q.isFetching}>
            {d.refresh}
          </Button>
        </div>
      </div>

      {!data.crawlerEnabled ? (
        <div
          className="rounded-2xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          {d.crawlerOff}
        </div>
      ) : null}

      {!data.queueMetricsAvailable ? (
        <div
          className="rounded-2xl border border-sky-500/40 bg-sky-50 px-4 py-3 text-sm text-sky-950 dark:bg-sky-950/30 dark:text-sky-100"
          role="status"
        >
          <p className="font-medium">{d.queueMetricsUnavailableTitle}</p>
          <p className="mt-1 text-sky-900/90 dark:text-sky-100/85">{d.queueMetricsUnavailableHint}</p>
          {data.queueMetricsNote ? (
            <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-black/5 p-2 font-mono text-xs text-sky-950 dark:bg-white/10 dark:text-sky-50">
              {data.queueMetricsNote}
            </pre>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">{d.throughput}</p>
          <p className="mt-3 font-mono text-4xl font-extrabold">
            {data.throughputPerSec}
            <span className="ml-2 text-base font-normal text-on-surface-variant">{d.throughputUnit}</span>
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">{d.saved1h}: {data.db.productsSavedLastHour}</p>
        </div>
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">{d.errorBudget}</p>
          <p className="mt-3 font-mono text-4xl font-extrabold text-red-600 dark:text-red-400">{data.queue.failed}</p>
          <p className="mt-2 text-xs text-on-surface-variant">{d.errorBudgetHint}</p>
        </div>
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">{d.workers}</p>
          <p className="mt-3 font-mono text-4xl font-extrabold">{data.workerConcurrency}</p>
          <p className="mt-2 text-xs text-on-surface-variant">{d.workersHint}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-6">
          <h2 className="font-heading text-lg font-bold">{d.nodeHealth}</h2>
          <ul className="mt-4 space-y-3">
            {data.sourcesSupported.map((src) => (
              <li
                key={src.id}
                className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-3 text-sm',
                  src.enabled ? 'bg-surface-container-lowest' : 'bg-surface-container-lowest/50 opacity-70'
                )}
              >
                <span className="font-medium">{src.label}</span>
                <span className={src.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-outline'}>
                  {src.enabled ? 'ON' : '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] border border-outline/10 bg-surface-container-low p-6">
          <h2 className="font-heading text-lg font-bold">{d.dbSync}</h2>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
              <dt className="text-xs text-outline">{d.totalRuns}</dt>
              <dd className="font-mono text-lg font-bold">{data.db.totalRuns}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
              <dt className="text-xs text-outline">{d.runs24h}</dt>
              <dd className="font-mono text-lg font-bold">{data.db.runsLast24h}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
              <dt className="text-xs text-outline">{d.rawProducts}</dt>
              <dd className="font-mono text-lg font-bold">{data.db.rawProductsCount}</dd>
            </div>
            <div className="rounded-xl bg-surface-container-lowest px-3 py-2">
              <dt className="text-xs text-outline">{d.fabricsRaw}</dt>
              <dd className="font-mono text-lg font-bold">{data.db.fabricsRawScrapedCount}</dd>
            </div>
          </dl>

          <h3 className="mt-8 font-heading text-base font-bold">BullMQ — {messages.admin.sidebar.crawler}</h3>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-outline">{d.queueWaiting}</dt>
              <dd className="font-mono">{data.queue.waiting}</dd>
            </div>
            <div>
              <dt className="text-xs text-outline">{d.queueActive}</dt>
              <dd className="font-mono">{data.queue.active}</dd>
            </div>
            <div>
              <dt className="text-xs text-outline">{d.queueCompleted}</dt>
              <dd className="font-mono">{data.queue.completed}</dd>
            </div>
            <div>
              <dt className="text-xs text-outline">{d.queueFailed}</dt>
              <dd className="font-mono">{data.queue.failed}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-lg font-bold text-on-surface">{d.recentLogTitle}</h2>
            <p className="mt-1 text-sm text-on-surface-variant">{d.recentLogSubtitle}</p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-[2rem] border border-outline/10 bg-inverse-surface shadow-lg">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-brand-500 via-indigo-400 to-brand-600" aria-hidden />
          <div className="max-h-[min(420px,50vh)] overflow-y-auto p-5 font-mono text-xs leading-relaxed text-inverse-on-surface">
            {data.recentIssues.length === 0 ? (
              <p className="text-inverse-on-surface/70">{d.recentLogEmpty}</p>
            ) : (
              <ul className="space-y-4">
                {data.recentIssues.map((row) => (
                  <li key={row.id} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-inverse-on-surface/60">
                      <span>#{row.id}</span>
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 font-bold',
                          row.status === 'FAILED'
                            ? 'bg-red-500/30 text-red-200'
                            : row.status === 'PARTIAL'
                              ? 'bg-amber-500/30 text-amber-100'
                              : 'bg-white/10'
                        )}
                      >
                        {row.status}
                      </span>
                      {row.completedAt ? (
                        <time dateTime={row.completedAt}>{new Date(row.completedAt).toLocaleString()}</time>
                      ) : null}
                      <Link
                        href={`/admin/crawler/history?q=${row.id}`}
                        className="ml-auto text-brand-300 underline-offset-2 hover:underline"
                      >
                        {d.openHistory}
                      </Link>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-inverse-on-surface/90">
                      {row.errorPreview ?? '—'}
                    </pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
