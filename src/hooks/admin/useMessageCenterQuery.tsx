'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchMessageCenterThreads } from '@/services/admin-message-center-api.service'

export interface UseMessageCenterQueryParams {
  page: number
  limit: number
  q: string
  source: string
  status: string
}

export function useMessageCenterQuery(params: UseMessageCenterQueryParams) {
  const query = useQuery({
    queryKey: ['admin-message-center', params],
    queryFn: async () => {
      const json = await fetchMessageCenterThreads({
        page: params.page,
        limit: params.limit,
        q: params.q || undefined,
        source: params.source || undefined,
        status: params.status
      })
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000,
    placeholderData: keepPreviousData
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load messages')
  }, [query.error])

  return query
}
