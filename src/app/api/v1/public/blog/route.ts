import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiError, apiSuccess } from '@/lib/utils/api-response'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import {
  listPublicBlogCategories,
  listPublicBlogPostsPaginated
} from '@/services/blog.service'
import { categoryLabelForTopic, parseBlogTopicParam } from '@/lib/blog-topics'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(500).optional().default(1),
  limit: z.coerce.number().int().min(1).max(24).optional().default(9),
  topic: z.string().trim().max(40).optional(),
  q: z.string().trim().max(100).optional().default(''),
  excludeLatest: z
    .union([z.literal('true'), z.literal('false'), z.literal('1'), z.literal('0')])
    .optional()
})

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, {
      limit: 90,
      windowSeconds: 60,
      routeKey: 'public:blog-list'
    })

    const url = new URL(req.url)
    const parsed = querySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      topic: url.searchParams.get('topic') ?? undefined,
      q: url.searchParams.get('q') ?? '',
      excludeLatest: url.searchParams.get('excludeLatest') ?? undefined
    })

    if (!parsed.success) {
      return apiError('VALIDATION_ERROR', 'Invalid blog query parameters', 400)
    }

    const topic = parseBlogTopicParam(parsed.data.topic)
    const category = categoryLabelForTopic(topic)
    const excludeLatest =
      parsed.data.excludeLatest === 'true' || parsed.data.excludeLatest === '1'

    // Categories are cheap (one GROUP BY) and live alongside the page so the
    // client never has to make a second request to render filter chips.
    const [list, categories] = await Promise.all([
      listPublicBlogPostsPaginated({
        page: parsed.data.page,
        limit: parsed.data.limit,
        category,
        q: parsed.data.q,
        excludeLatest
      }),
      listPublicBlogCategories()
    ])

    const totalPages = Math.max(1, Math.ceil(list.total / list.limit))
    const response = apiSuccess(
      {
        items: list.items,
        categories,
        topic,
        query: parsed.data.q
      },
      {
        page: list.page,
        limit: list.limit,
        total: list.total,
        totalPages
      }
    )
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120')
    return response
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
