import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadScoringDashboardResponse } from '@/types/lead-scoring-dashboard.types'

export async function fetchAdminLeadsScoring(selectedLeadId?: number): Promise<{
  ok: boolean
  json: ApiEnvelope<LeadScoringDashboardResponse>
}> {
  const sp = new URLSearchParams()
  if (selectedLeadId) sp.set('selected_lead_id', String(selectedLeadId))
  const qs = sp.toString()
  const res = await fetch(`/api/v1/admin/leads/scoring${qs ? `?${qs}` : ''}`)
  const json = (await res.json()) as ApiEnvelope<LeadScoringDashboardResponse>
  return { ok: res.ok, json }
}
