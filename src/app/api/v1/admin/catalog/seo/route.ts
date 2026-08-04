import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { withPagination } from '@/lib/utils/api-response'
import { AdminBulkSeoService } from '@/services/admin-bulk-seo.service'

export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(25),
  q: z.string().trim().min(1).optional(),
  missing: z.enum(['meta_title', 'meta_description', 'image_alt']).optional()
})

const bulkUpdateSchema = z.object({
  updates: z
    .array(
      z.object({
        id: z.number().int().positive(),
        metaTitleRu: z.string().trim().max(120).nullable().optional(),
        metaDescriptionRu: z.string().trim().max(400).nullable().optional(),
        imageAltRu: z.string().trim().max(200).nullable().optional()
      })
    )
    .min(1)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { data, total } = await AdminBulkSeoService.list({
      page: parsed.page,
      limit: parsed.limit,
      q: parsed.q,
      missing: parsed.missing
    })

    const paginated = withPagination(data.items, total, parsed.page, parsed.limit)
    return apiSuccess(paginated.items, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const json = await req.json()
    const parsed = bulkUpdateSchema.parse(json)
    await AdminBulkSeoService.bulkUpdate(parsed.updates)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

