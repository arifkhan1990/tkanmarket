import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminFabricService } from '@/services/admin-fabric.service'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const items = await AdminFabricService.listSupplierOptions()
    return apiSuccess(items)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
