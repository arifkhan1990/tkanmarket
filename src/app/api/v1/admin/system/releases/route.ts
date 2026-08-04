import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { withPagination } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const sp = req.nextUrl.searchParams
    const q = QuerySchema.parse(Object.fromEntries(sp.entries()))
    const result = await SystemConsoleService.getReleases({ page: q.page, limit: q.limit })
    const paginated = withPagination(result.items, result.total, q.page, q.limit)
    return apiSuccess({ items: paginated.items, featured: result.featured }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
