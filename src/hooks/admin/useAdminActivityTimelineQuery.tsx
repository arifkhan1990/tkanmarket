'use client'

import * as React from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminActivityTimelineListResponse } from '@/types/admin-activity-timeline.types'

type AdminActivityTimelineParams = {
  userId?: number | null
  from?: Date | null
  to?: Date | null
  q?: string | null
  pageSize?: number
}

function formatDateParam(d: Date | null | undefined): string | undefined {
  if (!d) return undefined
  const t = d.getTime()
  if (Number.isNaN(t)) return undefined
  return d.toISOString()
}

export function useAdminActivityTimelineQuery(params: AdminActivityTimelineParams) {
  const pageSize = params.pageSize && Number.isFinite(params.pageSize) ? params.pageSize : 10

  const query = useInfiniteQuery({
    queryKey: ['admin-activity-timeline', params.userId ?? null, params.from?.toISOString() ?? null, params.to?.toISOString() ?? null, params.q ?? null, pageSize],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const sp = new URLSearchParams()
      sp.set('page', String(pageParam))
      sp.set('limit', String(pageSize))
      if (params.userId != null) sp.set('userId', String(params.userId))
      const fromStr = formatDateParam(params.from)
      const toStr = formatDateParam(params.to)
      if (fromStr) sp.set('from', fromStr)
      if (toStr) sp.set('to', toStr)
      if (params.q && params.q.trim().length > 0) sp.set('q', params.q.trim())

      const res = await fetch(`/api/v1/admin/activity-timeline?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminActivityTimelineListResponse>

      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }

      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    getNextPageParam: (lastPage) => {
      const { meta } = lastPage
      return meta.page < meta.totalPages ? meta.page + 1 : undefined
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load activity timeline')
  }, [query.error])

  return query
}

