import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CommissionRulesDashboardDto } from '@/types/commission-rules.types'

export async function fetchAdminCommissionRules(): Promise<{
  ok: boolean
  json: ApiEnvelope<CommissionRulesDashboardDto>
}> {
  const res = await fetch('/api/v1/admin/commission-rules')
  const json = (await res.json()) as ApiEnvelope<CommissionRulesDashboardDto>
  return { ok: res.ok, json }
}
