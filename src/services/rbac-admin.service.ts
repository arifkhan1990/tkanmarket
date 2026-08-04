import { and, count, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog } from '@/db/schema/audit.schema'
import { permissions, rolePermissions, roles, userRoles } from '@/db/schema/rbac.schema'
import type {
  RbacMatrixResponse,
  UserRoleAssignment,
  UserRoleAssignmentRow
} from '@/types/rbac-admin.types'

export class RbacAdminService {
  public static async getMatrix(): Promise<RbacMatrixResponse> {
    const db = getDb()

    const [roleRows, permissionRows, rpRows, userCountRows] = await Promise.all([
      db
        .select({ id: roles.id, key: roles.key, name: roles.name, description: roles.description })
        .from(roles)
        .where(isNull(roles.deletedAt)),
      db
        .select({ id: permissions.id, key: permissions.key, description: permissions.description })
        .from(permissions)
        .where(isNull(permissions.deletedAt)),
      db
        .select({
          roleId: rolePermissions.roleId,
          permissionId: rolePermissions.permissionId
        })
        .from(rolePermissions)
        .where(isNull(rolePermissions.deletedAt)),
      db
        .select({ roleId: userRoles.roleId, c: count() })
        .from(userRoles)
        .where(isNull(userRoles.deletedAt))
        .groupBy(userRoles.roleId)
    ])

    return {
      roles: roleRows.map((r) => ({
        id: r.id,
        key: r.key,
        name: r.name,
        description: r.description
      })),
      permissions: permissionRows.map((p) => ({
        id: p.id,
        key: p.key,
        description: p.description
      })),
      role_permission_keys: rpRows.map((rp) => ({
        role_id: rp.roleId,
        permission_id: rp.permissionId
      })),
      role_user_counts: userCountRows.map((row) => ({
        role_id: row.roleId,
        count: Number(row.c)
      }))
    }
  }

  public static async listAssignmentsForUser(userId: number): Promise<UserRoleAssignment[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        roleKey: roles.key,
        roleName: roles.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(and(eq(userRoles.userId, userId), isNull(userRoles.deletedAt), isNull(roles.deletedAt)))

    return rows.map((r) => ({
      id: r.id,
      user_id: r.userId,
      role_id: r.roleId,
      role_key: r.roleKey,
      role_name: r.roleName
    }))
  }

  public static async assignRole(params: {
    actorUserId: number
    targetUserId: number
    roleId: number
    ip: string | null
    userAgent: string | null
  }): Promise<UserRoleAssignmentRow> {
    const db = getDb()

    const existingAny = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        deletedAt: userRoles.deletedAt
      })
      .from(userRoles)
      .where(and(eq(userRoles.userId, params.targetUserId), eq(userRoles.roleId, params.roleId)))
      .limit(1)

    let rowId: number
    let reactivated = false

    if (existingAny[0]?.id) {
      const prev = existingAny[0]
      if (!prev.deletedAt) {
        const joined = await db
          .select({
            id: userRoles.id,
            userId: userRoles.userId,
            roleId: userRoles.roleId,
            roleKey: roles.key,
            roleName: roles.name
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.id, prev.id))
          .limit(1)
        const row = joined[0]
        if (!row) throw new Error('Failed to load assignment')
        return {
          id: row.id,
          user_id: row.userId,
          role_id: row.roleId,
          role_key: row.roleKey,
          role_name: row.roleName
        }
      }
      reactivated = true
      await db
        .update(userRoles)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(userRoles.id, prev.id))
      rowId = prev.id
    } else {
      const [inserted] = await db
        .insert(userRoles)
        .values({
          userId: params.targetUserId,
          roleId: params.roleId,
          updatedAt: new Date(),
          deletedAt: null
        })
        .returning({ id: userRoles.id })
      if (!inserted?.id) throw new Error('Failed to assign role')
      rowId = inserted.id
    }

    if (!reactivated) {
      await db.insert(auditLog).values({
      actorId: params.actorUserId,
      action: 'rbac.user_role.assigned',
      entityType: 'user_role',
      entityId: rowId,
      success: true,
      message: `Assigned role ${params.roleId} to user ${params.targetUserId}`,
      payload: { targetUserId: params.targetUserId, roleId: params.roleId },
      ip: params.ip,
      userAgent: params.userAgent,
      updatedAt: new Date(),
      deletedAt: null
    })
    } else {
      await db.insert(auditLog).values({
        actorId: params.actorUserId,
        action: 'rbac.user_role.reactivated',
        entityType: 'user_role',
        entityId: rowId,
        success: true,
        message: `Reactivated role ${params.roleId} for user ${params.targetUserId}`,
        payload: { targetUserId: params.targetUserId, roleId: params.roleId },
        ip: params.ip,
        userAgent: params.userAgent,
        updatedAt: new Date(),
        deletedAt: null
      })
    }

    const joined = await db
      .select({
        id: userRoles.id,
        userId: userRoles.userId,
        roleId: userRoles.roleId,
        roleKey: roles.key,
        roleName: roles.name
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.id, rowId))
      .limit(1)

    const row = joined[0]
    if (!row) throw new Error('Failed to load assignment')

    return {
      id: row.id,
      user_id: row.userId,
      role_id: row.roleId,
      role_key: row.roleKey,
      role_name: row.roleName
    }
  }

  public static async removeAssignment(params: {
    actorUserId: number
    userRoleId: number
    ip: string | null
    userAgent: string | null
  }): Promise<void> {
    const db = getDb()

    const rows = await db
      .select({ id: userRoles.id, userId: userRoles.userId, roleId: userRoles.roleId })
      .from(userRoles)
      .where(and(eq(userRoles.id, params.userRoleId), isNull(userRoles.deletedAt)))
      .limit(1)

    const row = rows[0]
    if (!row) return

    await db
      .update(userRoles)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(userRoles.id, params.userRoleId))

    await db.insert(auditLog).values({
      actorId: params.actorUserId,
      action: 'rbac.user_role.removed',
      entityType: 'user_role',
      entityId: params.userRoleId,
      success: true,
      message: `Removed user role ${params.userRoleId}`,
      payload: { userId: row.userId, roleId: row.roleId },
      ip: params.ip,
      userAgent: params.userAgent,
      updatedAt: new Date(),
      deletedAt: null
    })
  }
}
