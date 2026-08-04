'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchProductReviewQueue } from '@/services/admin-product-review-queue-api.service'
import type { ProductReviewStatusFilter } from '@/types/admin-product-review-queue.types'

export function useProductReviewQueueQuery(params: {
  page: number
  limit: number
  filter: ProductReviewStatusFilter
}) {
  const query = useQuery({
    queryKey: ['admin-product-review-queue', params.page, params.limit, params.filter],
    queryFn: async () => {
      const json = await fetchProductReviewQueue(params)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load review queue')
  }, [query.error])

  return query
}
