import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminBullJobDetailDto } from '@/types/admin-bull-job.types'
import type {
  AdminQueuePauseStatusMap,
  AdminQueueStatsMap,
  AdminUnifiedQueueJobsResponse
} from '@/types/admin-job-queue.types'

export async function fetchAdminQueueStats(): Promise<ApiEnvelope<AdminQueueStatsMap>> {
  const res = await fetch('/api/v1/admin/queues')
  const json = (await res.json()) as ApiEnvelope<AdminQueueStatsMap>
  return json
}

export async function fetchAdminRecentQueueJobs(params: {
  page: number
  pageSize: number
  q?: string
  queue?: string
}): Promise<ApiEnvelope<AdminUnifiedQueueJobsResponse>> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('pageSize', String(params.pageSize))
  if (params.q) sp.set('q', params.q)
  if (params.queue) sp.set('queue', params.queue)
  const res = await fetch(`/api/v1/admin/queues/recent-jobs?${sp.toString()}`)
  const json = (await res.json()) as ApiEnvelope<AdminUnifiedQueueJobsResponse>
  return json
}

export async function fetchAdminBullJobDetail(
  queueName: string,
  jobId: string
): Promise<ApiEnvelope<AdminBullJobDetailDto>> {
  const q = encodeURIComponent(queueName)
  const j = encodeURIComponent(jobId)
  const res = await fetch(`/api/v1/admin/queues/${q}/jobs/${j}`)
  const json = (await res.json()) as ApiEnvelope<AdminBullJobDetailDto>
  return json
}

export async function postAdminBullJobRetry(
  queueName: string,
  jobId: string
): Promise<ApiEnvelope<{ ok: true }>> {
  const q = encodeURIComponent(queueName)
  const j = encodeURIComponent(jobId)
  const res = await fetch(`/api/v1/admin/queues/${q}/jobs/${j}`, { method: 'POST' })
  const json = (await res.json()) as ApiEnvelope<{ ok: true }>
  return json
}

export async function fetchAdminQueuePauseStatus(): Promise<
  ApiEnvelope<{ queues: AdminQueuePauseStatusMap }>
> {
  const res = await fetch('/api/v1/admin/queues/pause-status')
  const json = (await res.json()) as ApiEnvelope<{ queues: AdminQueuePauseStatusMap }>
  return json
}

export async function postAdminQueuePause(
  queueName: string,
  paused: boolean
): Promise<ApiEnvelope<{ isPaused: boolean }>> {
  const q = encodeURIComponent(queueName)
  const res = await fetch(`/api/v1/admin/queues/${q}/pause`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paused })
  })
  const json = (await res.json()) as ApiEnvelope<{ isPaused: boolean }>
  return json
}

export async function postAdminCleanStaleActiveJobs(params: {
  queue?: string
  graceMinutes?: number
  limit?: number
}): Promise<ApiEnvelope<{ graceMinutes: number; results: Array<{ queue: string; deletedCount: number }> }>> {
  const res = await fetch('/api/v1/admin/queues/clean-stale-active', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  const json = (await res.json()) as ApiEnvelope<{
    graceMinutes: number
    results: Array<{ queue: string; deletedCount: number }>
  }>
  return json
}
