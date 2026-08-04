'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadAssignmentRulesResponse, LeadOpsConfig } from '@/types/lead-assignment.types'
import { useI18n } from '@/hooks/useI18n'

export function useLeadAssignmentRulesQuery() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-lead-assignment-rules'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/lead-assignment-rules')
      const json = (await res.json()) as ApiEnvelope<LeadAssignmentRulesResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leads.table.failedToLoad)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })
}

export function useLeadAssignmentRulesSave() {
  const qc = useQueryClient()
  const { messages } = useI18n()
  return useMutation({
    mutationFn: async (body: Pick<LeadOpsConfig, 'assignmentRules' | 'draftNote'>) => {
      const res = await fetch('/api/v1/admin/lead-assignment-rules', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<LeadAssignmentRulesResponse>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leads.table.failedToLoad)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-lead-assignment-rules'] })
      toast.success(messages.admin.leadAssignmentPage.savedToast)
    }
  })
}
