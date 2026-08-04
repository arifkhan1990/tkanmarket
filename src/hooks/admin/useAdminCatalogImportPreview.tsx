'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useI18n } from '@/hooks/useI18n'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CatalogImportPreviewResponse } from '@/types/catalog-import.types'

export function useAdminCatalogImportPreviewQuery() {
  const { messages } = useI18n()
  const loadFailed = messages.admin.loadErrors.catalogPreview

  const query = useQuery({
    queryKey: ['admin-catalog-import-preview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/catalog-import/preview')
      const json = (await res.json()) as ApiEnvelope<CatalogImportPreviewResponse>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Failed to load preview')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    staleTime: 15 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadFailed)
  }, [query.error, loadFailed])

  return query
}
