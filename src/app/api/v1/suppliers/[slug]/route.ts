import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { SupplierService } from '@/services/supplier.service'
import { NotFoundError } from '@/lib/errors'
import { enforceRateLimit } from '@/lib/rate-limit/rate-limit'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await enforceRateLimit(req, { limit: 120, windowSeconds: 3600, routeKey: 'public:suppliers:detail' })
    const slug = (await context.params).slug
    const supplier = await SupplierService.getBySlug(slug)
    if (!supplier) throw new NotFoundError('Supplier not found')
    return apiSuccess(supplier)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

