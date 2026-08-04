'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package, Plane, Ship, TrainFront, TrendingUp, Truck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { AdminShippingRateCalculator } from '@/components/admin/logistics/AdminShippingRateCalculator'
import { useAdminLogisticsShipmentsQuery } from '@/hooks/admin/useAdminLogisticsShipmentsQuery'
import { useI18n } from '@/hooks/useI18n'
import type { LogisticsCourierMode, LogisticsShipmentStatus } from '@/types/admin-logistics-shipments.types'
import { cn } from '@/lib/utils'

function CourierIcon({ mode }: { mode: LogisticsCourierMode }) {
  const cls = 'h-5 w-5 text-primary'
  if (mode === 'AIR') return <Plane className={cls} aria-hidden />
  if (mode === 'ROAD') return <Truck className={cls} aria-hidden />
  if (mode === 'SEA') return <Ship className={cls} aria-hidden />
  return <TrainFront className={cls} aria-hidden />
}

function StatusBadge({ status, note }: { status: LogisticsShipmentStatus; note: string | null }) {
  if (status === 'IN_TRANSIT') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container/80 px-3 py-1 text-xs font-bold text-on-secondary-container">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        IN TRANSIT
      </span>
    )
  }
  if (status === 'DELAYED') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-error-container/90 px-3 py-1 text-xs font-bold text-on-error-container">
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        {note ?? 'DELAYED'}
      </span>
    )
  }
  if (status === 'CUSTOMS_HOLD') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-error-container/90 px-3 py-1 text-xs font-bold text-on-error-container">
        <span className="h-1.5 w-1.5 rounded-full bg-error" />
        CUSTOMS HOLD
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-surface-container-high px-3 py-1 text-xs font-bold text-on-surface-variant">
      <span className="h-1.5 w-1.5 rounded-full bg-outline" />
      DELIVERED
    </span>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
      <div className="h-14 animate-pulse bg-surface-container-low" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse border-t border-surface-container-low bg-surface-container-lowest/50" />
      ))}
    </div>
  )
}

