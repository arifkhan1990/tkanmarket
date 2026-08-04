import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'
import type { AdminFabricDraftOption } from '@/types/admin-fabric-draft-options.types'

export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
  q: z.string().trim().min(0).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(50).default(20),
  status: z
    .enum(['raw_scraped', 'ai_processing', 'ai_processed', 'approved', 'rejected'])
    .optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()

    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse({
      q: searchParams.get('q') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined
    })

    const list = await AdminFabricService.list({
      q: query.q,
      status: query.status,
      page: query.page,
      limit: query.limit
    })

    const items: AdminFabricDraftOption[] = list.items.map((it) => ({
      id: it.id,
      title: it.title_ru,
      supplier_name: it.supplier_name,
      status: it.status,
      thumb_url: it.thumb_url
    }))

    const paginated = withPagination(items, list.total, query.page, query.limit)
    return apiSuccess({ items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

