'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchNetworkPerformance } from '@/services/admin-network-performance-api.service'

export function useNetworkPerformanceQuery() {
  const query = useQuery({
    queryKey: ['admin-network-performance'],
    queryFn: async () => {
      const json = await fetchNetworkPerformance()
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 5 * 1000,
    refetchInterval: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load network performance')
  }, [query.error])

  return query
}
