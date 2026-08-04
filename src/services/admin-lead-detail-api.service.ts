import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { LeadDetail } from '@/types/lead.types'

export async function fetchAdminLeadDetail(id: number): Promise<{
  ok: boolean
  json: ApiEnvelope<LeadDetail>
}> {
  const res = await fetch(`/api/v1/admin/leads/${id}`, { credentials: 'same-origin' })
  try {
    const json = (await res.json()) as ApiEnvelope<LeadDetail>
    return { ok: res.ok, json }
  } catch {
    return {
      ok: false,
      json: {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Invalid response from server',
          statusCode: res.status || 500
        }
      }
    }
  }
}
