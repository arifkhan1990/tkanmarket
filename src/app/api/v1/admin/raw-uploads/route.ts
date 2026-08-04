import type { NextRequest } from 'next/server'

import { apiSuccess, withPagination } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminRawUploadService } from '@/services/admin-raw-upload.service'

export async function GET(req: NextRequest) {
  try {
    await requireAdminSession()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))

    const result = await AdminRawUploadService.list({ page, limit })
    return apiSuccess(withPagination(result.items, result.total, page, limit))
  } catch (err) {
    return toApiErrorResponse(err)
  }
}