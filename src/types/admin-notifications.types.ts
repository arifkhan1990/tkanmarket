export type AdminNotificationCategoryFilter = 'all' | 'system' | 'leads' | 'social'

export interface AdminNotificationRow {
  id: number
  type: string
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read_at: string | null
  is_high_priority: boolean
  created_at: string
}

export interface AdminNotificationsListQuery {
  userId: number
  page: number
  limit: number
  category: AdminNotificationCategoryFilter
}
