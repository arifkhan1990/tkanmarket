import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAdminService } from '@/services/admin/social-admin.service'
import { SchedulePostSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const body = SchedulePostSchema.parse(await req.json().catch(() => ({})))
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    await SocialAdminService.schedule(params.id, new Date(body.scheduled_at), userId)
    return apiSuccess({ id: params.id, status: 'SCHEDULED', scheduled_at: body.scheduled_at })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
