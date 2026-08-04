'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type {
  AdminLogisticsShipmentRow,
  AdminLogisticsShipmentsOverview,
  LogisticsShipmentStatus
} from '@/types/admin-logistics-shipments.types'

export type AdminLogisticsShipmentsApiData = {
  overview: AdminLogisticsShipmentsOverview
  items: AdminLogisticsShipmentRow[]
}

export function useAdminLogisticsShipmentsQuery(params: {
  page: number
  limit: number
  status: LogisticsShipmentStatus | 'ALL'
}) {
  return useQuery({
    queryKey: ['admin-logistics-shipments', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      sp.set('status', params.status)
      const res = await fetch(`/api/v1/admin/logistics/shipments?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminLogisticsShipmentsApiData> & { meta?: PaginationMeta }
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load shipments'
        throw new Error(msg)
      }
      return { overview: json.data.overview, items: json.data.items, meta: json.meta }
    },
    staleTime: 30 * 1000
  })
}
