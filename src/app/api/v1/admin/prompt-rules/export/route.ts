import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'

export async function GET() {
  try {
    await requireAdminSession()
    const rules = await PromptRuleService.exportRules()
    return apiSuccess({ rules })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
