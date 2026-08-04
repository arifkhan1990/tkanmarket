'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'

export interface SocialIntegration {
  id: number
  userId: number
  platform: 'INSTAGRAM' | 'TIKTOK' | 'PINTEREST' | 'FACEBOOK' | 'YOUTUBE'
  accountId: string
  accountName: string | null
  accountUsername: string | null
  avatarUrl: string | null
  scopes: string[] | null
  expiresAt: string | null
  lastRefreshedAt: string | null
  isActive: boolean
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
}

export interface SocialIntegrationList {
  items: SocialIntegration[]
}

export function useAdminSocialIntegrations(params: { includeInactive?: boolean } = {}) {
  return useQuery<ApiEnvelope<SocialIntegrationList>>({
    queryKey: ['admin-social-integrations', params.includeInactive ?? false],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params.includeInactive) sp.set('include_inactive', 'true')
      const res = await fetch(`/api/v1/admin/social/integrations?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<SocialIntegrationList>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Integrations request failed'
        throw new Error(message)
      }
      return json
    }
  })
}

export function useSocialIntegrationMutations() {
  const queryClient = useQueryClient()

  const connect = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch(`/api/v1/admin/social/integrations/${platform.toLowerCase()}/connect`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<{ authorizationUrl: string }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Failed to start OAuth'
        throw new Error(message)
      }
      return json.data.authorizationUrl
    },
    onSuccess: (authorizationUrl) => {
      window.location.href = authorizationUrl
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to connect')
    }
  })

  const disconnect = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/social/integrations/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiEnvelope<{ disconnected: boolean }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Disconnect failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: () => {
      toast.success('Account disconnected')
      void queryClient.invalidateQueries({ queryKey: ['admin-social-integrations'] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Disconnect failed')
    }
  })

  const refresh = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/social/integrations/${id}`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<{ refreshed: boolean }>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : 'Refresh failed'
        throw new Error(message)
      }
      return json
    },
    onSuccess: () => {
      toast.success('Token refreshed')
      void queryClient.invalidateQueries({ queryKey: ['admin-social-integrations'] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Refresh failed')
    }
  })

  return { connect, disconnect, refresh }
}
