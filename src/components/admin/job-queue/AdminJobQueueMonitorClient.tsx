'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ListOrdered } from 'lucide-react'

import { DashboardStatCardShell } from '@/components/admin/dashboard-stat-card-shell'
import { dashboardStatLabelClass, dashboardStatValueClass } from '@/components/admin/dashboard-stat-card-tones'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { JobQueueActivitySection } from '@/components/admin/job-queue/JobQueueActivitySection'
import {
  useAdminQueuePauseMutation,
  useAdminQueuePauseStatusQuery,
  useAdminQueueStatsQuery
} from '@/hooks/admin/useAdminJobQueue'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/utils'
import { QUEUE_NAMES } from '@/constants'
import type { AdminQueueStatsMap } from '@/types/admin-job-queue.types'

const QUEUE_ORDER = [
  QUEUE_NAMES.CRAWLER,
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.SOCIAL
] as const

function aggregateStats(map: AdminQueueStatsMap | undefined) {
  if (!map) return { active: 0, waiting: 0, completed: 0, failed: 0 }
  return Object.values(map).reduce(
    (acc, s) => ({
      active: acc.active + s.active,
      waiting: acc.waiting + s.waiting,
      completed: acc.completed + s.completed,
      failed: acc.failed + s.failed
    }),
    { active: 0, waiting: 0, completed: 0, failed: 0 }
  )
}

export function AdminJobQueueMonitorClient() {
  const { messages } = useI18n()
  const jq = messages.admin.jobQueue
  const ql = jq.queueLabels
  const queryClient = useQueryClient()

  const statsQuery = useAdminQueueStatsQuery()
  const pauseStatusQuery = useAdminQueuePauseStatusQuery()
  const pauseMutation = useAdminQueuePauseMutation()

  const queueMap = statsQuery.data?.success ? statsQuery.data.data : undefined
  const pauseMap = pauseStatusQuery.data?.success ? pauseStatusQuery.data.data.queues : undefined
  const totals = useMemo(() => aggregateStats(queueMap), [queueMap])

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-crawler-history'] })
    void queryClient.invalidateQueries({ queryKey: ['admin-queue-pause-status'] })
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ListOrdered className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-heading-xl font-extrabold tracking-tight">{jq.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{jq.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => refreshAll()}
            disabled={statsQuery.isFetching || pauseStatusQuery.isFetching}
          >
            {jq.refresh}
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/admin/crawler/control">{jq.dispatchJob}</Link>
          </Button>
        </div>
      </div>

      {statsQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {jq.requestFailed}
        </div>
      ) : null}

      {pauseStatusQuery.isError ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {jq.pauseStatusFailed}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardStatCardShell tone="blue">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className={dashboardStatLabelClass}>{jq.cardActive}</span>
            <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary">
              {jq.live}
            </span>
          </div>
          <p className={cn(dashboardStatValueClass, 'mt-0 font-mono font-black')}>
            {statsQuery.isLoading ? '—' : totals.active}
          </p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="yellow">
          <p className={dashboardStatLabelClass}>{jq.cardWaiting}</p>
          <p className={cn(dashboardStatValueClass, 'font-mono font-black')}>
            {statsQuery.isLoading ? '—' : totals.waiting}
          </p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="green">
          <p className={dashboardStatLabelClass}>{jq.cardCompleted}</p>
          <p className={cn(dashboardStatValueClass, 'font-mono font-black')}>
            {statsQuery.isLoading ? '—' : totals.completed}
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">{jq.cardCompletedHint}</p>
        </DashboardStatCardShell>
        <DashboardStatCardShell tone="red">
          <p className={dashboardStatLabelClass}>{jq.cardFailed}</p>
          <p className={cn(dashboardStatValueClass, 'font-mono font-black')}>
            {statsQuery.isLoading ? '—' : totals.failed}
          </p>
        </DashboardStatCardShell>
      </div>

      {queueMap ? (
        <div className="overflow-hidden rounded-2xl border border-outline/10 bg-surface-container-lowest">
          <div className="border-b border-outline/10 bg-surface-container-low/40 px-4 py-3">
            <h2 className="text-sm font-bold text-on-surface">{jq.sectionQueues}</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">{jq.colQueue}</TableHead>
                <TableHead className="text-right">{jq.cardWaiting}</TableHead>
                <TableHead className="text-right">{jq.cardActive}</TableHead>
                <TableHead className="text-right">{jq.cardCompleted}</TableHead>
                <TableHead className="text-right">{jq.cardFailed}</TableHead>
                <TableHead className="w-[200px] text-right">{jq.colControls}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {QUEUE_ORDER.map((name) => {
                const s = queueMap[name]
                const label = ql[name as keyof typeof ql]
                const paused = pauseMap?.[name]?.isPaused ?? false
                const busy = pauseMutation.isPending && pauseMutation.variables?.queueName === name
                return (
                  <TableRow key={name}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {label}
                        {paused ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
                            {jq.queuePausedBadge}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.waiting}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.active}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.completed}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{s.failed}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={busy || pauseStatusQuery.isLoading}
                        onClick={() =>
                          pauseMutation.mutate({ queueName: name, paused: !paused })
                        }
                      >
                        {paused ? jq.resumeQueue : jq.pauseQueue}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <JobQueueActivitySection />
    </div>
  )
}
