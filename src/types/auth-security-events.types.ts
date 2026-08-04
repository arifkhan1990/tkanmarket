import type { PaginationMeta } from '@/types/api-envelope.types'

export interface AuthSecurityEventListItem {
  id: number
  user_id: number | null
  email: string | null
  event_type: string
  success: boolean
  ip: string | null
  user_agent: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuthSecurityEventListResponse {
  items: AuthSecurityEventListItem[]
  meta: PaginationMeta
}
