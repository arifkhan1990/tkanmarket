'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SystemHealthRange, SystemLogLevel, SystemHealthResponse } from '@/types/admin-system-health.types'

export function useAdminSystemHealthQuery(params: { range: SystemHealthRange; level: SystemLogLevel }) {
  const query = useQuery({
    queryKey: ['admin-system-health', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('range', params.range)
      sp.set('level', params.level)
      const res = await fetch(`/api/v1/admin/system-health?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<SystemHealthResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load system health')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 5 * 1000,
    refetchInterval: 45 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load system health')
  }, [query.error])

  return query
}
