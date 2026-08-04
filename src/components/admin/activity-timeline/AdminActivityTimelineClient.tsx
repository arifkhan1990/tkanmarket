'use client'

import * as React from 'react'
import { Search, Download } from 'lucide-react'

import type { AdminActivityTimelineEvent } from '@/types/admin-activity-timeline.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { TimelineFeed } from './TimelineFeed'
import { TimelineSidebar } from './TimelineSidebar'
import { useAdminActivityTimelineQuery } from '@/hooks/admin/useAdminActivityTimelineQuery'

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function toCsvValue(v: unknown): string {
  const s = v == null ? '' : String(v)
  const escaped = s.replace(/"/g, '""')
  return `"${escaped}"`
}

function exportEventsJson(events: AdminActivityTimelineEvent[]) {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: events.length,
    events
  }
  downloadText(`activity-timeline-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

function exportEventsCsv(events: AdminActivityTimelineEvent[]) {
  const header = [
    'created_at',
    'source',
    'event_type',
    'message',
    'actor_name',
    'ip',
    'success',
    'resource_label',
    'resource_href'
  ]
  const rows = events.map((e) =>
    [
      e.created_at,
      e.source,
      e.event_type,
      e.message,
      e.actor?.name ?? '',
      e.ip ?? '',
      e.success == null ? '' : String(e.success),
      e.resource?.label ?? '',
      e.resource?.href ?? ''
    ].map(toCsvValue)
  )

  const csv = [header.map(toCsvValue).join(','), ...rows.map((r) => r.join(','))].join('\n')
  downloadText(`activity-timeline-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}

export function AdminActivityTimelineClient() {
  const [draftUserId, setDraftUserId] = React.useState<string>('')
  const [draftQ, setDraftQ] = React.useState<string>('')

  const [userId, setUserId] = React.useState<number | null>(null)
  const [q, setQ] = React.useState<string | null>(null)

  const query = useAdminActivityTimelineQuery({
    userId,
    q,
    pageSize: 20
  })

  const events = query.data?.pages.flatMap((p) => p.events) ?? []
  const sidebar = query.data?.pages[0]?.sidebar

  const applyFilters = () => {
    const raw = draftUserId.trim()
    const parsed = raw === '' ? null : Number(raw)
    setUserId(parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null)
    setQ(draftQ.trim().length > 0 ? draftQ.trim() : null)
  }

  const clearFilters = () => {
    setDraftUserId('')
    setDraftQ('')
    setUserId(null)
    setQ(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">System Activity</h1>
          <p className="text-sm text-on-surface-variant">Real-time event log across the B2B ecosystem.</p>
        </div>

        <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={() => exportEventsJson(events)} disabled={events.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export JSON
            </Button>
            <Button type="button" variant="outline" onClick={() => exportEventsCsv(events)} disabled={events.length === 0}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
        </div>
      </header>

      <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="w-[160px]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">User ID</label>
              <Input
                value={draftUserId}
                onChange={(e) => setDraftUserId(e.target.value)}
                inputMode="numeric"
                placeholder="—"
                className="h-10 mt-1"
              />
            </div>

            <div className="min-w-[220px] flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Search</label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" aria-hidden />
                <Input value={draftQ} onChange={(e) => setDraftQ(e.target.value)} placeholder="Search event type, action, message..." className="h-10 pl-9" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-10" onClick={applyFilters}>
              Apply
            </Button>
            <Button type="button" variant="ghost" className="h-10" onClick={clearFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="font-heading text-lg font-extrabold text-on-surface">Timeline</div>
                <div className="text-sm text-on-surface-variant">Date grouped events.</div>
              </div>
            </div>

            <TimelineFeed
              events={events}
              isLoading={query.isLoading}
              hasMore={Boolean(query.hasNextPage)}
              onLoadOlder={() => {
                void query.fetchNextPage()
              }}
            />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <TimelineSidebar sidebar={sidebar} isLoading={query.isLoading} />
        </div>
      </div>
    </div>
  )
}

