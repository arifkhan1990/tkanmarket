import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { requireCrawlerEnabled } from '@/lib/crawler/require-crawler-enabled'
import { CrawlerCatalogSourceSchema } from '@/lib/validations/crawler-run.validation'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'
import { SettingsService } from '@/services/admin/settings.service'
import { addCrawlerJob } from '@/lib/queue/helpers'

const TriggerSchema = z.object({
  source: CrawlerCatalogSourceSchema,
  keywords: z.array(z.string().trim().min(1)).min(1).max(20),
  maxProducts: z.number().int().positive().max(2000).optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    await requireCrawlerEnabled()
    const body = await req.json()
    const input = TriggerSchema.parse(body)
    const settings = await SettingsService.getSettings()
    const maxProducts = input.maxProducts ?? settings.crawlerDefaultMaxProducts
    const triggeredById = Number(session.user.id ?? 0) || null
    const result = await CrawlerAdminService.trigger({
      source: input.source,
      keywords: input.keywords,
      maxProducts,
      triggeredById
    })
    await addCrawlerJob({
      jobId: `crawler_run_${result.id}`,
      keywords: input.keywords,
      source: input.source,
      maxProducts
    })
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
