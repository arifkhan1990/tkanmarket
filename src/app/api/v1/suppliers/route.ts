import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { SupplierService } from '@/services/supplier.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'
import { parsePaginationParams } from '@/lib/utils/query-params'

const fabricTypeSchema = z.string().trim().min(1).max(50)

const SupplierQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  fabric_type: fabricTypeSchema.optional()
})

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 120, windowSeconds: 3600, routeKey: 'public:suppliers:list' })
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const params = SupplierQuerySchema.extend({
      page: z.number().int().min(1),
      limit: z.number().int().min(1)
    }).parse({
      page,
      limit,
      q: url.searchParams.get('q') ?? undefined,
      fabric_type: url.searchParams.get('fabric_type') ?? undefined
    })

    const result = await SupplierService.list({
      page: params.page,
      limit: params.limit,
      q: params.q,
      fabricType: params.fabric_type
    })
    const meta = withPagination(result.items, result.total, params.page, params.limit).meta
    return apiSuccess(result.items, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

