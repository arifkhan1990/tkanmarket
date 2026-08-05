import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialPublisherService } from '@/services/social-publisher.service'
import { BulkScheduleSchema } from '@/lib/validations/social.validation'
import { AuthError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = await req.json()
    const parsed = BulkScheduleSchema.parse(body)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    const updated = await SocialPublisherService.scheduleMany({
      postIds: parsed.post_ids,
      scheduledAt: new Date(parsed.scheduled_at),
      actorUserId: userId,
      timezone: parsed.timezone
    })
    return apiSuccess({ updated })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
