import type { NextRequest } from 'next/server'

import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminProductAttributesService } from '@/services/admin-product-attributes.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminProductAttributesService.getOverview()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
