'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SocialPlatformIcon, type SocialPlatformKey } from '@/components/admin/social/social-platform-icon'
import { useAdminSocialQueue } from '@/hooks/admin/useAdminSocialQueue'
import { cn } from '@/lib/utils'

import type { AdminSocialQueueItem } from '@/types/admin-social.types'

function startOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfMonth(date: Date): Date {
  const d = startOfMonth(date)
  d.setMonth(d.getMonth() + 1)
  return d
}

function startOfGrid(date: Date): Date {
  const som = startOfMonth(date)
  const day = som.getDay()
  som.setDate(som.getDate() - day)
  return som
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function groupByDay(posts: AdminSocialQueueItem[]): Map<string, AdminSocialQueueItem[]> {
  const map = new Map<string, AdminSocialQueueItem[]>()
  for (const p of posts) {
    const when = p.scheduledAt ?? p.publishedAt
    if (!when) continue
    const key = new Date(when).toISOString().slice(0, 10)
    const arr = map.get(key) ?? []
    arr.push(p)
    map.set(key, arr)
  }
  return map
}

export function SocialCalendarClient() {
  const [cursor, setCursor] = React.useState<Date>(() => startOfMonth(new Date()))

  const queueScheduled = useAdminSocialQueue({ page: 1, limit: 200, status: 'SCHEDULED' })
  const queuePublished = useAdminSocialQueue({ page: 1, limit: 200, status: 'PUBLISHED' })

  const byDay = React.useMemo(() => {
    const scheduled = queueScheduled.data?.success ? queueScheduled.data.data.items : []
    const published = queuePublished.data?.success ? queuePublished.data.data.items : []
    return groupByDay([...scheduled, ...published])
  }, [queueScheduled.data, queuePublished.data])

  const gridStart = startOfGrid(cursor)
  const today = new Date()
  const days: Date[] = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })
  const isLoading = queueScheduled.isLoading || queuePublished.isLoading

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Content calendar</h1>
          <p className="text-sm text-muted-foreground">Upcoming scheduled and recently published posts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="w-40 text-center font-semibold">{monthLabel}</div>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading calendar…
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <h2 className="text-lg font-semibold">{monthLabel}</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px rounded border text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="bg-muted px-2 py-1 text-center font-semibold text-muted-foreground">
                  {d}
                </div>
              ))}
              {days.map((day) => {
                const key = day.toISOString().slice(0, 10)
                const events = byDay.get(key) ?? []
                const isCurrentMonth = day.getMonth() === cursor.getMonth()
                const isToday = sameDay(day, today)
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex min-h-[110px] flex-col bg-card p-2',
                      !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                      isToday && 'ring-2 ring-primary'
                    )}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">{day.getDate()}</span>
                      {events.length > 0 ? <span className="text-[10px] text-muted-foreground">{events.length}</span> : null}
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
                      {events.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={cn(
                            'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px]',
                            ev.status === 'PUBLISHED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
                          )}
                          title={ev.captionText ?? ''}
                        >
                          <SocialPlatformIcon platform={ev.platform as SocialPlatformKey} className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{ev.captionText?.slice(0, 30) ?? '(no caption)'}</span>
                        </div>
                      ))}
                      {events.length > 3 ? (
                        <div className="text-[10px] text-muted-foreground">+ {events.length - 3} more</div>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
