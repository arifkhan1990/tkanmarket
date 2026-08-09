'use client'

import { Database, HardDrive, Network, Cpu } from 'lucide-react'

import type { SystemHealthDashboardResponse } from '@/types/admin-system-health-dashboard.types'
import { cn } from '@/lib/utils'

function BarRow({ label, pct, tone }: { label: string; pct: number; tone: 'primary' | 'secondary' | 'muted' }) {
  const w = Math.max(4, Math.min(100, Math.round(pct)))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold text-on-surface">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
        <div
          className={cn(
            'h-full rounded-full',
            tone === 'primary' && 'bg-primary',
            tone === 'secondary' && 'bg-secondary',
            tone === 'muted' && 'bg-outline'
          )}
          style={{ width: `${w}%` }}
        />
      </div>
    </div>
  )
}

export function SystemHealthClusterPanel({ data }: { data: SystemHealthDashboardResponse }) {
  const q = data.network.crawlerLatency.recent.length
  const r = data.resources
  const scraperActive = Math.min(16, Math.max(4, data.network.crawlerLatency.recent.filter((x) => x.durationMs != null).length))

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="space-y-6 rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm lg:col-span-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Resource utilization</h3>
            <p className="font-mono text-xs text-muted-foreground">{r.cpuLabel}</p>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Live
          </span>
        </div>
        <div className="flex h-56 items-end gap-1 px-1">
          {data.core.traffic_vs_latency.slice(-14).map((p, idx) => {
            const h = Math.max(12, Math.min(100, (p.traffic + p.p95_latency_ms / 20) % 100))
            return (
              <div
                key={idx}
                className={cn('flex-1 rounded-t-sm transition-colors', idx % 3 === 0 ? 'bg-primary/70' : 'bg-primary/25')}
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>
        <div className="grid grid-cols-3 gap-0 border-t border-border pt-6 text-center text-sm">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">CPU load</p>
            <p className="font-mono text-xl font-bold">{r.cpuLoadPercent.toFixed(1)}%</p>
          </div>
          <div className="border-x border-border">
            <p className="text-xs font-medium uppercase text-muted-foreground">Mem pressure</p>
            <p className="font-mono text-xl font-bold">{r.memoryPressurePercent.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Threads</p>
            <p className="font-mono text-xl font-bold">{r.activeThreads.toLocaleString()}</p>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-muted/40 p-6 lg:col-span-4">
        <div>
          <h3 className="font-headline text-lg font-bold">API performance</h3>
          <p className="text-xs text-muted-foreground">Regional latency (estimated from global P95)</p>
        </div>
        <div className="space-y-3">
          {data.regions.map((reg) => (
            <div key={reg.region} className="flex items-center justify-between rounded-lg bg-background p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-green-600" aria-hidden />
                <span className="text-sm font-semibold">{reg.region}</span>
              </div>
              <span className="font-mono text-sm font-bold text-green-600">
                {reg.latencyMs == null ? '—' : `${reg.latencyMs}ms`}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-surface-container-lowest p-6 shadow-sm lg:col-span-5">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-lg font-bold">Crawler throughput</h3>
          <Database className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <div className="mb-2 flex justify-between text-xs font-bold uppercase text-muted-foreground">
            <span>Active scrapers</span>
            <span className="font-mono text-primary">
              {scraperActive} / 16
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
            <div className="h-full bg-primary" style={{ width: `${(scraperActive / 16) * 100}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border-l-4 border-primary bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Runs sampled</p>
            <p className="font-mono text-2xl font-black">{q}</p>
          </div>
          <div className="rounded-lg border-l-4 border-secondary bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Avg duration</p>
            <p className="font-mono text-2xl font-black text-green-600">
              {data.network.crawlerLatency.avgMs == null ? '—' : `${data.network.crawlerLatency.avgMs}ms`}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead className="bg-muted/50 uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Job</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.crawlerJobs.map((j) => (
                <tr key={j.jobId} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{j.jobId}</td>
                  <td className="px-3 py-2">{j.source}</td>
                  <td className="px-3 py-2 font-bold text-green-600">{j.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-7">
        <div className="rounded-xl border border-border bg-surface-container-lowest p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold">Catalog footprint</h4>
              <p className="text-xs text-muted-foreground">Published fabrics (soft-delete excluded)</p>
            </div>
          </div>
          <p className="font-mono text-3xl font-black">{data.fabricCatalogCount.toLocaleString()}</p>
          <p className="mt-2 text-xs text-muted-foreground">Indexed SKUs in marketplace database</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-container-lowest p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold">Storage index</h4>
              <p className="text-xs text-muted-foreground">Relative catalog pressure</p>
            </div>
          </div>
          <BarRow label="Utilization model" pct={data.storage.usedPercent} tone="secondary" />
          <div className="mt-4 flex justify-between text-xs text-muted-foreground">
            <span>{data.storage.usedLabel}</span>
            <span>{data.storage.totalLabel}</span>
          </div>
        </div>
        <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              <h3 className="font-headline font-bold">Network traffic model</h3>
            </div>
            <span className="font-mono text-xs font-bold uppercase text-primary">Crawler jobs / hour</span>
          </div>
          <div className="grid grid-cols-12 gap-1">
            {data.core.traffic_vs_latency.slice(-12).map((p, i) => (
              <div
                key={i}
                className="col-span-1 flex h-16 items-end justify-center"
              >
                <div
                  className="w-full max-w-[14px] rounded-full bg-primary/60"
                  style={{ height: `${Math.max(15, Math.min(100, p.traffic * 8 + 10))}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
