'use client'

import { ArrowDown, ArrowUp, Database, ShieldCheck, Activity } from 'lucide-react'
import * as React from 'react'

import type { SystemHealthResponse, SystemHealthRange } from '@/types/admin-system-health.types'
import { cn } from '@/lib/utils'

function formatPct(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return `${v.toFixed(3)}%`.replace('.000', '')
}

function computeDeltaLabel({
  current,
  baseline
}: {
  current: number
  baseline: number
}) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return { dir: 'up' as const, delta: null as number | null }
  }
  const delta = current - baseline
  return { dir: delta >= 0 ? ('up' as const) : ('down' as const), delta }
}

function MiniBars({ values, tone }: { values: number[]; tone: 'primary' | 'secondary' | 'tertiary' }) {
  const max = Math.max(0, ...values)
  const colors =
    tone === 'primary'
      ? 'bg-primary/80'
      : tone === 'secondary'
        ? 'bg-indigo-600/80'
        : 'bg-tertiary-fixed/80'

  const bars = 8
  const sample = React.useMemo(() => {
    if (values.length === 0) return Array.from({ length: bars }).map(() => 0)
    const out = Array.from({ length: bars }).map((_, i) => 0)
    for (let i = 0; i < bars; i++) {
      const start = Math.floor((i * values.length) / bars)
      const end = Math.max(start + 1, Math.floor(((i + 1) * values.length) / bars))
      let sum = 0
      for (let j = start; j < Math.min(end, values.length); j++) sum += values[j] ?? 0
      out[i] = sum
    }
    return out
  }, [values])

  return (
    <div className="mt-4 h-12 flex items-end gap-1">
      {sample.map((v, idx) => {
        const pct = max > 0 ? v / max : 0
        const height = Math.max(8, Math.round(pct * 64))
        const stepMax = 12
        const step = Math.min(stepMax, Math.max(0, Math.round((height / 64) * stepMax)))
        const heightClass = ['h-0', 'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-7', 'h-8', 'h-9', 'h-10', 'h-11', 'h-12'][step] ?? 'h-8'
        return <div key={idx} className={cn('w-full rounded-sm', colors, heightClass)} aria-hidden />
      })}
    </div>
  )
}

function widthClassForPct(pct: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)))
  if (clamped <= 0) return 'w-[0%]'
  const step = Math.round(clamped / 10) * 10
  const safe = Math.max(0, Math.min(100, step))
  if (safe <= 0) return 'w-[0%]'
  if (safe <= 10) return 'w-[10%]'
  if (safe <= 20) return 'w-[20%]'
  if (safe <= 30) return 'w-[30%]'
  if (safe <= 40) return 'w-[40%]'
  if (safe <= 50) return 'w-[50%]'
  if (safe <= 60) return 'w-[60%]'
  if (safe <= 70) return 'w-[70%]'
  if (safe <= 80) return 'w-[80%]'
  if (safe <= 90) return 'w-[90%]'
  return 'w-[100%]'
}

export function SystemHealthSummaryCards({ data }: { data: SystemHealthResponse }) {
  const currentP95 = data.api_latency_p95_ms
  const prevBaseline = data.traffic_vs_latency.length
    ? Math.round(data.traffic_vs_latency.slice(0, Math.max(1, Math.floor(data.traffic_vs_latency.length / 2))).reduce((a, b) => a + b.p95_latency_ms, 0) / Math.max(1, Math.floor(data.traffic_vs_latency.length / 2)))
    : 0

  const delta = computeDeltaLabel({ current: currentP95, baseline: prevBaseline })

  const uptime = data.uptime_percent

  return (
    <div className="grid grid-cols-12 gap-6 mb-8">
      <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <ShieldCheck className="h-5 w-5" aria-hidden />
          </div>
          <span className="text-[10px] font-bold bg-surface-container-high px-2 py-1 rounded-md text-on-surface-variant">LIVE</span>
        </div>
        <h3 className="text-on-surface-variant text-sm font-semibold mb-1">Global Uptime</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-headline text-on-surface">{formatPct(uptime)}</span>
          <span className={cn('text-xs font-semibold flex items-center', uptime >= 99.9 ? 'text-green-600' : 'text-amber-500')}>
            <span className="mr-1">{uptime >= 99.9 ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}</span>
            0.002%
          </span>
        </div>
        <MiniBars values={data.traffic_vs_latency.map((p) => p.traffic)} tone="primary" />
      </div>

      <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border-l-4 border-primary">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-secondary-fixed/10 rounded-xl text-secondary">
            <Activity className="h-5 w-5" aria-hidden />
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-1 rounded-md">AVG p95</span>
        </div>
        <h3 className="text-on-surface-variant text-sm font-semibold mb-1">API Latency</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-headline text-on-surface">{currentP95}ms</span>
          <span className={cn('text-xs font-semibold flex items-center', delta.delta != null && delta.dir === 'up' ? 'text-green-600' : 'text-green-600')}>
            {delta.delta != null && delta.dir === 'down' ? <ArrowDown className="h-3 w-3" aria-hidden /> : <ArrowUp className="h-3 w-3" aria-hidden />}
            {delta.delta == null ? '—' : `${Math.abs(delta.delta)}ms`}
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mt-2">Optimal threshold: &lt; 200ms</p>
      </div>

      <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-tertiary-fixed rounded-xl text-tertiary">
            <Database className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-600">HEALTHY</span>
          </div>
        </div>
        <h3 className="text-on-surface-variant text-sm font-semibold mb-1">DB Load</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-headline text-on-surface">{data.db_load_capacity_percent}%</span>
          <span className="text-on-surface-variant text-xs font-medium">Capacity</span>
        </div>
        <div className="mt-4 w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div className={cn('bg-tertiary-container h-full', widthClassForPct(data.db_load_capacity_percent))} />
        </div>
      </div>
    </div>
  )
}

export function SystemHealthSummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-6 mb-8">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-2xl p-6 shadow-sm border border-outline/10 animate-pulse">
          <div className="h-5 w-24 rounded bg-surface-container-highest" />
          <div className="mt-4 h-10 w-56 rounded bg-surface-container-highest" />
          <div className="mt-4 h-8 w-full rounded bg-surface-container-highest" />
        </div>
      ))}
    </div>
  )
}

