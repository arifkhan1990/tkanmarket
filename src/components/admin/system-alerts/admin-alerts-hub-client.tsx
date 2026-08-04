'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Bell,
  Database,
  LayoutDashboard,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react'

import { AdminAlertsHubOverviewPane } from '@/components/admin/system-alerts/admin-alerts-hub-overview-pane'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminAlertsHubOverviewQuery } from '@/hooks/admin/useAdminAlertsHubOverviewQuery'
import { resolveAlertsHubCopy } from '@/lib/admin-alerts-hub-copy'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

import { NotificationCenterSkeleton } from '@/components/admin/notifications/notification-center-skeleton'
import { AlertsSkeleton } from '@/components/admin/system-alerts/system-alerts-ui'

type HubTab = 'overview' | 'notifications' | 'preferences' | 'system_alerts' | 'policy_db'

function parseTab(v: string | null): HubTab {
  if (v === 'preferences') return 'preferences'
  if (v === 'system_alerts') return 'system_alerts'
  if (v === 'policy_db') return 'policy_db'
  if (v === 'notifications') return 'notifications'
  return 'overview'
}

const LazyNotificationCenter = dynamic(
  async () => {
    const m = await import('@/components/admin/notifications/AdminNotificationCenterClient')
    return m.AdminNotificationCenterClient
  },
  { loading: () => <NotificationCenterSkeleton embedded />, ssr: false }
)

const LazyNotificationPreferences = dynamic(
  async () => {
    const m = await import('@/components/admin/notifications/AdminNotificationSettingsClient')
    return m.AdminNotificationSettingsClient
  },
  {
    loading: () => (
      <div className="space-y-4 py-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    ),
    ssr: false
  }
)

const LazySystemAlerts = dynamic(
  async () => {
    const m = await import('@/components/admin/system-alerts/AdminSystemAlertsClient')
    return m.AdminSystemAlertsClient
  },
  { loading: () => <AlertsSkeleton />, ssr: false }
)

const LazyPolicyDb = dynamic(
  async () => {
    const m = await import('@/components/admin/system-alerts/admin-system-alert-config-client')
    return m.AdminSystemAlertConfigClient
  },
  {
    loading: () => (
      <div className="space-y-6 py-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    ),
    ssr: false
  }
)

function TabBadge({ value }: { value: number }) {
  if (value <= 0) return null
  return (
    <span className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1.5 font-mono text-[10px] font-black text-on-primary group-data-[state=active]:bg-white/20 group-data-[state=active]:text-on-primary">
      {value > 99 ? '99+' : value}
    </span>
  )
}

export function AdminAlertsHubClient() {
  const { locale, messages } = useI18n()
  const copy = resolveAlertsHubCopy(messages, locale)

  const overviewQuery = useAdminAlertsHubOverviewQuery()
  const overview = overviewQuery.data

  const [tab, setTab] = React.useState<HubTab>('overview')

  React.useEffect(() => {
    const url = new URL(window.location.href)
    const initial = parseTab(url.searchParams.get('tab'))
    setTab(initial)
  }, [])

  const onTabChange = React.useCallback((next: string) => {
    const nextTab = parseTab(next)
    setTab(nextTab)
    const url = new URL(window.location.href)
    url.searchParams.set('tab', nextTab)
    window.history.replaceState(null, '', url.toString())
  }, [])

  const tabItems: Array<{
    value: HubTab
    label: string
    icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
    href: string
    badge?: number
  }> = [
    { value: 'overview', label: copy.tabOverview, icon: LayoutDashboard, href: '/admin/alerts' },
    {
      value: 'notifications',
      label: copy.tabInbox,
      icon: Bell,
      href: '/admin/notifications',
      badge: overview?.notifications.unreadTotal ?? 0
    },
    {
      value: 'preferences',
      label: copy.tabPreferences,
      icon: SlidersHorizontal,
      href: '/admin/notification-settings'
    },
    {
      value: 'system_alerts',
      label: copy.tabSystemAlerts,
      icon: AlertTriangle,
      href: '/admin/system-alerts',
      badge: overview?.monitors.dbEnabledCount ?? 0
    },
    {
      value: 'policy_db',
      label: copy.tabPolicy,
      icon: Database,
      href: '/admin/system-alert-config'
    }
  ]

  const lastSyncedLabel = overview
    ? copy.lastSync.replace('{time}', formatDistanceToNow(new Date(overview.generatedAt), { addSuffix: true }))
    : null

  return (
    <div className="space-y-6 pb-16">
      <div className="relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/90 p-4 shadow-sm sm:p-5 dark:border-outline/15">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-brand-500/[0.05] blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 shrink-0 text-brand-600" aria-hidden />
              <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{copy.title}</h1>
            </div>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-on-surface-variant">{copy.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {lastSyncedLabel ? (
              <div className="hidden rounded-full border border-outline/10 bg-surface-container-highest px-4 py-2 sm:block">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {lastSyncedLabel}
                </span>
              </div>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => void overviewQuery.refetch()}
              disabled={overviewQuery.isFetching}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', overviewQuery.isFetching && 'animate-spin')} aria-hidden />
              {copy.refresh}
            </Button>
            <Button asChild variant="secondary" size="sm" className="rounded-xl">
              <Link href={tabItems.find((t) => t.value === tab)?.href ?? '/admin/alerts'}>{copy.openFullPage}</Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <ScrollArea className="-mx-1 w-full max-w-full pb-1">
          <TabsList className="inline-flex h-auto min-h-11 w-max min-w-full flex-nowrap justify-start gap-1 rounded-2xl bg-surface-container-low p-1.5 shadow-sm">
            {tabItems.map((t) => {
              const Icon = t.icon
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="group gap-2 rounded-xl px-3.5 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-on-primary data-[state=active]:shadow-sm"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="whitespace-nowrap">{t.label}</span>
                  {typeof t.badge === 'number' ? <TabBadge value={t.badge} /> : null}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </ScrollArea>

        <TabsContent value="overview" className="mt-8 outline-none">
          {overviewQuery.isError && !overview ? (
            <div
              role="alert"
              className="flex flex-col gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                  <ShieldAlert className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="font-heading text-sm font-bold text-destructive">{copy.overviewLoadFailed}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {overviewQuery.error instanceof Error ? overviewQuery.error.message : null}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl border-destructive/30"
                onClick={() => void overviewQuery.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                {copy.retry}
              </Button>
            </div>
          ) : (
            <AdminAlertsHubOverviewPane data={overview} isLoading={overviewQuery.isLoading} copy={copy} />
          )}
        </TabsContent>

        <TabsContent value="notifications" className="mt-8 outline-none">
          <LazyNotificationCenter embedded />
        </TabsContent>

        <TabsContent value="preferences" className="mt-8 outline-none">
          <LazyNotificationPreferences embedded />
        </TabsContent>

        <TabsContent value="system_alerts" className="mt-8 outline-none">
          <LazySystemAlerts embedded />
        </TabsContent>

        <TabsContent value="policy_db" className="mt-8 outline-none">
          <LazyPolicyDb embedded />
        </TabsContent>
      </Tabs>
    </div>
  )
}
