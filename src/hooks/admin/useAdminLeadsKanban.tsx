'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminLeadsKanbanResponse } from '@/types/admin-leads-kanban.types'
import { useI18n } from '@/hooks/useI18n'

export function useAdminLeadsKanban() {
  const { messages } = useI18n()
  const query = useQuery({
    queryKey: ['admin-leads-kanban'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/leads?view=kanban')
      const json = (await res.json()) as ApiEnvelope<AdminLeadsKanbanResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 10 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : messages.admin.loadErrors.leadsKanban)
  }, [messages.admin.loadErrors.leadsKanban, query.error])

  return query
}

