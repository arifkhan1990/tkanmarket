'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import { fetchAdminSampleLifecycle } from '@/services/admin-sample-lifecycle-api.service'
import type { PaginationMeta } from '@/types/api-envelope.types'

export function useAdminSampleLifecycleQuery(params: { page: number; limit: number; stage: string }) {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.sampleLifecycle

  const query = useQuery({
    queryKey: ['admin-sample-lifecycle', params],
    queryFn: async () => {
      const { ok, json } = await fetchAdminSampleLifecycle(params)
      if (!ok || !json.success) {
        const msg = !json.success ? json.error.message : loadFailed
        throw new Error(msg)
      }
      const meta = json.meta as PaginationMeta | undefined
      return { stats: json.data.stats, items: json.data.items, meta }
    },
    staleTime: 20 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadFailed)
  }, [query.error, loadFailed])

  return query
}
