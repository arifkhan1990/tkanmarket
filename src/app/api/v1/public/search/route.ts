import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiError, apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { PublicSearchService } from '@/services/public-search.service'
import { LOCALES, type Locale } from '@/types/i18n.types'

export const dynamic = 'force-dynamic'

const searchQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  locale: z.enum(LOCALES).optional()
})

export async function GET(req: NextRequest) {
  try {
    // Public, abuse-prone endpoint — keep the bucket tight per IP.
    await enforceRateLimit(req, {
      limit: 60,
      windowSeconds: 60,
      routeKey: 'public:search'
    })

    const url = new URL(req.url)
    const parsed = searchQuerySchema.safeParse({
      q: url.searchParams.get('q') ?? '',
      locale: url.searchParams.get('locale') ?? undefined
    })

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid search parameters', 400)
    }

    const locale: Locale = parsed.data.locale ?? 'en'

    const data = await PublicSearchService.searchAll({
      q: parsed.data.q,
      locale
    })

    const response = apiSuccess(data)
    // Edge-cacheable for a few seconds — typeahead bursts hit the same query
    // many times in a row; SWR keeps the UI snappy without hammering Postgres.
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=30'
    )
    return response
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
