'use client'
import * as React from 'react'

import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { PublicStats } from '@/services/public-stats.service'

import { StatCardSkeleton } from '@/components/common/LoadingSkeleton/StatCardSkeleton'

export function usePublicStats() {
  const query = useQuery({
    queryKey: ['public-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/public/stats')
      const json = (await res.json()) as ApiEnvelope<PublicStats>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load stats')
  }, [query.error])

  return query
}

export function PublicStatsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <StatCardSkeleton key={idx} />
      ))}
    </div>
  )
}

