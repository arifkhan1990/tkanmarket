'use client'

import { Activity, Shield } from 'lucide-react'

import { TrafficVsLatencyChart } from '@/components/admin/charts/TrafficVsLatencyChart'
import { SystemHealthNodesPanel } from '@/components/admin/system-health/SystemHealthNodesPanel'
import type { SystemHealthDashboardResponse } from '@/types/admin-system-health-dashboard.types'

function cardTone(status: string) {
  if (status === 'Healthy') return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400'
  if (status === 'Warning') return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
  return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
}

export function SystemHealthPulsePanel({ data }: { data: SystemHealthDashboardResponse }) {
  const d = data.core

  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container to-primary p-6 text-white shadow-md"
        aria-label="Operational status"
      >
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Shield className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold">{data.banner.title}</h2>
              <p className="mt-1 max-w-xl text-sm text-indigo-100">{data.banner.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs">
              Uptime: {data.banner.uptimePercent.toFixed(2)}%
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs">
              P95: {data.banner.latencyMs}ms
            </span>
          </div>
        </div>
        <Activity className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-white/10" aria-hidden />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.serviceCards.map((c) => (
          <div key={c.id} className="rounded-2xl bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-muted-foreground">{c.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cardTone(c.status)}`}>
                {c.status}
              </span>
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface">{c.uptimeOrLoadPercent.toFixed(1)}%</div>
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.min(100, c.uptimeOrLoadPercent)}%` }}
              />
            </div>
            <p className="mt-3 font-mono text-[11px] text-muted-foreground">{c.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <TrafficVsLatencyChart data={d.traffic_vs_latency} />
        </div>
        <div className="xl:col-span-4">
          <SystemHealthNodesPanel nodes={d.nodes} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-headline text-base font-bold text-on-surface">Recent system events</h3>
          <p className="text-xs text-muted-foreground">Sourced from crawler runs in this environment</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Service</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Detail</th>
                <th className="px-5 py-3 font-semibold">Node</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.systemEvents.map((ev) => (
                <tr key={`${ev.ts}-${ev.nodeId}`} className="hover:bg-muted/30">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-muted-foreground">
                    {ev.ts.slice(11, 19)}
                  </td>
                  <td className="px-5 py-3 font-medium">{ev.service}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                        ev.statusLabel === 'Critical'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300'
                          : ev.statusLabel === 'Mem-Limit'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : ev.statusLabel === 'Degraded'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300'
                      }`}
                    >
                      {ev.statusLabel}
                    </span>
                  </td>
                  <td className="max-w-md px-5 py-3 text-muted-foreground">{ev.detail}</td>
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-primary">{ev.nodeId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
