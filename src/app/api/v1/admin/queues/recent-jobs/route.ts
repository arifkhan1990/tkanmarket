import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { QUEUE_NAMES } from '@/constants'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminUnifiedQueueJobsService } from '@/services/admin/admin-unified-queue-jobs.service'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().optional(),
  queue: z
    .enum([
      QUEUE_NAMES.CRAWLER,
      QUEUE_NAMES.AI,
      QUEUE_NAMES.IMAGE,
      QUEUE_NAMES.SOCIAL
    ])
    .optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const sp = req.nextUrl.searchParams
    const input = QuerySchema.parse({
      page: sp.get('page') ?? undefined,
      pageSize: sp.get('pageSize') ?? undefined,
      q: sp.get('q') ?? undefined,
      queue: sp.get('queue') ?? undefined
    })
    const data = await AdminUnifiedQueueJobsService.listRecent({
      page: input.page,
      pageSize: input.pageSize,
      q: input.q,
      queueName: input.queue
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
