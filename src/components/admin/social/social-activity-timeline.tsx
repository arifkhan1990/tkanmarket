'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Ban,
  BarChart3,
  CalendarClock,
  CalendarOff,
  CheckCircle2,
  FilePlus2,
  Link2,
  PencilLine,
  RotateCcw,
  Send,
  XCircle
} from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useI18n } from '@/hooks/useI18n'

interface ActivityItem {
  id: number
  postId: number | null
  action: string
  actorUserId: number | null
  actorName: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

const ACTION_META: Record<string, { icon: typeof CheckCircle2; color: string; key: string }> = {
  CREATED: { icon: FilePlus2, color: 'text-sky-600 bg-sky-50', key: 'activityCreated' },
  UPDATED: { icon: PencilLine, color: 'text-slate-600 bg-slate-100', key: 'activityUpdated' },
  APPROVED: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', key: 'activityApproved' },
  SCHEDULED: { icon: CalendarClock, color: 'text-blue-600 bg-blue-50', key: 'activityScheduled' },
  UNSCHEDULED: { icon: CalendarOff, color: 'text-slate-600 bg-slate-100', key: 'activityUnscheduled' },
  PUBLISHED: { icon: Send, color: 'text-violet-600 bg-violet-50', key: 'activityPublished' },
  FAILED: { icon: XCircle, color: 'text-red-600 bg-red-50', key: 'activityFailed' },
  REJECTED: { icon: Ban, color: 'text-red-600 bg-red-50', key: 'activityRejected' },
  REOPENED: { icon: RotateCcw, color: 'text-amber-600 bg-amber-50', key: 'activityReopened' },
  ANALYTICS_SYNCED: { icon: BarChart3, color: 'text-teal-600 bg-teal-50', key: 'activityAnalyticsSynced' },
  CREDENTIALS_CONNECTED: { icon: Link2, color: 'text-slate-600 bg-slate-100', key: 'activityCredentialsConnected' },
  CREDENTIALS_DISCONNECTED: { icon: Link2, color: 'text-slate-600 bg-slate-100', key: 'activityCredentialsDisconnected' },
  CREDENTIALS_REFRESHED: { icon: Link2, color: 'text-slate-600 bg-slate-100', key: 'activityCredentialsRefreshed' }
}

export function SocialActivityTimeline({ postId }: { postId: number }) {
  const { messages } = useI18n()
  const p = messages.admin.socialPreviewPage

  const { data, isLoading } = useQuery<{ id: number; activity: ActivityItem[] }>({
    queryKey: ['social-activity', postId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/social/${postId}/activity`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load activity')
      return json.data
    }
  })

  const activity = data?.activity ?? []

  if (isLoading) {
    return <div className="text-xs text-slate-400">Loading activity...</div>
  }

  if (activity.length === 0) {
    return <div className="text-xs text-slate-400">{p.activityEmpty}</div>
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-semibold text-slate-900">
            {p.activityTitle} ({activity.length})
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5 before:absolute before:left-[13px] before:top-1 before:bottom-1 before:w-px before:bg-slate-200">
          {activity.map((item) => {
            const meta = ACTION_META[item.action] ?? { icon: Activity, color: 'text-slate-600 bg-slate-100', key: 'activityUpdated' }
            const Icon = meta.icon
            const label = (p as unknown as Record<string, string>)[meta.key] ?? item.action
            const details = item.details ?? {}
            return (
              <li key={item.id} className="relative flex gap-3 pl-0">
                <span className={`relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-xs font-semibold text-slate-800">{label}</span>
                    {item.actorName ? (
                      <span className="text-[11px] text-slate-400">
                        {p.activityBy.replace('{name}', item.actorName)}
                      </span>
                    ) : null}
                    <span className="text-[11px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                  {item.action === 'FAILED' && details.error ? (
                    <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700">{String(details.error)}</p>
                  ) : null}
                  {item.action === 'PUBLISHED' && details.platformPostUrl ? (
                    <a
                      href={String(details.platformPostUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block max-w-full truncate text-[11px] font-medium text-violet-700 hover:underline"
                    >
                      {String(details.platformPostUrl)}
                    </a>
                  ) : null}
                  {item.action === 'REJECTED' && details.reason ? (
                    <p className="mt-1 text-[11px] text-slate-500">“{String(details.reason)}”</p>
                  ) : null}
                  {item.action === 'REOPENED' && details.restoredRevisionNumber ? (
                    <p className="mt-1 text-[11px] text-slate-500">
                      rev {String(details.restoredRevisionNumber)}
                    </p>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
