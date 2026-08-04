'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  Activity,
  Bell,
  BellRing,
  Gauge,
  Inbox,
  Radio,
  ShieldAlert,
  Sparkles,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { HubCopy } from '@/types/admin-alerts-hub-ui.types'
import type {
  AdminAlertsHubOverviewDto,
  AdminAlertsHubRecentNotification,
  AdminAlertsHubRecentTrigger
} from '@/types/admin-alerts-hub-overview.types'

interface KpiCardProps {
  icon: React.ReactNode
  iconClass: string
  label: string
  hint: string
  value: string
  secondary?: string
  loading?: boolean
}

function KpiCard({ icon, iconClass, label, hint, value, secondary, loading }: KpiCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/90 p-5 shadow-sm transition-all duration-200',
        'hover:border-primary/15 hover:shadow-md dark:border-outline/15'
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn('rounded-xl p-2.5 shadow-sm ring-1 ring-black/[0.03] dark:ring-white/[0.06]', iconClass)}>
          {icon}
        </div>
        {secondary ? (
          <span className="max-w-[55%] truncate rounded-full bg-surface-container-high px-2 py-0.5 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {secondary}
          </span>
        ) : null}
      </div>
      <p className="relative mt-4 text-xs font-semibold uppercase tracking-wider text-outline">{label}</p>
      {loading ? (
        <Skeleton className="relative mt-1 h-9 w-24" />
      ) : (
        <p className="relative mt-1 font-mono text-3xl font-black tabular-nums tracking-tight text-on-surface">{value}</p>
      )}
      <p className="relative mt-3 text-xs leading-relaxed text-on-surface-variant">{hint}</p>
    </div>
  )
}

function StatusPill({ status, copy }: { status: string; copy: HubCopy }) {
  const s = status.toLowerCase()
  if (s === 'failed' || s === 'fail' || s === 'error') {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-800 dark:bg-red-950/40 dark:text-red-300">
        {copy.failedBadge}
      </span>
    )
  }
  if (s === 'warning' || s === 'warn' || s === 'partial') {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        {copy.warningBadge}
      </span>
    )
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
      {copy.operationalBadge}
    </span>
  )
}

