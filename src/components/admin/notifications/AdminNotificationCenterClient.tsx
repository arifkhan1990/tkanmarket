'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Bell, CheckCheck, Loader2, MessageSquare, Settings, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { useAdminNotificationsMarkReadMutation, useAdminNotificationsQuery } from '@/hooks/admin/useAdminNotifications'
import { useI18n } from '@/hooks/useI18n'
import type { AdminNotificationCategoryFilter, AdminNotificationRow } from '@/types/admin-notifications.types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { NotificationCenterSkeleton } from './notification-center-skeleton'

function typeLabel(type: string, labels: { system: string; leads: string; social: string }): string {
  const t = type.toLowerCase()
  if (t.includes('lead')) return labels.leads
  if (t.includes('social')) return labels.social
  return labels.system
}

function NotificationIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (t.includes('lead')) return <UserPlus className="h-6 w-6 text-primary" aria-hidden />
  if (t.includes('social')) return <MessageSquare className="h-6 w-6 text-on-surface-variant" aria-hidden />
  if (t.includes('crawler') || t.includes('error')) return <AlertTriangle className="h-6 w-6 text-error" aria-hidden />
  return <Bell className="h-6 w-6 text-secondary" aria-hidden />
}

export function AdminNotificationCenterClient({ embedded = false }: { embedded?: boolean }) {
  const { messages } = useI18n()
  const p = messages.admin.notificationCenterPage
  const typeLabels = { system: p.filterSystem, leads: p.filterLeads, social: p.filterSocial }

  const [category, setCategory] = React.useState<AdminNotificationCategoryFilter>('all')
  const [page, setPage] = React.useState(1)
  const limit = 15

  React.useEffect(() => {
    setPage(1)
  }, [category])

  const query = useAdminNotificationsQuery({ page, limit, category })
  const markMutation = useAdminNotificationsMarkReadMutation()

  const items = query.data?.data.items ?? []
  const meta = query.data?.meta
  const totalPages = meta?.totalPages ?? 1

  const onMarkAllRead = async () => {
    try {
      const r = await markMutation.mutateAsync({ markAllRead: true, category })
      toast.success(p.toastMarkedRead.replace('{count}', String(r.updated)))
    } catch {
      /* toast in hook */
    }
  }

  const markSingleRead = async (row: AdminNotificationRow) => {
    if (row.read_at) return
    try {
      await markMutation.mutateAsync({ ids: [row.id] })
    } catch {
      /* handled */
    }
  }

  if (query.isLoading && !query.data) {
    return <NotificationCenterSkeleton embedded={embedded} />
  }

  return (
    <div className={embedded ? '' : 'mx-auto max-w-3xl'}>
      {!embedded ? (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">{p.title}</h1>
            <p className="mt-1 text-on-surface-variant">{p.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="shrink-0 gap-2">
            <Link href="/admin/notification-settings">
              <Settings className="h-4 w-4" aria-hidden />
              {p.settingsLink}
            </Link>
          </Button>
        </div>
      ) : null}

      <div
        className={cn(
          'mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
          embedded && 'rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-4 dark:border-outline/15'
        )}
      >
        <div className="flex flex-wrap gap-1 rounded-xl bg-surface-container-low p-1 ring-1 ring-outline/5">
          {(
            [
              ['all', p.filterAll],
              ['system', p.filterSystem],
              ['leads', p.filterLeads],
              ['social', p.filterSocial]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                category === key
                  ? 'bg-surface-container-lowest text-primary shadow-sm ring-1 ring-primary/15'
                  : 'text-on-surface-variant hover:bg-surface-container-high/80'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-2 rounded-xl shadow-sm"
            disabled={markMutation.isPending || items.length === 0}
            onClick={() => void onMarkAllRead()}
          >
            {markMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            {p.markRead}
          </Button>
        </div>
      </div>

      <ul className="space-y-4">
        {items.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => void markSingleRead(row)}
              className={cn(
                'group relative w-full rounded-2xl border border-outline/15 bg-surface-container-lowest p-5 text-left transition-all hover:shadow-md',
                row.is_high_priority && 'border-l-4 border-l-error bg-error-container/15',
                !row.read_at && 'ring-1 ring-primary/15'
              )}
            >
              <div className="flex gap-4">
                <div
                  className={cn(
                    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-container-low',
                    row.is_high_priority && 'bg-error/10'
                  )}
                >
                  <NotificationIcon type={row.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="font-heading text-base font-bold text-on-surface">{row.title}</h2>
                    {!row.read_at ? (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label={p.unread} />
                    ) : null}
                  </div>
                  {row.body ? <p className="mt-1 text-sm text-on-surface-variant">{row.body}</p> : null}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                    <span className="rounded-md bg-primary-fixed/40 px-2 py-0.5 font-mono font-semibold text-on-primary-fixed-variant">
                      {typeLabel(row.type, typeLabels)}
                    </span>
                    <span className="flex items-center gap-1">
                      {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {items.length === 0 && !query.isFetching ? (
        <p className="py-12 text-center text-on-surface-variant">{p.empty}</p>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-10 flex justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1 || query.isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {p.prev}
          </Button>
          <span className="flex items-center px-2 text-sm text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages || query.isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {p.next}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
