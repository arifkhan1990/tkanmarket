export interface AdminUserOption {
  id: number
  name: string
  email: string
  avatar_url: string | null
  role: 'ADMIN' | 'SALES' | 'VIEWER'
}

