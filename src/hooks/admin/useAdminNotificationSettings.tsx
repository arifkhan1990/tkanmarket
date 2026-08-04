'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminNotificationSettings } from '@/types/admin-notification-settings.types'
import { useI18n } from '@/hooks/useI18n'

const NOTIF_SETTINGS_KEY = ['admin-notification-settings'] as const

export function useAdminNotificationSettings() {
  const { messages } = useI18n()

  return useQuery({
    queryKey: NOTIF_SETTINGS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/me/notification-settings')
      const json = (await res.json()) as ApiEnvelope<AdminNotificationSettings>

      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }

      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })
}

export function useUpdateAdminNotificationSettings() {
  const { messages } = useI18n()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      emailEnabled?: boolean
      inAppEnabled?: boolean
      preferences?: Record<string, boolean | number>
    }) => {
      const res = await fetch('/api/v1/admin/me/notification-settings', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input)
      })

      const json = (await res.json()) as ApiEnvelope<AdminNotificationSettings>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }

      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: NOTIF_SETTINGS_KEY })
      toast.success(messages.admin.settingsMutation.updated)
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : messages.admin.settingsMutation.updateFailed)
    }
  })
}

export function useAdminNotificationSettingsToasts(query: { error: unknown }) {
  const { messages } = useI18n()

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.profile)
  }, [messages.admin.loadErrors.profile, query.error])
}

