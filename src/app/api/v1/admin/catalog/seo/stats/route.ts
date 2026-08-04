import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminBulkSeoService } from '@/services/admin-bulk-seo.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
    const data = await AdminBulkSeoService.getStats()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
