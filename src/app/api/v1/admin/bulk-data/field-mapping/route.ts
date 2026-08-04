import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminBulkDataFieldMappingService } from '@/services/admin-bulk-data-field-mapping.service'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await AdminBulkDataFieldMappingService.get()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

