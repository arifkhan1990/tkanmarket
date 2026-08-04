import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { FabricQuerySchema } from '@/lib/validations/fabric.validation'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { FabricService } from '@/services/fabric.service'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

export async function GET(req: NextRequest) {
  try {
    await enforceRateLimit(req, { limit: 120, windowSeconds: 3600, routeKey: 'public:fabrics:list' })
    const url = new URL(req.url)
    const searchParams = url.searchParams

    const raw = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
      q: searchParams.get('q') ?? undefined,
      material:
        searchParams.getAll('material').length > 0
          ? searchParams.getAll('material')
          : undefined,
      fabric_type: searchParams.get('fabric_type') ?? undefined,
      gsm_min: searchParams.get('gsm_min') ?? undefined,
      gsm_max: searchParams.get('gsm_max') ?? undefined,
      price_usd_min: searchParams.get('price_usd_min') ?? undefined,
      price_usd_max: searchParams.get('price_usd_max') ?? undefined,
      width: searchParams.get('width') ?? undefined,
      width_min: searchParams.get('width_min') ?? undefined,
      width_max: searchParams.get('width_max') ?? undefined,
      moq_min: searchParams.get('moq_min') ?? undefined,
      moq_max: searchParams.get('moq_max') ?? undefined,
      supplier_id: searchParams.get('supplier_id') ?? undefined,
      category_slug: searchParams.get('category_slug') ?? undefined,
      view: searchParams.get('view') ?? undefined
    }

    const params = FabricQuerySchema.parse(raw)
    const result = await FabricService.list(params)

    const baseMeta = withPagination(result.items, result.total, params.page, params.limit).meta
    const meta = { ...baseMeta, supplierCount: result.supplierCount }
    return apiSuccess(result.items, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

