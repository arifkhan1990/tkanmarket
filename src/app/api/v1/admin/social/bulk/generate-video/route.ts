import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { SocialService } from '@/services/social.service'
import { logger } from '@/lib/logger'
import { SocialPlatformSchema, VideoDurationSchema } from '@/lib/validations/social.validation'

const BodySchema = z.object({
  fabric_ids: z.array(z.number().int().positive()).min(1).max(50),
  prompt: z.string().max(2000).optional(),
  duration: VideoDurationSchema.optional().default(8),
  platform: SocialPlatformSchema.optional()
})

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = BodySchema.parse(await req.json())

    const results: Array<{ fabric_id: number; post_id: number; media_id: number; status: string }> = []
    const errors: Array<{ fabric_id: number; error: string }> = []

    for (const fabricId of body.fabric_ids) {
      try {
        const result = await SocialService.generateVideoForFabric(fabricId, {
          prompt: body.prompt,
          duration: body.duration,
          platform: body.platform
        })
        results.push({ fabric_id: fabricId, post_id: result.postId, media_id: result.mediaId, status: 'VIDEO_PENDING' })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        logger.warn('Bulk video generation failed for fabric', { fabricId, message })
        errors.push({ fabric_id: fabricId, error: message })
      }
    }

    return apiSuccess({ results, errors, total: body.fabric_ids.length, succeeded: results.length, failed: errors.length }, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
