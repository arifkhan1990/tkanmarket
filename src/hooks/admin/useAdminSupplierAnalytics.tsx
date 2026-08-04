'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierAnalyticsPayload } from '@/types/supplier-admin.types'

export function useAdminSupplierAnalytics() {
  return useQuery({
    queryKey: ['admin-supplier-analytics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/analytics')
      const json = (await res.json()) as ApiEnvelope<SupplierAnalyticsPayload>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load analytics'
        throw new Error(msg)
      }
      return json.data
    },
    staleTime: 60 * 1000
  })
}
