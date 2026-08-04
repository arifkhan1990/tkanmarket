'use client'

import { Cpu, MemoryStick, Network } from 'lucide-react'

import type { SystemHealthDashboardResponse } from '@/types/admin-system-health-dashboard.types'
import { cn } from '@/lib/utils'

export function SystemHealthStreamsPanel({ data }: { data: SystemHealthDashboardResponse }) {
  const r = data.resources

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CPU utilization</p>
              <p className="font-headline mt-1 text-3xl font-bold">{r.cpuLoadPercent.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <MemoryStick className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="flex h-14 items-end gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn('w-full rounded-sm', i > 5 ? 'bg-primary' : 'bg-primary/25')}
                style={{ height: `${30 + ((i * 17) % 55)}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{r.cpuLabel}</p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Memory pressure</p>
              <p className="font-headline mt-1 text-3xl font-bold">{r.memoryPressurePercent.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-700 dark:text-amber-400">
              <Cpu className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="flex h-14 items-end gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn('w-full rounded-sm', i > 4 ? 'bg-amber-600/80' : 'bg-amber-500/20')}
                style={{ height: `${25 + ((i * 13) % 50)}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{r.memLabel}</p>
        </div>

        <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
          <div className="mb-4 flex justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active threads</p>
              <p className="font-headline mt-1 text-3xl font-bold">{r.activeThreads.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-700 dark:text-indigo-400">
              <Network className="h-5 w-5" aria-hidden />
            </div>
          </div>
          <div className="flex h-14 items-end gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={cn('w-full rounded-sm', i > 3 ? 'bg-indigo-600' : 'bg-indigo-300/40')}
                style={{ height: `${40 + ((i * 11) % 45)}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{r.threadsLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4 rounded-2xl bg-muted/40 p-8">
          <div>
            <h3 className="font-headline text-2xl font-bold">Crawler throughput</h3>
            <p className="font-mono text-xs uppercase text-muted-foreground">Aggregated streams (window)</p>
          </div>
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 1000 200" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id="health-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,180 Q200,40 400,120 T800,60 T1000,100 L1000,200 L0,200 Z"
                fill="url(#health-area)"
              />
              <path
                d="M0,180 Q200,40 400,120 T800,60 T1000,100"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="3"
              />
            </svg>
          </div>
          <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
            <span>-{data.range}</span>
            <span>NOW</span>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-surface-container-highest p-6">
          <h3 className="font-headline text-xl font-bold">Regions</h3>
          <div className="space-y-3">
            {data.regions.map((reg) => (
              <div
                key={reg.region}
                className="flex items-center justify-between rounded-xl border border-primary/5 bg-background p-3"
              >
                <div>
                  <p className="text-sm font-semibold">{reg.region}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {reg.latencyMs == null ? 'Latency n/a' : `${reg.latencyMs}ms`}
                  </p>
                </div>
                <span
                  className={cn(
                    'rounded-md px-2 py-1 text-[10px] font-bold uppercase',
                    reg.state === 'Operational' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400',
                    reg.state === 'Degraded' && 'bg-amber-100 text-amber-800',
                    reg.state === 'Standby' && 'bg-surface-container-high text-on-surface-variant'
                  )}
                >
                  {reg.state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-outline/20 bg-surface-container-highest text-on-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-outline/15 bg-surface-container-low px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/90" />
              <div className="h-3 w-3 rounded-full bg-amber-500/90" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/90" />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-outline">technical_logs</span>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto p-5 font-mono text-xs leading-relaxed">
          {data.core.technical_logs.map((line, idx) => (
            <div key={`${line.ts}-${idx}`} className="mb-2">
              <span className="text-on-surface-variant">[{line.ts.slice(11, 19)}]</span>{' '}
              <span
                className={cn(
                  line.level === 'ERROR' && 'text-red-400',
                  line.level === 'WARN' && 'text-amber-400',
                  line.level === 'INFO' && 'text-emerald-400'
                )}
              >
                {line.level}:
              </span>{' '}
              <span className="text-on-surface">{line.message}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-900/40 bg-indigo-950 p-6 text-white shadow-lg">
        <p className="text-sm text-indigo-100">{data.securityNote}</p>
      </div>
    </div>
  )
}
