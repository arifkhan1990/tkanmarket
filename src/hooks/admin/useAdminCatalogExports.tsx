'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type {
  CatalogExportOverviewResponse,
  CreateCatalogExportPayload
} from '@/types/admin-catalog-export.types'

export function useAdminCatalogExportsQuery() {
  const query = useQuery({
    queryKey: ['admin-catalog-exports'],
    queryFn: async () => {
      const res = await fetch('/api/v1/admin/catalog/exports')
      const json = (await res.json()) as ApiEnvelope<CatalogExportOverviewResponse>

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to load catalog exports' : json.error.message)
      }

      return json.data
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(
      query.error instanceof Error ? query.error.message : 'Failed to load catalog exports'
    )
  }, [query.error])

  return query
}

export function useAdminCreateCatalogExportMutation() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (payload: CreateCatalogExportPayload) => {
      const res = await fetch('/api/v1/admin/catalog/exports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const json = (await res.json()) as ApiEnvelope<{ ok: boolean }>

      if (!res.ok || !json.success) {
        throw new Error(json.success ? 'Failed to initialize export' : json.error.message)
      }

      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-catalog-exports'] })
      toast.success('Catalog export initialized')
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to initialize export'
      toast.error(message)
    }
  })

  return mutation
}

