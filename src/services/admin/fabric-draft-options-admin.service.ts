import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminFabricDraftOption, AdminFabricDraftOptionsData, AdminFabricDraftOptionsResponse } from '@/types/admin-fabric-draft-options.types'

export async function fetchAdminFabricDraftOptions(params: {
  q: string
  page: number
  limit: number
  status?: string
}): Promise<AdminFabricDraftOptionsResponse> {
  const sp = new URLSearchParams()
  if (params.q.trim().length > 0) sp.set('q', params.q.trim())
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  if (params.status) sp.set('status', params.status)

  const res = await fetch(`/api/v1/admin/fabrics/draft-options?${sp.toString()}`, {
    credentials: 'include'
  })
  const json = (await res.json()) as ApiEnvelope<unknown>
  if (!res.ok || !json.success) {
    const msg = !json.success ? json.error.message : 'Request failed'
    throw new Error(msg)
  }

  const data = json.data
  const items: AdminFabricDraftOption[] = Array.isArray(data)
    ? (data as AdminFabricDraftOption[])
    : (data as AdminFabricDraftOptionsData).items

  return {
    items,
    meta: json.meta ?? {
      page: params.page,
      limit: params.limit,
      total: items.length,
      totalPages: 1
    }
  }
}

