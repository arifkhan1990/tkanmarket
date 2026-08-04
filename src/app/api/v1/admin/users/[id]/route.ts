import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession } from '@/lib/auth/require-admin'
import { getAuthRequestMeta } from '@/lib/auth/request-meta'
import { AdminUserManagementService } from '@/services/admin-user-management.service'

export const dynamic = 'force-dynamic'

const PatchSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(['ADMIN', 'SALES', 'VIEWER']).optional(),
  password: z.string().min(8).max(200).optional(),
  avatar_url: z.string().url().max(2000).optional().nullable()
})

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) {
      throw new Error('Invalid session')
    }

    const { id: idRaw } = await context.params
    const userId = Number(idRaw)
    if (!Number.isFinite(userId) || userId < 1) {
      throw new Error('Invalid user id')
    }

    const json: unknown = await req.json()
    const body = PatchSchema.parse(json)
    const meta = await getAuthRequestMeta()

    const updated = await AdminUserManagementService.update({
      userId,
      input: body,
      actorUserId: actorId,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return apiSuccess(updated)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) {
      throw new Error('Invalid session')
    }

    const { id: idRaw } = await context.params
    const userId = Number(idRaw)
    if (!Number.isFinite(userId) || userId < 1) {
      throw new Error('Invalid user id')
    }

    const meta = await getAuthRequestMeta()

    await AdminUserManagementService.softDelete({
      userId,
      actorUserId: actorId,
      ip: meta.ip,
      userAgent: meta.userAgent
    })

    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
