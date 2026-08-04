import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { parsePaginationParams } from '@/lib/utils/query-params'
import { AdminSampleLifecycleService } from '@/services/admin-sample-lifecycle.service'
import type { SampleLifecycleStageUi } from '@/types/admin-sample-lifecycle.types'

export const dynamic = 'force-dynamic'

const stageSchema = z.enum(['ALL', 'REQUESTED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CLOSED'])

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()
    const { page, limit } = parsePaginationParams(req.nextUrl.searchParams)
    const stageRaw = req.nextUrl.searchParams.get('stage') ?? 'ALL'
    const stage = stageSchema.parse(stageRaw) as 'ALL' | SampleLifecycleStageUi

    const { data, total } = await AdminSampleLifecycleService.list({ page, limit, stage })
    const paginated = withPagination(data.items, total, page, limit)
    return apiSuccess({ stats: data.stats, items: paginated.items }, paginated.meta)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
