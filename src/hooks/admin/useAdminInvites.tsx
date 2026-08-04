'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminInviteRow } from '@/types/admin-invite.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminInvitesQuery(enabled: boolean) {
  const { messages } = useI18n()
  return useQuery({
    queryKey: ['admin-invites'],
    enabled,
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/invites')
      const json = (await res.json()) as ApiEnvelope<AdminInviteRow[]>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    }
  })
}

export function useAdminInviteMutations() {
  const qc = useQueryClient()
  const { messages } = useI18n()

  const send = useMutation({
    mutationFn: async (body: { email: string; role: 'ADMIN' | 'SALES' | 'VIEWER' }) => {
      const res = await fetch('/api/v1/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<{ invite: AdminInviteRow }>
      if (!res.ok || !json.success) {
        throw new Error(!json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed)
      }
      return json.data
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['admin-invites'] })
      toast.success(messages.admin.invitesPanel.sentToast)
    }
  })

  return { send }
}
