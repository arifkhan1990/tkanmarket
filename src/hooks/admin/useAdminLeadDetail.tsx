'use client'

import { useQuery } from '@tanstack/react-query'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadDetail } from '@/types/lead.types'
import { useI18n } from '@/hooks/useI18n'
import { fetchAdminLeadDetail } from '@/services/admin-lead-detail-api.service'

export function useAdminLeadDetail(id: number, initial?: LeadDetail) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<LeadDetail>>({
    queryKey: ['admin-lead-detail', id],
    queryFn: async () => {
      const { ok, json } = await fetchAdminLeadDetail(id)
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    enabled: id > 0,
    initialData: initial ? { success: true, data: initial } : undefined
  })
}

