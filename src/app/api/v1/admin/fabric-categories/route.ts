import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { AdminFabricCategoryTermsService } from '@/services/admin-fabric-category-terms.service'

export const dynamic = 'force-dynamic'

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  include_inactive: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true')
  ,
  include_archived: z
    .union([z.literal('true'), z.literal('false')])
    .optional()
    .transform((v) => v === 'true')
})

const CreateBodySchema = z.object({
  slug: z.string().trim().min(1).max(200),
  name_ru: z.string().trim().min(2).max(200),
  name_en: z.string().trim().max(200).optional().nullable(),
  description_ru: z.string().trim().max(2000).optional().nullable(),
  description_en: z.string().trim().max(2000).optional().nullable(),
  sort_order: z.number().int().min(-999999).max(999999).optional(),
  is_active: z.boolean().optional()
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const parsed = ListQuerySchema.parse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      include_inactive: url.searchParams.get('include_inactive') ?? undefined,
      include_archived: url.searchParams.get('include_archived') ?? undefined
    })

    const data = await AdminFabricCategoryTermsService.list({
      page: parsed.page,
      limit: parsed.limit,
      q: parsed.q,
      includeInactive: parsed.include_inactive ?? false,
      includeArchived: parsed.include_archived ?? false
    })

    const paged = withPagination(data.items, data.total, parsed.page, parsed.limit)
    return apiSuccess(paged)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = CreateBodySchema.parse(await req.json())
    const data = await AdminFabricCategoryTermsService.create(body)
    return apiSuccess(data, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

