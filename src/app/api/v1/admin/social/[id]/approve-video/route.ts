import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { SocialAdminService } from '@/services/admin/social-admin.service'
import { AuthError } from '@/lib/errors'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const BodySchema = z.object({
  approved: z.boolean(),
  notes: z.string().max(1000).optional()
})

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await req.json())

    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')

    if (body.approved) {
      await SocialAdminService.approveVideo(params.id, userId)
    } else {
      await SocialAdminService.rejectVideo(params.id, userId, body.notes)
    }

    return apiSuccess({ post_id: params.id, approved: body.approved })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
