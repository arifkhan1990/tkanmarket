import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSalesPerformanceResponse } from '@/types/admin-sales-performance.types'

export async function fetchAdminSalesPerformance(days: number): Promise<{
  ok: boolean
  json: ApiEnvelope<AdminSalesPerformanceResponse>
}> {
  const sp = new URLSearchParams()
  sp.set('days', String(days))
  const res = await fetch(`/api/v1/admin/sales-performance?${sp.toString()}`, {
    credentials: 'same-origin'
  })
  try {
    const json = (await res.json()) as ApiEnvelope<AdminSalesPerformanceResponse>
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
