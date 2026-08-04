'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchAdminPricingAnalysis } from '@/services/admin-pricing-analysis-api.service'

export function useAdminPricingAnalysisQuery(loadErrorMessage: string) {
  const query = useQuery({
    queryKey: ['admin-pricing-analysis'],
    queryFn: async () => {
      const json = await fetchAdminPricingAnalysis()
      if (!json.success) {
        throw new Error(json.error.message)
      }
      return json.data
    },
    staleTime: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadErrorMessage)
  }, [loadErrorMessage, query.error])

  return query
}
