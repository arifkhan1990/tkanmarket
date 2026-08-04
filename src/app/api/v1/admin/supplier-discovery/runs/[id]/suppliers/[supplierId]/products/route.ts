import type { NextRequest } from 'next/server'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { SupplierDiscoveryRunProductsQuerySchema } from '@/lib/validations/supplier-discovery.validation'
import { SupplierDiscoveryAdminService } from '@/services/admin/supplier-discovery-admin.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; supplierId: string }> }) {
  try {
    await requireAdminSession()
    const { id, supplierId } = await ctx.params
    const runId = Number(id)
    const supId = Number(supplierId)
    if (!Number.isFinite(runId) || runId < 1 || !Number.isFinite(supId) || supId < 1) {
      throw new Error('Invalid id')
    }

    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const q = SupplierDiscoveryRunProductsQuerySchema.parse({
      page,
      limit,
      status: url.searchParams.get('status') ?? undefined
    })

    const { products, total } = await SupplierDiscoveryAdminService.listSupplierProducts(runId, supId, {
      page: q.page,
      limit: q.limit,
      status: q.status
    })

    const meta = withPagination(products, total, q.page, q.limit).meta
    return apiSuccess({ products, total }, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
