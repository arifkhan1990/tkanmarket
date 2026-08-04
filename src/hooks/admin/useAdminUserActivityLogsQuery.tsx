'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { UserActivityLogsListResponse } from '@/types/user-activity-logs.types'
import type { UserActivityActionType } from '@/types/user-activity-logs.types'

type Params = {
  userId?: number | null
  page: number
  limit: number
  from: Date
  to: Date
  q?: string | null
  actionType?: UserActivityActionType | null
}

function formatDate(d: Date): string {
  return d.toISOString()
}

export function useAdminUserActivityLogsQuery(params: Params) {
  const query = useQuery({
    queryKey: [
      'admin-user-activity-logs',
      params.userId ?? null,
      params.page,
      params.limit,
      params.from.toISOString(),
      params.to.toISOString(),
      params.q ?? null,
      params.actionType ?? null
    ],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.userId != null) sp.set('userId', String(params.userId))
      sp.set('from', formatDate(params.from))
      sp.set('to', formatDate(params.to))
      if (params.q && params.q.trim().length > 0) sp.set('q', params.q.trim())
      if (params.actionType && params.actionType !== 'ALL') sp.set('actionType', params.actionType)

      const res = await fetch(`/api/v1/admin/user-activity-logs?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<UserActivityLogsListResponse>

      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }

      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load user activity logs')
  }, [query.error])

  return query
}

