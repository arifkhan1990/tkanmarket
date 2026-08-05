import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAnalyticsService } from '@/services/social-analytics.service'
import { AnalyticsSummaryQuerySchema } from '@/lib/validations/social.validation'

const DailySeriesQuerySchema = AnalyticsSummaryQuerySchema.pick({
  platform: true,
  since: true,
  until: true
}).extend({
  days: z.coerce.number().int().min(1).max(90).optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = DailySeriesQuerySchema.parse({
      platform: url.searchParams.get('platform') ?? undefined,
      since: url.searchParams.get('since') ?? undefined,
      until: url.searchParams.get('until') ?? undefined,
      days: url.searchParams.get('days') ?? undefined
    })

    const until = parsed.until ? new Date(parsed.until) : new Date()
    const since = parsed.since ? new Date(parsed.since) : parsed.days ? new Date(until.getTime() - parsed.days * 24 * 60 * 60 * 1000) : new Date(until.getTime() - 30 * 24 * 60 * 60 * 1000)

    const series = await SocialAnalyticsService.dailySeries({
      platform: parsed.platform,
      since,
      until
    })
    return apiSuccess({ series })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
