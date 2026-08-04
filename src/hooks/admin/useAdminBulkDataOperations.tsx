'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { BulkDataOperationsResponse } from '@/types/admin-bulk-data.types'

export function useAdminBulkDataOperations() {
  const query = useQuery({
    queryKey: ['admin-bulk-data-operations'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/bulk-data/operations')
      const json = (await res.json()) as ApiEnvelope<BulkDataOperationsResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load bulk data operations')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(
      query.error instanceof Error ? query.error.message : 'Failed to load bulk data operations'
    )
  }, [query.error])

  return query
}

