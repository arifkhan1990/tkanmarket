'use client'

import { useQuery } from '@tanstack/react-query'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierCompliancePayload } from '@/types/supplier-admin.types'

export function useAdminSupplierCompliance() {
  return useQuery({
    queryKey: ['admin-supplier-compliance'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/suppliers/compliance')
      const json = (await res.json()) as ApiEnvelope<SupplierCompliancePayload>
      if (!res.ok || !json.success) {
        const msg = !json.success ? json.error.message : 'Failed to load compliance'
        throw new Error(msg)
      }
      return json.data
    },
    staleTime: 30 * 1000
  })
}
