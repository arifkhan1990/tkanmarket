import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AuthSecurityEventService } from '@/services/auth-security-event.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
    const data = await AuthSecurityEventService.getSummary24h()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
