'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  AdminBulkSeoRow,
  AdminBulkSeoBulkUpdatePayload,
  AdminBulkSeoQuery,
  AdminBulkSeoStats
} from '@/types/admin-bulk-seo.types'

type ListEnvelope = ApiEnvelope<AdminBulkSeoRow[]> & { meta?: PaginationMeta }

export function useAdminBulkSeoStatsQuery() {
  const query = useQuery({
    queryKey: ['admin-bulk-seo-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/catalog/seo/stats')
      const json = (await res.json()) as ApiEnvelope<AdminBulkSeoStats>

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load SEO stats' : json.error.message)
      }

      return json.data
    },
    staleTime: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load SEO stats')
  }, [query.error])

  return query
}

export function useAdminBulkSeoQuery(params: AdminBulkSeoQuery) {
  const query = useQuery({
    queryKey: ['admin-bulk-seo', params],
    queryFn: async () => {
      const url = new URL('/api/v1/admin/catalog/seo', window.location.origin)
      url.searchParams.set('page', String(params.page))
      url.searchParams.set('limit', String(params.limit))
      if (params.q) url.searchParams.set('q', params.q)
      if (params.missing) url.searchParams.set('missing', params.missing)

      const res = await fetch(url.toString())
      const json = (await res.json()) as ListEnvelope

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load bulk SEO rows' : json.error.message)
      }

      return { items: json.data, meta: json.meta }
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load bulk SEO rows')
  }, [query.error])

  return query
}

export function useAdminBulkSeoBulkUpdateMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AdminBulkSeoBulkUpdatePayload) => {
      const res = await fetch('/api/v1/admin/catalog/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to save SEO updates' : json.error.message)
      }
      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bulk-seo'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-bulk-seo-stats'] })
      toast.success('SEO updates saved')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to save SEO updates')
    }
  })
}

