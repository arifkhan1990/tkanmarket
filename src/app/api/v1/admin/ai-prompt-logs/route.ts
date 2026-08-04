import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AiPromptLogsAdminService } from '@/services/ai-prompt-logs-admin.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  source: z.string().trim().min(1).max(100).optional().nullable(),
  model: z.string().trim().min(1).max(100).optional().nullable(),
  status: z.string().trim().min(1).max(50).optional().nullable(),
  from: z.string().optional().nullable(),
  to: z.string().optional().nullable(),
  q: z.string().trim().min(1).max(200).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const params = QuerySchema.extend({
      page: z.number().int().min(1),
      limit: z.number().int().min(1).max(100)
    }).parse({
      page,
      limit,
      source: url.searchParams.get('source'),
      model: url.searchParams.get('model'),
      status: url.searchParams.get('status'),
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      q: url.searchParams.get('q')
    })

    const [data, stats] = await Promise.all([
      AiPromptLogsAdminService.list({
        page: params.page,
        limit: params.limit,
        source: params.source ?? undefined,
        model: params.model ?? undefined,
        status: params.status ?? undefined,
        from: params.from ?? undefined,
        to: params.to ?? undefined,
        q: params.q ?? undefined
      }),
      AiPromptLogsAdminService.getStats()
    ])

    return apiSuccess({
      ...data,
      stats
    })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
