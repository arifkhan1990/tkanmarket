import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { addCrawlerJob } from '@/lib/queue/helpers'
import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { requireCrawlerEnabled } from '@/lib/crawler/require-crawler-enabled'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'

const ParamsSchema = z.object({
  runId: z.coerce.number().int().positive()
})

export async function POST(_req: NextRequest, context: { params: Promise<{ runId: string }> }) {
  try {
    const session = await requireAdminSession()
    await requireCrawlerEnabled()
    const params = ParamsSchema.parse(await context.params)
    const triggeredById = Number(session.user.id ?? 0) || null
    const result = await CrawlerAdminService.retryRun({ runId: params.runId, triggeredById })
    await addCrawlerJob({
      jobId: `crawler_run_${result.id}`,
      keywords: result.keywords,
      source: result.source,
      maxProducts: result.maxProducts
    })
    return apiSuccess({ runId: result.id })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
