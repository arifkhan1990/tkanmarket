'use client'

import * as React from 'react'
import Image from 'next/image'
import { Search } from 'lucide-react'

import { SupplierSuiteSubNav } from '@/components/admin/suppliers/supplier-suite-subnav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminSupplierBulkOrderPayoutsQuery } from '@/hooks/admin/useAdminSupplierSuiteQueries'
import { useI18n } from '@/hooks/useI18n'
import { isRemoteImageSrc } from '@/lib/utils'
import { cn } from '@/lib/utils'

function useDebouncedValue(value: string, ms: number) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms)
    return () => window.clearTimeout(t)
  }, [value, ms])
  return v
}

export function AdminSupplierPayoutsClient({ variant = 'payouts' }: { variant?: 'payouts' | 'withdrawals' }) {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const title = variant === 'withdrawals' ? m.withdrawalsPageTitle : m.payoutsTitle
  const subtitle = variant === 'withdrawals' ? m.withdrawalsPageSubtitle : m.payoutsSubtitle
  const [page, setPage] = React.useState(1)
  const [q, setQ] = React.useState('')
  const debouncedQ = useDebouncedValue(q, 320)
  const limit = 15

  React.useEffect(() => {
    setPage(1)
  }, [debouncedQ])

  const query = useAdminSupplierBulkOrderPayoutsQuery({ page, limit, q: debouncedQ })

  const summary = query.data?.summary
  const items = query.data?.items ?? []
  const meta = query.data?.meta

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      </div>

      <SupplierSuiteSubNav className="mb-0" />

      {query.isLoading || !summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-container-high" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
            <p className="text-sm text-on-surface-variant">{m.payoutPending}</p>
            <p className="mt-2 font-mono text-2xl font-black">${summary.pendingUsd}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{m.payoutLive}</p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
            <p className="text-sm text-on-surface-variant">{m.payoutCompletedMtd}</p>
            <p className="mt-2 font-mono text-2xl font-black">${summary.completedMtdUsd}</p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-6 shadow-sm dark:border-outline/15">
            <p className="text-sm text-on-surface-variant">{m.payoutOnHold}</p>
            <p className="mt-2 font-mono text-2xl font-black text-destructive">{summary.onHoldCount}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm dark:border-outline/15">
            <p className="text-sm text-on-surface-variant">{m.payoutCommission}</p>
            <p className="mt-2 font-mono text-xl font-bold">{summary.assumedCommissionPercent.toFixed(1)}%</p>
            <p className="mt-1 text-[11px] text-on-surface-variant">{summary.nextScheduledNote}</p>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" aria-hidden />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={m.payoutSearchPlaceholder}
          className="rounded-xl border-none bg-surface-container-highest pl-10"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm dark:border-outline/15">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-outline/10 bg-surface-container-low/80 text-[11px] uppercase tracking-widest text-on-surface-variant">
                <th className="px-6 py-4">{m.colSupplier}</th>
                <th className="px-4 py-4">{m.colSupplierShare}</th>
                <th className="px-4 py-4">{m.colCommission}</th>
                <th className="px-4 py-4">{m.colOrderRef}</th>
                <th className="px-4 py-4">{m.colStatus}</th>
              </tr>
            </thead>
            <tbody>
              {query.isFetching && !query.data ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    {m.loading}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    {m.payoutEmpty}
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-b border-outline/5 hover:bg-surface-container-low/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
                          {row.logoUrl ? (
                            <Image
                              src={row.logoUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized={isRemoteImageSrc(row.logoUrl)}
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-bold">
                              {row.supplierName.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{row.supplierName}</div>
                          <div className="text-xs text-on-surface-variant">
                            {row.country}
                            {row.city ? ` · ${row.city}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono font-semibold">
                      {row.supplierShareUsd != null ? `$${row.supplierShareUsd}` : '—'}
                    </td>
                    <td className="px-4 py-4 text-xs text-on-surface-variant">
                      {row.commissionUsd != null ? `$${row.commissionUsd}` : '—'}
                      <span className="ml-1 text-[10px]">({row.commissionPercent.toFixed(1)}%)</span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{row.orderReference}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase',
                          row.payoutStatus === 'completed' && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
                          row.payoutStatus === 'processing' && 'bg-secondary-container/80 text-on-secondary-container',
                          row.payoutStatus === 'on_hold' && 'bg-destructive/15 text-destructive'
                        )}
                      >
                        {row.payoutStatus === 'completed'
                          ? m.statusCompleted
                          : row.payoutStatus === 'on_hold'
                            ? m.statusOnHold
                            : m.statusProcessing}
                      </span>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
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

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {query.error instanceof Error ? query.error.message : m.loadError}
        </div>
      ) : null}
    </div>
  )
}
