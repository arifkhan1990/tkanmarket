'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { SupplierInquiriesResponse } from '@/types/supplier-insights.types'

export function useAdminSupplierInquiries(params: {
  supplierId: number | null
  page: number
  limit: number
}) {
  return useQuery({
    queryKey: ['admin-supplier-inquiries', params.supplierId, params.page, params.limit],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      const res = await fetch(`/api/v1/admin/suppliers/${params.supplierId}/inquiries?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{
        supplier: SupplierInquiriesResponse['supplier']
        pendingCount: number
        items: SupplierInquiriesResponse['items']
      }> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load inquiries'
        throw new Error(msg)
      }
      return {
        supplier: json.data.supplier,
        pendingCount: json.data.pendingCount,
        items: json.data.items,
        meta: json.meta
      }
    },
    enabled: params.supplierId != null && params.supplierId > 0,
    staleTime: 20 * 1000
  })
}
