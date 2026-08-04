import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { ImageGenerationService } from '@/services/image-generation.service'
import { VideoGenerationService } from '@/services/video-generation.service'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)

    const [images, videos] = await Promise.all([
      ImageGenerationService.getByFabric(params.id),
      VideoGenerationService.getByFabric(params.id)
    ])

    return apiSuccess({ images, videos })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
