'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminManagedUser } from '@/types/admin-user-management.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminUserMutations() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  const createUser = useMutation({
    mutationFn: async (body: {
      email: string
      name: string
      role: 'ADMIN' | 'SALES' | 'VIEWER'
      password?: string
      avatar_url?: string | null
    }) => {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<AdminManagedUser>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(messages.admin.userManagement.createdToast)
    }
  })

  const updateUser = useMutation({
    mutationFn: async (params: {
      id: number
      body: { name?: string; role?: 'ADMIN' | 'SALES' | 'VIEWER'; password?: string; avatar_url?: string | null }
    }) => {
      const res = await fetch(`/api/v1/admin/users/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params.body)
      })
      const json = (await res.json()) as ApiEnvelope<AdminManagedUser>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(messages.admin.userManagement.updatedToast)
    }
  })

  const deactivateUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return id
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success(messages.admin.userManagement.deactivatedToast)
    }
  })

  return { createUser, updateUser, deactivateUser }
}
