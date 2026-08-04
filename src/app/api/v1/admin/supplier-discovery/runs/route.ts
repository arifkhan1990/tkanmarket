import type { NextRequest } from 'next/server'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { requireCrawlerEnabled } from '@/lib/crawler/require-crawler-enabled'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { CreateSupplierDiscoveryRunSchema } from '@/lib/validations/supplier-discovery.validation'
import { SupplierDiscoveryAdminService } from '@/services/admin/supplier-discovery-admin.service'
import { SupplierDiscoveryService } from '@/services/supplier-discovery/supplier-discovery.service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const url = new URL(req.url)
    const { page, limit } = parsePaginationParams(url.searchParams)
    const { runs, total } = await SupplierDiscoveryAdminService.listRuns({ page, limit })
    const meta = withPagination(runs, total, page, limit).meta
    return apiSuccess({ runs, total }, meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession()
    await requireCrawlerEnabled()
    const body: unknown = await req.json()
    const input = CreateSupplierDiscoveryRunSchema.parse(body)
    const triggeredById = Number(session.user.id ?? 0) || null
    const result = await SupplierDiscoveryService.createRun(
      {
        sources: input.sources,
        keywords: input.keywords,
        max_suppliers: input.max_suppliers,
        max_products_per_supplier: input.max_products_per_supplier,
        criteria: input.criteria
      },
      triggeredById
    )
    return apiSuccess(result, undefined, 201)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
