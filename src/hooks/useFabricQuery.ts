'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { FabricQuerySchema, type FabricQueryParams } from '@/lib/validations/fabric.validation'
import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { FabricDetail, FabricSummary } from '@/types/marketplace.types'

function buildQueryString(filters: FabricQueryParams) {
  const params = new URLSearchParams()

  params.set('page', String(filters.page))
  params.set('limit', String(filters.limit))
  params.set('sort', filters.sort)

  if (filters.q) params.set('q', filters.q)

  if (filters.material && filters.material.length > 0) {
    for (const m of filters.material) params.append('material', m)
  }
  if (filters.fabric_type) params.set('fabric_type', filters.fabric_type)
  if (typeof filters.gsm_min === 'number') params.set('gsm_min', String(filters.gsm_min))
  if (typeof filters.gsm_max === 'number') params.set('gsm_max', String(filters.gsm_max))
  if (typeof filters.width === 'number') params.set('width', String(filters.width))
  if (typeof filters.width_min === 'number') params.set('width_min', String(filters.width_min))
  if (typeof filters.width_max === 'number') params.set('width_max', String(filters.width_max))
  if (typeof filters.moq_min === 'number') params.set('moq_min', String(filters.moq_min))
  if (typeof filters.moq_max === 'number') params.set('moq_max', String(filters.moq_max))
  if (typeof filters.supplier_id === 'number') params.set('supplier_id', String(filters.supplier_id))
  if (filters.category_slug && filters.category_slug.trim().length > 0) {
    params.set('category_slug', filters.category_slug.trim())
  }
  if (filters.view === 'list') params.set('view', 'list')

  return params.toString()
}

export function useFabrics(filters: FabricQueryParams) {
  const validated = FabricQuerySchema.parse(filters)
  const queryString = buildQueryString(validated)

  const query = useQuery<ApiEnvelope<FabricSummary[]>>({
    queryKey: ['fabrics', validated],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fabrics?${queryString}`)
      const json = (await res.json()) as ApiEnvelope<FabricSummary[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json
    },
    staleTime: 5 * 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load fabrics')
  }, [query.error])

  return query
}

export function useFabric(slug: string) {
  const query = useQuery({
    queryKey: ['fabric', slug],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fabrics/${encodeURIComponent(slug)}`)
      const json = (await res.json()) as ApiEnvelope<FabricDetail>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    enabled: Boolean(slug),
    staleTime: 60 * 60 * 1000
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load fabric')
  }, [query.error])

  return query
}

export function useRelatedFabrics(fabricId: number, limit: number = 8) {
  const query = useQuery({
    queryKey: ['related-fabrics', fabricId, limit],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fabrics/${fabricId}/related?limit=${limit}`)
      const json = (await res.json()) as ApiEnvelope<FabricSummary[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    },
    enabled: fabricId > 0
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load related fabrics')
  }, [query.error])

  return query
}

export function useFeaturedFabrics(limit: number = 8) {
  const query = useQuery({
    queryKey: ['featured-fabrics', limit],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fabrics/featured?limit=${limit}`)
      const json = (await res.json()) as ApiEnvelope<FabricSummary[]>
      if (!res.ok) {
        if (!json.success) throw new Error(json.error.message)
        throw new Error('Request failed')
      }
      if (!json.success) throw new Error(json.error.message)
      return json.data
    }
  })

  React.useEffect(() => {
    if (!query.error) return
    toast.error(query.error instanceof Error ? query.error.message : 'Failed to load featured fabrics')
  }, [query.error])

  return query
}

