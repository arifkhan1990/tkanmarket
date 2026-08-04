'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowUpDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Search,
  Users
} from 'lucide-react'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { LeadSummary } from '@/types/lead.types'
import type { LeadStatus, LeadSource } from '@/types/marketplace.types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

/* ─── Status colour map ─────────────────────────────────────────── */
const STATUS_CLS: Record<LeadStatus, string> = {
  NEW:           'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
  CONTACTED:     'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  QUALIFIED:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  PROPOSAL_SENT: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
  NEGOTIATING:   'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300',
  CLOSED_WON:    'bg-emerald-100 text-emerald-800 font-bold dark:bg-emerald-950/60 dark:text-emerald-200',
  CLOSED_LOST:   'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
}

const SOURCE_CLS: Record<string, string> = {
  MARKETPLACE_INQUIRY: 'bg-primary/10 text-primary',
  SAMPLE_REQUEST:      'bg-amber-100 text-amber-700',
  SOCIAL_CAMPAIGN:     'bg-emerald-100 text-emerald-700',
  DIRECT_CONTACT:      'bg-secondary/10 text-secondary',
  MANUAL_ENTRY:        'bg-surface-container-high text-on-surface-variant'
}

const PAGE_SIZES = [10, 20, 50, 100] as const

/* ─── Smart page range builder ───────────────────────────────────── */
/** Returns an array of page numbers and 'ellipsis' sentinels */
function buildPageRange(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const range: (number | 'ellipsis')[] = [1]

  const start = Math.max(2, current - 2)
  const end   = Math.min(total - 1, current + 2)

  if (start > 2) range.push('ellipsis')
  for (let p = start; p <= end; p++) range.push(p)
  if (end < total - 1) range.push('ellipsis')

  range.push(total)
  return range
}

/* ─── Skeleton ───────────────────────────────────────────────────── */
function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm">
      <div className="border-b border-outline/10 bg-surface-container-low/50 px-4 py-3">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
      </div>
      <div className="divide-y divide-outline/8">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-3 w-5 animate-pulse rounded bg-surface-container-high" />
            <div className="flex flex-1 gap-4">
              <div className="h-3 w-32 animate-pulse rounded bg-surface-container-high" />
              <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
              <div className="h-3 w-36 animate-pulse rounded bg-surface-container-high" />
            </div>
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-container-high" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-surface-container-high" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Column header ──────────────────────────────────────────────── */
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-on-surface-variant',
        className
      )}
    >
      {children}
    </th>
  )
}

