import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { and, eq, isNotNull, isNull, or } from 'drizzle-orm'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { getAuthRequestMeta } from '@/lib/auth/request-meta'
import { getDb } from '@/db'
import { users } from '@/db/schema/users.schema'
import { AdminUserManagementService } from '@/services/admin-user-management.service'
import type { AdminUserOption } from '@/types/admin-users.types'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  role: z.enum(['SALES', 'ADMIN', 'VIEWER']).optional(),
  /** When `all`, returns every non-deleted user (for access control UI). */
  scope: z.enum(['all', 'assignable']).optional(),
  /** `active` = not soft-deleted; `deactivated` = soft-deleted only. */
  status: z.enum(['active', 'deactivated']).optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const q = QuerySchema.parse({
      role: url.searchParams.get('role') ?? undefined,
      scope: url.searchParams.get('scope') ?? undefined,
      status: url.searchParams.get('status') ?? undefined
    })

    const db = getDb()

    const where =
      q.scope === 'all'
        ? q.status === 'deactivated'
          ? q.role
            ? and(isNotNull(users.deletedAt), eq(users.role, q.role))
            : isNotNull(users.deletedAt)
          : q.role
            ? and(isNull(users.deletedAt), eq(users.role, q.role))
            : isNull(users.deletedAt)
        : q.role
          ? and(isNull(users.deletedAt), eq(users.role, q.role))
          : and(isNull(users.deletedAt), or(eq(users.role, 'SALES'), eq(users.role, 'ADMIN')))

    const rows = await db
      .select({ id: users.id, name: users.name, email: users.email, avatarUrl: users.avatarUrl, role: users.role })
      .from(users)
      .where(where)
      .limit(200)

    const data: AdminUserOption[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      avatar_url: r.avatarUrl ?? null,
      role: r.role
    }))

    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

const CreateUserSchema = z.object({
  email: z.string().trim().email().max(320),
  name: z.string().trim().min(1).max(200),
  role: z.enum(['ADMIN', 'SALES', 'VIEWER']),
  password: z.string().min(8).max(200).optional(),
  avatar_url: z.string().url().max(2000).optional().nullable()
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) {
      throw new Error('Invalid session')
    }

    const json: unknown = await req.json()
    const body = CreateUserSchema.parse(json)
    const meta = await getAuthRequestMeta()

    const created = await AdminUserManagementService.create({
      input: {
        email: body.email,
        name: body.name,
        role: body.role,
        password: body.password,
        avatar_url: body.avatar_url ?? null
      },
      actorUserId: actorId,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return apiSuccess(created, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

