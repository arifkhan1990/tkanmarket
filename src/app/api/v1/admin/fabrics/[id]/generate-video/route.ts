import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { SocialService } from '@/services/social.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const BodySchema = z.object({
  prompt: z.string().max(2000).optional(),
  image_url: z.string().url().optional(),
  platform: z.enum(['INSTAGRAM', 'TIKTOK', 'PINTEREST', 'FACEBOOK', 'YOUTUBE']).optional()
}).optional()

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await req.json().catch(() => undefined))

    const result = await SocialService.generateVideoForFabric(params.id, {
      prompt: body?.prompt,
      platform: body?.platform
    })

    return apiSuccess({
      fabric_id: params.id,
      post_id: result.postId,
      media_id: result.mediaId,
      status: 'VIDEO_PENDING'
    }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
