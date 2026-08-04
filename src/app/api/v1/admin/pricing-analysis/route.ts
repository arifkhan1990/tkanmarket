import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { apiSuccess } from '@/lib/utils/api-response'
import { AdminPricingAnalysisService } from '@/services/admin-pricing-analysis.service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdminSession()
    const data = await AdminPricingAnalysisService.getOverview()
    return apiSuccess(data)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
