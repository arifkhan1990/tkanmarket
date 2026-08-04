'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { format } from 'date-fns'
import { Download, Filter, Loader2, Search, Shield, TrendingUp, Verified } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import Link from 'next/link'

import { useAuthSecurityEventsQuery } from '@/hooks/admin/useAuthSecurityEventsQuery'
import { useAuthSecuritySummaryQuery } from '@/hooks/admin/useAuthSecuritySummaryQuery'
import { useI18n } from '@/hooks/useI18n'
import type { AuthSecurityEventListItem } from '@/types/auth-security-events.types'
import { cn } from '@/lib/utils'

function SecurityLogSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[1.5rem] bg-surface-container-high" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-[1.5rem] bg-surface-container-low" />
    </div>
  )
}

function initialsFromEmail(email: string | null): string {
  if (!email || !email.includes('@')) return '??'
  const part = email.split('@')[0] ?? ''
  const segs = part.split(/[._-]/).filter(Boolean)
  if (segs.length >= 2) return (segs[0]![0]! + segs[1]![0]!).toUpperCase()
  return part.slice(0, 2).toUpperCase() || '??'
}

function csvEscape(s: string): string {
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function exportPageCsv(rows: AuthSecurityEventListItem[], m: { colTime: string; colEvent: string; colEmail: string; colUserId: string; colIp: string; colSuccess: string }) {
  const header = [m.colTime, m.colEvent, m.colEmail, m.colUserId, m.colIp, m.colSuccess]
  const lines = [
    header.join(','),
    ...rows.map((row) =>
      [
        csvEscape(format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')),
        csvEscape(row.event_type),
        csvEscape(row.email ?? ''),
        csvEscape(row.user_id != null ? String(row.user_id) : ''),
        csvEscape(row.ip ?? ''),
        csvEscape(row.success ? 'ok' : 'fail')
      ].join(',')
    )
  ].join('\n')
  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `auth-security-events-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminSecurityAuthLogClient() {
  const { messages } = useI18n()
  const m = messages.admin.securityAuthLog

  const [page, setPage] = useState(1)
  const [eventType, setEventType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const [draftQ, setDraftQ] = useState('')

  const limit = 15

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      eventType: eventType || undefined,
      from: from || undefined,
      to: to || undefined,
      q: q || undefined
    }),
    [page, limit, eventType, from, to, q]
  )

  const query = useAuthSecurityEventsQuery(queryParams)
  const summaryQuery = useAuthSecuritySummaryQuery()
  const data = query.data
  const items = data?.items ?? []
  const meta = data?.meta
  const sum = summaryQuery.data

  const applyFilters = () => {
    setQ(draftQ.trim() || '')
    setPage(1)
  }

  const resetFilters = () => {
    setEventType('')
    setFrom('')
    setTo('')
    setDraftQ('')
    setQ('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.title}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{m.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" className="rounded-xl" onClick={() => {}}>
            <Filter className="h-4 w-4" aria-hidden />
            {m.filterView}
          </Button>
          <Button
            type="button"
            className="rounded-xl"
            onClick={() => exportPageCsv(items, m)}
            disabled={items.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden />
            {m.exportCsv}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.06)]">
          <span className="mb-3 text-xs font-bold uppercase tracking-widest text-outline">{m.summaryEvents24h}</span>
          {summaryQuery.isLoading ? (
            <p className="text-sm text-on-surface-variant">{m.summaryLoading}</p>
          ) : (
            <>
              <h3 className="font-mono text-3xl font-extrabold text-primary">{sum?.events24h ?? '—'}</h3>
              <div className="mt-3 flex items-center text-sm font-bold text-emerald-600">
                <TrendingUp className="mr-1 h-4 w-4" aria-hidden />
                {m.summarySuccess24h}: {sum?.success24h ?? '—'}
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col justify-between rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.06)]">
          <span className="mb-3 text-xs font-bold uppercase tracking-widest text-outline">{m.summaryFailed24h}</span>
          {summaryQuery.isLoading ? (
            <p className="text-sm text-on-surface-variant">{m.summaryLoading}</p>
          ) : (
            <>
              <h3 className="font-mono text-3xl font-extrabold text-error">{sum?.failed24h ?? '—'}</h3>
              <p className="mt-3 text-xs font-bold text-error">
                {m.summaryFailedIps.replace('{count}', String(sum?.distinct_failed_ips ?? 0))}
              </p>
            </>
          )}
        </div>
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-slate-900 to-indigo-950 p-6 text-white md:col-span-2">
          <div className="relative z-10 max-w-lg">
            <span className="mb-2 block text-xs font-bold uppercase tracking-widest opacity-70">{m.healthTitle}</span>
            <p className="text-sm leading-relaxed opacity-90">{m.healthBody}</p>
          </div>
          <div className="relative z-10 mt-4 flex justify-end">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-indigo-500/40">
              <Verified className="h-8 w-8" aria-hidden />
            </div>
          </div>
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        </div>
      </section>

      <div className="flex flex-col gap-4 rounded-2xl border border-outline/10 bg-surface-container-lowest p-4 shadow-sm md:flex-row md:flex-wrap md:items-end">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{m.eventType}</label>
          <Input
            value={eventType}
            onChange={(e) => {
              setEventType(e.target.value)
              setPage(1)
            }}
            placeholder={m.eventTypeAll}
            className="h-10 rounded-xl border-none bg-surface-container-highest"
          />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{m.fromDate}</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-xl border-none bg-surface-container-highest" />
        </div>
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{m.toDate}</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-xl border-none bg-surface-container-highest" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-outline">{m.searchPlaceholder}</label>
          <div className="flex gap-2">
            <Input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder={m.searchPlaceholder}
              className="h-10 rounded-xl border-none bg-surface-container-highest"
            />
            <Button type="button" variant="secondary" className="h-10 shrink-0 rounded-xl" onClick={applyFilters}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={resetFilters}>
          {m.resetFilters}
        </Button>
      </div>

      {query.isLoading && !data ? (
        <SecurityLogSkeleton />
      ) : (
        <div
          className={cn(
            'overflow-hidden rounded-[1.5rem] bg-surface-container-lowest shadow-[0_20px_50px_rgba(24,28,32,0.06)] transition-opacity',
            query.isFetching && 'opacity-80'
          )}
        >
          <div className="flex flex-col gap-2 border-b border-surface-container-low bg-surface-container-low/50 px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <h2 className="text-xl font-bold text-on-surface">{m.tableSection}</h2>
            {query.isFetching ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            ) : null}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-none bg-surface-container-low/40 hover:bg-surface-container-low/40">
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-outline">{m.colEmail}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-outline">{m.colEvent}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-outline">{m.colIp}</TableHead>
                  <TableHead className="text-xs font-bold uppercase tracking-widest text-outline">{m.colDuration}</TableHead>
                  <TableHead className="text-right text-xs font-bold uppercase tracking-widest text-outline">{m.colSuccess}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!query.isFetching && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-on-surface-variant">
                      {m.empty}
                    </TableCell>
                  </TableRow>
                )}
                {items.map((row) => (
                  <TableRow key={row.id} className="group border-surface-container-low hover:bg-surface-container-low/60">
                    <TableCell className="align-top">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-fixed text-xs font-bold text-on-primary-fixed">
                          {initialsFromEmail(row.email)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface">{row.email ?? '—'}</div>
                          <div className="text-[10px] text-outline">ID {row.user_id ?? '—'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="text-sm font-medium text-on-surface-variant">{row.event_type}</div>
                      <div className="font-mono text-[10px] uppercase text-outline">
                        {format(new Date(row.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className="font-mono text-xs text-on-surface">{row.ip ?? '—'}</span>
                    </TableCell>
                    <TableCell className="align-top text-sm text-on-surface-variant">—</TableCell>
                    <TableCell className="text-right align-top">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold uppercase',
                          row.success ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        )}
                      >
                        {row.success ? m.successOk : m.successFail}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-container bg-surface-container-low/30 px-6 py-5 md:flex-row md:px-8">
              <p className="text-sm text-outline">
                {messages.admin.dataTable.showingPage
                  .replace('{current}', String(meta.page))
                  .replace('{total}', String(meta.totalPages))}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={meta.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {messages.admin.dataTable.prev}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {messages.admin.dataTable.next}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex h-[320px] flex-col rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.06)] lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface">{m.mapSection}</h2>
            <span className="rounded-full bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">LIVE</span>
          </div>
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl bg-surface-container-high">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMHkjgstw4UuSpgy7y4cGcmkJvrfp5fLRAGvof8xtWUTJxfwTqFUCPgITReDft7Lg0Lboa7s3ySHTsaKBknaykijPf5UOwvyYJJ7a1kPfUNqYIc0J30wlWaLGbHsMUjxaNX-OUqo_lx7AQNutKoPRMwD_6VeEzRUU81Q2omnG_W1KVjl9nvPF-iz44Ivmjt5pM7cG_arwvFZgamSZRJBzjXqvpR7jp80HU4bcR-cJlZUIKsIA3moeqmI6ser-2EVs9FEPfFPI6q_g"
              alt=""
              fill
              className="object-cover opacity-85"
              sizes="(max-width: 1024px) 100vw, 66vw"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-highest/90 to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-xs text-on-surface-variant">{m.mapCaption}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-[0_20px_50px_rgba(24,28,32,0.06)]">
          <h2 className="mb-6 text-xl font-bold text-on-surface">{m.intelTitle}</h2>
          <div className="space-y-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed">
                <Shield className="h-5 w-5 text-primary" aria-hidden />
              </div>
              <p className="text-sm text-on-surface-variant">{m.intelBlock}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary-fixed">
                <span className="text-sm font-bold text-tertiary">!</span>
              </div>
              <p className="text-sm text-on-surface-variant">{m.intelGeo}</p>
            </div>
            <Button variant="outline" className="w-full rounded-xl" asChild>
              <Link href="/admin/access">{m.policyCta}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
