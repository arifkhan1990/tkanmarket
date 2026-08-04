'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AdminPagination } from '@/components/admin/admin-pagination'
import {
  useCrawlerHistoryQuery,
  useCrawlerRetryJob,
  useCrawlerRunDetailQuery,
} from '@/hooks/admin/useAdminCrawler'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { withLocaleUrl } from '@/lib/i18n/locale-path'

function formatDuration(startIso: string | null, endIso: string | null): string {
  if (!startIso) return '—'
  const a = new Date(startIso).getTime()
  const b = endIso ? new Date(endIso).getTime() : Date.now()
  const ms = Math.max(0, b - a)
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rs = s % 60
  return m > 0 ? `${m}m ${rs}s` : `${rs}s`
}

function saveRate(found: number, saved: number): string {
  if (found <= 0) return '—'
  return `${Math.round((saved / found) * 1000) / 10}%`
}

function statusClass(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    case 'FAILED':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
    case 'RUNNING':
    case 'PENDING':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
    default:
      return 'bg-surface-container-high text-on-surface'
  }
}

export function AdminCrawlerHistoryClient({ initialQuery }: { initialQuery?: string }) {
  const { messages, locale } = useI18n()
  const h = messages.admin.crawlerHistory
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const seeded = initialQuery?.trim() ?? ''

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [q, setQ] = useState(seeded)
  const [debouncedQ, setDebouncedQ] = useState(seeded)
  const [detailId, setDetailId] = useState<number | null>(null)

  useEffect(() => {
    const sp = new URLSearchParams(searchParams.toString())
    const pageRaw = sp.get('page')
    const pageSizeRaw = sp.get('pageSize')
    const statusRaw = sp.get('status')
    const sourceRaw = sp.get('source')
    const qRaw = sp.get('q')

    const nextPage = pageRaw ? Number(pageRaw) : 1
    const nextPageSize = pageSizeRaw ? Number(pageSizeRaw) : 20

    setPage(Number.isFinite(nextPage) && nextPage >= 1 ? Math.trunc(nextPage) : 1)
    setPageSize(Number.isFinite(nextPageSize) && nextPageSize >= 1 ? Math.trunc(nextPageSize) : 20)
    setStatusFilter(statusRaw?.trim() ?? '')
    setSourceFilter(sourceRaw?.trim() ?? '')
    const nextQ = (qRaw?.trim() ?? seeded).trim()
    setQ(nextQ)
    setDebouncedQ(nextQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retry = useCrawlerRetryJob()

  const historyQuery = useCrawlerHistoryQuery({
    page,
    pageSize,
    status: statusFilter || undefined,
    source: sourceFilter || undefined,
    q: debouncedQ || undefined,
  })

  const detailQuery = useCrawlerRunDetailQuery(detailId)

  const data = historyQuery.data?.success ? historyQuery.data.data : null
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const stats = data?.stats

  const onSearch = () => {
    setDebouncedQ(q.trim())
    setPage(1)
  }

  const onClear = () => {
    setQ('')
    setDebouncedQ('')
    setStatusFilter('')
    setSourceFilter('')
    setPage(1)
    setPageSize(20)
  }

  useEffect(() => {
    if (!pathname) return
    const sp = new URLSearchParams()
    if (page > 1) sp.set('page', String(page))
    if (pageSize !== 20) sp.set('pageSize', String(pageSize))
    if (statusFilter.trim()) sp.set('status', statusFilter.trim())
    if (sourceFilter.trim()) sp.set('source', sourceFilter.trim())
    if (debouncedQ.trim()) sp.set('q', debouncedQ.trim())
    const qs = sp.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    router.replace(withLocaleUrl(next, locale), { scroll: false })
  }, [debouncedQ, locale, page, pageSize, pathname, router, sourceFilter, statusFilter])

  const pageLabel = useMemo(() => {
    const shown = items.length
    return h.pageOf.replace('{page}', String(page)).replace('{shown}', String(shown)).replace('{total}', String(total))
  }, [h.pageOf, items.length, page, total])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{h.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{h.subtitle}</p>
        </div>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void historyQuery.refetch()}
          disabled={historyQuery.isFetching}
        >
          {h.refresh}
        </Button>
      </div>

      {stats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">{h.statJobs24h}</p>
            <p className="mt-2 font-mono text-3xl font-black">{stats.jobs24h}</p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">{h.statProductsFound}</p>
            <p className="mt-2 font-mono text-3xl font-black">{stats.productsFound24h}</p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">{h.statSuccess}</p>
            <p className="mt-2 font-mono text-3xl font-black">
              {stats.successRatePercent !== null ? `${stats.successRatePercent}%` : '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-outline">{h.statActive}</p>
            <p className="mt-2 font-mono text-3xl font-black">{stats.activeRunners}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{h.searchPlaceholder}</div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch()
            }}
            className="rounded-xl"
          />
        </div>
        <div className="w-full min-w-[160px] space-y-2 sm:w-56">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{h.filterSource}</div>
          <Input
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value)
              setPage(1)
            }}
            placeholder={h.filterSourcePlaceholder}
            className="rounded-xl"
          />
        </div>
        <div className="w-full min-w-[160px] space-y-2 sm:w-48">
          <div className="text-xs font-bold uppercase tracking-widest text-outline">{h.filterStatus}</div>
          <Select
            value={statusFilter || 'ALL'}
            onValueChange={(v) => {
              setStatusFilter(v === 'ALL' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{h.filterAll}</SelectItem>
              <SelectItem value="PENDING">PENDING</SelectItem>
              <SelectItem value="RUNNING">RUNNING</SelectItem>
              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
              <SelectItem value="PARTIAL">PARTIAL</SelectItem>
              <SelectItem value="FAILED">FAILED</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="rounded-full" onClick={onSearch}>
          {h.applyFilters}
        </Button>
        <Button variant="outline" className="rounded-full" onClick={onClear}>
          {h.clearFilters}
        </Button>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest">
        <Table>
          <TableHeader className="bg-surface-container-low/40">
            <TableRow>
              <TableHead>{h.colId}</TableHead>
              <TableHead>{h.colSource}</TableHead>
              <TableHead className="text-right">{h.colFound}</TableHead>
              <TableHead>{h.colRate}</TableHead>
              <TableHead className="text-center">{h.colDuration}</TableHead>
              <TableHead>{h.colStatus}</TableHead>
              <TableHead>{h.colWhen}</TableHead>
              <TableHead className="text-right">{h.colActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyQuery.isLoading
              ? Array.from({ length: 8 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} asTableRow columns={8} />
                ))
              : items.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-sm">
                      <Link className="text-brand-700 hover:underline" href={`/admin/jobs/crawler/${run.id}`}>
                        #{run.id}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm font-medium">{run.source}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{run.productsFound}</TableCell>
                    <TableCell className="text-sm">{saveRate(run.productsFound, run.productsSaved)}</TableCell>
                    <TableCell className="text-center text-sm text-on-surface-variant">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                          statusClass(run.status)
                        )}
                      >
                        {run.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-on-surface-variant">
                      {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" asChild>
                          <Link href={`/admin/jobs/crawler/${run.id}`}>{h.openRun}</Link>
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setDetailId(run.id)}>
                          {h.details}
                        </Button>
                        {(run.status === 'FAILED' || run.status === 'PARTIAL') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-full"
                            disabled={retry.isPending}
                            onClick={() => retry.mutate(run.id)}
                          >
                            {h.retry}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {!historyQuery.isLoading && items.length === 0 ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">{h.empty}</div>
        ) : null}
      </div>

      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        disabled={historyQuery.isFetching}
        onPageChange={(next) => setPage(next)}
        onPageSizeChange={(next) => {
          setPageSize(next)
          setPage(1)
        }}
        className="rounded-[2rem] border border-outline/10 bg-surface-container-lowest"
      />

      <p className="text-xs text-outline" aria-live="polite">
        {pageLabel}
      </p>

      <Sheet open={detailId !== null} onOpenChange={(o) => !o && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {h.details} #{detailId ?? ''}
            </SheetTitle>
          </SheetHeader>
          {detailQuery.isLoading ? (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-4 w-full rounded bg-surface-container-high" />
              <div className="h-24 w-full rounded bg-surface-container-high" />
            </div>
          ) : (
            <div className="mt-6 space-y-4 text-sm">
              <pre className="max-h-[420px] overflow-auto rounded-xl bg-inverse-surface p-4 font-mono text-xs text-inverse-on-surface whitespace-pre-wrap">
                {detailQuery.data?.success && detailQuery.data.data.run?.errorLog
                  ? detailQuery.data.data.run.errorLog
                  : detailQuery.data?.success && detailQuery.data.data.run
                    ? '(No error log for this run.)'
                    : '—'}
              </pre>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
