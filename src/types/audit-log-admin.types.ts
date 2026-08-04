import type { PaginationMeta } from '@/types/api-envelope.types'

export interface AuditLogListItem {
  id: number
  actor_id: number | null
  actor_name?: string | null
  actor_email?: string | null
  actor_avatar_url?: string | null
  action: string
  entity_type: string
  entity_id: number | null
  success: boolean
  message: string | null
  ip?: string | null
  user_agent?: string | null
  payload?: unknown | null
  created_at: string
}

export interface AuditLogListResponse {
  items: AuditLogListItem[]
  meta: PaginationMeta
}

export interface AuditLogStats {
  total_actions: number
  failed_actions: number
  successRateDeltaPct: number
  health_label: string
  unique_ips: number
  today_actions: number
  yesterday_actions: number
  today_delta_pct: number
  top_entity_type: string | null
}
