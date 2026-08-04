'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Star } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAdminSupplierReviewStatusMutation, useAdminSupplierReviewsQuery } from '@/hooks/admin/useAdminSupplierReviews'
import { useI18n } from '@/hooks/useI18n'
import { getLocaleFromPathname, withLocaleUrl } from '@/lib/i18n/locale-path'
import { cn } from '@/lib/utils'
import { DEFAULT_LOCALE } from '@/types/i18n.types'
import type { SupplierReviewAdminDto } from '@/types/supplier-ops.types'

const STATUSES = ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'] as const

function statusIntent(s: SupplierReviewAdminDto['status']): 'success' | 'warning' | 'error' | 'default' {
  if (s === 'APPROVED') return 'success'
  if (s === 'FLAGGED') return 'warning'
  if (s === 'REJECTED') return 'error'
  return 'default'
}

function reviewStatusLabel(
  m: {
    reviewsFilterPending: string
    reviewsFilterApproved: string
    reviewsFilterFlagged: string
    reviewsFilterRejected: string
  },
  status: SupplierReviewAdminDto['status']
): string {
  switch (status) {
    case 'PENDING':
      return m.reviewsFilterPending
    case 'APPROVED':
      return m.reviewsFilterApproved
    case 'FLAGGED':
      return m.reviewsFilterFlagged
    case 'REJECTED':
      return m.reviewsFilterRejected
  }
}

function ReviewsTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, rowIdx) => (
        <tr key={`sk-${rowIdx}`} className="border-b border-outline/5">
          <td className="px-4 py-4">
            <div className="h-4 w-36 max-w-full animate-pulse rounded-md bg-surface-container-high" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-16 animate-pulse rounded-md bg-surface-container-high" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-8 animate-pulse rounded-md bg-surface-container-high" />
          </td>
          <td className="max-w-xs px-4 py-4">
            <div className="h-3 w-full animate-pulse rounded-md bg-surface-container-high" />
            <div className="mt-2 h-3 w-[80%] animate-pulse rounded-md bg-surface-container-high" />
          </td>
          <td className="px-4 py-4">
            <div className="h-6 w-20 animate-pulse rounded-full bg-surface-container-high" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 w-24 animate-pulse rounded-md bg-surface-container-high" />
          </td>
          <td className="px-4 py-4 text-right">
            <div className="ml-auto flex max-w-[200px] justify-end gap-1">
              <div className="h-8 w-16 animate-pulse rounded-full bg-surface-container-high" />
              <div className="h-8 w-16 animate-pulse rounded-full bg-surface-container-high" />
            </div>
          </td>
        </tr>
      ))}
    </>
  )
}

