'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSocialQueueResult, AdminSocialStats } from '@/types/admin-social.types'
import type { AdminSocialAiBatchInput, AdminSocialCreatePostInput } from '@/types/admin-social.types'

import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useI18n } from '@/hooks/useI18n'
import { createAdminSocialPost, runAdminSocialAiBatch } from '@/services/admin-social-actions-api.service'

export function useAdminSocialQueue(params: {
  page: number
  limit: number
  platform?: string
  status?: string
  search?: string
  content_type?: string
}) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminSocialQueueResult>>({
    queryKey: ['admin-social', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.platform) sp.set('platform', params.platform)
      if (params.status) sp.set('status', params.status)
      if (params.search) sp.set('search', params.search)
      if (params.content_type) sp.set('content_type', params.content_type)
      const res = await fetch(`/api/v1/admin/social?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminSocialQueueResult>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function useAdminSocialStats(platform?: string) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminSocialStats>>({
    queryKey: ['admin-social-stats', platform ?? 'all'],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (platform) sp.set('platform', platform)
      const res = await fetch(`/api/v1/admin/social/stats?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminSocialStats>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function SocialQueueSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <TableRowSkeleton key={idx} />
      ))}
    </div>
  )
}

export function useSocialMutations() {
  const queryClient = useQueryClient()
  const { messages } = useI18n()

  const approve = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/social/${id}/approve`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success(messages.admin.socialPage.approveOk)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const publish = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/social/${id}/publish`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success(messages.admin.socialPage.publishOk)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const schedule = useMutation({
    mutationFn: async (input: { id: number; scheduledAt: string }) => {
      const res = await fetch(`/api/v1/admin/social/${input.id}/schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at: input.scheduledAt })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success(messages.admin.socialPage.scheduleOk)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const createPost = useMutation({
    mutationFn: async (input: AdminSocialCreatePostInput) => {
      const { ok, json } = await createAdminSocialPost(input)
      if (!ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success('Post created')
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const aiBatch = useMutation({
    mutationFn: async (input: AdminSocialAiBatchInput) => {
      const { ok, json } = await runAdminSocialAiBatch(input)
      if (!ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-social'] })
      queryClient.invalidateQueries({ queryKey: ['admin-social-stats'] })
      toast.success(`AI generation queued for ${data.created} posts`)
    },
    onError: (e: Error) => toast.error(e.message)
  })

  return { approve, publish, schedule, createPost, aiBatch }
}

export function SocialQueueTableSkeleton() {
  return (
    <div className="rounded-2xl border border-outline/10 bg-surface-container-lowest overflow-hidden">
      <div className="grid grid-cols-12 gap-2 border-b border-outline/10 bg-surface-container/40 px-4 py-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="col-span-12 md:col-span-2 h-4 animate-pulse rounded bg-surface-container-high" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-3 border-b border-outline/5 px-4 py-4">
          <div className="col-span-12 md:col-span-3 flex gap-3">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-surface-container-high" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-24 animate-pulse rounded bg-surface-container-high" />
              <div className="h-4 w-40 animate-pulse rounded bg-surface-container-high" />
            </div>
          </div>
          <div className="col-span-12 md:col-span-4 h-10 animate-pulse rounded bg-surface-container-high" />
          <div className="col-span-6 md:col-span-2 h-6 animate-pulse rounded-full bg-surface-container-high" />
          <div className="col-span-6 md:col-span-2 h-8 animate-pulse rounded bg-surface-container-high" />
          <div className="col-span-12 md:col-span-1 flex justify-end gap-2">
            <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-container-high" />
            <div className="h-9 w-9 animate-pulse rounded-lg bg-surface-container-high" />
          </div>
        </div>
      ))}
    </div>
  )
}
