import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdvancedAnalyticsResponse } from '@/types/admin-advanced-analytics.types'

export async function fetchAdminAdvancedAnalytics(): Promise<{
  ok: boolean
  json: ApiEnvelope<AdvancedAnalyticsResponse>
}> {
  const res = await fetch('/api/v1/admin/advanced-analytics')
  const json = (await res.json()) as ApiEnvelope<AdvancedAnalyticsResponse>
  return { ok: res.ok, json }
}
