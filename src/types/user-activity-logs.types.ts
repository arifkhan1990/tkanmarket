import type { PaginationMeta } from '@/types/api-envelope.types'

export type UserActivityLogSource = 'AUDIT' | 'AUTH'

export type UserActivityActionType =
  | 'ALL'
  | 'FABRIC_APPROVAL'
  | 'LEAD_ASSIGNED'
  | 'USER_PERMISSIONS'
  | 'SUPPLIER_VERIFICATION'

export const USER_ACTIVITY_ACTION_TYPE_OPTIONS: UserActivityActionType[] = [
  'ALL',
  'FABRIC_APPROVAL',
  'LEAD_ASSIGNED',
  'USER_PERMISSIONS',
  'SUPPLIER_VERIFICATION'
]

export interface UserActivityUserSummary {
  id: number
  name: string | null
  avatarUrl: string | null
  email: string | null
}

export interface UserActivityLogItem {
  id: number
  source: UserActivityLogSource
  created_at: string
  action_event: string
  resource_id: string
  ip: string | null
  success: boolean
}

export interface UserActivityMetrics {
  session_duration_ms: number | null
  productivity_score: number | null
  actions: number
  unique_ips: number
  avg_response_ms: number | null
  failed_requests: number
  last_seen_at: string | null
}

export interface UserActivityLogsListResponse {
  user: UserActivityUserSummary | null
  items: UserActivityLogItem[]
  meta: PaginationMeta
  metrics: UserActivityMetrics
}

