import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { QueuePauseAdminService } from '@/services/admin/queue-pause-admin.service'

const QueueNameSchema = z.enum([
  QUEUE_NAMES.CRAWLER,
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.SOCIAL
])

const BodySchema = z.object({
  paused: z.boolean()
})

export async function POST(req: NextRequest, context: { params: Promise<{ queueName: string }> }) {
  try {
    await requireAdminSession()
    const raw = await context.params
    const queueName = QueueNameSchema.parse(decodeURIComponent(raw.queueName))
    const body = BodySchema.parse(await req.json())
    const result = await QueuePauseAdminService.setPaused(queueName, body.paused)
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
