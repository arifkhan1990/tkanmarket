'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Activity, ArrowUpRight } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminQueueStatsQuery, useAdminRecentQueueJobsQuery } from '@/hooks/admin/useAdminJobQueue'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { QUEUE_NAMES } from '@/constants'
import type { AdminUnifiedQueueJobItem } from '@/types/admin-job-queue.types'

const AI_QUEUES = [
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.IMAGE_GENERATION,
  QUEUE_NAMES.VIDEO_GENERATION,
  QUEUE_NAMES.TRANSLATION,
  QUEUE_NAMES.SOCIAL
] as const

type AiQueueName = (typeof AI_QUEUES)[number]

function queueLabel(aiLive: { queueLabels: Record<string, string> }, queue: string): string {
  const key = (
    {
      [QUEUE_NAMES.AI]: 'ai',
      [QUEUE_NAMES.IMAGE]: 'image',
      [QUEUE_NAMES.IMAGE_GENERATION]: 'imageGeneration',
      [QUEUE_NAMES.VIDEO_GENERATION]: 'videoGeneration',
      [QUEUE_NAMES.TRANSLATION]: 'translation',
      [QUEUE_NAMES.SOCIAL]: 'social'
    } as const
  )[queue as AiQueueName]
  return key ? aiLive.queueLabels[key] ?? queue : queue
}

function formatRuntimeMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const rs = s % 60
  return m > 0 ? `${m}m ${rs}s` : `${rs}s`
}

function formatActiveSince(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleTimeString()
  } catch {
    return iso
  }
}

export function AiQueueLiveSection() {
  const { messages } = useI18n()
  const aiLive = messages.admin.dashboard.aiLive
  const jobQueue = messages.admin.jobQueue

  const statsQuery = useAdminQueueStatsQuery()
  const recentQuery = useAdminRecentQueueJobsQuery({ page: 1, pageSize: 50 })

  const queueMap = statsQuery.data?.success ? statsQuery.data.data : undefined

  const liveJobs = useMemo(() => {
    const recentItems = recentQuery.data?.success ? recentQuery.data.data.items : []
    return recentItems.filter((row) => row.queueName !== QUEUE_NAMES.CRAWLER && row.state === 'active')
  }, [recentQuery.data])

  const waitingCount = useMemo(() => {
    if (!queueMap) return 0
    return AI_QUEUES.reduce((acc, q) => acc + (queueMap[q]?.waiting ?? 0), 0)
  }, [queueMap])

  const activeTotal = useMemo(() => {
    if (!queueMap) return 0
    return AI_QUEUES.reduce((acc, q) => acc + (queueMap[q]?.active ?? 0), 0)
  }, [queueMap])

  const queueStats = (queue: AiQueueName): { active: number; waiting: number } => {
    const s = queueMap?.[queue]
    return { active: s?.active ?? 0, waiting: s?.waiting ?? 0 }
  }

  const kindLabel = (kind: AdminUnifiedQueueJobItem['jobKind']) => jobQueue.jobKindLabels[kind]

  return (
    <section
      className="rounded-2xl border border-outline/10 bg-surface-container-lowest/80 p-3 shadow-sm sm:p-4 dark:border-outline/15"
      aria-label="AI processing live"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Activity className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-on-surface">{aiLive.title}</h2>
            <p className="mt-0.5 text-xs text-on-surface-variant">{aiLive.subtitle}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full text-xs" asChild>
          <Link href="/admin/job-queue">
            {aiLive.viewAll}
            <ArrowUpRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {AI_QUEUES.map((queue) => {
          const stats = queueStats(queue)
          return (
            <DashboardStatCardShell key={queue} tone="blue">
              <p className={dashboardStatLabelClass}>{queueLabel(aiLive, queue)}</p>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className={cn(dashboardStatValueClass, 'font-mono font-black')}>
                  {statsQuery.isLoading ? '—' : stats.active}
                </p>
                <span className="text-[10px] font-semibold text-on-surface-variant">
                  {aiLive.inQueue}: {statsQuery.isLoading ? '—' : stats.waiting}
                </span>
              </div>
            </DashboardStatCardShell>
          )
        })}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-outline/10">
        <div className="flex items-center justify-between border-b border-outline/10 bg-surface-container-low/40 px-4 py-2.5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            {aiLive.runningNow}
          </h3>
          {activeTotal > 0 || waitingCount > 0 ? (
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold text-on-surface-variant">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
              {activeTotal} {aiLive.runningNow} · {waitingCount} {aiLive.inQueue}
            </span>
          ) : null}
        </div>
        {liveJobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-on-surface-variant">{aiLive.noActive}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{aiLive.fabric}</TableHead>
                <TableHead>{aiLive.process}</TableHead>
                <TableHead>{aiLive.queueLabel}</TableHead>
                <TableHead className="text-center">{aiLive.runtime}</TableHead>
                <TableHead className="text-center">{aiLive.startedAt}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {liveJobs.map((row) => (
                <TableRow key={`${row.queueName}-${row.id}`}>
                  <TableCell className="max-w-[220px]">
                    {row.fabricId ? (
                      <Link
                        href={`/admin/fabrics/${row.fabricId}`}
                        className="block truncate text-sm font-semibold text-primary hover:underline"
                      >
                        {row.fabricTitle ?? `#${row.fabricId}`}
                      </Link>
                    ) : (
                      <span className="text-sm text-on-surface-variant">—</span>
                    )}
                    {row.fabricId ? (
                      <span className="block text-[10px] font-mono text-on-surface-variant">
                        #{row.fabricId}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">{row.jobName || kindLabel(row.jobKind)}</span>
                    <span className="block text-[10px] text-on-surface-variant">{kindLabel(row.jobKind)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                      <span className="text-sm">{queueLabel(aiLive, row.queueName)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-on-surface-variant">
                    {formatRuntimeMs(row.runtimeMs)}
                  </TableCell>
                  <TableCell className="text-center text-xs text-on-surface-variant">
                    {formatActiveSince(row.processedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  )
}
