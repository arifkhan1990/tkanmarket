'use client'

import Link from 'next/link'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import {
  Activity,
  ArrowRight,
  FileText,
  Package,
  UserPlus,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useAdminActivityFeed } from '@/hooks/admin/useAdminActivityFeed'
import { useI18n } from '@/hooks/useI18n'

interface EventStyle {
  icon: React.ElementType
  bg: string
  text: string
}

function styleForType(eventType: string): EventStyle {
  const t = eventType.toUpperCase()
  if (t.includes('CREATED') || t.includes('SEED_CREATED'))
    return { icon: Plus, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' }
  if (t.includes('STATUS'))
    return { icon: Activity, bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400' }
  if (t.includes('ASSIGN'))
    return { icon: UserPlus, bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400' }
  if (t.includes('NOTE'))
    return { icon: FileText, bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-600 dark:text-violet-400' }
  if (t.includes('APPROVED') || t.includes('PUBLISHED'))
    return { icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400' }
  if (t.includes('REJECTED') || t.includes('FAILED'))
    return { icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-950/40', text: 'text-red-600 dark:text-red-400' }
  if (t.includes('UPDATED'))
    return { icon: RefreshCw, bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-600 dark:text-sky-400' }
  if (t.includes('FABRIC'))
    return { icon: Package, bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-600 dark:text-indigo-400' }
  return { icon: Wrench, bg: 'bg-surface-container-high', text: 'text-on-surface-variant' }
}

function getDateLabel(date: Date): string {
  if (isToday(date)) return `Today, ${format(date, 'MMM d')}`
  if (isYesterday(date)) return `Yesterday, ${format(date, 'MMM d')}`
  return format(date, 'MMM d, yyyy')
}

interface DateGroup {
  label: string
  items: Array<{ id: string; event_type: string; message: string; created_at: string }>
}

export function ActivityFeed() {
  const query = useAdminActivityFeed()
  const { messages } = useI18n()
  const a = messages.admin.activityFeed

  const grouped: DateGroup[] = []
  if (query.data) {
    for (const e of query.data) {
      const d = new Date(e.created_at)
      const label = Number.isNaN(d.getTime()) ? '—' : getDateLabel(d)
      const last = grouped[grouped.length - 1]
      if (!last || last.label !== label) grouped.push({ label, items: [e] })
      else last.items.push(e)
    }
  }

  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-5 shadow-sm dark:border-outline/15">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-extrabold tracking-tight text-on-surface">{a.title}</h2>
          <p className="mt-0.5 text-xs text-on-surface-variant">{a.subtitle}</p>
        </div>
        <Link
          href="/admin/activity-timeline"
          className="inline-flex items-center gap-1.5 rounded-full border border-outline/15 bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 hover:border-primary/30"
        >
          {a.viewAll}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {query.isLoading ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-surface-container-high animate-pulse" />
              <div className="flex-1 space-y-2 pt-0.5">
                <div className="h-4 w-3/4 rounded bg-surface-container-high animate-pulse" />
                <div className="h-3 w-1/4 rounded bg-surface-container-high animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-high">
            <Activity className="h-5 w-5 text-on-surface-variant" aria-hidden />
          </div>
          <p className="text-sm text-on-surface-variant">{a.empty}</p>
        </div>
      ) : null}

      {!query.isLoading && grouped.length > 0 ? (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {group.label}
              </div>
              <div className="space-y-1">
                {group.items.map((e, index) => {
                  const style = styleForType(e.event_type)
                  const Icon = style.icon
                  const createdAt = new Date(e.created_at)
                  const rowKey = `${String(e.id)}-${e.created_at}-${index}`

                  return (
                    <div
                      key={rowKey}
                      className="group flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-surface-container-high/60"
                    >
                      <div
                        className={cn(
                          'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          style.bg,
                          style.text
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-on-surface leading-snug">{e.message}</p>
                        <p className="mt-0.5 text-xs text-on-surface-variant">
                          {Number.isNaN(createdAt.getTime())
                            ? '—'
                            : formatDistanceToNow(createdAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
