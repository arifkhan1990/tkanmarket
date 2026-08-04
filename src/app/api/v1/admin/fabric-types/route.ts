import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { AdminFabricTypesService } from '@/services/admin-fabric-types.service'
import { withPagination } from '@/lib/utils/api-response'
import { logger } from '@/lib/logger'

const CreateBodySchema = z.object({
  slug: z.string().trim().min(1).max(100).toLowerCase(),
  label_ru: z.string().trim().min(1).max(300),
  label_en: z.string().trim().min(1).max(300).optional().nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional().default(0)
})

const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  q: z.string().trim().optional(),
  include_deleted: z.coerce.boolean().default(false)
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    await enforceRateLimit(req, {
      limit: 120,
      windowSeconds: 60,
      routeKey: 'admin:fabric-types:list'
    })

    const { searchParams } = req.nextUrl
    const params = ListQuerySchema.parse(Object.fromEntries(searchParams))

    const result = await AdminFabricTypesService.list({
      page: params.page,
      limit: params.limit,
      q: params.q,
      includeDeleted: params.include_deleted
    })
    const meta = withPagination(result.items, result.total, params.page, params.limit).meta
    return apiSuccess(result.items, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    await enforceRateLimit(req, {
      limit: 30,
      windowSeconds: 60,
      routeKey: 'admin:fabric-types:create'
    })

    const json: unknown = await req.json()
    const body = CreateBodySchema.parse(json)

    const result = await AdminFabricTypesService.create({
      slug: body.slug,
      labelRu: body.label_ru,
      labelEn: body.label_en ?? null,
      sortOrder: body.sort_order
    })

    logger.info('Fabric type created', {
      adminId: Number(session.user.id),
      slug: body.slug,
      id: result.id
    })

    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
