import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { BullJobAdminService } from '@/services/admin/bull-job-admin.service'

const QueueNameSchema = z.enum([
  QUEUE_NAMES.CRAWLER,
  QUEUE_NAMES.AI,
  QUEUE_NAMES.IMAGE,
  QUEUE_NAMES.SOCIAL
])

export async function GET(_req: NextRequest, context: { params: Promise<{ queueName: string; jobId: string }> }) {
  try {
    await requireAdminSession()
    const raw = await context.params
    const queueName = QueueNameSchema.parse(raw.queueName)
    const jobId = z.string().min(1).parse(decodeURIComponent(raw.jobId))
    const data = await BullJobAdminService.getDetail(queueName, jobId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(_req: NextRequest, context: { params: Promise<{ queueName: string; jobId: string }> }) {
  try {
    await requireAdminSession()
    const raw = await context.params
    const queueName = QueueNameSchema.parse(raw.queueName)
    const jobId = z.string().min(1).parse(decodeURIComponent(raw.jobId))
    const data = await BullJobAdminService.retry(queueName, jobId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
