'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchPromotionAnalytics } from '@/services/admin-promotion-analytics-api.service'

export function usePromotionAnalyticsQuery() {
  const query = useQuery({
    queryKey: ['admin-promotion-analytics'],
    queryFn: async () => {
      const json = await fetchPromotionAnalytics()
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load promotion analytics')
  }, [query.error])

  return query
}
