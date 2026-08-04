import { eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { auditLog } from '@/db/schema/audit.schema'
import { users } from '@/db/schema/users.schema'
import { hashPassword } from '@/lib/auth/password'
import type { AdminManagedUser, AdminUserCreateInput, AdminUserUpdateInput } from '@/types/admin-user-management.types'

export class AdminUserManagementService {
  public static async listAll(): Promise<AdminManagedUser[]> {
    const db = getDb()
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl
      })
      .from(users)
      .where(isNull(users.deletedAt))
      .orderBy(users.id)
      .limit(500)

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      avatar_url: r.avatarUrl ?? null
    }))
  }

  public static async create(params: {
    input: AdminUserCreateInput
    actorUserId: number
    ip: string | null
    userAgent: string | null
  }): Promise<AdminManagedUser> {
    const db = getDb()
    const passwordHash = params.input.password ? hashPassword(params.input.password) : null

    const [row] = await db
      .insert(users)
      .values({
        email: params.input.email.trim().toLowerCase(),
        name: params.input.name.trim(),
        role: params.input.role,
        passwordHash,
        avatarUrl: params.input.avatar_url ?? null,
        updatedAt: new Date(),
        deletedAt: null
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl
      })

    if (!row) throw new Error('Failed to create user')

    await db.insert(auditLog).values({
      actorId: params.actorUserId,
      action: 'user.created',
      entityType: 'user',
      entityId: row.id,
      success: true,
      message: `Created user ${row.email}`,
      payload: { userId: row.id },
      ip: params.ip,
      userAgent: params.userAgent,
      updatedAt: new Date(),
      deletedAt: null
    })

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar_url: row.avatarUrl ?? null
    }
  }

  public static async update(params: {
    userId: number
    input: AdminUserUpdateInput
    actorUserId: number
    ip: string | null
    userAgent: string | null
  }): Promise<AdminManagedUser> {
    const db = getDb()

    const patch: {
      name?: string
      role?: 'ADMIN' | 'SALES' | 'VIEWER'
      avatarUrl?: string | null
      passwordHash?: string
      updatedAt: Date
    } = { updatedAt: new Date() }

    if (params.input.name !== undefined) patch.name = params.input.name.trim()
    if (params.input.role !== undefined) patch.role = params.input.role
    if (params.input.avatar_url !== undefined) patch.avatarUrl = params.input.avatar_url
    if (params.input.password !== undefined && params.input.password.length > 0) {
      patch.passwordHash = hashPassword(params.input.password)
    }

    const [row] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, params.userId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        avatarUrl: users.avatarUrl
      })

    if (!row) throw new Error('User not found')

    await db.insert(auditLog).values({
      actorId: params.actorUserId,
      action: 'user.updated',
      entityType: 'user',
      entityId: row.id,
      success: true,
      message: `Updated user ${row.id}`,
      payload: { userId: row.id },
      ip: params.ip,
      userAgent: params.userAgent,
      updatedAt: new Date(),
      deletedAt: null
    })

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      avatar_url: row.avatarUrl ?? null
    }
  }

  public static async softDelete(params: {
    userId: number
    actorUserId: number
    ip: string | null
    userAgent: string | null
  }): Promise<void> {
    if (params.userId === params.actorUserId) {
      throw new Error('Cannot deactivate your own account')
    }

    const db = getDb()
    await db
      .update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, params.userId))

    await db.insert(auditLog).values({
      actorId: params.actorUserId,
      action: 'user.soft_deleted',
      entityType: 'user',
      entityId: params.userId,
      success: true,
      message: `Soft-deleted user ${params.userId}`,
      payload: { userId: params.userId },
      ip: params.ip,
      userAgent: params.userAgent,
      updatedAt: new Date(),
      deletedAt: null
    })
  }
}
