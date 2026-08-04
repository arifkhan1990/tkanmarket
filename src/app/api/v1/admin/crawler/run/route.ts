import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { requireAdminSession } from '@/lib/auth/require-admin'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { requireCrawlerEnabled } from '@/lib/crawler/require-crawler-enabled'
import { CrawlerCatalogSourceSchema } from '@/lib/validations/crawler-run.validation'
import { CrawlerService } from '@/services/crawler.service'
import { SettingsService } from '@/services/admin/settings.service'
import { addCrawlerJob } from '@/lib/queue/helpers'

const BodySchema = z.object({
  keywords: z.array(z.string().trim().min(1)).min(1).max(25),
  source: CrawlerCatalogSourceSchema.default('both'),
  max_products: z.number().int().positive().max(2000).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    await requireCrawlerEnabled()
    const body = BodySchema.parse(await req.json().catch(() => ({})))
    const settings = await SettingsService.getSettings()
    const maxProducts = body.max_products ?? settings.crawlerDefaultMaxProducts

    const run = await CrawlerService.createRun({
      source: body.source,
      keywords: body.keywords,
      maxProducts,
      triggeredById: Number(session.user.id ?? 0) || null
    })

    await addCrawlerJob({
      jobId: `crawler_run_${run.id}`,
      keywords: body.keywords,
      source: body.source,
      maxProducts
    })

    return apiSuccess({ runId: run.id })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
