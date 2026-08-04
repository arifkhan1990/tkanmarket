import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { CrawlerAdminService } from '@/services/admin/crawler-admin.service'

export async function GET(_req: NextRequest) {
  try {
    await requireAdminSession()
    const data = await CrawlerAdminService.getDiagnostics()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
