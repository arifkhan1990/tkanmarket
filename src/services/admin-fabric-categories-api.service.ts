import type { ApiEnvelope, PaginationMeta } from '@/types/api-envelope.types'
import type { AdminFabricCategoryTerm, AdminFabricCategoryTermCreateInput, AdminFabricCategoryTermUpdateInput } from '@/types/admin-fabric-category-terms.types'

export type AdminFabricCategoryListResponse = {
  items: AdminFabricCategoryTerm[]
  meta: PaginationMeta
}

export async function fetchAdminFabricCategories(params: {
  page: number
  limit: number
  q?: string
  includeInactive?: boolean
  includeArchived?: boolean
}): Promise<ApiEnvelope<AdminFabricCategoryListResponse>> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  if (params.q && params.q.trim().length > 0) sp.set('q', params.q.trim())
  if (params.includeInactive) sp.set('include_inactive', 'true')
  if (params.includeArchived) sp.set('include_archived', 'true')
  const res = await fetch(`/api/v1/admin/fabric-categories?${sp.toString()}`)
  return (await res.json()) as ApiEnvelope<AdminFabricCategoryListResponse>
}

export async function createAdminFabricCategory(
  input: AdminFabricCategoryTermCreateInput
): Promise<ApiEnvelope<{ id: number }>> {
  const res = await fetch('/api/v1/admin/fabric-categories', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  })
  return (await res.json()) as ApiEnvelope<{ id: number }>
}

export async function updateAdminFabricCategory(
  id: number,
  input: AdminFabricCategoryTermUpdateInput
): Promise<ApiEnvelope<{ ok: true }>> {
  const res = await fetch(`/api/v1/admin/fabric-categories/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  })
  return (await res.json()) as ApiEnvelope<{ ok: true }>
}

export async function archiveAdminFabricCategory(id: number): Promise<ApiEnvelope<{ ok: true }>> {
  const res = await fetch(`/api/v1/admin/fabric-categories/${id}/archive`, { method: 'POST' })
  return (await res.json()) as ApiEnvelope<{ ok: true }>
}

export async function restoreAdminFabricCategory(id: number): Promise<ApiEnvelope<{ ok: true }>> {
  const res = await fetch(`/api/v1/admin/fabric-categories/${id}/restore`, { method: 'POST' })
  return (await res.json()) as ApiEnvelope<{ ok: true }>
}

