'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { ApiEnvelope } from '@/types/api-envelope.types'

import type { AdminFabricListResponse } from '@/types/admin-fabric-management.types'
import { TableRowSkeleton } from '@/components/common/LoadingSkeleton/TableRowSkeleton'
import { useI18n } from '@/hooks/useI18n'

export function useAdminFabrics(params: { page: number; limit: number; status?: string }) {
  const { messages } = useI18n()
  return useQuery<ApiEnvelope<AdminFabricListResponse>>({
    queryKey: ['admin-fabrics', params],
    queryFn: async () => {
      const sp = new URLSearchParams()
      sp.set('page', String(params.page))
      sp.set('limit', String(params.limit))
      if (params.status) sp.set('status', params.status)

      const res = await fetch(`/api/v1/admin/fabrics?${sp.toString()}`)
      const json = (await res.json()) as ApiEnvelope<AdminFabricListResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(messages.admin.leadsTimeline.requestFailed)
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    }
  })
}

export function AdminFabricsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, idx) => (
        <TableRowSkeleton key={idx} />
      ))}
    </div>
  )
}

export function useApproveRejectFabrics() {
  const { messages } = useI18n()
  const approve = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/admin/fabrics/${id}/approve`, { method: 'POST' })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : messages.admin.leadsTimeline.requestFailed)
    }
  })

  const reject = useMutation({
    mutationFn: async (vars: { id: number; reason: string }) => {
      const res = await fetch(`/api/v1/admin/fabrics/${vars.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: vars.reason })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : messages.admin.leadsTimeline.requestFailed)
    }
  })

  return { approve, reject }
}

export function useFabricSupervisionFlag() {
  const { messages } = useI18n()
  return useMutation({
    mutationFn: async (vars: { id: number; note?: string }) => {
      const res = await fetch(`/api/v1/admin/fabrics/${vars.id}/flag-supervision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: vars.note ?? '' })
      })
      const json = (await res.json()) as ApiEnvelope<unknown>
      if (!res.ok || !json.success) {
        const message = !json.success ? json.error.message : messages.admin.leadsTimeline.requestFailed
        throw new Error(message)
      }
      return json.data
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : messages.admin.leadsTimeline.requestFailed)
    }
  })
}

