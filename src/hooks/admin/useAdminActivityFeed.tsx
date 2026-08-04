'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminActivityFeed } from '@/services/admin-activity-api.service'

export function useAdminActivityFeed() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const { ok, json } = await fetchAdminActivityFeed()
      if (!ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.activity)
  }, [messages.admin.loadErrors.activity, query.error])

  return query
}

