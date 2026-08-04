import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricTaxonomyService } from '@/services/admin-fabric-taxonomy.service'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  category_slug: z.string().trim().min(1).max(200).optional().nullable()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const raw = url.searchParams.get('category_slug')
    const parsed = QuerySchema.parse({
      category_slug: raw !== null && raw !== '' ? raw : undefined
    })
    const data = await AdminFabricTaxonomyService.getOverview(parsed.category_slug ?? undefined)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
