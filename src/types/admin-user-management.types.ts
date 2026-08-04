export interface AdminManagedUser {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'SALES' | 'VIEWER'
  avatar_url: string | null
}

export interface AdminUserCreateInput {
  email: string
  name: string
  role: 'ADMIN' | 'SALES' | 'VIEWER'
  password?: string
  avatar_url?: string | null
}

export interface AdminUserUpdateInput {
  name?: string
  role?: 'ADMIN' | 'SALES' | 'VIEWER'
  password?: string
  avatar_url?: string | null
}
