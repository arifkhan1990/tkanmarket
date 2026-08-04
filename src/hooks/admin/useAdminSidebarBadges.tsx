'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminSidebarBadges } from '@/services/admin-sidebar-badges-api.service'

export function useAdminSidebarBadges() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-sidebar-badges'],
    queryFn: async () => {
      const { ok, json } = await fetchAdminSidebarBadges()
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.sidebarBadges)
  }, [messages.admin.loadErrors.sidebarBadges, query.error])

  return query
}

