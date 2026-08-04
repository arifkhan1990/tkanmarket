import type { NextRequest } from 'next/server'

import { apiSuccess } from '@/lib/utils/api-response'
import { toApiErrorResponse } from '@/lib/api/handle-api-error'
import { requireAdminSession } from '@/lib/auth/require-admin'
import { PromptRuleService } from '@/services/admin/prompt-rule.service'
import { UpdatePromptRuleSchema } from '@/lib/validations/prompt-rules'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await params
    const rule = await PromptRuleService.getById(Number(id))
    if (!rule) return apiSuccess(null, undefined, 404)
    return apiSuccess(rule)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await params
    const body = await req.json() as unknown
    const input = UpdatePromptRuleSchema.parse(body)
    const rule = await PromptRuleService.update(Number(id), input)
    return apiSuccess(rule)
  } catch (err) {
    return toApiErrorResponse(err)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminSession()
    const { id } = await params
    await PromptRuleService.delete(Number(id))
    return apiSuccess({ deleted: true })
  } catch (err) {
    return toApiErrorResponse(err)
  }
}
