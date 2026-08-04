'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminAlertsHubOverviewDto } from '@/types/admin-alerts-hub-overview.types'

export const ADMIN_ALERTS_HUB_OVERVIEW_QUERY_KEY = ['admin-alerts-hub-overview'] as const

export function useAdminAlertsHubOverviewQuery() {
  const query = useQuery({
    queryKey: ADMIN_ALERTS_HUB_OVERVIEW_QUERY_KEY,
    queryFn: async (): Promise<AdminAlertsHubOverviewDto> => {
      const res = await fetch('/api/v1/admin/alerts/overview', {
        cache: 'no-store',
        credentials: 'same-origin'
      })
      const json = (await res.json()) as ApiEnvelope<AdminAlertsHubOverviewDto>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load alerts overview' : json.error.message)
      }
      return json.data
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: true
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load alerts overview')
  }, [query.error])

  return query
}
