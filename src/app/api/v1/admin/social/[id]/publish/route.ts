import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'

import { getDb } from '@/db'
import { socialPosts } from '@/db/schema/social.schema'
import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { enqueueSocialPublish } from '@/lib/queue/helpers'
import { AuthError, NotFoundError, ValidationError } from '@/lib/errors'

const ParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminSession()
    const params = ParamsSchema.parse(await context.params)
    const userId = session.user.id ? Number(session.user.id) : NaN
    if (!Number.isFinite(userId)) throw new AuthError('Invalid session user id')

    const db = getDb()
    const postRows = await db
      .select({ captionText: socialPosts.captionText })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, params.id), isNull(socialPosts.deletedAt)))
      .limit(1)

    const post = postRows[0]
    if (!post) throw new NotFoundError('Social post not found')
    if (!post.captionText || post.captionText.trim().length === 0) {
      throw new ValidationError('Post cannot be published without a caption')
    }

    await enqueueSocialPublish(params.id, { actorUserId: userId, reason: 'manual' })
    return apiSuccess({ id: params.id, queued: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
