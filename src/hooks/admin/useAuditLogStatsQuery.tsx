'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AuditLogStats } from '@/types/audit-log-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useAuditLogStatsQuery(params: { rangeDays: number }) {
  const { messages } = useI18n()

  const query = useQuery({
    queryKey: ['admin-audit-log-stats', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('rangeDays', String(params.rangeDays))
      const res = await fetch(`/api/v1/admin/audit-log/stats?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AuditLogStats>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.loadErrors.auditLog)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.auditLog)
  }, [messages.admin.loadErrors.auditLog, query.error])

  return query
}

