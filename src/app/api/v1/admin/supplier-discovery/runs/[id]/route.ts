import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { SupplierDiscoveryAdminService } from '@/services/admin/supplier-discovery-admin.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await ctx.params
    const runId = Number(id)
    if (!Number.isFinite(runId) || runId < 1) {
      throw new Error('Invalid id')
    }
    const data = await SupplierDiscoveryAdminService.getRun(runId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
