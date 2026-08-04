import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { BulkIdsSchema } from '@/lib/validations/social.validation'
import { enqueueSocialPublish } from '@/lib/queue/helpers'
import { AuthError } from '@/lib/errors'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    const body = await req.json()
    const parsed = BulkIdsSchema.parse(body)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')
    let enqueued = 0
    for (const postId of parsed.post_ids) {
      await enqueueSocialPublish(postId, { actorUserId: userId, reason: 'manual' })
      enqueued += 1
    }
    return apiSuccess({ enqueued })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
