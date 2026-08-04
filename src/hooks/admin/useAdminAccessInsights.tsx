'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminAccessInsights } from '@/types/admin-access-insights.types'
import { useI18n } from '@/hooks/useI18n'

const INSIGHTS_KEY = ['admin-access-insights'] as const

export function useAdminAccessInsights() {
  const { messages } = useI18n()

  const query = useQuery({
    queryKey: INSIGHTS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/access/insights')
      const json = (await res.json()) as ApiEnvelope<AdminAccessInsights>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.loadErrors.users)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.users)
  }, [messages.admin.loadErrors.users, query.error])

  return query
}

