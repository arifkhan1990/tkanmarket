import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SocialAnalyticsService } from '@/services/social-analytics.service'
import { AnalyticsSummaryQuerySchema } from '@/lib/validations/social.validation'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = AnalyticsSummaryQuerySchema.parse({
      platform: url.searchParams.get('platform') ?? undefined,
      campaign_id: url.searchParams.get('campaign_id') ?? undefined,
      since: url.searchParams.get('since') ?? undefined,
      until: url.searchParams.get('until') ?? undefined
    })
    const summary = await SocialAnalyticsService.summary({
      platform: parsed.platform,
      campaignId: parsed.campaign_id,
      since: parsed.since ? new Date(parsed.since) : undefined,
      until: parsed.until ? new Date(parsed.until) : undefined
    })
    return apiSuccess({ summary })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
