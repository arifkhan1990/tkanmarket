'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminSalesPerformance } from '@/services/admin-sales-performance-api.service'

export function useAdminSalesPerformanceQuery(days: number) {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.salesPerformance

  const query = useQuery({
    queryKey: ['admin-sales-performance', days],
    queryFn: async () => {
      const { ok, json } = await fetchAdminSalesPerformance(days)
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
