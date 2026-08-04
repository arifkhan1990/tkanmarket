'use client'

import * as React from 'react'
import Image from 'next/image'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { useAdminLogisticsCarriersQuery } from '@/hooks/admin/useAdminLogisticsCarriers'
import { cn } from '@/lib/utils'
import type { AdminLogisticsCarrierRow, LogisticsCarrierHealth, LogisticsCarrierServiceType } from '@/types/admin-logistics-carriers.types'

function StatsSkeleton() {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <StatCardSkeleton key={idx} />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
      <div className="h-14 bg-surface-container-high animate-pulse" />
      <div className="divide-y divide-surface-container">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-4 p-4">
            <div className="col-span-4 h-10 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-3 h-10 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-2 h-10 rounded-xl bg-surface-container-high animate-pulse" />
            <div className="col-span-3 h-10 rounded-xl bg-surface-container-high animate-pulse" />
          </div>
        ))}
      </div>
      <div className="h-14 bg-surface-container-low animate-pulse" />
    </div>
  )
}

function HealthPill({ health }: { health: LogisticsCarrierHealth }) {
  const cls =
    health === 'OPERATIONAL'
      ? 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
      : health === 'DELAYED'
        ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
        : 'bg-surface-container-high text-on-surface-variant dark:bg-surface-container-high/60'

  const label = health === 'OPERATIONAL' ? 'Operational' : health === 'DELAYED' ? 'Delayed' : 'Maintenance'

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{label}</span>
}

function CarrierIdentity({ row }: { row: AdminLogisticsCarrierRow }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-surface-container-high shrink-0">
        {row.logoUrl ? <Image src={row.logoUrl} alt={`${row.name} logo`} fill sizes="40px" className="object-contain" /> : null}
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-on-surface">{row.name}</div>
        <div className="text-xs font-mono text-on-surface-variant">ID: {row.carrierCode}</div>
      </div>
    </div>
  )
}

function ReliabilityBar({ percent }: { percent: number }) {
  const w = Math.min(100, Math.max(0, percent))
  return (
    <div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-surface-container-high">
      <div className="h-full bg-primary transition-all" style={{ width: `${w}%` }} />
    </div>
  )
}

