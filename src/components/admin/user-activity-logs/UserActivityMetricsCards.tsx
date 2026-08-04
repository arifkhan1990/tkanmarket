'use client'

import * as React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Clock, TrendingUp, Activity, AlertTriangle, Search, Shield } from 'lucide-react'

import type { UserActivityMetrics } from '@/types/user-activity-logs.types'

function formatDurationMs(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const totalMinutes = Math.floor(ms / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function UserActivityMetricsCards({
  metrics,
  lastSeenAt,
  isLoading
}: {
  metrics: UserActivityMetrics | undefined
  lastSeenAt: string | null
  isLoading: boolean
}) {
  if (isLoading || !metrics) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 animate-pulse">
            <div className="h-3 w-2/5 rounded bg-surface-container-highest" />
            <div className="mt-3 h-8 w-3/4 rounded bg-surface-container-highest" />
          </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 animate-pulse">
              <div className="h-3 w-2/5 rounded bg-surface-container-highest" />
              <div className="mt-3 h-8 w-3/4 rounded bg-surface-container-highest" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const lastSeenLabel =
    lastSeenAt && !Number.isNaN(new Date(lastSeenAt).getTime())
      ? `${formatDistanceToNow(new Date(lastSeenAt), { addSuffix: true })}`
      : '—'

  const productivityLabel = metrics.productivity_score == null ? '—' : `${metrics.productivity_score.toFixed(1)}%`

  const avgResponseLabel = metrics.avg_response_ms == null ? '—' : `${Math.round(metrics.avg_response_ms)}ms`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Clock className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Session</div>
          <div className="text-lg font-heading font-extrabold text-on-surface">{formatDurationMs(metrics.session_duration_ms)}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
          <TrendingUp className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Productivity</div>
          <div className="text-lg font-heading font-extrabold text-on-surface">{productivityLabel}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Activity className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Actions</div>
          <div className="text-lg font-heading font-extrabold text-on-surface">{metrics.actions.toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high text-on-surface">
          <Search className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Unique IPs</div>
          <div className="text-lg font-heading font-extrabold text-on-surface">{metrics.unique_ips.toLocaleString()}</div>
        </div>
      </div>

      <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Shield className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Avg Response</div>
          <div className="text-lg font-heading font-extrabold text-on-surface">{avgResponseLabel}</div>
        </div>
      </div>

      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-error/10 text-error flex items-center justify-center">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Failed Req</div>
            <div className="text-lg font-heading font-extrabold text-on-surface">{metrics.failed_requests.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-2xl bg-surface-container-lowest p-4 border border-outline/10 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center">
            <Shield className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Last Seen</div>
            <div className="text-lg font-heading font-extrabold text-on-surface">{lastSeenLabel}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

