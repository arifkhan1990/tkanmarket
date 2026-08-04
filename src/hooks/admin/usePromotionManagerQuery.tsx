'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchPromotionManagerOverview } from '@/services/admin-promotion-manager-api.service'

export function usePromotionManagerQuery() {
  const query = useQuery({
    queryKey: ['admin-promotion-manager'],
    queryFn: async () => {
      const json = await fetchPromotionManagerOverview()
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load promotions')
  }, [query.error])

  return query
}