export function AdminGlobalShippingLogisticsClient() {
  const { messages } = useI18n()
  const m = messages.admin.globalShippingPage
  const [page, setPage] = React.useState(1)
  const [status, setStatus] = React.useState<LogisticsShipmentStatus | 'ALL'>('ALL')
  const limit = 12

  const query = useAdminLogisticsShipmentsQuery({ page, limit, status })
  const overview = query.data?.overview
  const meta = query.data?.meta
  const items = query.data?.items ?? []

  const filterBtn = (key: LogisticsShipmentStatus | 'ALL', label: string) => (
    <button
      key={key}
      type="button"
      onClick={() => {
        setPage(1)
        setStatus(key)
      }}
      className={cn(
        'rounded-xl px-4 py-2 text-sm transition-all sm:px-5',
        status === key ? 'bg-surface-container-lowest font-semibold text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'
      )}
    >
      {label}
      {key === 'DELAYED' ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-error" /> : null}
    </button>
  )

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">{m.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
      </header>

      <AdminShippingRateCalculator />

      {query.isError ? (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">
            {query.error instanceof Error ? query.error.message : m.loadError}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {m.retry}
          </Button>
        </div>
      ) : null}

      {!query.isError ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="relative overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm lg:col-span-8 dark:border-outline/15">
            <div className="absolute left-6 top-6 z-10 rounded-2xl bg-surface/90 p-4 shadow-lg backdrop-blur-md">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">{m.activeCorridors}</h3>
              <p className="text-sm font-semibold text-on-surface">{overview?.corridorLabel ?? '—'}</p>
              {overview?.activeCorridorTrucks != null ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  <span className="font-mono text-[10px] text-on-surface-variant">
                    {overview.activeCorridorTrucks} {m.trucksInTransit.toUpperCase()}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="relative h-[280px] w-full sm:h-[400px]">
              {overview?.mapImageUrl ? (
                <Image
                  src={overview.mapImageUrl}
                  alt=""
                  fill
                  className="object-cover opacity-90 mix-blend-multiply grayscale"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-surface-container-low" />
              )}
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 800 400" aria-hidden>
                <path
                  d="M100 200 Q 300 100 500 180"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="8,4"
                  strokeWidth="2"
                  className="text-primary"
                />
                <path
                  d="M100 200 Q 250 250 450 300"
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray="8,4"
                  strokeWidth="2"
                  className="text-primary"
                />
                <circle cx="100" cy="200" r="4" className="fill-primary" />
                <circle cx="500" cy="180" r="4" className="fill-primary" />
                <circle cx="450" cy="300" r="4" className="fill-primary" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-4">
            <div className="relative overflow-hidden rounded-3xl bg-primary p-6 text-on-primary shadow-xl">
              <Package className="absolute -right-4 -top-4 h-32 w-32 opacity-10" aria-hidden />
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-200">{m.kpiOnTime}</p>
              <div className="mb-2 text-5xl font-extrabold">{overview ? `${overview.onTimePercent.toFixed(1)}%` : '—'}</div>
              {overview ? (
                <div className="flex items-center gap-1 text-sm font-medium text-emerald-300">
                  <TrendingUp className="h-4 w-4" aria-hidden />+{overview.onTimeDeltaPercent.toFixed(1)}% this month
                </div>
              ) : null}
            </div>
            <div className="rounded-3xl bg-surface-container-high p-6">
              <p className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">{m.kpiTotal}</p>
              <div className="mb-2 text-4xl font-extrabold text-on-surface">
                {overview ? overview.totalShipments.toLocaleString() : '—'}
              </div>
              {overview ? (
                <div className="mt-6 flex gap-4">
                  <div className="flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">{m.domestic}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant">
                      <div className="h-full bg-primary" style={{ width: `${overview.domesticSharePercent}%` }} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-[10px] font-bold uppercase text-on-surface-variant">{m.global}</p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline-variant">
                      <div className="h-full bg-primary" style={{ width: `${overview.globalSharePercent}%` }} />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col justify-end gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-headline text-2xl font-bold text-on-surface">{m.transitTitle}</h2>
          <p className="text-sm text-on-surface-variant">{m.transitSubtitle}</p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl bg-surface-container-low p-1">
          {filterBtn('ALL', m.filterAll)}
          {filterBtn('IN_TRANSIT', m.filterInTransit)}
          {filterBtn('DELAYED', m.filterDelayed)}
          {filterBtn('DELIVERED', m.filterDelivered)}
        </div>
      </div>

      {query.isFetching && !query.data ? <TableSkeleton /> : null}

      {!query.isError && overview ? (
        <div className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-4 py-4 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant sm:px-8 sm:py-5">
                    {m.colTracking}
                  </th>
                  <th className="px-3 py-4 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant sm:px-6 sm:py-5">
                    {m.colOrigin}
                  </th>
                  <th className="px-3 py-4 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant sm:px-6 sm:py-5">
                    {m.colCourier}
                  </th>
                  <th className="px-3 py-4 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant sm:px-6 sm:py-5">
                    {m.colEta}
                  </th>
                  <th className="px-3 py-4 font-headline text-[11px] font-bold uppercase tracking-widest text-on-surface-variant sm:px-6 sm:py-5">
                    {m.colStatus}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {items.map((row) => (
                  <tr key={row.id} className="group transition-colors hover:bg-surface-container-lowest/80">
                    <td className="px-4 py-5 sm:px-8">
                      <span className="inline-block rounded-lg bg-primary/10 px-3 py-1 font-mono text-sm font-medium text-primary">
                        {row.trackingCode}
                      </span>
                    </td>
                    <td className="px-3 py-5 sm:px-6">
                      <p className="text-sm font-semibold text-on-surface">
                        {row.originCity}, {row.originCountry}
                      </p>
                      <p className="text-[10px] font-medium text-on-surface-variant">{row.supplierName}</p>
                    </td>
                    <td className="px-3 py-5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high">
                          <CourierIcon mode={row.courierMode} />
                        </div>
                        <span className="text-sm font-medium text-on-surface">{row.courierName}</span>
                      </div>
                    </td>
                    <td className="px-3 py-5 font-mono text-sm text-on-surface sm:px-6">
                      {row.status === 'DELAYED' && row.deliveryStatusNote ? (
                        <span className="font-bold text-error">{row.deliveryStatusNote}</span>
                      ) : row.estimatedDeliveryAt ? (
                        new Date(row.estimatedDeliveryAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-5 sm:px-6">
                      <StatusBadge status={row.status} note={row.deliveryStatusNote} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-container-low bg-surface-container-low/50 px-4 py-4 sm:flex-row sm:px-8">
              <p className="text-xs font-medium text-on-surface-variant">
                {m.showing
                  .replace(
                    '{from}',
                    String(meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1)
                  )
                  .replace('{to}', String(Math.min(meta.page * meta.limit, meta.total)))
                  .replace('{total}', String(meta.total))}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label={messages.a11y.paginationPrev}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl bg-primary px-2 text-sm font-semibold text-on-primary">
                  {meta.page}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label={messages.a11y.paginationNext}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
