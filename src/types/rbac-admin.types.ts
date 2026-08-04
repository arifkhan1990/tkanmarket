export interface RbacRoleRow {
  id: number
  key: string
  name: string
  description: string | null
}

export interface RbacPermissionRow {
  id: number
  key: string
  description: string | null
}

export interface RbacRoleUserCountRow {
  role_id: number
  count: number
}

export interface RbacMatrixResponse {
  roles: RbacRoleRow[]
  permissions: RbacPermissionRow[]
  role_permission_keys: Array<{ role_id: number; permission_id: number }>
  role_user_counts: RbacRoleUserCountRow[]
}

export interface UserRoleAssignment {
  id: number
  user_id: number
  role_id: number
  role_key: string
  role_name: string
}

export interface UserRoleAssignmentRow extends UserRoleAssignment {}
