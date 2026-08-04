'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminAdvancedAnalytics } from '@/services/admin-advanced-analytics-api.service'

export function useAdminAdvancedAnalyticsQuery() {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.advancedAnalytics

  const query = useQuery({
    queryKey: ['admin-advanced-analytics'],
    queryFn: async () => {
      const { ok, json } = await fetchAdminAdvancedAnalytics()
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(loadFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadFailed)
  }, [query.error, loadFailed])

  return query
}
