'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { RbacMatrixResponse, UserRoleAssignment, UserRoleAssignmentRow } from '@/types/rbac-admin.types'
import { useI18n } from '@/hooks/useI18n'

export function useRbacMatrixQuery() {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-rbac-matrix'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/rbac/matrix')
      const json = (await res.json()) as ApiEnvelope<RbacMatrixResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 60 * 1000
  })
}

export function useUserRolesQuery(userId: number | null) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-user-roles', userId],
    enabled: userId !== null && userId > 0,
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/rbac/user-roles?userId=${userId}`)
      const json = (await res.json()) as ApiEnvelope<UserRoleAssignment[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })
}

export function useRbacUserRoleMutations() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  const assign = useMutation({
    mutationFn: async (body: { userId: number; roleId: number }) => {
      const res = await fetch('/api/v1/admin/rbac/user-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<UserRoleAssignmentRow>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async (_, vars) => {
      await qc.invalidateQueries({ queryKey: ['admin-user-roles', vars.userId] })
      await qc.invalidateQueries({ queryKey: ['admin-rbac-matrix'] })
      toast.success(messages.admin.rbacPage.assignedToast)
    }
  })

  const remove = useMutation({
    mutationFn: async (params: { userRoleId: number; userId: number }) => {
      const sp = new URLSearchParams()
      sp.set('userRoleId', String(params.userRoleId))
      const res = await fetch(`/api/v1/admin/rbac/user-roles?${sp.toString()}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return params
    },
    onSuccess: async (params) => {
      await qc.invalidateQueries({ queryKey: ['admin-user-roles', params.userId] })
      await qc.invalidateQueries({ queryKey: ['admin-rbac-matrix'] })
      toast.success(messages.admin.rbacPage.removedToast)
    }
  })

  return { assign, remove }
}
