import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'

export async function GET() {
  try {
    await requireAdminSession()
    const data = await SystemConsoleService.getIntegrationsWithHealth()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
