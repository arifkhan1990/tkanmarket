import type { RbacMatrixResponse } from '@/types/rbac-admin.types'

export type MatrixColumn = 'view' | 'edit' | 'delete' | 'approve'

export interface ModuleMatrixRow {
  module: string
  view: boolean
  edit: boolean
  delete: boolean
  approve: boolean
}

function permissionKeyToModuleAndAction(key: string): { module: string; action: string } {
  const i = key.lastIndexOf('.')
  if (i === -1) return { module: 'general', action: key }
  return { module: key.slice(0, i), action: key.slice(i + 1) }
}

function actionToColumn(action: string): MatrixColumn | null {
  const a = action.toLowerCase()
  if (a.includes('approve')) return 'approve'
  if (a.includes('delete')) return 'delete'
  if (a.includes('manage') || a === 'edit' || a.includes('write') || a.includes('update')) return 'edit'
  if (a.includes('view') || a.includes('read') || a.includes('list')) return 'view'
  return 'view'
}

export function buildModuleMatrixForRole(
  matrix: RbacMatrixResponse,
  roleId: number
): ModuleMatrixRow[] {
  const permById = new Map(matrix.permissions.map((p) => [p.id, p]))
  const granted = new Set(
    matrix.role_permission_keys.filter((x) => x.role_id === roleId).map((x) => x.permission_id)
  )

  const acc = new Map<
    string,
    { view: boolean; edit: boolean; delete: boolean; approve: boolean }
  >()

  for (const pid of granted) {
    const p = permById.get(pid)
    if (!p) continue
    const { module, action } = permissionKeyToModuleAndAction(p.key)
    const col = actionToColumn(action)
    if (!col) continue
    const row = acc.get(module) ?? { view: false, edit: false, delete: false, approve: false }
    row[col] = true
    acc.set(module, row)
  }

  return Array.from(acc.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([module, flags]) => ({
      module,
      ...flags
    }))
}

export function roleUserCount(matrix: RbacMatrixResponse, roleId: number): number {
  const row = matrix.role_user_counts.find((r) => r.role_id === roleId)
  return row?.count ?? 0
}
