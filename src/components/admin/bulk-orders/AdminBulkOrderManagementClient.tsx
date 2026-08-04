'use client'
import * as React from 'react'
import Link from 'next/link'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { useAdminBulkOrdersBulkStatusMutation, useAdminBulkOrdersQuery } from '@/hooks/admin/useAdminBulkOrders'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { AdminBulkOrderRow, BulkOrderStatus } from '@/types/admin-bulk-orders.types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'

import { BulkOrderMetricsSkeleton, BulkOrderTableSkeleton } from './bulk-order-management-skeletons'
import { BulkOrderStatusBadge } from './bulk-order-status-badge'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const a = parts[0]?.[0] ?? '?'
  const b = parts[1]?.[0] ?? ''
  return (a + b).toUpperCase()
}

export function AdminBulkOrderManagementClient() {
  const { messages } = useI18n()
  const m = messages.admin.bulkOrderManagementPage
  const statusLabels: Record<BulkOrderStatus, string> = {
    PROCESSING: m.statusProcessing,
    IN_TRANSIT: m.statusInTransit,
    DELIVERED: m.statusDelivered,
    ON_HOLD: m.statusOnHold
  }

  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [statusFilter, setStatusFilter] = React.useState<BulkOrderStatus | ''>('')
  const [tierFilter, setTierFilter] = React.useState<string>('')
  const [dateFrom, setDateFrom] = React.useState('')
  const [dateTo, setDateTo] = React.useState('')
  const [q, setQ] = React.useState('')
  const [selected, setSelected] = React.useState<Set<number>>(() => new Set())

  const query = useAdminBulkOrdersQuery({
    page,
    limit,
    status: statusFilter || undefined,
    supplierTier: tierFilter ? (tierFilter as 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD') : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    q: q.trim() ? q.trim() : undefined
  })

  const bulkStatus = useAdminBulkOrdersBulkStatusMutation()

  const payload = query.data?.data
  const items = payload?.items ?? []
  const metrics = payload?.metrics
  const meta = query.data?.meta

  const toggle = (id: number, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(items.map((r) => r.id)))
  }

  const exportCsv = () => {
    const rows = items.length ? items : []
    const header = [m.csvOrderId, m.csvBuyer, m.csvSupplier, m.csvTotalMeters, m.csvStatus, m.csvOrderedAt]
    const lines = [
      header.join(','),
      ...rows.map((r: AdminBulkOrderRow) =>
        [
          r.orderReference,
          `"${r.buyerCompanyName.replace(/"/g, '""')}"`,
          `"${r.supplierName.replace(/"/g, '""')}"`,
          r.totalMeters,
          r.status,
          r.orderedAt
        ].join(',')
      )
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bulk-orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const applyBulkStatus = (status: BulkOrderStatus) => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    bulkStatus.mutate({ ids, status })
    setSelected(new Set())
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={exportCsv}>
            {m.exportCsv}
          </Button>
          <Button type="button" className="bg-brand-600 hover:bg-brand-700 text-white" asChild>
            <Link href="/admin/leads">{m.manualEntry}</Link>
          </Button>
        </div>
      </header>

      {query.isLoading && !metrics ? <BulkOrderMetricsSkeleton /> : null}

      {metrics ? (
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCardShell tone="blue">
            <p className={dashboardStatLabelClass}>{m.metricDailyVolume}</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>
              {metrics.dailyVolumeMeters.toLocaleString(undefined, { maximumFractionDigits: 0 })}{' '}
              <span className="text-sm font-normal text-on-surface-variant">{m.metersUnit}</span>
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="yellow">
            <p className={dashboardStatLabelClass}>{m.metricInTransit}</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>
              {m.ordersCount.replace('{count}', String(metrics.inTransitOrders))}
            </p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="red">
            <p className={dashboardStatLabelClass}>{m.metricFlagged}</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{metrics.flaggedOrders}</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="green">
            <p className={dashboardStatLabelClass}>{m.metricPendingSettlement}</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>
              ${metrics.pendingSettlementUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </DashboardStatCardShell>
        </section>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-2xl border border-outline/15 bg-surface-container-low p-4">
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold uppercase text-on-surface-variant">
          {m.filterOrderStatus}
          <select
            className="rounded-xl border border-outline/15 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter((e.target.value as BulkOrderStatus) || '')
            }}
          >
            <option value="">{m.filterAllStatuses}</option>
            <option value="PROCESSING">{m.statusProcessing}</option>
            <option value="IN_TRANSIT">{m.statusInTransit}</option>
            <option value="DELIVERED">{m.statusDelivered}</option>
            <option value="ON_HOLD">{m.statusOnHold}</option>
          </select>
        </label>
        <label className="flex min-w-[140px] flex-col gap-1 text-xs font-semibold uppercase text-on-surface-variant">
          {m.filterDateFrom}
          <input
            type="date"
            className="rounded-xl border border-outline/15 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            value={dateFrom}
            onChange={(e) => {
              setPage(1)
              setDateFrom(e.target.value)
            }}
          />
        </label>
        <label className="flex min-w-[140px] flex-col gap-1 text-xs font-semibold uppercase text-on-surface-variant">
          {m.filterDateTo}
          <input
            type="date"
            className="rounded-xl border border-outline/15 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            value={dateTo}
            onChange={(e) => {
              setPage(1)
              setDateTo(e.target.value)
            }}
          />
        </label>
        <label className="flex min-w-[160px] flex-col gap-1 text-xs font-semibold uppercase text-on-surface-variant">
          {m.filterSupplierTier}
          <select
            className="rounded-xl border border-outline/15 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            value={tierFilter}
            onChange={(e) => {
              setPage(1)
              setTierFilter(e.target.value)
            }}
          >
            <option value="">{m.filterAnyTier}</option>
            <option value="PLATINUM">{m.tierPlatinum}</option>
            <option value="GOLD">{m.tierGold}</option>
            <option value="SILVER">{m.tierSilver}</option>
            <option value="STANDARD">{m.tierStandard}</option>
          </select>
        </label>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1">
          <span className="text-xs font-semibold uppercase text-on-surface-variant">{m.filterSearch}</span>
          <input
            className="rounded-xl border border-outline/15 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface"
            placeholder={m.filterSearchPlaceholder}
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0"
          onClick={() => {
            setPage(1)
            void query.refetch()
          }}
        >
          {m.applyFilters}
        </Button>
      </div>

      {selected.size > 0 ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-600 px-4 py-3 text-white md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-medium">{m.bulkSelected.replace('{count}', String(selected.size))}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25"
              onClick={() => applyBulkStatus('PROCESSING')}
              disabled={bulkStatus.isPending}
            >
              {m.actionMarkProcessing}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/15 text-white hover:bg-white/25"
              onClick={() => applyBulkStatus('IN_TRANSIT')}
              disabled={bulkStatus.isPending}
            >
              {m.actionInTransit}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-red-200 bg-red-600 text-white hover:bg-red-700"
              onClick={() => applyBulkStatus('ON_HOLD')}
              disabled={bulkStatus.isPending}
            >
              {m.actionPutOnHold}
            </Button>
          </div>
        </div>
      ) : null}

      {query.isLoading && !payload ? <BulkOrderTableSkeleton /> : null}

      {!query.isLoading && items.length === 0 ? (
        <div className="rounded-2xl border border-outline/15 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
          {m.emptyState}
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-outline/15 bg-surface-container-low">
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={items.length > 0 && selected.size === items.length}
                      onCheckedChange={(c) => toggleAll(c === true)}
                      aria-label={m.selectAllAria}
                    />
                  </th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">{m.colOrderId}</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">{m.colBuyer}</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">{m.colSupplier}</th>
                  <th className="px-4 py-3 text-right font-semibold text-on-surface-variant">{m.colMeters}</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">{m.colStatus}</th>
                  <th className="px-4 py-3 font-semibold text-on-surface-variant">{m.colDate}</th>
                  <th className="w-10 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {items.map((row: AdminBulkOrderRow) => (
                  <tr key={row.id} className="hover:bg-surface-container-low/80">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(row.id)}
                        onCheckedChange={(c) => toggle(row.id, c === true)}
                        aria-label={m.selectRowAria.replace('{reference}', row.orderReference)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-brand-700">{row.orderReference}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-800">
                          {initials(row.buyerCompanyName)}
                        </span>
                        <span className="font-medium text-on-surface">{row.buyerCompanyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{row.supplierName}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.totalMeters.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <BulkOrderStatusBadge status={row.status} labels={statusLabels} />
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {new Date(row.orderedAt).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => bulkStatus.mutate({ ids: [row.id], status: 'PROCESSING' })}>
                            {m.actionMarkProcessing}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => bulkStatus.mutate({ ids: [row.id], status: 'DELIVERED' })}>
                            {m.actionMarkDelivered}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => bulkStatus.mutate({ ids: [row.id], status: 'ON_HOLD' })}>
                            {m.actionPutOnHold}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-outline/15 bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-on-surface-variant">
              {m.paginationShowing
                .replace('{from}', String((meta?.page ?? 1) * limit - limit + 1))
                .replace('{to}', String(Math.min((meta?.page ?? 1) * limit, meta?.total ?? 0)))
                .replace('{total}', String(meta?.total ?? 0))}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={(meta?.page ?? 1) <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {m.previous}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={meta ? meta.page >= meta.totalPages : true}
                onClick={() => setPage((p) => (meta ? Math.min(meta.totalPages, p + 1) : p + 1))}
              >
                {m.next}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
