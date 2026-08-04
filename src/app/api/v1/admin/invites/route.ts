import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminOnlySession } from '@/lib/auth/require-admin'
import { AdminInviteService } from '@/services/admin-invite.service'

export const dynamic = 'force-dynamic'

const PostSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(['ADMIN', 'SALES', 'VIEWER'])
})

export async function GET() {
  try {
    await requireAdminOnlySession()
    const data = await AdminInviteService.listPending()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminOnlySession()
    const actorId = Number(session.user?.id)
    if (!Number.isFinite(actorId)) throw new Error('Invalid session')

    const json: unknown = await req.json()
    const body = PostSchema.parse(json)
    const result = await AdminInviteService.createInvite({
      email: body.email,
      role: body.role,
      invitedByUserId: actorId
    })
    return apiSuccess({ invite: result.invite }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
