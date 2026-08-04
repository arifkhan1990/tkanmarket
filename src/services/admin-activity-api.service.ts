import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminActivityEvent } from '@/types/admin-activity.types'

export async function fetchAdminActivityFeed(): Promise<{
  ok: boolean
  json: ApiEnvelope<AdminActivityEvent[]>
}> {
  const res = await fetch('/api/v1/admin/activity')
  const json = (await res.json()) as ApiEnvelope<AdminActivityEvent[]>
  return { ok: res.ok, json }
}
