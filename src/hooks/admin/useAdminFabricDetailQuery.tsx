'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchAdminFabricDetail } from '@/services/admin-fabric-detail-api.service'
import { useI18n } from '@/hooks/useI18n'

export function useAdminFabricDetailQuery(fabricId: number | null) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-fabric-detail', fabricId],
    enabled: fabricId !== null && fabricId > 0,
    queryFn: async () => {
      const json = await fetchAdminFabricDetail(fabricId as number)
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 20 * 1000,
    meta: { errorMessage: messages.admin.leadsTimeline.requestFailed }
  })
}
