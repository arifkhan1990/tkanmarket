export type AdminActivityTimelineSource = 'LEAD' | 'FABRIC' | 'AUDIT' | 'AUTH' | 'AI'

export interface AdminActivityTimelineActor {
  id: number | null
  name: string | null
  avatarUrl: string | null
}

export interface AdminActivityTimelineResource {
  id: number | null
  label: string
  href?: string
}

export interface AdminActivityTimelineEvent {
  id: number
  source: AdminActivityTimelineSource
  event_type: string
  message: string
  created_at: string
  ip?: string | null
  success?: boolean
  actor: AdminActivityTimelineActor
  resource?: AdminActivityTimelineResource
}

export interface AdminActivityTimelineUserStat {
  userId: number
  name: string | null
  avatarUrl: string | null
  actions: number
  level: number
}

export interface AdminActivityTimelineSidebarStats {
  weeklyTotalActions: number
  weeklyGrowthPercent: number | null
  userEngagementPercent: number | null
  topActiveUsers: AdminActivityTimelineUserStat[]
  entityDistribution: {
    inventory: number
    orders: number
    users: number
    system: number
  }
}

export interface AdminActivityTimelineListResponse {
  events: AdminActivityTimelineEvent[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  sidebar: AdminActivityTimelineSidebarStats
}

