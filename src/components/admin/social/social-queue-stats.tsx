'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Layers, Timer, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AdminSocialStats } from '@/types/admin-social.types'

type SocialQueueStatsProps = {
  stats: AdminSocialStats | undefined
  isLoading: boolean
  labels: {
    scheduled: string
    published: string
    activeFabrics: string
    next: string
    nextEmpty: string
  }
}

function useCountdown(targetIso: string | null | undefined) {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!targetIso) return
    const target = new Date(targetIso).getTime()
    const tick = () => {
      const diff = target - Date.now()
      if (diff <= 0) { setLabel('Now'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLabel(h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [targetIso])

  return targetIso ? label : null
}

function StatCard({ label, value, icon: Icon, accent, className }: {
  label: string; value: string | number; icon: React.ElementType; accent: string; className?: string
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm', className)}>
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-xl', accent)}>
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </div>
      <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
      <p className="mt-1 font-heading text-3xl font-extrabold tabular-nums text-on-surface">{value}</p>
    </div>
  )
}

export function SocialQueueStats({ stats, isLoading, labels }: SocialQueueStatsProps) {
  const nextAt = stats?.nextPublication?.scheduledAt
  const countdown = useCountdown(nextAt)

  if (isLoading) {
    return (
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('rounded-2xl border border-outline/10 bg-surface-container-lowest p-5', i === 3 && 'col-span-2 md:col-span-1')}>
            <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-container-high" />
            <div className="mt-3 h-3 w-24 animate-pulse rounded bg-surface-container-high" />
            <div className="mt-2 h-8 w-12 animate-pulse rounded bg-surface-container-high" />
          </div>
        ))}
      </section>
    )
  }

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <StatCard label={labels.scheduled} value={stats?.totalScheduled ?? 0} icon={CalendarClock}
        accent="bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300" />
      <StatCard label={labels.activeFabrics} value={stats?.activeCampaignFabrics ?? 0} icon={Layers}
        accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300" />
      <StatCard label={labels.published} value={stats?.totalPublished ?? 0} icon={TrendingUp}
        accent="bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300" />

      {/* Next publication hero card */}
      <div className="col-span-2 overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary to-primary/80 p-5 text-on-primary shadow-md shadow-primary/20 md:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold opacity-90">{labels.next}</span>
          <Timer className="h-4 w-4 opacity-70" aria-hidden />
        </div>
        {stats?.nextPublication?.captionPreview ? (
          <p className="mt-2 line-clamp-2 text-sm font-semibold italic leading-snug opacity-95">
            &ldquo;{stats.nextPublication.captionPreview}&rdquo;
          </p>
        ) : (
          <p className="mt-2 text-sm opacity-80">{labels.nextEmpty}</p>
        )}
        {countdown ? (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-on-primary/15 px-2.5 py-1 font-mono text-xs font-bold tabular-nums">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-primary" />
            {countdown}
          </div>
        ) : null}
      </div>
    </section>
  )
}
