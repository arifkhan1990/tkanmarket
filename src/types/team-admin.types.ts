export interface TeamListItem {
  id: number
  name: string
  slug: string
}

export interface TeamMemberRow {
  id: number
  team_id: number
  user_id: number
  title: string | null
}

export type UserRoleLabel = 'ADMIN' | 'SALES' | 'VIEWER'

export interface TeamMemberWithUser extends TeamMemberRow {
  user_name: string
  user_email: string
  user_role: UserRoleLabel
  user_avatar_url: string | null
}

export interface TeamDashboardStats {
  team_id: number
  member_count: number
  seat_limit: number
  seat_utilization_pct: number
  total_assigned_leads: number
  closed_won_leads: number
  lead_conversion_pct: number
  avg_response_minutes: number | null
}

export interface TeamMemberPerformanceRow {
  team_member_id: number
  user_id: number
  user_name: string
  user_email: string
  user_role: UserRoleLabel
  title: string | null
  user_avatar_url: string | null
  assigned_leads: number
  closed_won_leads: number
  conversion_pct: number
  avg_response_minutes: number | null
}
