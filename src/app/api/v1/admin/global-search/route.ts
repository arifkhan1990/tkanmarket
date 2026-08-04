import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminGlobalSearchService } from '@/services/admin-global-search.service'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  q: z.string().optional().default('')
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = querySchema.parse({ q: req.nextUrl.searchParams.get('q') ?? '' })

    const data = await AdminGlobalSearchService.search(parsed.q)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
