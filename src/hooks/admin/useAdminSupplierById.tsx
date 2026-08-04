'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSupplierDetail } from '@/types/supplier-admin.types'

export function useAdminSupplierById(supplierId: number | null) {
  return useQuery({
    queryKey: ['admin-supplier', supplierId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/suppliers/${supplierId}`)
      const json = (await res.json()) as ApiEnvelope<AdminSupplierDetail>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load supplier'
        throw new Error(msg)
      }
      return json.data
    },
    enabled: supplierId != null && supplierId > 0,
    staleTime: 30 * 1000
  })
}
