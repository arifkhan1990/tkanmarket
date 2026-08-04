'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchFabricTaxonomy } from '@/services/admin-fabric-taxonomy-api.service'

export function useFabricTaxonomyQuery(categorySlug: string | undefined) {
  const query = useQuery({
    queryKey: ['admin-fabric-taxonomy', categorySlug ?? ''],
    queryFn: async () => {
      const json = await fetchFabricTaxonomy(categorySlug)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load taxonomy')
  }, [query.error])

  return query
}
