'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { ADMIN_ALERTS_HUB_OVERVIEW_QUERY_KEY } from '@/hooks/admin/useAdminAlertsHubOverviewQuery'
import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { AdminNotificationCategoryFilter, AdminNotificationRow } from '@/types/admin-notifications.types'

type NotificationsEnvelope = ApiEnvelope<{ items: AdminNotificationRow[] }> & { meta?: PaginationMeta }

export const ADMIN_NOTIFICATIONS_PREVIEW_QUERY_KEY = ['admin-notifications-preview'] as const

export interface NotificationPreview {
  unreadCount: number
  items: AdminNotificationRow[]
}

/**
 * Fetches the last 5 notifications + total unread count for the navbar bell dropdown.
 * Polls every 30 seconds so the badge stays fresh without a full-page reload.
 */
export function useAdminNotificationPreviewQuery() {
  return useQuery({
    queryKey: ADMIN_NOTIFICATIONS_PREVIEW_QUERY_KEY,
    queryFn: async (): Promise<NotificationPreview> => {
      const res = await fetch('/api/v1/admin/notifications/preview', { credentials: 'same-origin' })
      const json = (await res.json()) as ApiEnvelope<NotificationPreview>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load preview' : json.error.message)
      }
      return json.data
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false
  })
}

export function useAdminNotificationsQuery(params: {
  page: number
  limit: number
  category: AdminNotificationCategoryFilter
}) {
  const query = useQuery({
    queryKey: ['admin-notifications', params],
    queryFn: async () => {
      const url = new URL('/api/v1/admin/notifications', window.location.origin)
      url.searchParams.set('page', String(params.page))
      url.searchParams.set('limit', String(params.limit))
      url.searchParams.set('category', params.category)

      const res = await fetch(url.toString(), { credentials: 'same-origin' })
      const json = (await res.json()) as NotificationsEnvelope
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load notifications' : json.error.message)
      }
      return { data: json.data, meta: json.meta }
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load notifications')
  }, [query.error])

  return query
}

export function useAdminNotificationsMarkReadMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { ids: number[] } | { markAllRead: true; category?: AdminNotificationCategoryFilter }) => {
      const res = await fetch('/api/v1/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
      })
      const json = (await res.json()) as ApiEnvelope<{ updated: number }> // success payload
      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to update' : json.error.message)
      }
      return json.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      await queryClient.invalidateQueries({ queryKey: ADMIN_ALERTS_HUB_OVERVIEW_QUERY_KEY })
      await queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_PREVIEW_QUERY_KEY })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  })
}
