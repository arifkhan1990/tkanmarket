'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchFabricsForCompare } from '@/lib/services/fabric-compare.service'
import type { FabricDetail } from '@/types/marketplace.types'

export function useFabricCompare(ids: number[], initialData?: FabricDetail[]) {
  const key = ids.slice().sort((a, b) => a - b).join(',')

  const query = useQuery({
    queryKey: ['fabric-compare', key],
    queryFn: () => fetchFabricsForCompare(ids),
    enabled: ids.length > 0,
    initialData: initialData && initialData.length > 0 ? initialData : undefined
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load comparison')
  }, [query.error])

  return query
}
