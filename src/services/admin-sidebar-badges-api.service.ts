import type { ApiEnvelope } from '@/types/api-envelope.types'
import type { AdminSidebarBadges } from '@/types/admin-sidebar-badges.types'

export async function fetchAdminSidebarBadges(): Promise<{
  ok: boolean
  json: ApiEnvelope<AdminSidebarBadges>
}> {
  const res = await fetch('/api/v1/admin/sidebar-badges')
  const json = (await res.json()) as ApiEnvelope<AdminSidebarBadges>
  return { ok: res.ok, json }
}