/* ─── Page size selector ─────────────────────────────────────────── */
function PageSizeSelect({
  value,
  onChange,
  disabled
}: {
  value: number
  onChange: (n: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-on-surface-variant">Rows</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className={cn(
          'h-8 rounded-xl border border-outline/20 bg-surface-container-lowest px-2.5 py-0',
          'text-xs font-semibold text-on-surface shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        {PAGE_SIZES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  )
}

/* ─── Go-to-page input ───────────────────────────────────────────── */
function GoToPage({
  totalPages,
  onGo,
  disabled
}: {
  totalPages: number
  onGo: (p: number) => void
  disabled?: boolean
}) {
  const [val, setVal] = React.useState('')

  function commit() {
    const n = parseInt(val, 10)
    if (!Number.isNaN(n) && n >= 1 && n <= totalPages) {
      onGo(n)
      setVal('')
    }
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-xs text-on-surface-variant">Go to</span>
      <input
        type="number"
        min={1}
        max={totalPages}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        onBlur={commit}
        placeholder="—"
        disabled={disabled}
        className={cn(
          'h-8 w-14 rounded-xl border border-outline/20 bg-surface-container-lowest px-2.5',
          'text-center text-xs font-semibold text-on-surface shadow-sm tabular-nums',
          'focus:outline-none focus:ring-2 focus:ring-primary/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        )}
      />
    </div>
  )
}

/* ─── Props ──────────────────────────────────────────────────────── */
interface LeadTableViewProps {
  q?: string
  status?: LeadStatus | ''
  source?: LeadSource | ''
  assignedToId?: string
}

/* ─── Main component ─────────────────────────────────────────────── */
export function LeadTableView({ q, status, source, assignedToId }: LeadTableViewProps) {
  const { messages } = useI18n()
  const t = messages.admin.leads.table

  const [page, setPage]         = React.useState(1)
  const [pageSize, setPageSize] = React.useState<number>(20)

  /* Reset to page 1 whenever any filter or page-size changes */
  React.useEffect(() => { setPage(1) }, [q, status, source, assignedToId, pageSize])

  const queryKey = ['admin-leads-table', { page, pageSize, q, status, source, assignedToId }] as const

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page',  String(page))
      sp.set('limit', String(pageSize))
      if (q?.trim())    sp.set('q', q.trim())
      if (status)        sp.set('status', status)
      if (source)        sp.set('source', source)
      if (assignedToId)  sp.set('assigned_to_id', assignedToId)

      const res  = await fetch(`/api/v1/admin/leads?${sp.toString()}`, { credentials: 'same-origin' })
      const json = (await res.json()) as ApiEnvelope<{ items: LeadSummary[]; total: number }> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : t.failedToLoad)
      }
      return json
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : t.failedToLoad)
  }, [query.error, t.failedToLoad])

  if (query.isLoading && !query.data) return <TableSkeleton rows={pageSize > 20 ? 12 : 8} />

  const items: LeadSummary[] = query.data?.success ? query.data.data.items : []
  const meta                  = query.data?.success ? query.data.meta : undefined
  const total                 = meta?.total ?? (query.data?.success ? query.data.data.total : 0)
  const totalPages            = meta?.totalPages ?? Math.max(1, Math.ceil(total / pageSize))
  const isEmpty               = items.length === 0 && !query.isFetching

  /* Range display: "41 – 60 of 156" */
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeTo   = Math.min(page * pageSize, total)

  const pageRange = buildPageRange(page, totalPages)

  function goToPage(p: number) {
    setPage(Math.max(1, Math.min(totalPages, p)))
  }

  return (
    <div className="space-y-3">
      {/* ── Table ───────────────────────────────────────────────── */}
      <div
        className={cn(
          'overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest shadow-sm',
          'transition-opacity duration-150',
          query.isFetching && !query.isLoading && 'opacity-60'
        )}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-outline/10 bg-surface-container-low/60">
              <tr>
                <Th className="w-12">#</Th>
                <Th>{t.company}</Th>
                <Th className="hidden sm:table-cell">{t.contact}</Th>
                <Th className="hidden md:table-cell">{t.email}</Th>
                <Th className="hidden lg:table-cell">{t.source}</Th>
                <Th>{t.status}</Th>
                <Th className="hidden xl:table-cell">{t.country}</Th>
                <Th className="hidden xl:table-cell">{t.assigned}</Th>
                <Th className="hidden lg:table-cell">
                  <span className="flex items-center gap-1">
                    {t.created}
                    <ArrowUpDown className="h-3 w-3 text-outline" aria-hidden />
                  </span>
                </Th>
                <Th className="text-right">{t.actions}</Th>
              </tr>
            </thead>

            <tbody className="divide-y divide-outline/8">
              {isEmpty ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      {q ? (
                        <>
                          <Search className="h-8 w-8 text-outline" />
                          <p className="text-sm font-medium text-on-surface-variant">
                            No results for &ldquo;<span className="text-on-surface">{q}</span>&rdquo;
                          </p>
                          <p className="text-xs text-outline">Try different keywords or clear the search</p>
                        </>
                      ) : (
                        <>
                          <Users className="h-8 w-8 text-outline" />
                          <p className="text-sm font-medium text-on-surface-variant">No leads match the current filters</p>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((lead) => {
                  const assignee = lead.assignedTo
                  const initials = (assignee?.name?.trim()[0] ?? '—').toUpperCase()

                  return (
                    <tr
                      key={lead.id}
                      className="group transition-colors hover:bg-surface-container-low/40"
                    >
                      {/* ID */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-on-surface-variant">#{lead.id}</span>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3">
                        <p className="max-w-[140px] truncate font-semibold text-on-surface">
                          {lead.companyName}
                        </p>
                      </td>

                      {/* Contact */}
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <p className="max-w-[120px] truncate text-on-surface-variant">
                          {lead.contactName}
                        </p>
                      </td>

                      {/* Email */}
                      <td className="hidden px-4 py-3 md:table-cell">
                        <a
                          href={`mailto:${lead.email}`}
                          className="max-w-[180px] truncate text-xs text-primary underline-offset-2 hover:underline"
                        >
                          {lead.email}
                        </a>
                      </td>

                      {/* Source */}
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            SOURCE_CLS[lead.source] ?? 'bg-surface-container-high text-on-surface-variant'
                          )}
                        >
                          {lead.source.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                            STATUS_CLS[lead.status] ?? 'bg-surface-container-high text-on-surface-variant'
                          )}
                        >
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Country */}
                      <td className="hidden px-4 py-3 xl:table-cell">
                        <span className="text-xs text-on-surface-variant">{lead.country}</span>
                      </td>

                      {/* Assigned */}
                      <td className="hidden px-4 py-3 xl:table-cell">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              {assignee.avatarUrl ? (
                                <AvatarImage src={assignee.avatarUrl} alt={assignee.name} />
                              ) : null}
                              <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                            </Avatar>
                            <span className="max-w-[90px] truncate text-xs text-on-surface-variant">
                              {assignee.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-outline">—</span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="font-mono text-xs tabular-nums text-on-surface-variant">
                          {lead.createdAt.slice(0, 10)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                          aria-label={t.view}
                        >
                          <Link href={`/admin/leads/${lead.id}`}>
                            {t.view}
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination bar — always visible when data is available ── */}
      {!isEmpty && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline/10 bg-surface-container-lowest px-4 py-3 shadow-sm">

          {/* Left: record range + page size selector */}
          <div className="flex items-center gap-4">
            <p className="text-xs text-on-surface-variant">
              {total === 0 ? (
                'No results'
              ) : (
                <>
                  <span className="font-semibold tabular-nums text-on-surface">{rangeFrom}–{rangeTo}</span>
                  {' of '}
                  <span className="font-semibold tabular-nums text-on-surface">{total}</span>
                  {' leads'}
                </>
              )}
            </p>
            <PageSizeSelect
              value={pageSize}
              onChange={(n) => { setPageSize(n) }}
              disabled={query.isFetching}
            />
          </div>

          {/* Right: page buttons + go-to */}
          <div className="flex items-center gap-1.5">
            {/* First */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="First page"
              className="hidden h-8 w-8 rounded-xl border-outline/20 p-0 sm:flex"
              disabled={page <= 1 || query.isFetching}
              onClick={() => goToPage(1)}
            >
              <ChevronFirst className="h-3.5 w-3.5" />
            </Button>

            {/* Prev */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Previous page"
              className="h-8 gap-1 rounded-xl border-outline/20 px-2.5"
              disabled={page <= 1 || query.isFetching}
              onClick={() => goToPage(page - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </Button>

            {/* Page numbers */}
            <div className="hidden items-center gap-1 sm:flex">
              {pageRange.map((item, idx) =>
                item === 'ellipsis' ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="flex h-8 w-6 items-center justify-center text-xs text-on-surface-variant"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => goToPage(item)}
                    disabled={query.isFetching}
                    aria-label={`Page ${item}`}
                    aria-current={item === page ? 'page' : undefined}
                    className={cn(
                      'flex h-8 min-w-[32px] items-center justify-center rounded-xl px-2.5',
                      'text-xs font-semibold tabular-nums transition-colors',
                      'disabled:cursor-not-allowed disabled:opacity-50',
                      item === page
                        ? 'bg-primary text-white shadow-sm'
                        : 'border border-outline/20 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                    )}
                  >
                    {item}
                  </button>
                )
              )}
            </div>

            {/* Mobile: current / total */}
            <span className="px-1 text-xs tabular-nums text-on-surface-variant sm:hidden">
              {page} / {totalPages}
            </span>

            {/* Next */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Next page"
              className="h-8 gap-1 rounded-xl border-outline/20 px-2.5"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => goToPage(page + 1)}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>

            {/* Last */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Last page"
              className="hidden h-8 w-8 rounded-xl border-outline/20 p-0 sm:flex"
              disabled={page >= totalPages || query.isFetching}
              onClick={() => goToPage(totalPages)}
            >
              <ChevronLast className="h-3.5 w-3.5" />
            </Button>

            {/* Go to page */}
            {totalPages > 5 && (
              <GoToPage totalPages={totalPages} onGo={goToPage} disabled={query.isFetching} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
