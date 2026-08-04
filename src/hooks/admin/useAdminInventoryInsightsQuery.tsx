'use client'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminInventoryInsightsResponse } from '@/types/admin-inventory-insights.types'

export function useAdminInventoryInsightsQuery() {
  return useQuery({
    queryKey: ['admin-inventory-insights'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/inventory-insights')
      const json = (await res.json()) as ApiEnvelope<AdminInventoryInsightsResponse>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load inventory insights'
        toast.error(msg)
        throw new Error(msg)
      }
      return json.data
    },
    staleTime: 60 * 1000
  })
}
