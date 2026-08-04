'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricSummary } from '@/types/marketplace.types'
import type { PaginationMeta } from '@/types/api-envelope.types'

type FabricsPageData = {
  items: FabricSummary[]
  meta: PaginationMeta
}

export function useSupplierFabricsCatalog(params: {
  supplierId: number
  page: number
  limit: number
  fabricType: string | null
}) {
  const query = useQuery({
    queryKey: ['fabrics', 'supplier-catalog', params.supplierId, params.page, params.limit, params.fabricType],
    queryFn: async () => {
      const u = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
        supplier_id: String(params.supplierId),
        sort: 'created_at_desc'
      })
      if (params.fabricType) u.set('fabric_type', params.fabricType)
      const res = await fetch(`/api/v1/fabrics?${u.toString()}`)
      const json = (await res.json()) as ApiEnvelope<FabricSummary[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      if (!json.meta) throw new Error('Missing pagination')
      return { items: json.data, meta: json.meta } satisfies FabricsPageData
    },
    enabled: params.supplierId > 0
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load fabrics')
  }, [query.error])

  return query
}
