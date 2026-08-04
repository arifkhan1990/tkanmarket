'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AuthSecuritySummary } from '@/types/auth-security-summary.types'
import { useI18n } from '@/hooks/useI18n'

export function useAuthSecuritySummaryQuery() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-auth-security-summary'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/auth-security-events/summary')
      const json = (await res.json()) as ApiEnvelope<AuthSecuritySummary>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(
      query.error instanceof Error ? query.error.message : messages.admin.loadErrors.authSecurityEvents
    )
  }, [messages.admin.loadErrors.authSecurityEvents, query.error])

  return query
}
