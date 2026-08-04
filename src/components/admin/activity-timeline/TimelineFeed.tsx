'use client'

import Link from 'next/link'
import * as React from 'react'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { AlertTriangle, ExternalLink, Film, ImageIcon, Trash2 } from 'lucide-react'

import type { AdminActivityTimelineEvent } from '@/types/admin-activity-timeline.types'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

function getInitials(name: string): string {
  const cleaned = name.trim()
  if (!cleaned) return 'S'
  return cleaned[0]?.toUpperCase() ?? 'S'
}

function getDateLabel(createdAt: Date): string {
  if (isToday(createdAt)) return `Today, ${format(createdAt, 'MMM d')}`
  if (isYesterday(createdAt)) return `Yesterday, ${format(createdAt, 'MMM d')}`
  return format(createdAt, 'MMM d, yyyy')
}

function statusChip(success: boolean | undefined): { className: string; label: string } | null {
  if (success === true) return { className: 'bg-emerald-100 text-emerald-800', label: 'Success' }
  if (success === false) return { className: 'bg-red-100 text-red-800', label: 'Failed' }
  return null
}

function MediaEventIcon({ eventType }: { eventType: string }): React.ReactNode {
  if (eventType === 'VIDEO_GENERATED') return <Film className="h-4 w-4 shrink-0 text-violet-600" aria-hidden />
  if (eventType === 'VIDEO_SUPERSEDED') return <Film className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
  if (eventType === 'VIDEO_GENERATION_FAILED') return <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
  if (eventType === 'IMAGE_BATCH_GENERATED') return <ImageIcon className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
  if (eventType === 'MEDIA_CLEANED_UP') return <Trash2 className="h-4 w-4 shrink-0 text-outline" aria-hidden />
  if (eventType === 'AI_PROCESSING_FAILED') return <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
  return null
}

export function TimelineFeed({
  events,
  onLoadOlder,
  hasMore,
  isLoading
}: {
  events: AdminActivityTimelineEvent[]
  onLoadOlder: () => void
  hasMore: boolean
  isLoading: boolean
}) {
  const grouped = React.useMemo(() => {
    const groups: Array<{ label: string; items: AdminActivityTimelineEvent[] }> = []
    for (const e of events) {
      const d = new Date(e.created_at)
      const label = getDateLabel(d)
      const last = groups[groups.length - 1]
      if (!last || last.label !== label) groups.push({ label, items: [e] })
      else last.items.push(e)
    }
    return groups
  }, [events])

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-3" aria-hidden>
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-surface-container-highest animate-pulse" />
              <div className="min-w-0 flex-1">
                <div className="h-4 w-3/4 rounded bg-surface-container animate-pulse" />
                <div className="mt-2 h-3 w-1/2 rounded bg-surface-container-highest animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && events.length === 0 ? <div className="text-sm text-on-surface-variant">No activity found.</div> : null}

      {!isLoading ? (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.label} className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{g.label}</div>
              <div className="space-y-3">
                {g.items.map((e) => {
                  const d = new Date(e.created_at)
                  const who = e.actor?.name ?? (e.source === 'AUTH' ? 'Auth System' : 'System')
                  const initials = getInitials(who)
                  const chip = statusChip(e.success)

                  return (
                    <div key={`${e.source}-${e.id}`} className="flex items-start gap-3">
                      <Avatar className={cn('h-9 w-9', e.source === 'AUTH' ? 'bg-primary-container' : e.source === 'AI' ? 'bg-violet-100' : 'bg-surface-container-lowest')}>
                        {e.actor?.avatarUrl ? <AvatarImage src={e.actor.avatarUrl} alt={who} /> : null}
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <MediaEventIcon eventType={e.event_type} />
                              <div className="text-sm font-semibold text-on-surface">{e.message}</div>
                            </div>
                            <div className="mt-1 text-xs text-on-surface-variant">{Number.isNaN(d.getTime()) ? '—' : formatDistanceToNow(d, { addSuffix: true })}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {chip ? <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium', chip.className)}>{chip.label}</span> : null}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs text-on-surface-variant truncate">
                            {e.event_type ? <span className="font-mono">{e.event_type}</span> : null}
                          </div>

                          {e.resource?.href ? (
                            <Button asChild variant="ghost" className="h-7 px-2 text-xs" size="sm">
                              <Link href={e.resource.href}>
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                                <span className="ml-1">View</span>
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && hasMore ? (
        <div className="flex justify-center pt-6">
          <Button onClick={onLoadOlder} variant="outline" className="rounded-full">
            Load older activity
          </Button>
        </div>
      ) : null}
    </div>
  )
}

