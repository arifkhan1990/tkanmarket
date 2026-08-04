'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  AdminCrawlerDiagnosticsResponse,
  AdminCrawlerHistoryResponse,
  AdminCrawlerRunDetailResponse,
  AdminCrawlerStatusResponse,
  CancelRunResponse,
  ReconcileStaleCrawlerRunsResponse
} from '@/types/admin-crawler.types'
import type { CrawlerSource } from '@/types/crawler.types'
import { useI18n } from '@/hooks/useI18n'

function crawlerControlPollMs(data: AdminCrawlerStatusResponse | undefined): number | false {
  if (!data) return false
  if (data.runningCount > 0) return 4_000
  const st = data.latestRun?.status
  if (st === 'RUNNING' || st === 'PENDING') return 4_000
  return false
}

export function useAdminCrawler() {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminCrawlerStatusResponse>>({
    queryKey: ['admin-crawler'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/crawler')
      const json = (await res.json()) as ApiEnvelope<AdminCrawlerStatusResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.crawlerPage.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const payload = query.state.data?.success ? query.state.data.data : undefined
      return crawlerControlPollMs(payload)
    }
  })
}

export function useCrawlerHistoryQuery(params: {
  page: number
  pageSize: number
  status?: string
  source?: string
  q?: string
}) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminCrawlerHistoryResponse>>({
    queryKey: ['admin-crawler-history', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('pageSize', String(params.pageSize))
      if (params.status) sp.set('status', params.status)
      if (params.source) sp.set('source', params.source)
      if (params.q) sp.set('q', params.q)
      const res = await fetch(`/api/v1/admin/crawler/history?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminCrawlerHistoryResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.crawlerHistory.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const d = query.state.data?.success ? query.state.data.data : undefined
      if (!d) return false
      if (d.stats.activeRunners > 0) return 5_000
      if (d.items.some((i) => i.status === 'RUNNING' || i.status === 'PENDING')) return 5_000
      return false
    }
  })
}

export function useCrawlerDiagnosticsQuery() {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminCrawlerDiagnosticsResponse>>({
    queryKey: ['admin-crawler-diagnostics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/crawler/diagnostics')
      const json = (await res.json()) as ApiEnvelope<AdminCrawlerDiagnosticsResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.crawlerDiagnostics.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const d = query.state.data?.success ? query.state.data.data : undefined
      if (d?.crawlerEnabled === false) return 60_000
      return 30_000
    }
  })
}

export function useCrawlerRunDetailQuery(runId: number | null) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminCrawlerRunDetailResponse>>({
    queryKey: ['admin-crawler-run', runId],
    enabled: runId !== null && runId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/crawler/status/${runId}`)
      const json = (await res.json()) as ApiEnvelope<AdminCrawlerRunDetailResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.crawlerHistory.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    refetchInterval: (query) => {
      const run = query.state.data?.success ? query.state.data.data.run : null
      if (!run) return false
      if (run.status === 'RUNNING' || run.status === 'PENDING') return 3_000
      return false
    }
  })
}

export function useCrawlerRunJob() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { keywords: string[]; source: CrawlerSource; max_products?: number }) => {
      const res = await fetch('/api/v1/admin/crawler/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })
      const json = (await res.json()) as ApiEnvelope<{ runId: number }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.crawlerPage.requestFailed
        throw new Error(message)
      }
      if (!('data' in json) || json.data === undefined) {
        throw new Error(messages.admin.crawlerPage.requestFailed)
      }
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-history'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-diagnostics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-run'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-pause-status'] })
      toast.success(messages.admin.crawlerPage.runQueuedToast)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.admin.crawlerPage.requestFailed
      toast.error(message)
    }
  })
}

export function useReconcileStaleRuns() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { maxAgeMinutes?: number; force?: boolean } | number = {}) => {
      const params = typeof input === 'number'
        ? { maxAgeMinutes: input, force: false }
        : { maxAgeMinutes: input.maxAgeMinutes ?? 120, force: input.force ?? false }

      const res = await fetch('/api/v1/admin/crawler/reconcile-stale', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(params)
      })
      const json = (await res.json()) as ApiEnvelope<ReconcileStaleCrawlerRunsResponse>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.crawlerPage.requestFailed
        throw new Error(message)
      }
      if (!('data' in json) || json.data === undefined) {
        throw new Error(messages.admin.crawlerPage.requestFailed)
      }
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-history'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-diagnostics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-run'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-pause-status'] })
      if (data.reconciledCount === 0) {
        toast.info(messages.admin.crawlerDiagnostics.reconcileNone)
      } else {
        const base = messages.admin.crawlerDiagnostics.reconcileDone.replace('{count}', String(data.reconciledCount))
        toast.success(base)
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.admin.crawlerPage.requestFailed
      toast.error(message)
    }
  })
}

export function useCancelCrawlerRun() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (runId: number) => {
      const res = await fetch(`/api/v1/admin/crawler/cancel/${runId}`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<CancelRunResponse>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.crawlerPage.requestFailed
        throw new Error(message)
      }
      if (!('data' in json) || json.data === undefined) {
        throw new Error(messages.admin.crawlerPage.requestFailed)
      }
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-history'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-diagnostics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-run'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      if (data.ok) {
        toast.success(data.message)
      } else {
        toast.info(data.message)
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.admin.crawlerPage.requestFailed
      toast.error(message)
    }
  })
}

export function useCrawlerRetryJob() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (runId: number) => {
      const res = await fetch(`/api/v1/admin/crawler/retry/${runId}`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<{ runId: number }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.crawlerPage.requestFailed
        throw new Error(message)
      }
      if (!('data' in json) || json.data === undefined) {
        throw new Error(messages.admin.crawlerPage.requestFailed)
      }
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-history'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-diagnostics'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-crawler-run'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-stats'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-recent-queue-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-queue-pause-status'] })
      toast.success(messages.admin.crawlerPage.retryQueuedToast)
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : messages.admin.crawlerPage.requestFailed
      toast.error(message)
    }
  })
}

/** @deprecated Prefer `useCrawlerRunJob` — uses typed sources and `/api/v1/admin/crawler/run`. */
export function useCrawlerTrigger() {
  return useCrawlerRunJob()
}
