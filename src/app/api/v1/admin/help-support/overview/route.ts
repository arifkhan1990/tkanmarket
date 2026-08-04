import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminHelpSupportService } from '@/services/admin-help-support.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
    const data = await AdminHelpSupportService.getOverview()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