export function AdminSupplierReviewsClient() {
  const pathname = usePathname()
  const pathLocale = getLocaleFromPathname(pathname) ?? DEFAULT_LOCALE
  const { locale, messages } = useI18n()
  const m = messages.admin.supplierSuite
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState<(typeof STATUSES)[number] | 'ALL'>('ALL')
  const limit = 15

  React.useEffect(() => {
    setPage(1)
  }, [status])

  const query = useAdminSupplierReviewsQuery({
    page,
    limit,
    status: status === 'ALL' ? undefined : status
  })
  const mutation = useAdminSupplierReviewStatusMutation()

  const bundle = query.data
  const stats = bundle?.data.stats
  const items = bundle?.data.items ?? []
  const meta = bundle?.meta

  const filterLabel = (s: typeof status) => {
    if (s === 'ALL') return m.reviewsFilterAll
    if (s === 'PENDING') return m.reviewsFilterPending
    if (s === 'APPROVED') return m.reviewsFilterApproved
    if (s === 'FLAGGED') return m.reviewsFilterFlagged
    return m.reviewsFilterRejected
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.reviewsPageTitle}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{m.reviewsPageSubtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : m.loadError}
        </div>
      ) : null}

      {query.isLoading || !stats ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <DashboardStatCardShell tone="blue">
            <p className={dashboardStatLabelClass}>{m.reviewsStatTotal}</p>
            <p className={cn(dashboardStatValueClass, 'font-mono')}>{stats.totalReviews.toLocaleString()}</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="yellow">
            <p className={dashboardStatLabelClass}>{m.reviewsStatPending}</p>
            <p className={cn(dashboardStatValueClass, 'font-mono text-amber-800 dark:text-amber-200')}>
              {stats.pendingCount.toLocaleString()}
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="red">
            <p className={dashboardStatLabelClass}>{m.reviewsStatFlagged}</p>
            <p className={cn(dashboardStatValueClass, 'font-mono')}>{stats.flaggedCount.toLocaleString()}</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="green">
            <p className={dashboardStatLabelClass}>{m.reviewsStatAvg}</p>
            <p className={cn(dashboardStatValueClass, 'flex items-center gap-2 font-mono')}>
              <Star className="h-7 w-7 shrink-0 text-amber-500" aria-hidden />
              {stats.averageRating != null ? stats.averageRating.toFixed(1) : '—'}
            </p>
          </DashboardStatCardShell>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['ALL', ...STATUSES] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              status === s
                ? 'bg-primary text-on-primary shadow-sm'
                : 'border border-outline/15 bg-surface-container-low text-on-surface-variant hover:border-outline/25'
            )}
          >
            {filterLabel(s)}
          </button>
        ))}
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[900px] text-left text-sm"
            aria-busy={!bundle && (query.isLoading || query.isFetching)}
          >
            <thead>
              <tr className="border-b border-outline/10 bg-surface-container-low/80 text-[11px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-4 py-3">{m.reviewsColSupplier}</th>
                <th className="px-4 py-3">{m.reviewsColSku}</th>
                <th className="px-4 py-3">{m.reviewsColRating}</th>
                <th className="px-4 py-3">{m.reviewsColExcerpt}</th>
                <th className="px-4 py-3">{m.reviewsColStatus}</th>
                <th className="px-4 py-3">{m.reviewsColUpdated}</th>
                <th className="px-4 py-3 text-right">{m.reviewsColActions}</th>
              </tr>
            </thead>
            <tbody>
              {!bundle && (query.isLoading || query.isFetching) ? (
                <ReviewsTableSkeleton />
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant">
                    {m.reviewsEmpty}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b border-outline/5 hover:bg-surface-container-low/40">
                    <td className="px-4 py-4">
                      <Link
                        className="font-semibold text-primary hover:underline"
                        href={withLocaleUrl(`/admin/suppliers/${row.supplierId}/edit`, pathLocale)}
                      >
                        {row.supplierName}
                      </Link>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{row.skuSnapshot ?? '—'}</td>
                    <td className="px-4 py-4 font-mono">{row.rating}</td>
                    <td className="max-w-xs px-4 py-4 text-on-surface-variant line-clamp-2">{row.body}</td>
                    <td className="px-4 py-4">
                      <Badge intent={statusIntent(row.status)}>{reviewStatusLabel(m, row.status)}</Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-on-surface-variant">
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(row.updatedAt))}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        {row.status !== 'APPROVED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-xs"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: row.id, status: 'APPROVED' })}
                          >
                            {m.reviewsApprove}
                          </Button>
                        ) : null}
                        {row.status !== 'REJECTED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-xs"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: row.id, status: 'REJECTED' })}
                          >
                            {m.reviewsReject}
                          </Button>
                        ) : null}
                        {row.status !== 'FLAGGED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-full text-xs"
                            disabled={mutation.isPending}
                            onClick={() => mutation.mutate({ id: row.id, status: 'FLAGGED', flag_reason: 'moderation' })}
                          >
                            {m.reviewsFlag}
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-outline/10 px-4 py-3">
            <p className="text-xs text-on-surface-variant">
              {m.paginationStatus
                .replace('{page}', String(meta.page))
                .replace('{totalPages}', String(meta.totalPages))
                .replace('{total}', String(meta.total))}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {m.prev}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {m.next}
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
