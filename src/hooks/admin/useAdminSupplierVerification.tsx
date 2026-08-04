'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  SupplierVerificationCaseDetailDto,
  SupplierVerificationCaseListItemDto,
  VerificationChecklistItem
} from '@/types/supplier-ops.types'

export function useAdminSupplierVerificationListQuery() {
  const { messages } = useI18n()
  const loadError = messages.admin.supplierSuite.loadError
  const query = useQuery({
    queryKey: ['admin', 'supplier-verification', 'list'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/supplier-verification')
      const json = (await res.json()) as ApiEnvelope<{ items: SupplierVerificationCaseListItemDto[] }>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data.items
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadError)
  }, [query.error, loadError])

  return query
}

export function useAdminSupplierVerificationDetailQuery(caseId: number) {
  const { messages } = useI18n()
  const loadError = messages.admin.supplierSuite.loadError
  const query = useQuery({
    queryKey: ['admin', 'supplier-verification', caseId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/supplier-verification/${caseId}`)
      const json = (await res.json()) as ApiEnvelope<SupplierVerificationCaseDetailDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error(loadError)
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    enabled: caseId > 0
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadError)
  }, [query.error, loadError])

  return query
}

export function useAdminSupplierVerificationPatchMutation(caseId: number) {
  const { messages } = useI18n()
  const saved = messages.admin.supplierSuite.verificationCaseSaved
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      status?: SupplierVerificationCaseDetailDto['status']
      internal_note?: string | null
      checklist?: VerificationChecklistItem[]
    }) => {
      const res = await fetch(`/api/v1/admin/supplier-verification/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: input.status,
          internal_note: input.internal_note,
          checklist: input.checklist
        })
      })
      const json = (await res.json()) as ApiEnvelope<SupplierVerificationCaseDetailDto>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Update failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'supplier-verification'] })
      toast.success(saved)
    },
    onError: (e: Error) => toast.error(e.message)
  })
}
