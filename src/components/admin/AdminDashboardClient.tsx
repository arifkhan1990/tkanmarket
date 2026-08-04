'use client'

import { useMemo } from 'react'
import { Activity } from 'lucide-react'

import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'
import { StatsCard } from '@/components/admin/StatsCard'
import { useAdminDashboard, AdminDashboardSkeleton } from '@/hooks/admin/useAdminDashboard'
import { useI18n } from '@/hooks/useI18n'
import type { StatsCardIconName } from '@/types/admin.types'

export function AdminDashboardClient() {
  const query = useAdminDashboard()
  const { messages } = useI18n()

  const stats = query.data

  const fabricStats = stats?.fabrics
  const leadsByStatus = stats?.leads.byStatus
  const socialByStatus = stats?.social.byStatus
  const crawler = stats?.crawler

  const cards = useMemo((): Array<{
    title: string
    value: number
    change: undefined
    icon: StatsCardIconName
    color: 'red' | 'yellow' | 'green' | 'blue'
  }> => {
    return [
      {
        title: messages.admin.dashboard.pendingAi,
        value: fabricStats?.pendingAi ?? 0,
        change: undefined,
        icon: 'bot',
        color: 'red' as const
      },
      {
        title: messages.admin.dashboard.pendingReview,
        value: fabricStats?.pendingReview ?? 0,
        change: undefined,
        icon: 'shield-check',
        color: 'yellow' as const
      },
      {
        title: messages.admin.dashboard.approved,
        value: fabricStats?.approved ?? 0,
        change: undefined,
        icon: 'shield-check',
        color: 'green' as const
      },
      {
        title: messages.admin.dashboard.rejected,
        value: fabricStats?.rejected ?? 0,
        change: undefined,
        icon: 'x-circle',
        color: 'blue' as const
      }
    ]
  }, [fabricStats?.approved, fabricStats?.pendingAi, fabricStats?.pendingReview, fabricStats?.rejected, messages])

  if (query.isLoading) return <AdminDashboardSkeleton />

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
        <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
          {cards.map((c) => (
            <StatsCard key={c.title} variant="compact" title={c.title} value={c.value} icon={c.icon} color={c.color} />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.dashboard.leadsByStatus}</div>
                <div className="text-lg font-extrabold">{messages.admin.dashboard.crmOverview}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {leadsByStatus
                ? (Object.entries(leadsByStatus) as Array<[string, number]>).map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{k}</div>
                      <div className="text-2xl font-extrabold font-mono">{v}</div>
                    </div>
                  ))
                : null}
            </div>
          </div>

          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.dashboard.crawler}</div>
                <div className="text-lg font-extrabold">{messages.admin.dashboard.runControl}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{messages.admin.dashboard.running}</div>
                <div className="text-2xl font-extrabold font-mono">{crawler?.runningCount ?? 0}</div>
              </div>
              <div className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{messages.admin.dashboard.latestStatus}</div>
                <div className="text-2xl font-extrabold font-mono">{crawler?.latestRun?.status ?? '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.dashboard.socialQueue}</div>
                <div className="text-lg font-extrabold">{messages.admin.dashboard.queueHealth}</div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {socialByStatus
                ? (Object.entries(socialByStatus) as Array<[string, number]>).map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{k}</div>
                      <div className="text-2xl font-extrabold font-mono">{v}</div>
                    </div>
                  ))
                : null}
            </div>
          </div>

          <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold uppercase tracking-widest text-outline">{messages.admin.dashboard.activityFeed}</div>
                <div className="text-lg font-extrabold">{messages.admin.dashboard.recentActions}</div>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-surface-container-highest p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" aria-hidden />
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold">{messages.admin.dashboard.noActivityTitle}</div>
                    <div className="text-xs text-on-surface-variant">{messages.admin.dashboard.noActivityDescription}</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-surface-container-highest p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" aria-hidden />
                  <div className="space-y-1">
                    <div className="text-sm font-extrabold">{messages.admin.dashboard.noActivityTitle}</div>
                    <div className="text-xs text-on-surface-variant">{messages.admin.dashboard.noActivityDescription}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

