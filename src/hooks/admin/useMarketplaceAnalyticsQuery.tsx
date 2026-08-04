'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchMarketplaceAnalytics } from '@/services/admin-marketplace-analytics-api.service'
import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'
import type { MarketplaceAnalyticsPeriod } from '@/types/marketplace-analytics.types'

export function useMarketplaceAnalyticsQuery(period: MarketplaceAnalyticsPeriod) {
  const query = useQuery({
    queryKey: ['admin-marketplace-analytics', period],
    queryFn: async () => {
      const json = await fetchMarketplaceAnalytics(period)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load marketplace analytics')
  }, [query.error])

  return query
}
