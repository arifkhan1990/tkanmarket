import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { ImageGenerationService } from '@/services/image-generation.service'
import { addImageGenerationJob } from '@/lib/queue/helpers'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

const BodySchema = z.object({
  prompt: z.string().min(1).max(2000).optional()
}).optional()

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)
    const body = BodySchema.parse(await req.json().catch(() => undefined))

    const job = await addImageGenerationJob(params.id, body?.prompt ?? '')

    return apiSuccess({ fabric_id: params.id, job_id: job.id ?? job.name })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
