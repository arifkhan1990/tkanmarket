import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { withPagination } from '@/lib/utils/api-response'
import { AdminBulkOrdersService } from '@/services/admin-bulk-orders.service'
import type { BulkOrderStatus, SupplierTier } from '@/types/admin-bulk-orders.types'

export const dynamic = 'force-dynamic'

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(5).max(100).default(25),
  status: z.enum(['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'ON_HOLD']).optional(),
  supplierTier: z.enum(['PLATINUM', 'GOLD', 'SILVER', 'STANDARD']).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  q: z.string().trim().min(1).optional()
})

const patchSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  status: z.enum(['PROCESSING', 'IN_TRANSIT', 'DELIVERED', 'ON_HOLD'])
})

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const parsed = listQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()))

    const { data, total } = await AdminBulkOrdersService.list({
      page: parsed.page,
      limit: parsed.limit,
      status: parsed.status as BulkOrderStatus | undefined,
      supplierTier: parsed.supplierTier as SupplierTier | undefined,
      dateFrom: parsed.dateFrom,
      dateTo: parsed.dateTo,
      q: parsed.q
    })

    const paginated = withPagination(data.items, total, parsed.page, parsed.limit)
    return apiSuccess(
      { items: paginated.items, metrics: data.metrics },
      paginated.meta
    )
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminSession()
    const json = await req.json()
    const parsed = patchSchema.parse(json)
    await AdminBulkOrdersService.bulkUpdateStatus(parsed)
    return apiSuccess({ ok: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
