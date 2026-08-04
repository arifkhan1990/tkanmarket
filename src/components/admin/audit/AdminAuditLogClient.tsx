'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, Loader2, Search } from 'lucide-react'

import { AdminAuditLogBento } from '@/components/admin/audit/admin-audit-log-bento'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { useAuditLogStatsQuery } from '@/hooks/admin/useAuditLogStatsQuery'
import { useAuditLogQuery } from '@/hooks/admin/useAuditLogQuery'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import type { AuditLogListItem } from '@/types/audit-log-admin.types'
import { AdminAuditLogJsonDialog } from '@/components/admin/audit/admin-audit-log-json-dialog'
import { exportAuditLogsCsv, initialsFromActor } from '@/components/admin/audit/admin-audit-log-utils'

function AuditLogSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-surface-container-high" />
      <div className="rounded-xl border border-outline/15 bg-surface-container-lowest">
        <div className="h-12 border-b border-outline/10 bg-surface-container-low" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-[1.4fr_1.6fr_1.2fr_1.4fr_1fr_1.8fr] gap-4 border-b border-outline/10 px-4 py-3">
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
            <div className="h-4 animate-pulse rounded bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AdminAuditLogClient() {
  const { messages } = useI18n()
  const m = messages.admin.auditLogPage
  const filt = messages.admin.securityAuthLog

  const [page, setPage] = useState(1)
  const [draftActor, setDraftActor] = useState('')
  const [actorId, setActorId] = useState<number | undefined>(undefined)
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [draftQ, setDraftQ] = useState('')
  const [q, setQ] = useState('')
  const [selectedRow, setSelectedRow] = useState<AuditLogListItem | null>(null)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)

  const limit = 24

  const params = useMemo(
    () => ({
      page,
      limit,
      actorId,
      action: action || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined
    }),
    [page, limit, actorId, action, from, to, q]
  )

  const query = useAuditLogQuery(params)
  const data = query.data
  const items = data?.items ?? []
  const meta = data?.meta
  const statsQuery = useAuditLogStatsQuery({ rangeDays: 30 })

  const applyFilters = () => {
    const raw = draftActor.trim()
    const n = raw === '' ? NaN : Number(raw)
    setActorId(Number.isFinite(n) && n > 0 ? n : undefined)
    setQ(draftQ.trim() || '')
    setPage(1)
  }

  const resetFilters = () => {
    setDraftActor('')
    setActorId(undefined)
    setAction('')
    setFrom('')
    setTo('')
    setDraftQ('')
    setQ('')
    setPage(1)
  }

  const filterForm = (
    <div className="flex flex-col gap-4 pt-2">
      <div className="min-w-[140px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{m.actorFilter}</label>
        <Input
          value={draftActor}
          onChange={(e) => setDraftActor(e.target.value)}
          inputMode="numeric"
          placeholder="—"
          className="h-10 font-mono"
        />
      </div>
      <div className="min-w-[160px]">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{m.colAction}</label>
        <Input value={action} onChange={(e) => setAction(e.target.value)} className="h-10" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{filt.fromDate}</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{filt.toDate}</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-on-surface-variant">{filt.searchPlaceholder}</label>
        <div className="flex gap-2">
          <Input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder={filt.searchPlaceholder}
            className="h-10"
          />
          <Button type="button" variant="secondary" className="h-10 shrink-0" onClick={applyFilters}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          onClick={() => {
            applyFilters()
            setFilterOpen(false)
          }}
        >
          {filt.applyFilters}
        </Button>
        <Button type="button" variant="outline" onClick={resetFilters}>
          {filt.resetFilters}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <AdminAuditLogBento
        stats={statsQuery.data}
        statsLoading={statsQuery.isLoading && !statsQuery.data}
        onExportCsv={() => exportAuditLogsCsv(items)}
        onOpenFilters={() => setFilterOpen(true)}
        exportDisabled={items.length === 0}
      />

      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{m.title}</SheetTitle>
            <p className="text-sm text-muted-foreground">{m.subtitle}</p>
          </SheetHeader>
          {filterForm}
        </SheetContent>
      </Sheet>

      <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder={filt.searchPlaceholder}
              className="h-10 pl-9"
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={applyFilters}>
            {filt.applyFilters}
          </Button>
        </div>
      </section>

      {query.isLoading && !data ? (
        <AuditLogSkeleton />
      ) : (
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest/80 shadow-sm transition-opacity',
            query.isFetching && 'opacity-70'
          )}
        >
          {query.isFetching && (
            <div className="absolute right-4 top-4 z-10" aria-hidden>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                <TableHead className="font-semibold">{m.colTime}</TableHead>
                <TableHead className="font-semibold">{m.colActor}</TableHead>
                <TableHead className="font-semibold">{m.colAction}</TableHead>
                <TableHead className="font-semibold">{m.colEntity}</TableHead>
                <TableHead className="font-semibold">IP Address</TableHead>
                <TableHead className="text-right font-semibold">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!query.isFetching && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-on-surface-variant">
                    {m.empty}
                  </TableCell>
                </TableRow>
              )}
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-on-surface">
                    {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-xl bg-surface-container-lowest">
                        {row.actor_avatar_url ? <AvatarImage src={row.actor_avatar_url} alt={row.actor_name ?? 'User'} /> : null}
                        <AvatarFallback className="font-mono">{initialsFromActor(row.actor_name, row.actor_email)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{row.actor_name ?? '—'}</div>
                        <div className="truncate font-mono text-xs text-on-surface-variant">{row.actor_email ?? ''}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate font-mono text-xs">{row.action}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs">
                    {row.entity_type}
                    {row.entity_id != null ? ` #${row.entity_id}` : ''}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-on-surface-variant">{row.ip ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Badge
                        intent={row.success ? 'success' : 'error'}
                        className={cn('rounded-full')}
                      >
                        {row.success ? filt.successOk : filt.successFail}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => {
                          setSelectedRow(row)
                          setJsonOpen(true)
                        }}
                      >
                        View JSON
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant">
            {messages.admin.dataTable.showingPage
              .replace('{current}', String(meta.page))
              .replace('{total}', String(meta.totalPages))}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {messages.admin.dataTable.prev}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {messages.admin.dataTable.next}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          onClick={() => exportAuditLogsCsv(items)}
          disabled={items.length === 0}
        >
          <Download className="h-4 w-4" aria-hidden />
          Export CSV
        </Button>
        <Button type="button" variant="outline" className="rounded-xl" onClick={() => window.print()} disabled={items.length === 0}>
          Print audit report
        </Button>
      </div>

      <AdminAuditLogJsonDialog open={jsonOpen} onOpenChange={(o) => setJsonOpen(o)} row={selectedRow} />
    </div>
  )
}
