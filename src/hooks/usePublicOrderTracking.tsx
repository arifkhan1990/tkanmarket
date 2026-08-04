'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PublicOrderTrackingResponse } from '@/types/public-order-tracking.types'

export function usePublicOrderTrackingQuery(orderReference: string | null, loadErrorMessage: string) {
  const ref = orderReference?.trim() ?? ''

  const query = useQuery({
    queryKey: ['public-order-tracking', ref],
    queryFn: async () => {
      const url = new URL('/api/v1/public/order-tracking', window.location.origin)
      url.searchParams.set('ref', ref)
      const res = await fetch(url.toString())
      const json = (await res.json()) as ApiEnvelope<PublicOrderTrackingResponse>
      if (!res.ok || !json.success) {
        throw new Error(json.success ? loadErrorMessage : json.error.message)
      }
      return json.data
    },
    enabled: ref.length >= 3
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : loadErrorMessage)
  }, [loadErrorMessage, query.error])

  return query
}
