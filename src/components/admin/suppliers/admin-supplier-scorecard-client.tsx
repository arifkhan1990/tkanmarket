'use client'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { useAdminSupplierScorecardQuery } from '@/hooks/admin/useAdminSupplierSuiteQueries'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

type Props = { variant: 'executive' | 'benchmark' }

export function AdminSupplierScorecardClient({ variant }: Props) {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const q = useAdminSupplierScorecardQuery(variant)

  if (q.isLoading || !q.data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-surface-container-high sm:w-72" />
        <SupplierSuiteSubNav className="mb-0" />
        <div className="animate-pulse space-y-6">
          <div className="h-40 rounded-2xl border border-outline/10 bg-surface-container-high dark:border-outline/15" />
          <div className="h-48 rounded-2xl border border-outline/10 bg-surface-container-high dark:border-outline/15" />
        </div>
      </div>
    )
  }

  const d = q.data
  const snap = d.snapshot

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">
          {variant === 'benchmark' ? m.benchmarkTitle : m.scorecardTitle}
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">{m.scorecardSubtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      <div
        className={cn(
          'grid gap-6',
          variant === 'benchmark' ? 'lg:grid-cols-2' : 'lg:grid-cols-3'
        )}
      >
        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {m.metricQuality}
          </h2>
          <p className="mt-2 font-heading text-4xl font-extrabold text-primary">
            {snap.globalQualityRatePercent.toFixed(1)}%
          </p>
        </section>
        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {m.metricLeadTime}
          </h2>
          <p className="mt-2 font-heading text-4xl font-extrabold">
            {snap.avgInquiryToCloseDays != null ? `${snap.avgInquiryToCloseDays} ${m.days}` : '—'}
          </p>
        </section>
        <section
          className={cn(
            'rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15',
            variant === 'benchmark' ? 'lg:col-span-2' : ''
          )}
        >
          <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {m.breakdownTitle}
          </h2>
          <ul className="mt-4 space-y-3">
            {d.scoreBreakdown.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="text-on-surface-variant">{row.label}</span>
                <span className="font-mono font-semibold text-on-surface">{row.value.toFixed(1)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-outline/10 bg-surface-container-low/40 p-6 dark:border-outline/15">
        <h2 className="font-heading text-lg font-bold">{m.leaderboardTitle}</h2>
        <ol className="mt-4 space-y-2">
          {d.rows.slice(0, 8).map((row, idx) => (
            <li
              key={row.supplierId}
              className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3 text-sm"
            >
              <span className="font-semibold">
                #{idx + 1} {row.name}
              </span>
              <span className="font-mono text-primary">{row.compositeScore.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      </section>

      {q.isError ? (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">
            {q.error instanceof Error ? q.error.message : m.loadError}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => void q.refetch()}>
            {m.retry}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
