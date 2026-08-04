'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react'
import { useState } from 'react'

import { invTableWrap, invText } from '@/components/admin/inventory-suite/inventory-suite-styles'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAdminInventoryFabricsQuery } from '@/hooks/admin/useAdminInventoryFabricsQuery'
import { useI18n } from '@/hooks/useI18n'
import type { InventoryFabricStatusUi } from '@/types/admin-inventory-insights.types'
import { cn } from '@/lib/utils'

function statusBadge(status: InventoryFabricStatusUi): { className: string; label: string } {
  switch (status) {
    case 'Healthy':
    case 'Optimal':
      return {
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
        label: status
      }
    case 'Critical':
    case 'Reorder':
      return { className: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300', label: status }
    case 'Urgent':
      return {
        className: 'bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
        label: status
      }
    case 'Watchlist':
    case 'Stable':
      return { className: 'bg-surface-container-high text-on-surface', label: status }
    default:
      return { className: 'bg-surface-container-high text-on-surface', label: status }
  }
}

export function InventoryFabricsTableSection({ variant }: { variant: 'health' | 'distribution' }) {
  const { messages } = useI18n()
  const t = messages.admin.inventorySuite
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [pendingQ, setPendingQ] = useState('')
  const limit = variant === 'health' ? 10 : 8
  const fab = useAdminInventoryFabricsQuery({ page, limit, q })

  const from = fab.data?.meta ? (fab.data.meta.page - 1) * fab.data.meta.limit + 1 : 0
  const to = fab.data?.meta
    ? Math.min(fab.data.meta.page * fab.data.meta.limit, fab.data.meta.total)
    : 0

  const items = fab.data?.items ?? []
  const showEmpty = !fab.isLoading && items.length === 0

  return (
    <section className={invTableWrap()}>
      <div className="flex flex-col gap-4 border-b border-outline/10 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className={cn('text-xl font-bold', invText.title)}>{t.masterSku}</h3>
          <p className={cn('mt-1 text-sm', invText.muted)}>{t.masterInventoryHint}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
              aria-hidden
            />
            <Input
              className="pl-9"
              placeholder={t.filterSku}
              value={pendingQ}
              onChange={(e) => setPendingQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setQ(pendingQ)
                  setPage(1)
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            onClick={() => {
              setQ(pendingQ)
              setPage(1)
            }}
          >
            <Filter className="h-4 w-4" aria-hidden />
            {t.filter}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/fabrics">{t.exportCsv}</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {fab.isLoading ? (
          <div className="space-y-2 p-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-surface-container-high" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-surface-container-low">
              <tr>
                <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>
                  {variant === 'health' ? t.skuDetails : t.skuDetails}
                </th>
                <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>{t.category}</th>
                <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>
                  {t.currentStock}
                </th>
                <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>{t.threshold}</th>
                {variant === 'distribution' ? (
                  <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>
                    {t.turnoverRate}
                  </th>
                ) : (
                  <th className={cn('px-6 py-3 text-[10px] font-black uppercase tracking-wider', invText.muted)}>{t.leadTime}</th>
                )}
                <th className={cn('px-6 py-3 text-right text-[10px] font-black uppercase tracking-wider', invText.muted)}>
                  {t.statusColumn}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {showEmpty ? (
                <tr>
                  <td colSpan={6} className={cn('px-6 py-12 text-center text-sm', invText.muted)}>
                    {t.masterSkuEmpty}
                  </td>
                </tr>
              ) : null}
              {items.map((row) => {
                const b = statusBadge(row.status)
                return (
                  <tr key={row.id} className="hover:bg-surface-container-low/80">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-high">
                          {row.imageUrl ? (
                            <Image src={row.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                          ) : null}
                        </div>
                        <div>
                          <p className={cn('font-semibold', invText.title)}>{row.title}</p>
                          <p className="font-mono text-xs text-outline">{row.sku ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className={cn('px-6 py-4 text-sm capitalize', invText.body)}>{row.categoryLabel}</td>
                    <td className={cn('px-6 py-4 font-mono text-sm', invText.body)}>{row.stockLevelNote}</td>
                    <td className="px-6 py-4">
                      {variant === 'distribution' && row.thresholdFillPercent != null ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 max-w-[80px] flex-1 rounded-full bg-surface-container-high">
                            <div
                              className="h-full rounded-full bg-brand-500 dark:bg-brand-400"
                              style={{ width: `${row.thresholdFillPercent}%` }}
                            />
                          </div>
                          <span className={cn('text-xs font-semibold', invText.body)}>{row.thresholdFillPercent}%</span>
                        </div>
                      ) : (
                        <span className={cn('font-mono text-sm', invText.body)}>{row.thresholdNote}</span>
                      )}
                    </td>
                    <td className={cn('px-6 py-4 font-mono text-sm', invText.body)}>
                      {variant === 'distribution' ? row.turnoverNote : row.leadTimeNote}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold', b.className)}>
                        {b.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-col items-center justify-between gap-3 border-t border-outline/10 bg-surface-container-low px-6 py-4 text-xs font-semibold text-on-surface-variant sm:flex-row">
        <span>
          {t.showing
            .replace('{from}', String(from))
            .replace('{to}', String(to))
            .replace('{total}', String(fab.data?.meta?.total ?? 0))}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={page <= 1 || fab.isLoading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            aria-label={t.prev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={fab.isLoading || !fab.data?.meta || page >= (fab.data.meta?.totalPages ?? 1)}
            onClick={() => setPage((p) => p + 1)}
            aria-label={t.next}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}
