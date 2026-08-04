'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useCrawlerHistoryQuery, useCrawlerRetryJob, useReconcileStaleRuns } from '@/hooks/admin/useAdminCrawler'
import { useAdminCleanStaleActiveJobsMutation, useAdminRecentQueueJobsQuery } from '@/hooks/admin/useAdminJobQueue'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { QUEUE_NAMES } from '@/constants'
import type { AdminQueueName, AdminUnifiedJobKind } from '@/types/admin-job-queue.types'

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

function formatRuntimeMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const rm = m % 60
  const rs = s % 60
  if (h > 0) return `${h}h ${rm}m`
  return `${m}m ${rs}s`
}

function formatIsoShort(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function dbStatusClass(status: string): string {
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

function redisStateClass(state: string): string {
  switch (state) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    case 'failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200'
    case 'waiting':
    case 'delayed':
      return 'bg-surface-container-high text-on-surface-variant'
    default:
      return 'bg-surface-container-high text-on-surface'
  }
}

export function JobQueueActivitySection() {
  const { messages } = useI18n()
  const jq = messages.admin.jobQueue
  const retry = useCrawlerRetryJob()
  const reconcile = useReconcileStaleRuns()
  const cleanActive = useAdminCleanStaleActiveJobsMutation()

  const [tab, setTab] = useState<'redis' | 'db'>('redis')

  const [redisPage, setRedisPage] = useState(1)
  const [qRedis, setQRedis] = useState('')
  const [debouncedRedisQ, setDebouncedRedisQ] = useState('')
  const [queueFilter, setQueueFilter] = useState<'' | AdminQueueName>('')

  const [dbPage, setDbPage] = useState(1)
  const [qDb, setQDb] = useState('')
  const [debouncedDbQ, setDebouncedDbQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const pageSize = 12

  const redisQuery = useAdminRecentQueueJobsQuery({
    page: redisPage,
    pageSize,
    q: debouncedRedisQ || undefined,
    queue: queueFilter || undefined
  })

  const historyQuery = useCrawlerHistoryQuery({
    page: dbPage,
    pageSize,
    status: statusFilter || undefined,
    q: debouncedDbQ || undefined
  })

  const redisData = redisQuery.data?.success ? redisQuery.data.data : null
  const redisItems = redisData?.items ?? []
  const redisTotal = redisData?.total ?? 0
  const redisTotalPages = Math.max(1, Math.ceil(redisTotal / pageSize))

  const dbData = historyQuery.data?.success ? historyQuery.data.data : null
  const dbItems = dbData?.items ?? []
  const dbTotal = dbData?.total ?? 0
  const dbTotalPages = Math.max(1, Math.ceil(dbTotal / pageSize))

  const redisPageLabel = useMemo(() => {
    const shown = redisItems.length
    return jq.pageOf.replace('{page}', String(redisPage)).replace('{shown}', String(shown)).replace('{total}', String(redisTotal))
  }, [jq.pageOf, redisItems.length, redisPage, redisTotal])

  const dbPageLabel = useMemo(() => {
    const shown = dbItems.length
    return jq.pageOf.replace('{page}', String(dbPage)).replace('{shown}', String(shown)).replace('{total}', String(dbTotal))
  }, [jq.pageOf, dbItems.length, dbPage, dbTotal])

  const kindLabel = (k: AdminUnifiedJobKind) => jq.jobKindLabels[k]

  const queueSelectLabel = (v: '' | AdminQueueName) => {
    if (v === '') return jq.filterQueueAll
    return jq.queueLabels[v as keyof typeof jq.queueLabels]
  }

  const bullJobHref = (row: (typeof redisItems)[0]) =>
    `/admin/jobs/bull/${encodeURIComponent(row.queueName)}/${encodeURIComponent(row.id)}`

  const staleMsRaw = Number(process.env.NEXT_PUBLIC_ADMIN_STALE_JOB_MS ?? 60 * 60 * 1000)
  const staleThresholdMs = Number.isFinite(staleMsRaw) && staleMsRaw > 0 ? Math.floor(staleMsRaw) : 60 * 60 * 1000

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-heading text-lg font-bold text-on-surface">{jq.recentTitle}</h2>
        <p className="mt-1 text-sm text-on-surface-variant">{jq.recentSubtitle}</p>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as 'redis' | 'db')
        }}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="redis">{jq.tabRedis}</TabsTrigger>
          <TabsTrigger value="db">{jq.tabDb}</TabsTrigger>
        </TabsList>

        <TabsContent value="redis" className="space-y-4">
          <p className="text-sm text-on-surface-variant">{jq.redisSubtitle}</p>

          {redisQuery.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {jq.redisFailed}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-outline/10 bg-surface-container-lowest px-4 py-3">
            <p className="text-sm text-on-surface-variant">
              {jq.staleHint.replace('{minutes}', String(Math.round(staleThresholdMs / 60_000)))}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={cleanActive.isPending}
                onClick={() =>
                  cleanActive.mutate({
                    queue: queueFilter || undefined,
                    graceMinutes: Math.round(staleThresholdMs / 60_000),
                    limit: 200
                  })
                }
                title={jq.cleanActiveHint}
              >
                {jq.cleanActive}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={reconcile.isPending}
                onClick={() => reconcile.mutate(120)}
                title={messages.admin.crawlerDiagnostics.reconcileHint}
              >
                {jq.reconcileStale}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{jq.searchPlaceholder}</div>
              <Input
                value={qRedis}
                onChange={(e) => setQRedis(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedRedisQ(qRedis.trim())
                    setRedisPage(1)
                  }
                }}
                className="rounded-xl"
              />
            </div>
            <div className="w-full min-w-[180px] space-y-2 sm:w-52">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{jq.filterQueue}</div>
              <Select
                value={queueFilter || 'ALL'}
                onValueChange={(v) => {
                  setQueueFilter(v === 'ALL' ? '' : (v as AdminQueueName))
                  setRedisPage(1)
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue>{queueSelectLabel(queueFilter)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{jq.filterQueueAll}</SelectItem>
                  <SelectItem value={QUEUE_NAMES.CRAWLER}>{jq.queueLabels.crawler_jobs}</SelectItem>
                  <SelectItem value={QUEUE_NAMES.AI}>{jq.queueLabels.ai_processing_jobs}</SelectItem>
                  <SelectItem value={QUEUE_NAMES.IMAGE}>{jq.queueLabels.image_processing_jobs}</SelectItem>
                  <SelectItem value={QUEUE_NAMES.SOCIAL}>{jq.queueLabels.social_media_jobs}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="rounded-full"
              onClick={() => {
                setDebouncedRedisQ(qRedis.trim())
                setRedisPage(1)
              }}
            >
              {jq.applyFilters}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest">
            <Table>
              <TableHeader className="bg-surface-container-low/40">
                <TableRow>
                  <TableHead>{jq.colJobId}</TableHead>
                  <TableHead>{jq.colJobName}</TableHead>
                  <TableHead>{jq.colType}</TableHead>
                  <TableHead>{jq.colStatus}</TableHead>
                  <TableHead className="text-center">{jq.colRuntime}</TableHead>
                  <TableHead className="text-center">{jq.colActiveSince}</TableHead>
                  <TableHead className="text-right">{jq.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redisQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <TableRowSkeleton key={idx} asTableRow columns={7} />
                    ))
                  : redisItems.map((row) => {
                      const isStale = row.state === 'active' && row.runtimeMs !== null && row.runtimeMs >= staleThresholdMs
                      return (
                        <TableRow key={`${row.queueName}-${row.id}`}>
                          <TableCell className="max-w-[140px] truncate font-mono text-xs text-primary">{row.id}</TableCell>
                          <TableCell className="max-w-[120px] truncate text-sm">{row.jobName}</TableCell>
                          <TableCell className="text-sm font-medium">{kindLabel(row.jobKind)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase',
                                  redisStateClass(row.state)
                                )}
                              >
                                {row.state.toUpperCase()}
                              </span>
                              {isStale ? (
                                <span
                                  className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold uppercase text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                                  title={jq.staleBadgeHint}
                                >
                                  {jq.staleBadge}
                                </span>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm text-on-surface-variant">
                            {formatRuntimeMs(row.runtimeMs)}
                          </TableCell>
                          <TableCell className="text-center text-xs text-on-surface-variant">
                            {formatIsoShort(row.processedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                              <Link href={bullJobHref(row)}>{jq.view}</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
              </TableBody>
            </Table>
            {!redisQuery.isLoading && redisItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant">{jq.emptyRedis}</div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline/10 bg-surface-container-low/30 px-4 py-4">
              <p className="text-sm text-on-surface-variant">{redisPageLabel}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={redisPage <= 1}
                  onClick={() => setRedisPage((p) => Math.max(1, p - 1))}
                >
                  {jq.prev}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={redisPage >= redisTotalPages}
                  onClick={() => setRedisPage((p) => p + 1)}
                >
                  {jq.next}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="db" className="space-y-4">
          <p className="text-sm text-on-surface-variant">{jq.dbSubtitle}</p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1 space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{jq.searchPlaceholder}</div>
              <Input
                value={qDb}
                onChange={(e) => setQDb(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDebouncedDbQ(qDb.trim())
                    setDbPage(1)
                  }
                }}
                className="rounded-xl"
              />
            </div>
            <div className="w-full min-w-[160px] space-y-2 sm:w-48">
              <div className="text-xs font-bold uppercase tracking-widest text-outline">{jq.filterStatus}</div>
              <Select
                value={statusFilter || 'ALL'}
                onValueChange={(v) => {
                  setStatusFilter(v === 'ALL' ? '' : v)
                  setDbPage(1)
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{jq.filterAll}</SelectItem>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="RUNNING">RUNNING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                  <SelectItem value="PARTIAL">PARTIAL</SelectItem>
                  <SelectItem value="FAILED">FAILED</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="rounded-full"
              onClick={() => {
                setDebouncedDbQ(qDb.trim())
                setDbPage(1)
              }}
            >
              {jq.applyFilters}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-outline/10 bg-surface-container-lowest">
            <Table>
              <TableHeader className="bg-surface-container-low/40">
                <TableRow>
                  <TableHead>{jq.colJobId}</TableHead>
                  <TableHead>{jq.colType}</TableHead>
                  <TableHead>{jq.colStatus}</TableHead>
                  <TableHead className="text-center">{jq.colRuntime}</TableHead>
                  <TableHead className="text-right">{jq.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyQuery.isLoading
                  ? Array.from({ length: 6 }).map((_, idx) => (
                      <TableRowSkeleton key={idx} asTableRow columns={5} />
                    ))
                  : dbItems.map((run) => (
                      <TableRow key={run.id} className="group">
                        <TableCell>
                          <Link
                            href={`/admin/jobs/crawler/${run.id}`}
                            className="font-mono text-sm font-semibold text-primary hover:underline"
                          >
                            #{run.id}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm font-medium">{jq.typeCrawler}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-bold',
                              dbStatusClass(run.status)
                            )}
                          >
                            {run.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm text-on-surface-variant">
                          {formatDuration(run.startedAt, run.completedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="rounded-full" asChild>
                              <Link href={`/admin/jobs/crawler/${run.id}`}>{jq.view}</Link>
                            </Button>
                            {(run.status === 'FAILED' || run.status === 'PARTIAL') && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full"
                                disabled={retry.isPending}
                                onClick={() => retry.mutate(run.id)}
                              >
                                {messages.admin.crawlerHistory.retry}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
            {!historyQuery.isLoading && dbItems.length === 0 ? (
              <div className="p-8 text-center text-sm text-on-surface-variant">{jq.empty}</div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline/10 bg-surface-container-low/30 px-4 py-4">
              <p className="text-sm text-on-surface-variant">{dbPageLabel}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={dbPage <= 1}
                  onClick={() => setDbPage((p) => Math.max(1, p - 1))}
                >
                  {jq.prev}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={dbPage >= dbTotalPages}
                  onClick={() => setDbPage((p) => p + 1)}
                >
                  {jq.next}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
