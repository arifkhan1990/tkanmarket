'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { AdminSupplierRow } from '@/types/admin-suppliers.types'

export function useAdminSuppliersQuery(params: { page: number; limit: number; q: string }) {
  return useQuery({
    queryKey: ['admin-suppliers', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q.trim()) sp.set('q', params.q.trim())
      const res = await fetch(`/api/v1/admin/suppliers?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminSupplierRow[]> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load suppliers'
        throw new Error(msg)
      }
      return { items: json.data, meta: json.meta }
    },
    staleTime: 30 * 1000
  })
}
