'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  AdminBulkOrderRow,
  AdminBulkOrdersMetrics,
  BulkOrderStatus,
  SupplierTier
} from '@/types/admin-bulk-orders.types'

type BulkOrdersEnvelope = ApiEnvelope<{ items: AdminBulkOrderRow[]; metrics: AdminBulkOrdersMetrics }> & {
  meta?: PaginationMeta
}

export type AdminBulkOrdersQueryParams = {
  page: number
  limit: number
  status?: BulkOrderStatus
  supplierTier?: SupplierTier
  dateFrom?: string
  dateTo?: string
  q?: string
}

export function useAdminBulkOrdersQuery(params: AdminBulkOrdersQueryParams) {
  const query = useQuery({
    queryKey: ['admin-bulk-orders', params],
    queryFn: async () => {
      const url = new URL('/api/v1/admin/bulk-orders', window.location.origin)
      url.searchParams.set('page', String(params.page))
      url.searchParams.set('limit', String(params.limit))
      if (params.status) url.searchParams.set('status', params.status)
      if (params.supplierTier) url.searchParams.set('supplierTier', params.supplierTier)
      if (params.dateFrom) url.searchParams.set('dateFrom', params.dateFrom)
      if (params.dateTo) url.searchParams.set('dateTo', params.dateTo)
      if (params.q) url.searchParams.set('q', params.q)

      const res = await fetch(url.toString())
      const json = (await res.json()) as BulkOrdersEnvelope

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load bulk orders' : json.error.message)
      }

      return { data: json.data, meta: json.meta }
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load bulk orders')
  }, [query.error])

  return query
}

export function useAdminBulkOrdersBulkStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { ids: number[]; status: BulkOrderStatus }) => {
      const res = await fetch('/api/v1/admin/bulk-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to update orders' : json.error.message)
      }
      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bulk-orders'] })
      toast.success('Orders updated')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to update orders')
    }
  })
}
