import type { NextRequest } from 'next/server'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { SupplierDiscoveryRunSuppliersQuerySchema } from '@/lib/validations/supplier-discovery.validation'
import { SupplierDiscoveryAdminService } from '@/services/admin/supplier-discovery-admin.service'
import type { SupplierDiscoverySource } from '@/types/supplier-discovery.types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await ctx.params
    const runId = Number(id)
    if (!Number.isFinite(runId) || runId < 1) {
      throw new Error('Invalid id')
    }

    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const q = SupplierDiscoveryRunSuppliersQuerySchema.parse({
      page,
      limit,
      qualified: url.searchParams.get('qualified') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
      source: url.searchParams.get('source') ?? undefined
    })

    const qualified =
      q.qualified === 'true' ? true : q.qualified === 'false' ? false : undefined

    const { suppliers, total } = await SupplierDiscoveryAdminService.listRunSuppliers(runId, {
      page: q.page,
      limit: q.limit,
      qualified,
      status: q.status,
      source: q.source as SupplierDiscoverySource | undefined
    })

    const meta = withPagination(suppliers, total, q.page, q.limit).meta
    return apiSuccess({ suppliers, total }, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
