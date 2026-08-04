export interface AdminInviteRow {
  id: number
  email: string
  role: 'ADMIN' | 'SALES' | 'VIEWER'
  expires_at: string
  accepted_at: string | null
  invited_by_user_id: number
}
