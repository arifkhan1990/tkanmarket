'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierPayoutRequestDto, SupplierPayoutSummaryDto } from '@/types/supplier-ops.types'

type PayoutsResponse = {
  requests: SupplierPayoutRequestDto[]
  summary: SupplierPayoutSummaryDto
}

export function useAdminSupplierPayoutsQuery() {
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  const query = useQuery({
    queryKey: ['admin', 'supplier-payouts'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/supplier-payouts')
      const json = (await res.json()) as ApiEnvelope<PayoutsResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(m.loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : m.loadError)
  }, [query.error, m.loadError])

  return query
}

export function useAdminSupplierPayoutStatusMutation() {
  const qc = useQueryClient()
  const { messages } = useI18n()
  const m = messages.admin.supplierSuite
  return useMutation({
    mutationFn: async (input: { id: number; status: SupplierPayoutRequestDto['status']; resolution_note?: string | null }) => {
      const res = await fetch(`/api/v1/admin/supplier-payouts/${input.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: input.status, resolution_note: input.resolution_note })
      })
      const json = (await res.json()) as ApiEnvelope<SupplierPayoutRequestDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(m.loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'supplier-payouts'] })
      toast.success(m.withdrawalsToastUpdated)
    },
    onError: (e: Error) => toast.error(e.message)
  })
}