function NotificationItem({
  row,
  copy
}: {
  row: AdminAlertsHubRecentNotification
  copy: HubCopy
}) {
  return (
    <li>
      <div className="group flex items-start gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3.5 shadow-sm transition-all hover:border-primary/20 hover:bg-surface-container-low hover:shadow-md dark:border-outline/12">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner',
            row.isHighPriority
              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
              : 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300'
          )}
        >
          {row.isHighPriority ? (
            <ShieldAlert className="h-4 w-4" aria-hidden />
          ) : (
            <BellRing className="h-4 w-4" aria-hidden />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-on-surface">{row.title}</p>
            {row.isHighPriority ? (
              <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-800 dark:bg-red-950/40 dark:text-red-300">
                {copy.highPriorityBadge}
              </span>
            ) : null}
          </div>
          {row.body ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-on-surface-variant">{row.body}</p>
          ) : null}
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-outline">
            {row.type} · {formatDistanceToNow(new Date(row.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </li>
  )
}

function TriggerItem({ row, copy }: { row: AdminAlertsHubRecentTrigger; copy: HubCopy }) {
  return (
    <li>
      <div className="group flex items-start gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3.5 shadow-sm transition-all hover:border-violet-500/25 hover:bg-surface-container-low hover:shadow-md dark:border-outline/12">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 shadow-inner dark:bg-violet-950/40 dark:text-violet-300">
          <Activity className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-on-surface">{row.label}</p>
            <StatusPill status={row.status} copy={copy} />
          </div>
          <p className="mt-0.5 truncate text-xs text-on-surface-variant">{row.workerHint}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-outline">
            {row.monitorKey} · {copy.avgLoadMs.replace('{n}', String(row.avgLoadMs))} ·{' '}
            {formatDistanceToNow(new Date(row.lastTriggeredAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    </li>
  )
}

export function AdminAlertsHubOverviewPane({
  data,
  isLoading,
  copy
}: {
  data: AdminAlertsHubOverviewDto | undefined
  isLoading: boolean
  copy: HubCopy
}) {
  const n = data?.notifications
  const m = data?.monitors

  return (
    <div className="space-y-8">
      <section
        aria-label={copy.kpiSectionLabel}
        className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15"
      >
        <div className="mb-3 flex items-center gap-2 px-0.5 sm:mb-4">
          <Zap className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="font-heading text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
            {copy.kpiSectionLabel}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          <KpiCard
            icon={<Bell className="h-5 w-5" aria-hidden />}
            iconClass="bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
            label={copy.kpiUnreadLabel}
            hint={copy.kpiUnreadHint}
            value={String(n?.unreadTotal ?? 0)}
            secondary={n ? copy.last7DaysSuffix.replace('{n}', String(n.last7dCount)) : undefined}
            loading={isLoading && !data}
          />
          <KpiCard
            icon={<ShieldAlert className="h-5 w-5" aria-hidden />}
            iconClass="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
            label={copy.kpiHighPriorityLabel}
            hint={copy.kpiHighPriorityHint}
            value={String(n?.highPriorityUnread ?? 0)}
            loading={isLoading && !data}
          />
          <KpiCard
            icon={<Gauge className="h-5 w-5" aria-hidden />}
            iconClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            label={copy.kpiMonitorsLabel}
            hint={copy.kpiMonitorsHint}
            value={String(m?.dbEnabledCount ?? 0)}
            secondary={
              m
                ? `${copy.ofTotal.replace('{total}', String(m.dbTotalCount))} · ${copy.settingsTriggers.replace(
                    '{n}',
                    String(m.settingsActiveTriggerCount)
                  )}`
                : undefined
            }
            loading={isLoading && !data}
          />
          <KpiCard
            icon={<Radio className="h-5 w-5" aria-hidden />}
            iconClass="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
            label={copy.kpiChannelsLabel}
            hint={copy.kpiChannelsHint}
            value={String(m?.channelsEnabledCount ?? 0)}
            secondary={m ? copy.ofTotal.replace('{total}', String(m.channelsTotalCount)) : undefined}
            loading={isLoading && !data}
          />
        </div>
      </section>

      <div className="mb-1 flex items-center gap-2 px-0.5">
        <Sparkles className="h-4 w-4 text-brand-600" aria-hidden />
        <h2 className="font-heading text-sm font-extrabold uppercase tracking-widest text-on-surface-variant">
          {copy.activitySectionLabel}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/90 p-5 shadow-sm dark:border-outline/15">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">{copy.recentUnreadTitle}</h3>
            <Button asChild variant="link" size="sm" className="shrink-0 text-primary">
              <Link href="/admin/alerts?tab=notifications">{copy.viewInbox}</Link>
            </Button>
          </div>
          {isLoading && !data ? (
            <ul className="space-y-3" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
                </li>
              ))}
            </ul>
          ) : n && n.recentUnread.length > 0 ? (
            <ul className="space-y-3">
              {n.recentUnread.map((r) => (
                <NotificationItem key={r.id} row={r} copy={copy} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline/25 bg-surface-container-low/40 px-6 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container-high/80 text-on-surface-variant">
                <Inbox className="h-7 w-7" aria-hidden />
              </div>
              <p className="max-w-sm text-sm text-on-surface-variant">{copy.recentUnreadEmpty}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/90 p-5 shadow-sm dark:border-outline/15">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="font-heading text-lg font-extrabold tracking-tight text-on-surface">
              {copy.recentTriggeredTitle}
            </h3>
            <Button asChild variant="link" size="sm" className="shrink-0 text-primary">
              <Link href="/admin/alerts?tab=system_alerts">{copy.viewMonitors}</Link>
            </Button>
          </div>
          {isLoading && !data ? (
            <ul className="space-y-3" aria-busy="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <Skeleton className="h-[4.75rem] w-full rounded-2xl" />
                </li>
              ))}
            </ul>
          ) : m && m.recentTriggered.length > 0 ? (
            <ul className="space-y-3">
              {m.recentTriggered.map((r) => (
                <TriggerItem key={r.id} row={r} copy={copy} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-outline/25 bg-surface-container-low/40 px-6 py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100/80 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
                <Activity className="h-7 w-7" aria-hidden />
              </div>
              <p className="max-w-sm text-sm text-on-surface-variant">{copy.recentTriggeredEmpty}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
