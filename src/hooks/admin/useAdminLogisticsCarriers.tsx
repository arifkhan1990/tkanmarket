'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  AdminLogisticsCarriersOverviewResponse,
  AdminLogisticsCarriersQuery
} from '@/types/admin-logistics-carriers.types'

type CarriersEnvelope = ApiEnvelope<AdminLogisticsCarriersOverviewResponse> & { meta?: PaginationMeta }

export function useAdminLogisticsCarriersQuery(params: AdminLogisticsCarriersQuery) {
  const query = useQuery({
    queryKey: ['admin-logistics-carriers', params],
    queryFn: async () => {
      const url = new URL('/api/v1/admin/logistics/carriers', window.location.origin)
      url.searchParams.set('page', String(params.page))
      url.searchParams.set('limit', String(params.limit))
      if (params.region) url.searchParams.set('region', params.region)
      if (params.serviceType) url.searchParams.set('serviceType', params.serviceType)
      if (params.health) url.searchParams.set('health', params.health)
      if (params.q) url.searchParams.set('q', params.q)

      const res = await fetch(url.toString())
      const json = (await res.json()) as CarriersEnvelope

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load carriers' : json.error.message)
      }

      return { data: json.data, meta: json.meta }
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load carriers')
  }, [query.error])

  return query
}

