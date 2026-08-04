'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'

export interface SocialCampaign {
  id: number
  name: string
  description: string | null
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
  startsAt: string | null
  endsAt: string | null
  createdByUserId: number
  createdAt: string
  updatedAt: string
  postCount: number
  publishedCount: number
  scheduledCount: number
}

export function useAdminSocialCampaigns() {
  return useQuery<ApiEnvelope<{ items: SocialCampaign[] }>>({
    queryKey: ['admin-social-campaigns'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/social/campaigns')
      const json = (await res.json()) as ApiEnvelope<{ items: SocialCampaign[] }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Campaign list failed'
        throw new Error(message)
      }
      return json
    }
  })
}

export interface CreateCampaignInput {
  name: string
  description?: string
  status?: SocialCampaign['status']
  startsAt?: string
  endsAt?: string
}

export function useSocialCampaignMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const res = await fetch('/api/v1/admin/social/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name,
          description: input.description,
          status: input.status,
          starts_at: input.startsAt,
          ends_at: input.endsAt
        })
      })
      const json = (await res.json()) as ApiEnvelope<{ id: number }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Create failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: () => {
      toast.success('Campaign created')
      void queryClient.invalidateQueries({ queryKey: ['admin-social-campaigns'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Create failed')
  })

  const update = useMutation({
    mutationFn: async (input: { id: number } & Partial<CreateCampaignInput>) => {
      const body: Record<string, unknown> = {}
      if (input.name !== undefined) body.name = input.name
      if (input.description !== undefined) body.description = input.description
      if (input.status !== undefined) body.status = input.status
      if (input.startsAt !== undefined) body.starts_at = input.startsAt
      if (input.endsAt !== undefined) body.ends_at = input.endsAt
      const res = await fetch(`/api/v1/admin/social/campaigns/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<{ updated: boolean }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Update failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: () => {
      toast.success('Campaign updated')
      void queryClient.invalidateQueries({ queryKey: ['admin-social-campaigns'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed')
  })

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/social/campaigns/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiEnvelope<{ deleted: boolean }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Delete failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: () => {
      toast.success('Campaign archived')
      void queryClient.invalidateQueries({ queryKey: ['admin-social-campaigns'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed')
  })

  const attachPosts = useMutation({
    mutationFn: async (input: { campaignId: number; postIds: number[] }) => {
      const res = await fetch(`/api/v1/admin/social/campaigns/${input.campaignId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_ids: input.postIds })
      })
      const json = (await res.json()) as ApiEnvelope<{ attached: number }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Attach failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: (data) => {
      toast.success(`Attached ${data.data.attached} posts`)
      void queryClient.invalidateQueries({ queryKey: ['admin-social-campaigns'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-social'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Attach failed')
  })

  return { create, update, remove, attachPosts }
}
