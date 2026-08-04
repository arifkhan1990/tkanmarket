import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminDashboardResponse } from '@/types/admin-dashboard.types'

export async function fetchAdminDashboard(): Promise<{
  ok: boolean
  json: ApiEnvelope<AdminDashboardResponse>
}> {
  const res = await fetch('/api/v1/admin/dashboard')
  const json = (await res.json()) as ApiEnvelope<AdminDashboardResponse>
  return { ok: res.ok, json }
}
