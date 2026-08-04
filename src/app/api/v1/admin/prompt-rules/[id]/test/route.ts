import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { TestRuleSchema } from '@/lib/validations/prompt-rules'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await params
    const body = await req.json() as unknown
    const input = TestRuleSchema.parse(body)
    const result = await PromptRuleService.testRule(Number(id), input.fabricData)
    return apiSuccess(result)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
