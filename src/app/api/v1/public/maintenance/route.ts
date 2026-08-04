import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { apiSuccess } from '@/lib/utils/api-response'
import { SystemConsoleService } from '@/services/admin/system-console.service'

export async function GET() {
  try {
    const data = await SystemConsoleService.getPublicMaintenance()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
