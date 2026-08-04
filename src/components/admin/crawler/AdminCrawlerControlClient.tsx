'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminCrawler, useCancelCrawlerRun, useCrawlerRetryJob, useCrawlerRunJob, useReconcileStaleRuns } from '@/hooks/admin/useAdminCrawler'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useI18n } from '@/hooks/useI18n'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import type { CrawlerSource } from '@/types/crawler.types'
import { cn } from '@/lib/utils'

export function AdminCrawlerControlClient() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()
  const m = messages.admin.crawlerPage
  const settingsQuery = useAdminSettings()
  const defaultMax = settingsQuery.data?.success ? settingsQuery.data.data.crawlerDefaultMaxProducts : 200

  const statusQuery = useAdminCrawler()
  const runJob = useCrawlerRunJob()
  const retryJob = useCrawlerRetryJob()
  const cancelJob = useCancelCrawlerRun()
  const reconcile = useReconcileStaleRuns()

  const [keywordsInput, setKeywordsInput] = useState('')
  const [source, setSource] = useState<CrawlerSource>('both')
  const [maxProducts, setMaxProducts] = useState(String(defaultMax))

  useEffect(() => {
    setMaxProducts(String(defaultMax))
  }, [defaultMax])

  const history = statusQuery.data?.success ? statusQuery.data.data.history : []
  const runningCount = statusQuery.data?.success ? statusQuery.data.data.runningCount : 0
  const latestRun = statusQuery.data?.success ? statusQuery.data.data.latestRun : null

  useEffect(() => {
    if (!latestRun) return
    if (keywordsInput.trim().length > 0) return
    if (latestRun.keywords.length === 0) return
    setKeywordsInput(latestRun.keywords.join(', '))
  }, [keywordsInput, latestRun])

  const parseKeywords = (value: string) =>
    value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 25)

  const maxNum = useMemo(() => {
    const n = Number(maxProducts)
    if (Number.isNaN(n) || n < 10) return 10
    if (n > 2000) return 2000
    return n
  }, [maxProducts])

  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const statusClass = (status: string): string => {
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

  const formatDuration = (startIso: string | null, endIso: string | null): string => {
    if (!startIso) return '—'
    const a = new Date(startIso).getTime()
    const b = endIso ? new Date(endIso).getTime() : nowMs
    const ms = Math.max(0, b - a)
    const s = Math.floor(ms / 1000)
    const min = Math.floor(s / 60)
    const rs = s % 60
    return min > 0 ? `${min}m ${rs}s` : `${rs}s`
  }

  const onRun = () => {
    const keywords = parseKeywords(keywordsInput)
    if (keywords.length === 0) {
      toast.error(m.keywordsRequiredToast)
      return
    }
    runJob.mutate(
      { keywords, source, max_products: maxNum },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ['admin-crawler'] })
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{m.title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{m.subtitle}</p>
          {typeof statusQuery.dataUpdatedAt === 'number' ? (
            <p className="mt-2 text-xs text-outline" aria-live="polite">
              {m.lastRefreshed}:{' '}
              {new Date(statusQuery.dataUpdatedAt).toLocaleString(undefined, {
                dateStyle: 'short',
                timeStyle: 'medium'
              })}
              {statusQuery.isFetching ? ` · ${m.refreshing}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/crawler/history">{messages.admin.crawlerNav.history}</Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/crawler/diagnostics">{messages.admin.crawlerNav.diagnostics}</Link>
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={reconcile.isPending}
            title={m.forceReconcileHint}
            onClick={() => reconcile.mutate({ force: true })}
          >
            {m.forceReconcile}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => void statusQuery.refetch()}
            disabled={statusQuery.isFetching}
          >
            {messages.common.refresh}
          </Button>
          <div className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.running}</div>
            <div className="text-2xl font-extrabold font-mono">{runningCount}</div>
          </div>
          <div className="rounded-2xl bg-surface-container-highest p-4 space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.latest}</div>
            <div className="text-2xl font-extrabold font-mono">{latestRun?.status ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 p-6 space-y-4">
        <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.triggerSection}</div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.sourceLabel}</div>
            <Select value={source} onValueChange={(v) => setSource(v as CrawlerSource)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">{m.sourceBoth}</SelectItem>
                <SelectItem value="all">{m.sourceAll}</SelectItem>
                <SelectItem value="alibaba">{m.sourceAlibaba}</SelectItem>
                <SelectItem value="1688">{m.source1688}</SelectItem>
                <SelectItem value="made_in_china">{m.sourceMadeInChina}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1 lg:col-span-1">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.keywordsLabel}</div>
            <Input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              className="rounded-xl"
              placeholder={m.keywordsPlaceholder}
            />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-widest text-outline">{m.maxProductsLabel}</div>
            <Input
              value={maxProducts}
              onChange={(e) => setMaxProducts(e.target.value)}
              inputMode="numeric"
              className="rounded-xl font-mono"
            />
          </div>
        </div>
        <Button className="rounded-full" onClick={onRun} disabled={runJob.isPending}>
          {runJob.isPending ? m.triggerPending : m.triggerNow}
        </Button>
      </div>

      <div className="rounded-[2rem] bg-surface-container-lowest border border-outline/10 overflow-hidden">
        <Table>
          <TableHeader className="bg-surface-container-low/40">
            <TableRow>
              <TableHead>{m.tableId}</TableHead>
              <TableHead>{m.tableStatus}</TableHead>
              <TableHead>{m.tableSource}</TableHead>
              <TableHead>{m.tableKeywords}</TableHead>
              <TableHead>{m.tableFound}</TableHead>
              <TableHead>{m.tableSaved}</TableHead>
              <TableHead>{m.tableErrors}</TableHead>
              <TableHead className="text-right">{m.tableActions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statusQuery.isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <TableRowSkeleton key={idx} asTableRow columns={8} />
                ))
              : history.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      <Link href={`/admin/jobs/crawler/${run.id}`} className="font-mono text-sm text-brand-700 hover:underline">
                        #{run.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', statusClass(run.status))}
                      >
                        {run.status === 'RUNNING' || run.status === 'PENDING' ? (
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
                        ) : null}
                        {run.status}
                      </span>
                      <div className="mt-1 text-xs text-on-surface-variant">
                        {formatDuration(run.startedAt, run.completedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{run.source}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-on-surface-variant line-clamp-2">{run.keywords.join(', ')}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{run.productsFound}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{run.productsSaved}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">{run.errorsCount}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" className="rounded-full" asChild>
                          <Link href={`/admin/crawler/history?q=${run.id}`}>{m.openHistory}</Link>
                        </Button>
                        {(run.status === 'FAILED' || run.status === 'PARTIAL') && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="rounded-full"
                            disabled={retryJob.isPending}
                            onClick={() => retryJob.mutate(run.id)}
                          >
                            {m.retry}
                          </Button>
                        )}
                        {(run.status === 'RUNNING' || run.status === 'PENDING') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="rounded-full"
                            disabled={cancelJob.isPending}
                            onClick={() => cancelJob.mutate(run.id)}
                          >
                            {m.cancel}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
        {statusQuery.isError ? (
          <div className="border-t border-outline/10 bg-surface-container-low/30 px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-destructive">
                {statusQuery.error instanceof Error ? statusQuery.error.message : m.requestFailed}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => void statusQuery.refetch()}
                disabled={statusQuery.isFetching}
              >
                {m.tryAgain}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
