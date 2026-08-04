'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminUserOption } from '@/types/admin-users.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminUsers(params?: {
  role?: 'SALES' | 'ADMIN' | 'VIEWER'
  scope?: 'all' | 'assignable'
  status?: 'active' | 'deactivated'
}) {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-users', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      if (params?.role) sp.set('role', params.role)
      if (params?.scope) sp.set('scope', params.scope)
      if (params?.status) sp.set('status', params.status)
      const res = await fetch(`/api/v1/admin/users?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminUserOption[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.users)
  }, [messages.admin.loadErrors.users, query.error])

  return query
}

