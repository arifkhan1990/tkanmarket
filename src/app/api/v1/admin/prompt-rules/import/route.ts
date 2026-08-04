import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { ImportPromptRulesSchema } from '@/lib/validations/prompt-rules'

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = await req.json() as unknown
    const input = ImportPromptRulesSchema.parse(body)
    const result = await PromptRuleService.importRules(input.rules)
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
