import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { SocialService } from '@/services/social.service'
import { SocialPlatformSchema, VideoDurationSchema } from '@/lib/validations/social.validation'

const BodySchema = z.object({
  fabric_id: z.number().int().positive(),
  prompt: z.string().max(2000).optional(),
  duration: VideoDurationSchema.optional().default(8),
  platform: SocialPlatformSchema.optional().default('INSTAGRAM'),
  image_url: z.string().url().optional()
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json())

    const result = await SocialService.generateVideoForFabric(body.fabric_id, {
      prompt: body.prompt,
      duration: body.duration,
      platform: body.platform,
      imageUrl: body.image_url
    })

    return apiSuccess({
      fabric_id: body.fabric_id,
      post_id: result.postId,
      media_id: result.mediaId,
      status: 'VIDEO_PENDING'
    }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
