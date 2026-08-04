'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierReviewAdminDto, SupplierReviewModerationStatsDto } from '@/types/supplier-ops.types'
type ListResponse = {
  items: SupplierReviewAdminDto[]
  stats: SupplierReviewModerationStatsDto
}

export function useAdminSupplierReviewsQuery(params: {
  page: number
  limit: number
  status?: 'PENDING' | 'APPROVED' | 'FLAGGED' | 'REJECTED'
}) {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const query = useQuery({
    queryKey: ['admin', 'supplier-reviews', params],
    queryFn: async () => {
      const u = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit)
      })
      if (params.status) u.set('status', params.status)
      const res = await fetch(`/api/v1/admin/supplier-reviews?${u}`)
      const json = (await res.json()) as ApiEnvelope<ListResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(m.loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      if (!json.meta) throw new Error(m.loadError)
      return { data: json.data, meta: json.meta }
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : m.loadError)
  }, [query.error, m.loadError])

  return query
}

export function useAdminSupplierReviewStatusMutation() {
  const qc = useQueryClient()
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  return useMutation({
    mutationFn: async (input: { id: number; status: SupplierReviewAdminDto['status']; flag_reason?: string | null }) => {
      const res = await fetch(`/api/v1/admin/supplier-reviews/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: input.status, flag_reason: input.flag_reason })
      })
      const json = (await res.json()) as ApiEnvelope<SupplierReviewAdminDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(m.loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'supplier-reviews'] })
      toast.success(m.reviewsToastUpdated)
    },
    onError: (e: Error) => toast.error(e.message)
  })
}
