'use client'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminLeadsScoring } from '@/services/admin-leads-scoring-api.service'

export function useLeadScoringDashboard(selectedLeadId?: number) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-leads-scoring', selectedLeadId ?? 0],
    queryFn: async () => {
      const { ok, json } = await fetchAdminLeadsScoring(selectedLeadId)
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leads.table.failedToLoad)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })
}
