'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchAdminFabricDraftPreview } from '@/services/admin/fabric-draft-preview-admin.service'

export function useAdminFabricDraftPreviewQuery(fabricId: number | null) {
  const query = useQuery({
    queryKey: ['admin-fabric-draft-preview', fabricId],
    queryFn: () => fetchAdminFabricDraftPreview(fabricId as number),
    enabled: fabricId != null && fabricId > 0,
    staleTime: 20 * 1000,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load fabric preview')
  }, [query.error])

  return query
}
