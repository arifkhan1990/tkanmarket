'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowLeft, Bot, ClipboardCopy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useCrawlerRetryJob, useCrawlerRunDetailQuery } from '@/hooks/admin/useAdminCrawler'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { QUEUE_NAMES } from '@/constants'

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

export function AdminCrawlerJobDetailClient({ runId }: { runId: number }) {
  const { messages } = useI18n()
  const d = messages.admin.crawlerJobDetail
  const detailQuery = useCrawlerRunDetailQuery(runId)
  const retry = useCrawlerRetryJob()

  const run = detailQuery.data?.success ? detailQuery.data.data.run : undefined

  const logText = useMemo(() => {
    if (!run) return ''
    const parts: string[] = []
    if (run.startedAt) parts.push(`[INFO] ${d.started}: ${run.startedAt}`)
    if (run.completedAt) parts.push(`[INFO] ${d.completed}: ${run.completedAt}`)
    parts.push(`[INFO] ${d.source}: ${run.source}`)
    parts.push(`[INFO] ${d.keywordsLabel}: ${run.keywords.join(', ')}`)
    parts.push(`[INFO] status=${run.status}`)
    parts.push(`[INFO] ${d.productsFound}: ${run.productsFound}`)
    parts.push(`[INFO] ${d.productsSaved}: ${run.productsSaved}`)
    parts.push(`[INFO] ${d.errors}: ${run.errorsCount}`)
    if (run.errorLog?.trim()) {
      parts.push('---')
      parts.push(run.errorLog.trim())
    }
    return parts.join('\n')
  }, [d, run])

  const savePct =
    run && run.productsFound > 0 ? Math.min(100, Math.round((run.productsSaved / run.productsFound) * 1000) / 10) : null

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(logText || d.infoNoLog)
      toast.success(d.copiedToast)
    } catch {
      toast.error(d.copyFailed)
    }
  }

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 rounded bg-surface-container-high" />
        <div className="h-64 rounded-2xl bg-surface-container-high" />
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {d.requestFailed}
      </div>
    )
  }

  if (!run) {
    return (
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 text-center">
        <p className="text-on-surface-variant">{d.notFound}</p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/admin/job-queue">{d.backToQueue}</Link>
        </Button>
      </div>
    )
  }

  const payloadJson = JSON.stringify(
    {
      id: run.id,
      status: run.status,
      source: run.source,
      keywords: run.keywords,
      productsFound: run.productsFound,
      productsSaved: run.productsSaved,
      errorsCount: run.errorsCount,
      startedAt: run.startedAt,
      completedAt: run.completedAt
    },
    null,
    2
  )

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface-variant">
        <Link href="/admin/dashboard" className="hover:text-primary">
          {d.breadcrumbDashboard}
        </Link>
        <span aria-hidden className="text-outline">
          /
        </span>
        <Link href="/admin/job-queue" className="hover:text-primary">
          {d.breadcrumbQueue}
        </Link>
        <span aria-hidden className="text-outline">
          /
        </span>
        <span className="text-on-surface">{d.runLabel.replace('{id}', String(run.id))}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">
              {d.runLabel.replace('{id}', String(run.id))}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold',
                statusClass(run.status)
              )}
            >
              {run.status === 'RUNNING' || run.status === 'PENDING' ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
              ) : null}
              {run.status}
            </span>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
            {run.source} · {run.keywords.join(', ')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/job-queue">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              {d.backToQueue}
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/crawler/control">
              <Bot className="mr-2 h-4 w-4" aria-hidden />
              {d.openCrawler}
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link
              href={`/admin/jobs/bull/${encodeURIComponent(QUEUE_NAMES.CRAWLER)}/${encodeURIComponent(`crawler_run_${run.id}`)}`}
            >
              {d.openBullJob}
            </Link>
          </Button>
          {(run.status === 'FAILED' || run.status === 'PARTIAL') && (
            <Button
              className="rounded-full"
              disabled={retry.isPending}
              onClick={() => retry.mutate(run.id)}
            >
              {d.retry}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="overflow-hidden rounded-2xl border border-outline/15 bg-surface-container-highest shadow-xl">
            <div className="flex items-center justify-between border-b border-outline/15 bg-surface-container-low px-4 py-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-outline">{d.liveLog}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full text-outline hover:text-on-surface"
                onClick={() => void copyLog()}
              >
                <ClipboardCopy className="mr-1 h-4 w-4" aria-hidden />
                {d.copyLog}
              </Button>
            </div>
            <pre className="max-h-[min(480px,55vh)] overflow-auto p-4 font-mono text-xs leading-relaxed text-on-surface">
              {logText || (run.errorLog ? run.errorLog : d.noLog)}
            </pre>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">{d.duration}</p>
              <p className="mt-2 font-mono text-2xl font-black">{formatDuration(run.startedAt, run.completedAt)}</p>
            </div>
            <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-outline">{d.productsSaved}</p>
              <p className="mt-2 font-mono text-2xl font-black">{run.productsSaved}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {d.productsFound}: {run.productsFound}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{d.executionParams}</h2>
            <pre className="mt-4 max-h-[280px] overflow-auto rounded-xl border border-outline/10 bg-background p-3 font-mono text-[11px] leading-relaxed text-on-surface">
              {payloadJson}
            </pre>
          </section>

          <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{d.summary}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">{d.source}</dt>
                <dd className="font-medium">{run.source}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">{d.errors}</dt>
                <dd className="font-mono font-medium">{run.errorsCount}</dd>
              </div>
            </dl>
            {savePct !== null ? (
              <div className="mt-6">
                <div className="mb-2 flex justify-between text-xs font-medium text-on-surface-variant">
                  <span>{d.progressSaved}</span>
                  <span>{savePct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${savePct}%` }}
                  />
                </div>
              </div>
            ) : null}
            {run.status === 'RUNNING' || run.status === 'PENDING' ? (
              <p className="mt-4 text-xs text-primary">{d.runningHint}</p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
