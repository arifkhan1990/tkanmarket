import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { addImageGenerationJob } from '@/lib/queue/helpers'
import { getDb } from '@/db'
import { fabrics } from '@/db/schema/fabrics.schema'
import { and, eq, isNull } from 'drizzle-orm'

import type { ImageGenerationJobPayload } from '@/types/queue.types'

const RouteParamsSchema = z.object({
  id: z.coerce.number().int().positive()
})

export async function POST(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const params = RouteParamsSchema.parse(await context.params)

    const db = getDb()
    const [fabric] = await db
      .select({ id: fabrics.id })
      .from(fabrics)
      .where(and(eq(fabrics.id, params.id), isNull(fabrics.deletedAt)))
      .limit(1)

    if (!fabric) throw new Error('Fabric not found')

    const payload: ImageGenerationJobPayload = {
      fabricId: params.id,
      prompt: '',
      isBatch: true
    }

    const job = await addImageGenerationJob(params.id, '', payload)

    return apiSuccess({
      fabric_id: params.id,
      job_id: job.id ?? job.name,
      status: 'BATCH_QUEUED'
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
