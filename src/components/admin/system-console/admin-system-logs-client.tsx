'use client'

import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAdminSystemLogs } from '@/hooks/admin/useAdminSystemConsole'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { SystemTechnicalLogDto } from '@/types/system-console.types'

function levelBadge(level: SystemTechnicalLogDto['level']) {
  if (level === 'ERROR' || level === 'CRITICAL')
    return 'bg-destructive text-destructive-foreground'
  if (level === 'WARN') return 'bg-amber-600 text-white'
  return 'bg-surface-container-high text-on-surface-variant'
}

export function AdminSystemLogsClient() {
  const { messages } = useI18n()
  const [page, setPage] = useState(1)
  const [level, setLevel] = useState<string>('ALL')
  const [service, setService] = useState('ALL')
  const [q, setQ] = useState('')
  const [draftQ, setDraftQ] = useState('')

  const query = useAdminSystemLogs({
    page,
    limit: 20,
    level,
    service,
    q: q.trim() || undefined,
    includeAnalytics: true
  })

  const data = query.data?.data
  const meta = query.data?.meta

  const maxBar = useMemo(() => {
    const buckets = data?.hourlyBuckets ?? []
    if (!buckets.length) return 1
    return Math.max(1, ...buckets.map((b) => b.count))
  }, [data?.hourlyBuckets])

  if (query.isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-surface-container-high" />
        <div className="h-[480px] animate-pulse rounded-2xl bg-surface-container-lowest" />
      </div>
    )
  }

  if (query.isError || !data) {
    return (
      <p className="text-sm text-destructive">
        {query.error instanceof Error ? query.error.message : messages.admin.systemConsole.loadFailed}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">
          {messages.admin.sidebar.systemLogs}
        </h1>
        <p className="mt-2 text-on-surface-variant">
          Technical log stream with filters. All entries are stored in the database.
        </p>
      </div>

      <section className="flex flex-wrap items-end gap-4 rounded-xl bg-surface-container-low p-4 shadow-sm md:p-6">
        <div className="min-w-[140px] flex-1 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-outline">Log level</label>
          <Select value={level} onValueChange={(v) => { setPage(1); setLevel(v) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All levels</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px] flex-1 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-outline">Service</label>
          <Select value={service} onValueChange={(v) => { setPage(1); setService(v) }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All services</SelectItem>
              {data.services.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full min-w-[200px] flex-1 flex-col gap-2 md:max-w-md">
          <label className="text-xs font-bold uppercase tracking-widest text-outline">Search</label>
          <div className="flex gap-2">
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              placeholder="Message, service, trace ID…"
              className="rounded-xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1)
                  setQ(draftQ)
                }
              }}
            />
            <Button
              type="button"
              className="rounded-xl"
              onClick={() => {
                setPage(1)
                setQ(draftQ)
              }}
            >
              Apply
            </Button>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="rounded-xl"
          onClick={() => {
            setLevel('ALL')
            setService('ALL')
            setDraftQ('')
            setQ('')
            setPage(1)
          }}
        >
          Reset
        </Button>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live window
          </span>
          <span className="text-sm text-on-surface-variant">
            {data.liveEventCount} events in the last {data.liveWindowMinutes} minutes
          </span>
        </div>
      </div>

      <div className="flex max-h-[min(600px,70vh)] flex-col overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b border-outline/10 bg-surface-container-low px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-outline md:px-6">
          <div className="col-span-12 md:col-span-2">Timestamp</div>
          <div className="col-span-4 text-center md:col-span-1">Level</div>
          <div className="col-span-8 md:col-span-2">Service</div>
          <div className="col-span-12 md:col-span-5">Message</div>
          <div className="col-span-12 text-right md:col-span-2">Trace</div>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto font-mono text-[13px] leading-relaxed">
          {data.items.map((row) => (
            <div
              key={row.id}
              className={cn(
                'grid grid-cols-12 gap-2 border-b border-outline/5 px-4 py-3 md:px-6',
                row.level === 'ERROR' || row.level === 'CRITICAL' ? 'bg-destructive/5' : 'hover:bg-surface-container-low/80'
              )}
            >
              <div className="col-span-12 text-on-surface-variant md:col-span-2">
                {new Date(row.occurredAt).toLocaleString()}
              </div>
              <div className="col-span-4 flex justify-center md:col-span-1">
                <span className={cn('rounded px-2 py-0.5 text-[10px] font-bold uppercase', levelBadge(row.level))}>
                  {row.level}
                </span>
              </div>
              <div className="col-span-8 font-medium text-primary md:col-span-2">{row.serviceName}</div>
              <div className="col-span-12 min-w-0 md:col-span-5">
                <p className="truncate text-on-surface">{row.message}</p>
                {row.detailText ? (
                  <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-surface-container-high/80 p-2 text-xs text-destructive">
                    {row.detailText}
                  </pre>
                ) : null}
              </div>
              <div className="col-span-12 text-right text-[11px] text-outline md:col-span-2">{row.traceId}</div>
            </div>
          ))}
        </div>
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <span className="flex items-center px-2 text-sm text-on-surface-variant">
            Page {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 rounded-2xl border border-outline/10 bg-surface-container-lowest p-6 shadow-sm">
          <h3 className="font-heading text-lg font-bold">Event frequency</h3>
          <p className="text-sm text-on-surface-variant">Log volume by hour (last 24h)</p>
          <div className="mt-6 flex h-32 items-end gap-1">
            {(data.hourlyBuckets ?? []).map((b) => (
              <div key={b.hourLabel} className="group relative flex flex-1 flex-col justify-end">
                <div
                  className="w-full rounded-t-md bg-primary/25 transition group-hover:bg-primary"
                  style={{ height: `${Math.max(8, (b.count / maxBar) * 100)}%` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm">
          <div>
            <h3 className="font-heading text-lg font-bold">Log export</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">Use filters and browser print for snapshots.</p>
          </div>
          <Button variant="secondary" className="mt-6 rounded-xl font-bold" type="button">
            Open print view
          </Button>
        </div>
      </div>
    </div>
  )
}
