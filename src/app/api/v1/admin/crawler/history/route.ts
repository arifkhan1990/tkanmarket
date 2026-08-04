import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
  q: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const sp = req.nextUrl.searchParams
    const input = QuerySchema.parse({
      page: sp.get('page') ?? undefined,
      pageSize: sp.get('pageSize') ?? undefined,
      status: sp.get('status') ?? undefined,
      source: sp.get('source') ?? undefined,
      q: sp.get('q') ?? undefined
    })
    const data = await CrawlerAdminService.listHistory({
      page: input.page,
      pageSize: input.pageSize,
      status: input.status,
      source: input.source,
      q: input.q
    })
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
