export interface AdminNotificationSettings {
  id: number
  user_id: number
  email_enabled: boolean
  in_app_enabled: boolean
  preferences: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

