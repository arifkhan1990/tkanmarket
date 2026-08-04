'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchAdminFabricDraftOptions } from '@/services/admin/fabric-draft-options-admin.service'

function useDebouncedValue(value: string, ms: number) {
  const [debounced, setDebounced] = React.useState(value)
  React.useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function useAdminFabricDraftOptionsQuery(params: {
  q: string
  page: number
  limit: number
  status?: string
  enabled?: boolean
}) {
  const enabled = params.enabled ?? true
  const debouncedQ = useDebouncedValue(params.q, 250)

  const query = useQuery({
    queryKey: ['admin-fabric-draft-options', debouncedQ, params.page, params.limit, params.status ?? ''],
    queryFn: () =>
      fetchAdminFabricDraftOptions({
        q: debouncedQ,
        page: params.page,
        limit: params.limit,
        status: params.status
      }),
    enabled,
    staleTime: 15 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load fabric list')
  }, [query.error])

  return { ...query, debouncedQ }
}

