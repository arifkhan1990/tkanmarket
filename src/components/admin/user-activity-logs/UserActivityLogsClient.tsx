'use client'

import * as React from 'react'
import { Download, RefreshCw, Search } from 'lucide-react'

import type { UserActivityLogItem } from '@/types/user-activity-logs.types'
import type { UserActivityActionType } from '@/types/user-activity-logs.types'
import { USER_ACTIVITY_ACTION_TYPE_OPTIONS } from '@/types/user-activity-logs.types'

import { useAdminUserActivityLogsQuery } from '@/hooks/admin/useAdminUserActivityLogsQuery'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { UserActivityMetricsCards } from './UserActivityMetricsCards'
import { UserActivityLogsTable } from './UserActivityLogsTable'
import { AdminUserActivityLogJsonDialog } from './AdminUserActivityLogJsonDialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

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

function exportPageAsJson(events: UserActivityLogItem[]) {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: events.length,
    events
  }
  downloadText(`user-activity-logs-${Date.now()}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8')
}

function exportPageAsCsv(events: UserActivityLogItem[]) {
  const header = ['created_at', 'source', 'action_event', 'resource_id', 'ip', 'success']
  const rows = events.map((e) => [e.created_at, e.source, e.action_event, e.resource_id, e.ip ?? '', e.success].map(toCsvValue))
  const csv = [header.map(toCsvValue).join(','), ...rows.map((r) => r.join(','))].join('\n')
  downloadText(`user-activity-logs-${Date.now()}.csv`, csv, 'text/csv;charset=utf-8')
}

function initials(name: string | null | undefined): string {
  const t = (name ?? '').trim()
  return t[0]?.toUpperCase() ?? 'U'
}

function UserActivityLogsPageSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <div className="h-10 w-56 animate-pulse rounded bg-surface-container-highest" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-surface-container-highest" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-10 w-36 animate-pulse rounded bg-surface-container-highest" />
          <div className="h-10 w-36 animate-pulse rounded bg-surface-container-highest" />
        </div>
      </header>

      <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="h-10 w-full animate-pulse rounded bg-surface-container-highest" />
            <div className="h-10 w-full animate-pulse rounded bg-surface-container-highest" />
            <div className="h-10 w-full animate-pulse rounded bg-surface-container-highest" />
          </div>
          <div className="h-10 w-full animate-pulse rounded bg-surface-container-highest" />
          <div className="flex flex-wrap gap-2">
            <div className="h-10 w-24 animate-pulse rounded bg-surface-container-highest" />
            <div className="h-10 w-24 animate-pulse rounded bg-surface-container-highest" />
            <div className="h-10 w-24 animate-pulse rounded bg-surface-container-highest" />
          </div>
        </div>
      </Card>

      <UserActivityMetricsCards metrics={undefined} lastSeenAt={null} isLoading />
      <UserActivityLogsTable
        items={[]}
        meta={null}
        page={1}
        onPageChange={(p: number) => {
          void p
        }}
        isLoading
        userName={null}
        onViewJson={(_row) => {
          // no-op
        }}
      />
    </div>
  )
}

export function UserActivityLogsClient() {
  const [draftUserId, setDraftUserId] = React.useState<string>('')
  const [appliedUserId, setAppliedUserId] = React.useState<number | null>(null)
  const [draftQ, setDraftQ] = React.useState<string>('')
  const [q, setQ] = React.useState<string | null>(null)
  const [draftActionType, setDraftActionType] = React.useState<UserActivityActionType>('ALL')
  const [appliedActionType, setAppliedActionType] = React.useState<UserActivityActionType>('ALL')
  const [range, setRange] = React.useState<'24h' | '7d' | '30d'>('24h')
  const [page, setPage] = React.useState(1)
  const limit = 24

  const { from, to } = React.useMemo(() => {
    const now = new Date()
    const days = range === '24h' ? 1 : range === '7d' ? 7 : 30
    const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return { from: fromDate, to: now }
  }, [range])

  const query = useAdminUserActivityLogsQuery({
    userId: appliedUserId,
    page,
    limit,
    from,
    to,
    q,
    actionType: appliedActionType
  })

  const data = query.data
  const items = data?.items ?? []
  const meta = data?.meta ?? null
  const metrics = data?.metrics
  const user = data?.user

  const [selectedRow, setSelectedRow] = React.useState<UserActivityLogItem | null>(null)
  const [jsonOpen, setJsonOpen] = React.useState(false)

  const onViewJson = (row: UserActivityLogItem) => {
    setSelectedRow(row)
    setJsonOpen(true)
  }

  const applyFilters = () => {
    const raw = draftUserId.trim()
    if (raw.length === 0) setAppliedUserId(null)
    else {
      const n = Number(raw)
      setAppliedUserId(Number.isFinite(n) && n > 0 ? n : null)
    }
    setQ(draftQ.trim().length > 0 ? draftQ.trim() : null)
    setAppliedActionType(draftActionType)
    setPage(1)
  }

  const resetFilters = () => {
    setDraftUserId('')
    setDraftQ('')
    setAppliedUserId(null)
    setQ(null)
    setDraftActionType('ALL')
    setAppliedActionType('ALL')
    setRange('24h')
    setPage(1)
  }

  if (query.isLoading && !data) {
    return <UserActivityLogsPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight text-on-surface">Activity Logs</h1>
          <p className="text-sm text-on-surface-variant">
            {user ? (
              <>
                Detailed audit trail and performance metrics for <span className="font-semibold text-on-surface">{user.name ?? 'User'}</span>{' '}
                <span className="font-mono text-on-surface-variant">(UID: {user.id})</span>
              </>
            ) : (
              'Detailed audit trail and performance metrics for the selected admin user.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => exportPageAsJson(items)} disabled={items.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            Export JSON
          </Button>
          <Button type="button" variant="outline" onClick={() => exportPageAsCsv(items)} disabled={items.length === 0}>
            <Download className="h-4 w-4" aria-hidden />
            Export CSV
          </Button>
        </div>
      </header>

      <Card className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="w-[190px]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                User ID
              </label>
              <Input
                value={draftUserId}
                onChange={(e) => setDraftUserId(e.target.value)}
                inputMode="numeric"
                placeholder="(empty = current admin)"
                className="h-10 mt-1"
              />
            </div>

            <div className="min-w-[240px] flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                Search
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" aria-hidden />
                <Input
                  value={draftQ}
                  onChange={(e) => setDraftQ(e.target.value)}
                  placeholder="Action, event type, ip..."
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="w-[220px]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">Action Type</label>
              <Select
                value={draftActionType}
                onValueChange={(v) => setDraftActionType(v as UserActivityActionType)}
              >
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ACTIVITY_ACTION_TYPE_OPTIONS.map((t) => {
                    const label =
                      t === 'ALL'
                        ? 'All Actions'
                        : t === 'FABRIC_APPROVAL'
                          ? 'Fabric Approval'
                          : t === 'LEAD_ASSIGNED'
                            ? 'Lead Assignment'
                            : t === 'USER_PERMISSIONS'
                              ? 'User Permissions'
                              : 'Supplier Verification'
                    return (
                      <SelectItem key={t} value={t}>
                        {label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={range === '24h' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => {
                  setRange('24h')
                  setPage(1)
                }}
              >
                Last 24 Hours
              </Button>
              <Button
                type="button"
                variant={range === '7d' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => {
                  setRange('7d')
                  setPage(1)
                }}
              >
                Last 7 Days
              </Button>
              <Button
                type="button"
                variant={range === '30d' ? 'default' : 'outline'}
                className="h-10"
                onClick={() => {
                  setRange('30d')
                  setPage(1)
                }}
              >
                Last 30 Days
              </Button>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="h-10" onClick={applyFilters}>
                Apply
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={() => {
                  void query.refetch()
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                Refresh
              </Button>
              <Button type="button" variant="ghost" className="h-10" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <UserActivityMetricsCards metrics={metrics} lastSeenAt={metrics?.last_seen_at ?? null} isLoading={query.isLoading && !data} />

      <UserActivityLogsTable
        items={items}
        meta={meta}
        page={page}
        onPageChange={(p) => setPage(p)}
        isLoading={query.isLoading && !data}
        userName={user?.name ?? null}
        onViewJson={onViewJson}
      />

      <AdminUserActivityLogJsonDialog
        open={jsonOpen}
        onOpenChange={setJsonOpen}
        user={user ?? null}
        row={selectedRow}
      />
    </div>
  )
}

