'use client'

import * as React from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { fetchMediaLibrary } from '@/services/admin-media-library-api.service'
import type { MediaLibrarySort, MediaLibraryStatusFilter } from '@/types/admin-media-library.types'

export interface UseMediaLibraryQueryParams {
  page: number
  limit: number
  q: string
  folder: string
  fabricId: number | null
  status: MediaLibraryStatusFilter
  sort: MediaLibrarySort
}

export function useMediaLibraryQuery(params: UseMediaLibraryQueryParams) {
  const query = useQuery({
    queryKey: ['admin-media-library', params],
    queryFn: async () => {
      const json = await fetchMediaLibrary({
        page: params.page,
        limit: params.limit,
        q: params.q || undefined,
        folder: params.folder || undefined,
        fabricId: params.fabricId ?? undefined,
        status: params.status,
        sort: params.sort
      })
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000,
    placeholderData: keepPreviousData
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load media library')
  }, [query.error])

  return query
}
