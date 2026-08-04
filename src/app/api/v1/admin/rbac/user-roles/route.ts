import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession, requireAdminSession } from '@/lib/auth/require-admin'
import { getAuthRequestMeta } from '@/lib/auth/request-meta'
import { RbacAdminService } from '@/services/rbac-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  userId: z.coerce.number().int().positive()
})

const PostSchema = z.object({
  userId: z.number().int().positive(),
  roleId: z.number().int().positive()
})

const DeleteSchema = z.object({
  userRoleId: z.coerce.number().int().positive()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const q = QuerySchema.parse({ userId: url.searchParams.get('userId') })
    const data = await RbacAdminService.listAssignmentsForUser(q.userId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) {
      throw new Error('Invalid session')
    }

    const json: unknown = await req.json()
    const body = PostSchema.parse(json)
    const meta = await getAuthRequestMeta()

    const row = await RbacAdminService.assignRole({
      actorUserId: actorId,
      targetUserId: body.userId,
      roleId: body.roleId,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return apiSuccess(row, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) {
      throw new Error('Invalid session')
    }

    const url = new URL(req.url)
    const body = DeleteSchema.parse({ userRoleId: url.searchParams.get('userRoleId') })
    const meta = await getAuthRequestMeta()

    await RbacAdminService.removeAssignment({
      actorUserId: actorId,
      userRoleId: body.userRoleId,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
