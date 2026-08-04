'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowLeft, ClipboardCopy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useAdminBullJobDetailQuery, useAdminBullJobRetryMutation } from '@/hooks/admin/useAdminJobQueue'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'

function parseCrawlerRunIdFromData(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null
  const jobId = (data as Record<string, unknown>).jobId
  if (typeof jobId === 'string') {
    const m = /^crawler_run_(\d+)$/.exec(jobId)
    if (m) return Number(m[1])
  }
  return null
}

function parseFabricId(data: unknown): number | null {
  if (!data || typeof data !== 'object') return null
  const e = (data as Record<string, unknown>).entityId
  if (typeof e === 'number' && Number.isInteger(e) && e > 0) return e
  return null
}

function stateBadgeClass(state: string): string {
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

function formatTs(ms: number | undefined): string {
  if (ms === undefined || ms === 0) return '—'
  return new Date(ms).toLocaleString()
}

export function AdminBullJobDetailClient({ queueName, jobId }: { queueName: string; jobId: string }) {
  const { messages } = useI18n()
  const b = messages.admin.bullJobDetail
  const q = useAdminBullJobDetailQuery(queueName, jobId)
  const retry = useAdminBullJobRetryMutation()

  const job = q.data?.success ? q.data.data : undefined

  const crawlerRunId = useMemo(() => (job ? parseCrawlerRunIdFromData(job.data) : null), [job])
  const fabricId = useMemo(() => (job ? parseFabricId(job.data) : null), [job])

  const payloadJson = useMemo(() => {
    if (!job) return ''
    try {
      return JSON.stringify(
        {
          queueName: job.queueName,
          state: job.state,
          id: job.id,
          name: job.name,
          data: job.data,
          opts: job.opts,
          progress: job.progress,
          attemptsMade: job.attemptsMade,
          attemptsStarted: job.attemptsStarted,
          timestamp: job.timestamp,
          processedOn: job.processedOn,
          finishedOn: job.finishedOn,
          failedReason: job.failedReason,
          stacktrace: job.stacktrace,
          returnvalue: job.returnvalue,
          delay: job.delay,
          priority: job.priority
        },
        null,
        2
      )
    } catch {
      return ''
    }
  }, [job])

  const copyPayload = async () => {
    try {
      await navigator.clipboard.writeText(payloadJson || '')
      toast.success(b.copiedToast)
    } catch {
      toast.error(b.copyFailed)
    }
  }

  if (q.isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 w-64 rounded bg-surface-container-high" />
        <div className="h-40 rounded-2xl bg-surface-container-high" />
      </div>
    )
  }

  if (q.isError) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {b.requestFailed}
      </div>
    )
  }

  if (!job) {
    return (
      <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-8 text-center">
        <p className="text-on-surface-variant">{b.notFound}</p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/admin/job-queue">{b.backToQueue}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-on-surface-variant">
        <Link href="/admin/dashboard" className="hover:text-primary">
          {messages.admin.crawlerJobDetail.breadcrumbDashboard}
        </Link>
        <span className="text-outline">/</span>
        <Link href="/admin/job-queue" className="hover:text-primary">
          {b.breadcrumbQueue}
        </Link>
        <span className="text-outline">/</span>
        <span className="text-on-surface">{b.jobLabel.replace('{id}', job.id)}</span>
      </nav>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{job.name || b.title}</h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase',
                stateBadgeClass(job.state)
              )}
            >
              {job.state === 'active' ? (
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
              ) : null}
              {job.state}
            </span>
          </div>
          <p className="mt-2 font-mono text-sm text-on-surface-variant">
            {b.queueLabel}: {job.queueName} · id: {job.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full" asChild>
            <Link href="/admin/job-queue">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              {b.backToQueue}
            </Link>
          </Button>
          {crawlerRunId !== null ? (
            <Button variant="outline" className="rounded-full" asChild>
              <Link href={`/admin/jobs/crawler/${crawlerRunId}`}>{b.openCrawlerRun}</Link>
            </Button>
          ) : null}
          {fabricId !== null ? (
            <Button variant="outline" className="rounded-full" asChild>
              <Link href={`/admin/fabrics/${fabricId}`}>{b.openFabric}</Link>
            </Button>
          ) : null}
          {job.state === 'failed' ? (
            <Button
              className="rounded-full"
              disabled={retry.isPending}
              onClick={() => retry.mutate({ queueName: job.queueName, jobId: job.id })}
            >
              {b.retry}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="font-heading text-base font-bold text-on-surface">{b.payload}</h2>
              <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => void copyPayload()}>
                <ClipboardCopy className="mr-1 h-4 w-4" aria-hidden />
                {b.copyJson}
              </Button>
            </div>
            <pre className="max-h-[min(400px,50vh)] overflow-auto rounded-xl border border-outline/10 bg-background p-4 font-mono text-xs leading-relaxed text-on-surface">
              {JSON.stringify(job.data, null, 2)}
            </pre>
          </section>

          {job.failedReason ? (
            <section className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
              <h2 className="font-heading text-base font-bold text-destructive">{b.failedReason}</h2>
              <p className="mt-3 whitespace-pre-wrap font-mono text-sm text-on-surface">{job.failedReason}</p>
            </section>
          ) : null}

          {job.stacktrace.length > 0 ? (
            <section className="rounded-2xl border border-outline/15 bg-surface-container-highest p-5">
              <h2 className="font-heading text-base font-bold text-on-surface">{b.stacktrace}</h2>
              <pre className="mt-3 max-h-[280px] overflow-auto font-mono text-xs text-on-surface-variant">
                {job.stacktrace.join('\n')}
              </pre>
            </section>
          ) : null}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <section className="rounded-2xl border border-outline/10 bg-surface-container-lowest p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{b.timing}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">{b.created}</dt>
                <dd className="font-mono">{formatTs(job.timestamp)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">{b.processed}</dt>
                <dd className="font-mono">{formatTs(job.processedOn)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-on-surface-variant">{b.finished}</dt>
                <dd className="font-mono">{formatTs(job.finishedOn)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{b.progress}</h2>
            <p className="mt-2 font-mono text-sm">{JSON.stringify(job.progress)}</p>
            <h3 className="mt-4 font-heading text-sm font-bold text-on-surface">{b.attempts}</h3>
            <p className="mt-1 font-mono text-sm">
              {job.attemptsMade} / started {job.attemptsStarted}
            </p>
          </section>

          <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{b.options}</h2>
            <pre className="mt-3 max-h-[200px] overflow-auto rounded-xl border border-outline/10 bg-background p-3 font-mono text-[11px]">
              {JSON.stringify(job.opts, null, 2)}
            </pre>
          </section>

          <section className="rounded-2xl border border-outline/10 bg-surface-container-low p-5">
            <h2 className="font-heading text-base font-bold text-on-surface">{b.returnValue}</h2>
            <pre className="mt-3 max-h-[200px] overflow-auto rounded-xl border border-outline/10 bg-background p-3 font-mono text-[11px]">
              {JSON.stringify(job.returnvalue, null, 2)}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
