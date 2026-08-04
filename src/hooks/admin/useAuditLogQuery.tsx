'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AuditLogListResponse } from '@/types/audit-log-admin.types'
import { useI18n } from '@/hooks/useI18n'

export type AuditLogQueryParams = {
  page: number
  limit: number
  actorId?: number
  action?: string
  from?: string
  to?: string
  q?: string
}

export function useAuditLogQuery(params: AuditLogQueryParams) {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-audit-log', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.actorId) sp.set('actorId', String(params.actorId))
      if (params.action) sp.set('action', params.action)
      if (params.from) sp.set('from', params.from)
      if (params.to) sp.set('to', params.to)
      if (params.q) sp.set('q', params.q)
      const res = await fetch(`/api/v1/admin/audit-log?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AuditLogListResponse>
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
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.auditLog)
  }, [messages.admin.loadErrors.auditLog, query.error])

  return query
}
