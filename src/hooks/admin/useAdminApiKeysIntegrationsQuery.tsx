'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CrawlerIntegrationsResponse, CrawlerIntegrationItem } from '@/types/api-keys-admin.types'
import type { SystemHealthRange } from '@/types/system-health-monitor.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminApiKeysIntegrationsQuery(params: { enabledDays: number }) {
  const { messages } = useI18n()

  const query = useQuery({
    queryKey: ['admin-api-keys-integrations', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('enabledDays', String(params.enabledDays))
      const res = await fetch(`/api/v1/admin/api-keys/integrations?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<CrawlerIntegrationsResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.loadErrors.auditLog)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.auditLog)
  }, [messages.admin.loadErrors.auditLog, query.error])

  return query
}

