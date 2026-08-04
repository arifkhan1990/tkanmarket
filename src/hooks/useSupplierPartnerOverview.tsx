'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { SupplierPartnerOverviewResponse } from '@/types/supplier-partner-overview.types'

export function useSupplierPartnerOverviewQuery(slug: string | null, loadErrorMessage: string) {
  const s = slug?.trim() ?? ''

  const query = useQuery({
    queryKey: ['supplier-partner-overview', s],
    queryFn: async () => {
      const res = await fetch(`/api/v1/public/suppliers/${encodeURIComponent(s)}/partner-overview`)
      const json = (await res.json()) as ApiEnvelope<SupplierPartnerOverviewResponse>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? loadErrorMessage : json.error.message)
      }
      return json.data
    },
    enabled: s.length >= 2
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadErrorMessage)
  }, [loadErrorMessage, query.error])

  return query
}
