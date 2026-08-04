import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { CustomReportResponse } from '@/types/admin-custom-report.types'

export async function fetchAdminCustomReport(): Promise<CustomReportResponse> {
  const res = await fetch('/api/v1/admin/reports/custom-builder')
  const json = (await res.json()) as ApiEnvelope<CustomReportResponse>
  if (!res.ok || !json.success) {
    const msg = !json.success ? json.error.message : 'Request failed'
    throw new Error(msg)
  }
  return json.data
}
