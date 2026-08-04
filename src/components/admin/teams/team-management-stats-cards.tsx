'use client'

import { Armchair, Clock, Percent } from 'lucide-react'

import type { TeamDashboardStats } from '@/types/team-admin.types'
import { cn } from '@/lib/utils'

interface TeamManagementStatsCardsProps {
  stats: TeamDashboardStats | undefined
  isLoading: boolean
  labels: {
    statsSeats: string
    statsAvgResponse: string
    statsConversion: string
    statsMinsSuffix: string
    statsPctSuffix: string
    statsLeadsNote: string
    statsSeatBarHint: string
  }
}

function StatSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
      <div className="pointer-events-none absolute -right-4 -top-8 h-24 w-24 rounded-full bg-surface-container-high/80 opacity-50 blur-2xl" />
      <div className="relative h-3 w-24 animate-pulse rounded-full bg-surface-container-high" />
      <div className="relative mt-3 h-9 w-32 animate-pulse rounded-lg bg-surface-container-high" />
    </div>
  )
}

export function TeamManagementStatsCards({ stats, isLoading, labels }: TeamManagementStatsCardsProps) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <StatSkeleton />
        </div>
        <StatSkeleton />
        <StatSkeleton />
      </div>
    )
  }

  if (!stats) return null

  const seatPct = Math.min(100, stats.seat_utilization_pct)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm transition-all duration-300 dark:border-outline/15 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] md:col-span-2">
        <div
          className="pointer-events-none absolute -right-8 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-60 blur-3xl"
          aria-hidden
        />
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{labels.statsSeats}</p>
            <h3 className="font-headline mt-2 text-3xl font-black tracking-tight text-on-surface tabular-nums">
              {stats.member_count}{' '}
              <span className="text-lg font-medium text-on-surface-variant">/ {stats.seat_limit}</span>
            </h3>
            <p className="mt-2 text-xs text-on-surface-variant">{labels.statsLeadsNote}</p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary shadow-sm ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
            <Armchair className="h-6 w-6" aria-hidden />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between font-mono text-xs">
            <span className="text-on-surface-variant">{labels.statsSeatBarHint}</span>
            <span className="font-bold text-primary">{seatPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className={cn('h-full rounded-full bg-gradient-to-r from-primary to-primary-container')}
              style={{ width: `${seatPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-outline/10 border-l-4 border-l-tertiary bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
        <div
          className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-tertiary/20 via-tertiary/5 to-transparent opacity-50 blur-3xl"
          aria-hidden
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{labels.statsAvgResponse}</p>
        <div className="relative mt-2 flex items-baseline gap-2">
          <span className="font-headline text-3xl font-black tracking-tight text-on-surface tabular-nums">
            {stats.avg_response_minutes != null ? stats.avg_response_minutes : '—'}
          </span>
          {stats.avg_response_minutes != null ? (
            <span className="font-mono text-sm text-on-surface-variant">{labels.statsMinsSuffix}</span>
          ) : null}
        </div>
        <div className="relative mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          <span>Δ(updated − created) for non-new leads</span>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-outline/10 border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-sm dark:border-outline/15">
        <div
          className="pointer-events-none absolute -right-6 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent opacity-50 blur-3xl"
          aria-hidden
        />
        <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-on-surface-variant">{labels.statsConversion}</p>
        <div className="relative mt-2 flex items-baseline gap-2">
          <span className="font-headline text-3xl font-black tracking-tight text-on-surface tabular-nums">{stats.lead_conversion_pct}</span>
          <span className="font-mono text-sm text-on-surface-variant">{labels.statsPctSuffix}</span>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant">
          <Percent className="h-4 w-4 shrink-0" aria-hidden />
          <span>
            {stats.closed_won_leads} / {stats.total_assigned_leads} leads
          </span>
        </div>
      </div>
    </div>
  )
}
