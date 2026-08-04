import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { AdminProfileService } from '@/services/admin-profile.service'

export async function POST() {
  try {
    const session = await requireAdminSession()
    const userId = Number(session.user?.id)
    if (!Number.isFinite(userId)) throw new Error('Invalid session')

    const data = await AdminProfileService.startTotpSetup(userId)
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
