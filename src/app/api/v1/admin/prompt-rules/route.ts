import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { CreatePromptRuleSchema } from '@/lib/validations/prompt-rules'

export async function GET() {
  try {
    await requireAdminSession()
    const rules = await PromptRuleService.list()
    return apiSuccess(rules)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminSession()
    const body = await req.json() as unknown
    const input = CreatePromptRuleSchema.parse(body)
    const rule = await PromptRuleService.create(input)
    return apiSuccess(rule)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
