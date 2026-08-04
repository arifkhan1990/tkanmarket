'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SystemHealthDashboardResponse } from '@/types/admin-system-health-dashboard.types'
import type { SystemHealthRange, SystemLogLevel } from '@/types/admin-system-health.types'

export function useAdminSystemHealthDashboardQuery(params: { range: SystemHealthRange; level: SystemLogLevel }) {
  const query = useQuery({
    queryKey: ['admin-system-health-dashboard', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('range', params.range)
      sp.set('level', params.level)
      const res = await fetch(`/api/v1/admin/system-health/dashboard?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<SystemHealthDashboardResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load system health dashboard')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 5 * 1000,
    refetchInterval: 45 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load system health dashboard')
  }, [query.error])

  return query
}
