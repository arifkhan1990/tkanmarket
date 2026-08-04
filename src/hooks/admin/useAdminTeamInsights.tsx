'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { TeamDashboardStats, TeamMemberPerformanceRow } from '@/types/team-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminTeamDashboardQuery(teamId: number | null) {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-team-dashboard', teamId],
    enabled: teamId !== null && teamId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/teams/${teamId}/dashboard`)
      const json = (await res.json()) as ApiEnvelope<TeamDashboardStats>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.teamInsights)
  }, [messages.admin.loadErrors.teamInsights, query.error])

  return query
}

export function useAdminTeamPerformanceQuery(teamId: number | null) {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-team-performance', teamId],
    enabled: teamId !== null && teamId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/teams/${teamId}/performance`)
      const json = (await res.json()) as ApiEnvelope<TeamMemberPerformanceRow[]>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.teams)
  }, [messages.admin.loadErrors.teams, query.error])

  return query
}
