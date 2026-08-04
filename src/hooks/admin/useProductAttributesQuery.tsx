'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchProductAttributesOverview } from '@/services/admin-product-attributes-api.service'

export function useProductAttributesQuery() {
  const query = useQuery({
    queryKey: ['admin-product-attributes'],
    queryFn: async () => {
      const json = await fetchProductAttributesOverview()
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load attributes')
  }, [query.error])

  return query
}
