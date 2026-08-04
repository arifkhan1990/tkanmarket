'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { TeamListItem, TeamMemberWithUser } from '@/types/team-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminTeamsQuery() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/teams')
      const json = (await res.json()) as ApiEnvelope<TeamListItem[]>
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

export function useAdminTeamMembersQuery(teamId: number | null) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-team-members', teamId],
    enabled: teamId !== null && teamId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/teams/${teamId}/members`)
      const json = (await res.json()) as ApiEnvelope<TeamMemberWithUser[]>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    }
  })
}

export function useAdminTeamMutations() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  const createTeam = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/v1/admin/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })
      const json = (await res.json()) as ApiEnvelope<TeamListItem>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-teams'] })
      toast.success(messages.admin.teamsPage.createdTeamToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const addMember = useMutation({
    mutationFn: async (body: { teamId: number; userId: number; title?: string | null }) => {
      const res = await fetch(`/api/v1/admin/teams/${body.teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: body.userId, title: body.title })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return body.teamId
    },
    onSuccess: async (teamId) => {
      await qc.invalidateQueries({ queryKey: ['admin-team-members', teamId] })
      toast.success(messages.admin.teamsPage.addedMemberToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  const removeMember = useMutation({
    mutationFn: async (params: { memberId: number; teamId: number }) => {
      const res = await fetch(`/api/v1/admin/team-members/${params.memberId}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return params.teamId
    },
    onSuccess: async (teamId) => {
      await qc.invalidateQueries({ queryKey: ['admin-team-members', teamId] })
      toast.success(messages.admin.teamsPage.removedMemberToast)
    },
    onError: (err: Error) => {
      toast.error(err.message)
    }
  })

  return { createTeam, addMember, removeMember }
}
