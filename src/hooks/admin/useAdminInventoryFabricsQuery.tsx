'use client'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { AdminInventoryFabricRow } from '@/types/admin-inventory-insights.types'

export function useAdminInventoryFabricsQuery(params: { page: number; limit: number; q: string }) {
  return useQuery({
    queryKey: ['admin-inventory-fabrics', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q.trim()) sp.set('q', params.q.trim())
      const res = await fetch(`/api/v1/admin/inventory-fabrics?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{ items: AdminInventoryFabricRow[] }> & {
        meta?: PaginationMeta
      }
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load fabrics'
        toast.error(msg)
        throw new Error(msg)
      }
      return { items: json.data.items, meta: json.meta }
    },
    staleTime: 30 * 1000
  })
}