export function AdminCarrierManagementClient() {
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [region, setRegion] = React.useState<string | undefined>(undefined)
  const [serviceType, setServiceType] = React.useState<LogisticsCarrierServiceType | undefined>(undefined)
  const [health, setHealth] = React.useState<LogisticsCarrierHealth | undefined>(undefined)
  const [q, setQ] = React.useState('')

  const query = useAdminLogisticsCarriersQuery({
    page,
    limit,
    region,
    serviceType,
    health,
    q: q.trim() ? q.trim() : undefined
  })

  const meta = query.data?.meta
  const data = query.data?.data
  const items = React.useMemo(() => data?.items ?? [], [data])

  const avgReliability = React.useMemo(() => {
    if (items.length === 0) return null
    const sum = items.reduce((acc, r) => acc + r.reliabilityPercent, 0)
    return sum / items.length
  }, [items])

  const operationalCount = React.useMemo(() => items.filter((r) => r.health === 'OPERATIONAL').length, [items])
  const delayedCount = React.useMemo(() => items.filter((r) => r.health === 'DELAYED').length, [items])
  const maintenanceCount = React.useMemo(() => items.filter((r) => r.health === 'MAINTENANCE').length, [items])

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-on-surface md:text-4xl">
            Logistics: Carrier Partners
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            Manage global shipping relationships, monitor service health across transit lanes, and optimize logistics performance.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-container px-6 py-3 text-sm font-semibold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02] active:scale-95"
        >
          New Carrier
        </button>
      </header>

      {query.isLoading && !data ? <StatsSkeleton /> : null}

      {data ? (
        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <DashboardStatCardShell tone="blue">
            <p className={dashboardStatLabelClass}>Active Carriers</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{data.stats.activeCarriers.toLocaleString()}</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="green">
            <p className={dashboardStatLabelClass}>Global Health</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{data.stats.globalHealthPercent.toFixed(1)}%</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="yellow">
            <p className={dashboardStatLabelClass}>Avg Transit Time</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{data.stats.avgTransitDays.toFixed(1)}d</p>
          </DashboardStatCardShell>
          <DashboardStatCardShell tone="red">
            <p className={dashboardStatLabelClass}>Active Lanes</p>
            <p className={cn(dashboardStatValueClass, 'font-black')}>{data.stats.activeLanes.toLocaleString()}</p>
          </DashboardStatCardShell>
        </section>
      ) : null}

      <section className="mb-6 flex flex-col gap-3 rounded-2xl bg-surface-container-low p-4 md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => {
            setPage(1)
            setQ(e.target.value)
          }}
          className="w-full rounded-xl bg-surface-container-highest px-4 py-3 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20 outline-none md:max-w-sm"
          placeholder="Search carriers..."
        />
        <select
          aria-label="Region filter"
          value={region ?? ''}
          onChange={(e) => {
            setPage(1)
            setRegion(e.target.value ? e.target.value : undefined)
          }}
          className="rounded-xl bg-surface-container-highest px-3 py-3 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All regions</option>
          <option value="GLOBAL">Global</option>
          <option value="EU">EU</option>
          <option value="APAC">APAC</option>
          <option value="NA">North America</option>
        </select>
        <select
          aria-label="Service type filter"
          value={serviceType ?? ''}
          onChange={(e) => {
            setPage(1)
            setServiceType((e.target.value as LogisticsCarrierServiceType) || undefined)
          }}
          className="rounded-xl bg-surface-container-highest px-3 py-3 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Service type</option>
          <option value="EXPRESS">Express</option>
          <option value="ECONOMY">Economy</option>
          <option value="FREIGHT">Freight</option>
        </select>
        <select
          aria-label="Health filter"
          value={health ?? ''}
          onChange={(e) => {
            setPage(1)
            setHealth((e.target.value as LogisticsCarrierHealth) || undefined)
          }}
          className="rounded-xl bg-surface-container-highest px-3 py-3 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Health status</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="DELAYED">Delayed</option>
          <option value="MAINTENANCE">Maintenance</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-on-surface-variant">Rows:</span>
          <select
            aria-label="Rows per page"
            value={limit}
            onChange={(e) => {
              setPage(1)
              setLimit(Number(e.target.value))
            }}
            className="rounded-xl bg-surface-container-highest px-3 py-3 text-sm ring-1 ring-outline/10 focus:ring-2 focus:ring-primary/20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </section>

      {query.isLoading && !data ? <TableSkeleton /> : null}

      {data && items.length ? (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm dark:border-outline/15">
          <div className="grid grid-cols-12 gap-4 bg-surface-container px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
            <div className="col-span-4">Carrier identity</div>
            <div className="col-span-3">Active lanes</div>
            <div className="col-span-2">Service health</div>
            <div className="col-span-1 text-right">Avg transit</div>
            <div className="col-span-2 text-right">Performance</div>
          </div>

          <div className="divide-y divide-surface-container">
            {items.map((row) => (
              <div key={row.id} className="grid grid-cols-12 gap-4 px-4 py-4">
                <div className="col-span-4">
                  <CarrierIdentity row={row} />
                </div>
                <div className="col-span-3 flex flex-wrap gap-1.5">
                  {row.laneTags.map((t) => (
                    <span key={t.laneCode} className="rounded-full bg-secondary-container px-2 py-0.5 text-[10px] font-bold uppercase text-on-secondary-container">
                      {t.laneCode}
                    </span>
                  ))}
                  <span className="ml-1 text-[10px] text-on-surface-variant">
                    {row.laneTags.length === 0 ? 'No lanes' : null}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <HealthPill health={row.health} />
                </div>
                <div className="col-span-1 text-right font-mono text-sm text-on-surface">{row.avgTransitDays.toFixed(1)}d</div>
                <div className="col-span-2 text-right">
                  <ReliabilityBar percent={row.reliabilityPercent} />
                  <div className="mt-1 text-[10px] font-bold text-on-surface-variant">{row.reliabilityPercent.toFixed(0)}% Reliability</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between bg-surface-container-low px-4 py-3 text-sm">
            <span className="text-xs text-on-surface-variant">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1} • {meta?.total?.toLocaleString() ?? 0} carriers
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(meta?.page ?? page) <= 1}
                className="h-9 rounded-xl bg-surface-container-highest px-3 text-xs font-semibold disabled:opacity-50"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (meta?.totalPages ? Math.min(meta.totalPages, p + 1) : p + 1))}
                disabled={meta ? meta.page >= meta.totalPages : false}
                className="h-9 rounded-xl bg-surface-container-highest px-3 text-xs font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {!query.isLoading && data && items.length === 0 ? (
        <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-10 text-center text-on-surface-variant shadow-sm dark:border-outline/15">
          No carriers found.
        </div>
      ) : null}

      {data && items.length > 0 ? (
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm lg:col-span-2 dark:border-outline/15">
            <h3 className="mb-4 text-lg font-bold text-on-surface">Operational overview</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Operational</p>
                <p className="mt-2 font-mono text-3xl font-black text-green-700 dark:text-green-300">
                  {operationalCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Delayed</p>
                <p className="mt-2 font-mono text-3xl font-black text-red-700 dark:text-red-300">
                  {delayedCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Maintenance</p>
                <p className="mt-2 font-mono text-3xl font-black text-on-surface">
                  {maintenanceCount.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-xl bg-surface-container-low p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Avg reliability (this page)</p>
                  <p className="mt-2 font-mono text-3xl font-black text-on-surface">
                    {avgReliability == null ? '—' : `${avgReliability.toFixed(0)}%`}
                  </p>
                </div>
                <div className="w-40">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, avgReliability ?? 0))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-outline">
                    {items.length.toLocaleString()} carriers visible
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
            <h3 className="mb-4 text-lg font-bold text-on-surface">Ops note</h3>
            <div className="rounded-xl bg-primary-fixed p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-on-primary-fixed">Insight</p>
              <p className="mt-2 text-sm text-on-primary-fixed-variant">
                Prioritize carriers marked delayed for lane review; use reliability % and avg transit time to guide re-routing.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

