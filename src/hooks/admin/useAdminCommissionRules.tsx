'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminCommissionRules } from '@/services/admin-commission-rules-api.service'

export function useAdminCommissionRulesQuery() {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.commissionRules

  const query = useQuery({
    queryKey: ['admin-commission-rules'],
    queryFn: async () => {
      const { ok, json } = await fetchAdminCommissionRules()
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(loadFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadFailed)
  }, [query.error, loadFailed])

  return query
}
