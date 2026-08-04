'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AuthSecurityEventListResponse } from '@/types/auth-security-events.types'
import { useI18n } from '@/hooks/useI18n'

export type AuthSecurityEventsQueryParams = {
  page: number
  limit: number
  eventType?: string
  from?: string
  to?: string
  q?: string
}

export function useAuthSecurityEventsQuery(params: AuthSecurityEventsQueryParams) {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-auth-security-events', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.eventType) sp.set('eventType', params.eventType)
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.q) sp.set('q', params.q)
      const res = await fetch(`/api/v1/admin/auth-security-events?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AuthSecurityEventListResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    placeholderData: (prev) => prev
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(
      query.error instanceof Error ? query.error.message : messages.admin.loadErrors.authSecurityEvents
    )
  }, [messages.admin.loadErrors.authSecurityEvents, query.error])

  return query
}
