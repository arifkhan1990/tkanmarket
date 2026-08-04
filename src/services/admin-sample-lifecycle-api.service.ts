import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSampleLifecycleRow, AdminSampleLifecycleStats } from '@/types/admin-sample-lifecycle.types'

export type AdminSampleLifecycleApiData = {
  stats: AdminSampleLifecycleStats
  items: AdminSampleLifecycleRow[]
}

export async function fetchAdminSampleLifecycle(params: {
  page: number
  limit: number
  stage: string
}): Promise<{ ok: boolean; json: ApiEnvelope<AdminSampleLifecycleApiData> }> {
  const sp = new URLSearchParams()
  sp.set('page', String(params.page))
  sp.set('limit', String(params.limit))
  sp.set('stage', params.stage)
  const res = await fetch(`/api/v1/admin/sample-lifecycle?${sp.toString()}`)
  const json = (await res.json()) as ApiEnvelope<AdminSampleLifecycleApiData>
  return { ok: res.ok, json }
}
