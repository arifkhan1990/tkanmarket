'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSupplierDetail } from '@/types/supplier-admin.types'

export type AdminSupplierPatchInput = {
  name?: string
  slug?: string
  country?: string
  city?: string | null
  province?: string | null
  description?: string | null
  logo_url?: string | null
  website_url?: string | null
  verified?: boolean
  established_year?: number | null
  source_url?: string | null
}

export function useAdminSupplierUpdate(supplierId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: AdminSupplierPatchInput) => {
      const res = await fetch(`/api/v1/admin/suppliers/${supplierId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const json = (await res.json()) as ApiEnvelope<AdminSupplierDetail>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Update failed'
        throw new Error(msg)
      }
      return json.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-supplier', supplierId] })
      void qc.invalidateQueries({ queryKey: ['admin-suppliers'] })
    }
  })
}
