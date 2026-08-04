'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { ApiKeysListResponse } from '@/types/api-keys-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminApiKeysQuery(params: { page: number; limit: number; q?: string | null }) {
  const { messages } = useI18n()

  const query = useQuery({
    queryKey: ['admin-api-keys', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.q) sp.set('q', params.q)

      const res = await fetch(`/api/v1/admin/api-keys?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<ApiKeysListResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.loadErrors.auditLog)
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

