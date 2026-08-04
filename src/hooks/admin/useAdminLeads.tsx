'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminLeadCard, AdminLeadDetail } from '@/types/admin-leads.types'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useI18n } from '@/hooks/useI18n'

export function useAdminLeads(params: { page: number; limit: number }) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<{ items: AdminLeadCard[]; total: number }>>({
    queryKey: ['admin-leads', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      const res = await fetch(`/api/v1/admin/leads?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<{ items: AdminLeadCard[]; total: number }>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function LeadsKanbanSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, idx) => (
        <TableRowSkeleton key={idx} />
      ))}
    </div>
  )
}

export function useLeadMutations() {
  const { messages } = useI18n()
  const updateStatus = useMutation({
    mutationFn: async (input: { id: number; status: AdminLeadCard['status'] }) => {
      const res = await fetch(`/api/v1/admin/leads/${input.id}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(input.status)
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    }
  })

  const addNote = useMutation({
    mutationFn: async (input: { id: number; content: string }) => {
      const res = await fetch(`/api/v1/admin/leads/${input.id}/notes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ content: input.content })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    }
  })

  return { updateStatus, addNote }
}

