import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAnalyticsService } from '@/services/social-analytics.service'
import { enqueueSocialAnalyticsSync } from '@/lib/queue/helpers'

const ParamsSchema = z.object({ id: z.coerce.number().int().positive() })

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    const history = await SocialAnalyticsService.postHistory({ postId: id })
    return apiSuccess({ postId: id, history })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminSession()
    const { id } = ParamsSchema.parse(await context.params)
    await enqueueSocialAnalyticsSync(id)
    return apiSuccess({ postId: id, queued: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
