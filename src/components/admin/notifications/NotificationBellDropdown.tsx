'use client'

import * as React from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCheck,
  Loader2,
  MessageSquare,
  Settings,
  UserPlus
} from 'lucide-react'
import { toast } from 'sonner'

import {
  ADMIN_NOTIFICATIONS_PREVIEW_QUERY_KEY,
  useAdminNotificationPreviewQuery,
  useAdminNotificationsMarkReadMutation
} from '@/hooks/admin/useAdminNotifications'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { AdminNotificationRow } from '@/types/admin-notifications.types'

/* ─── Icon map ─────────────────────────────────────────────────── */
function NotificationIcon({ type, highPriority }: { type: string; highPriority: boolean }) {
  const t = type.toLowerCase()
  const base = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl'

  if (t.includes('lead'))
    return (
      <span className={cn(base, 'bg-primary/10')}>
        <UserPlus className="h-4 w-4 text-primary" aria-hidden />
      </span>
    )
  if (t.includes('social'))
    return (
      <span className={cn(base, 'bg-secondary/10')}>
        <MessageSquare className="h-4 w-4 text-secondary" aria-hidden />
      </span>
    )
  if (highPriority || t.includes('crawler') || t.includes('error') || t.includes('fail'))
    return (
      <span className={cn(base, 'bg-error/10')}>
        <AlertTriangle className="h-4 w-4 text-error" aria-hidden />
      </span>
    )
  return (
    <span className={cn(base, 'bg-surface-container-high')}>
      <Bell className="h-4 w-4 text-on-surface-variant" aria-hidden />
    </span>
  )
}

/* ─── Single row ────────────────────────────────────────────────── */
function NotificationRow({
  row,
  onMarkRead
}: {
  row: AdminNotificationRow
  onMarkRead: (id: number) => void
}) {
  const isUnread = row.read_at === null
  const timeAgo = formatDistanceToNow(new Date(row.created_at), { addSuffix: true })

  return (
    <button
      type="button"
      onClick={() => {
        if (isUnread) onMarkRead(row.id)
      }}
      className={cn(
        'group relative flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        'hover:bg-surface-container-high/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        isUnread && 'bg-primary/[0.04]',
        row.is_high_priority && 'bg-error/[0.04]'
      )}
    >
      {/* Left: unread stripe */}
      {isUnread && (
        <span
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-primary"
          aria-hidden
        />
      )}

      <NotificationIcon type={row.type} highPriority={row.is_high_priority} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-1">
          <p
            className={cn(
              'line-clamp-1 text-[13px] font-semibold leading-snug',
              isUnread ? 'text-on-surface' : 'text-on-surface-variant'
            )}
          >
            {row.title}
          </p>
          {isUnread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
          )}
        </div>
        {row.body ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-on-surface-variant">{row.body}</p>
        ) : null}
        <p className="mt-1 text-[10px] tabular-nums text-on-surface-variant/70">{timeAgo}</p>
      </div>
    </button>
  )
}

/* ─── Unread count badge on the bell ───────────────────────────── */
function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null
  const label = count > 99 ? '99+' : String(count)
  return (
    <span
      className={cn(
        'absolute -right-0.5 -top-0.5 flex min-w-[17px] items-center justify-center',
        'rounded-full bg-error px-1 py-px',
        'text-[9px] font-bold leading-none text-white ring-2 ring-background'
      )}
      aria-label={`${count} unread`}
    >
      {label}
    </span>
  )
}

/* ─── Main component ────────────────────────────────────────────── */
export function NotificationBellDropdown() {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()
  const preview = useAdminNotificationPreviewQuery()
  const markMutation = useAdminNotificationsMarkReadMutation()

  const items = preview.data?.items ?? []
  const unreadCount = preview.data?.unreadCount ?? 0
  const isLoading = preview.isLoading && !preview.data

  const handleMarkRead = React.useCallback(
    (id: number) => {
      markMutation.mutate({ ids: [id] })
    },
    [markMutation]
  )

  const handleMarkAllRead = async () => {
    try {
      const result = await markMutation.mutateAsync({ markAllRead: true, category: 'all' })
      toast.success(`${result.updated} notification(s) marked as read`)
      // Optimistic update on preview cache
      await queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_PREVIEW_QUERY_KEY })
    } catch {
      /* error toast handled in mutation hook */
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        >
          <Bell className="h-[1.125rem] w-[1.125rem]" aria-hidden />
          <UnreadBadge count={unreadCount} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0 shadow-lg"
        aria-label="Notification preview"
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-outline/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-on-surface-variant" aria-hidden />
            <span className="text-sm font-semibold text-on-surface">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                {unreadCount > 99 ? '99+' : unreadCount} unread
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-on-surface-variant hover:text-on-surface"
              aria-label="Notification settings"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link href="/admin/alerts?tab=preferences">
                <Settings className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>

        {/* ── Notification list ───────────────────────────── */}
        <div className="max-h-[360px] overflow-y-auto overscroll-contain">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex animate-pulse gap-3 rounded-xl bg-surface-container-high/50 p-3"
                >
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-surface-container-high" />
                  <div className="flex-1 space-y-1.5 py-0.5">
                    <div className="h-3 w-3/4 rounded bg-surface-container-high" />
                    <div className="h-2.5 w-1/2 rounded bg-surface-container-high" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high">
                <BellOff className="h-5 w-5 text-on-surface-variant" aria-hidden />
              </span>
              <p className="text-sm text-on-surface-variant">No notifications yet</p>
            </div>
          ) : (
            <div className="p-2">
              {items.map((row) => (
                <NotificationRow key={row.id} row={row} onMarkRead={handleMarkRead} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-outline/10 px-3 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 rounded-lg px-2.5 text-xs text-on-surface-variant hover:text-on-surface disabled:opacity-40"
            disabled={unreadCount === 0 || markMutation.isPending}
            onClick={() => void handleMarkAllRead()}
            aria-label="Mark all notifications as read"
          >
            {markMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
            )}
            Mark all read
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 rounded-lg px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 hover:text-primary"
            asChild
            onClick={() => setOpen(false)}
          >
            <Link href="/admin/alerts?tab=notifications">
              View all
              <span aria-hidden className="ml-0.5">→</span>
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
