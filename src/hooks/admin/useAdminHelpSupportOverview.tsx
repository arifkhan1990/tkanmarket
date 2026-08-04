'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminHelpSupportOverviewResponse } from '@/types/admin-help-support.types'

export function useAdminHelpSupportOverview() {
  return useQuery({
    queryKey: ['admin-help-support-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/help-support/overview')
      const json = (await res.json()) as ApiEnvelope<AdminHelpSupportOverviewResponse>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load help center'
        throw new Error(msg)
      }
      return json.data
    },
    staleTime: 60 * 1000
  })
}
