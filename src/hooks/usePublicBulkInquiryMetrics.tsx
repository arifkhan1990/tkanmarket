'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PublicBulkInquiryMetrics } from '@/types/public-bulk-inquiry-metrics.types'

export function usePublicBulkInquiryMetrics() {
  const query = useQuery({
    queryKey: ['public-bulk-inquiry-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/v1/public/bulk-inquiry/metrics')
      const json = (await res.json()) as ApiEnvelope<PublicBulkInquiryMetrics>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load inquiry metrics')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load inquiry metrics')
  }, [query.error])

  return query
}

