'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  fetchAdminBullJobDetail,
  postAdminCleanStaleActiveJobs,
  fetchAdminQueuePauseStatus,
  fetchAdminQueueStats,
  fetchAdminRecentQueueJobs,
  postAdminBullJobRetry,
  postAdminQueuePause
} from '@/services/admin-job-queue.service'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminBullJobDetailDto } from '@/types/admin-bull-job.types'
import type {
  AdminQueuePauseStatusMap,
  AdminQueueStatsMap,
  AdminUnifiedQueueJobsResponse
} from '@/types/admin-job-queue.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminQueueStatsQuery() {
  return useQuery<ApiEnvelope<AdminQueueStatsMap>>({
    queryKey: ['admin-queue-stats'],
    queryFn: async () => {
      const json = await fetchAdminQueueStats()
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const data = query.state.data?.success ? query.state.data.data : undefined
      if (!data) return 5_000
      const active = Object.values(data).reduce((a, s) => a + s.active, 0)
      const waiting = Object.values(data).reduce((a, s) => a + s.waiting, 0)
      return active > 0 || waiting > 0 ? 4_000 : 12_000
    }
  })
}

export function useAdminRecentQueueJobsQuery(params: {
  page: number
  pageSize: number
  q?: string
  queue?: string
}) {
  return useQuery<ApiEnvelope<AdminUnifiedQueueJobsResponse>>({
    queryKey: ['admin-recent-queue-jobs', params],
    queryFn: async () => {
      const json = await fetchAdminRecentQueueJobs(params)
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const data = query.state.data?.success ? query.state.data.data : undefined
      if (!data) return 8_000
      const busy = data.items.some(
        (j) => j.state === 'active' || j.state === 'waiting' || j.state === 'delayed'
      )
      return busy ? 4_000 : 15_000
    }
  })
}

export function useAdminBullJobDetailQuery(queueName: string | null, jobId: string | null) {
  return useQuery<ApiEnvelope<AdminBullJobDetailDto>>({
    queryKey: ['admin-bull-job', queueName, jobId],
    enabled: Boolean(queueName && jobId && jobId.length > 0),
    queryFn: async () => {
      const json = await fetchAdminBullJobDetail(queueName!, jobId!)
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const d = query.state.data?.success ? query.state.data.data : undefined
      if (!d) return false
      if (d.state === 'active' || d.state === 'waiting' || d.state === 'delayed') return 3_000
      return false
    }
  })
}

export function useAdminBullJobRetryMutation() {
  const { messages } = useI18n()
  const b = messages.admin.bullJobDetail
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { queueName: string; jobId: string }) => {
      const json = await postAdminBullJobRetry(input.queueName, input.jobId)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-bull-job'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
      toast.success(b.retryQueuedToast)
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : b.requestFailed
      toast.error(msg)
    }
  })
}

export function useAdminQueuePauseStatusQuery() {
  return useQuery<ApiEnvelope<{ queues: AdminQueuePauseStatusMap }>>({
    queryKey: ['admin-queue-pause-status'],
    queryFn: async () => {
      const json = await fetchAdminQueuePauseStatus()
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: 12_000
  })
}

export function useAdminQueuePauseMutation() {
  const { messages } = useI18n()
  const jq = messages.admin.jobQueue
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { queueName: string; paused: boolean }) => {
      const json = await postAdminQueuePause(input.queueName, input.paused)
      if (!json.success) throw new Error(json.error.message)
      return { data: json.data, paused: input.paused }
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-pause-status'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      toast.success(result.paused ? jq.pauseQueuedToast : jq.resumeQueuedToast)
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : jq.pauseStatusFailed
      toast.error(msg)
    }
  })
}

export function useAdminCleanStaleActiveJobsMutation() {
  const { messages } = useI18n()
  const jq = messages.admin.jobQueue
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { queue?: string; graceMinutes?: number; limit?: number }) => {
      const json = await postAdminCleanStaleActiveJobs(input)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
      const totalDeleted = data.results.reduce((acc, r) => acc + r.deletedCount, 0)
      if (totalDeleted === 0) {
        toast.info(jq.cleanedActiveNone)
      } else {
        toast.success(jq.cleanedActiveToast.replace('{count}', String(totalDeleted)))
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : jq.cleanedActiveFailed
      toast.error(msg)
    }
  })
}
