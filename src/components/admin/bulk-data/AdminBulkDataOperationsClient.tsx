'use client'

import { useAdminBulkDataOperations } from '@/hooks/admin/useAdminBulkDataOperations'
import { useI18n } from '@/hooks/useI18n'

import { BulkDataOperationsHistorySkeleton, BulkDataOperationsSummarySkeleton } from './bulk-data-operations-skeletons'

export function AdminBulkDataOperationsClient() {
  const { messages } = useI18n()
  const m = messages.admin.bulkDataOperationsPage
  const query = useAdminBulkDataOperations()

  const data = query.data

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
      </header>

      {query.isLoading && !data ? (
        <>
          <BulkDataOperationsSummarySkeleton />
          <BulkDataOperationsHistorySkeleton />
        </>
      ) : null}

      {data ? (
        <>
          <section
            className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-4 shadow-sm sm:p-5 dark:border-outline/15"
            aria-label={m.title}
          >
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-surface-container-low p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {m.metricProcessed24h}
                </p>
                <p className="mt-2 text-2xl font-black text-on-surface">
                  {data.metrics.totalProcessed.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {m.metricSuccessful}
                </p>
                <p className="mt-2 text-2xl font-black text-green-600">
                  {data.metrics.totalSuccessful.toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl bg-surface-container-low p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {m.metricWarnings}
                </p>
                <p className="mt-2 text-2xl font-black text-error">
                  {data.metrics.totalWarnings.toLocaleString()}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">{m.activeImportTitle}</h2>
                  <p className="text-sm text-on-surface-variant">{m.activeImportSubtitle}</p>
                </div>
                {data.runningCount > 0 ? (
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                    {m.runningCount.replace('{count}', String(data.runningCount))}
                  </span>
                ) : (
                  <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                    {m.idle}
                  </span>
                )}
              </div>

              {data.activeRun ? (
                <div className="rounded-xl bg-surface-container-low p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-mono text-sm text-primary">
                      #{data.activeRun.id} • {data.activeRun.source}
                    </p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {data.activeRun.status}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs font-bold uppercase text-on-surface-variant">{m.statProcessed}</p>
                      <p className="mt-1 font-mono">
                        {m.statRows.replace('{count}', data.activeRun.productsFound.toLocaleString())}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-on-surface-variant">{m.statSaved}</p>
                      <p className="mt-1 font-mono text-green-600">
                        {data.activeRun.productsSaved.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase text-on-surface-variant">{m.statErrors}</p>
                      <p className="mt-1 font-mono text-error">
                        {data.activeRun.errorsCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant">{m.noRecentRuns}</p>
              )}
            </div>

            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
              <h2 className="mb-4 text-lg font-bold">{m.recentOperationsTitle}</h2>
              <div className="space-y-3">
                {data.recentHistory.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-xl bg-surface-container-low px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-mono text-xs text-primary">#{run.id}</p>
                      <p className="text-xs text-on-surface-variant">{run.source}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{run.status}</p>
                      <p className="text-[11px] text-on-surface-variant">
                        {m.historySavedLine.replace('{count}', run.productsSaved.toLocaleString())}
                      </p>
                    </div>
                  </div>
                ))}
                {data.recentHistory.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{m.noHistoryYet}</p>
                ) : null}
              </div>
            </div>
          </section>
        </>
      ) : null}

      {!query.isLoading && !data ? (
        <p className="py-10 text-center text-on-surface-variant">{m.emptyEnvironment}</p>
      ) : null}
    </div>
  )
}
